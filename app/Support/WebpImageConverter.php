<?php

namespace App\Support;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;

class WebpImageConverter
{
    /**
     * Convert an uploaded image to WebP and store it on disk.
     *
     * @throws RuntimeException
     */
    public function storePublicWebp(
        UploadedFile $file,
        string $directory = 'gallery-projects',
        string $disk = 'public',
        int $quality = 82,
        ?string $cropAspect = null,
    ): string {
        $webpBinary = $this->toWebpBinary($file, $quality, $cropAspect);
        $cleanDirectory = trim($directory, '/');
        $path = $cleanDirectory.'/'.Str::uuid().'.webp';

        Storage::disk($disk)->put($path, $webpBinary, ['visibility' => 'public']);

        return $path;
    }

    /**
     * Convert an existing public image path to a new cropped WebP.
     *
     * @throws RuntimeException
     */
    public function cropExistingPublicImageToWebp(
        string $publicPath,
        string $directory = 'gallery-projects',
        string $disk = 'public',
        int $quality = 82,
        string $cropAspect = '1:1',
    ): string {
        if (! PublicContentSecurity::isSafeRelativePath($publicPath)) {
            throw new RuntimeException('Invalid media path.');
        }

        $absolutePath = public_path(ltrim($publicPath, '/'));
        if (! is_file($absolutePath)) {
            throw new RuntimeException('Selected media file does not exist.');
        }

        $binary = $this->toWebpBinaryFromPath($absolutePath, $quality, $cropAspect);

        $cleanDirectory = trim($directory, '/');
        $path = $cleanDirectory.'/'.Str::uuid().'.webp';

        Storage::disk($disk)->put($path, $binary, ['visibility' => 'public']);

        return $path;
    }

    /**
     * @throws RuntimeException
     */
    private function toWebpBinary(UploadedFile $file, int $quality, ?string $cropAspect = null): string
    {
        if (class_exists(\Imagick::class)) {
            return $this->convertWithImagick($file->getRealPath() ?: '', $quality, $cropAspect);
        }

        return $this->convertWithGd($file->getRealPath() ?: '', (string) $file->getMimeType(), $quality, $cropAspect);
    }

    /**
     * @throws RuntimeException
     */
    private function toWebpBinaryFromPath(string $absolutePath, int $quality, ?string $cropAspect = null): string
    {
        if (class_exists(\Imagick::class)) {
            return $this->convertWithImagick($absolutePath, $quality, $cropAspect);
        }

        $mime = (string) mime_content_type($absolutePath);

        return $this->convertWithGd($absolutePath, $mime, $quality, $cropAspect);
    }

    /**
     * @throws RuntimeException
     */
    private function convertWithImagick(string $path, int $quality, ?string $cropAspect = null): string
    {
        if ($path === '' || ! is_file($path)) {
            throw new RuntimeException('Uploaded image path is invalid.');
        }

        $imagick = new \Imagick();

        try {
            $imagick->readImage($path);
            $this->applyImagickCrop($imagick, $cropAspect);
            $imagick->setImageFormat('webp');
            $imagick->setImageCompressionQuality($quality);

            $blob = $imagick->getImageBlob();
            if (! is_string($blob) || $blob === '') {
                throw new RuntimeException('Unable to convert image to WebP.');
            }

            return $blob;
        } catch (\Throwable $exception) {
            throw new RuntimeException('Unable to convert image to WebP.', previous: $exception);
        } finally {
            $imagick->clear();
            $imagick->destroy();
        }
    }

    /**
     * @throws RuntimeException
     */
    private function convertWithGd(string $path, string $mime, int $quality, ?string $cropAspect = null): string
    {
        if (! function_exists('imagewebp')) {
            throw new RuntimeException('WebP conversion is not supported on this server.');
        }

        if ($path === '' || ! is_file($path)) {
            throw new RuntimeException('Uploaded image path is invalid.');
        }

        $sourceImage = $this->createImageResourceFromMime($path, strtolower(trim($mime)));

        if ($sourceImage === false) {
            throw new RuntimeException('Unsupported image format. Please upload JPG, PNG, GIF, BMP, or WebP.');
        }

        $targetImage = $this->applyGdCrop($sourceImage, $cropAspect);

        if (function_exists('imagepalettetotruecolor')) {
            imagepalettetotruecolor($targetImage);
        }
        imagealphablending($targetImage, true);
        imagesavealpha($targetImage, true);

        ob_start();
        $written = imagewebp($targetImage, null, $quality);
        $binary = ob_get_clean();

        if ($targetImage !== $sourceImage) {
            imagedestroy($targetImage);
        }
        imagedestroy($sourceImage);

        if (! $written || ! is_string($binary) || $binary === '') {
            throw new RuntimeException('Unable to convert image to WebP.');
        }

        return $binary;
    }

    private function createImageResourceFromMime(string $path, string $mime): mixed
    {
        return match ($mime) {
            'image/jpeg', 'image/jpg' => @imagecreatefromjpeg($path),
            'image/png' => @imagecreatefrompng($path),
            'image/gif' => @imagecreatefromgif($path),
            'image/webp' => function_exists('imagecreatefromwebp') ? @imagecreatefromwebp($path) : false,
            'image/bmp', 'image/x-ms-bmp' => function_exists('imagecreatefrombmp') ? @imagecreatefrombmp($path) : false,
            'image/avif' => function_exists('imagecreatefromavif') ? @imagecreatefromavif($path) : false,
            default => false,
        };
    }

    private function applyImagickCrop(\Imagick $imagick, ?string $cropAspect): void
    {
        [$ratioWidth, $ratioHeight] = $this->parseAspectRatio($cropAspect);

        if ($ratioWidth === null || $ratioHeight === null) {
            return;
        }

        $width = (int) $imagick->getImageWidth();
        $height = (int) $imagick->getImageHeight();

        if ($width <= 0 || $height <= 0) {
            return;
        }

        $sourceRatio = $width / $height;
        $targetRatio = $ratioWidth / $ratioHeight;

        if (abs($sourceRatio - $targetRatio) < 0.0001) {
            return;
        }

        if ($sourceRatio > $targetRatio) {
            $cropHeight = $height;
            $cropWidth = (int) floor($height * $targetRatio);
            $x = (int) floor(($width - $cropWidth) / 2);
            $y = 0;
        } else {
            $cropWidth = $width;
            $cropHeight = (int) floor($width / $targetRatio);
            $x = 0;
            $y = (int) floor(($height - $cropHeight) / 2);
        }

        $imagick->cropImage($cropWidth, $cropHeight, $x, $y);
        $imagick->setImagePage(0, 0, 0, 0);
    }

    private function applyGdCrop(mixed $sourceImage, ?string $cropAspect): mixed
    {
        [$ratioWidth, $ratioHeight] = $this->parseAspectRatio($cropAspect);

        if ($ratioWidth === null || $ratioHeight === null) {
            return $sourceImage;
        }

        $width = imagesx($sourceImage);
        $height = imagesy($sourceImage);

        if ($width <= 0 || $height <= 0) {
            return $sourceImage;
        }

        $sourceRatio = $width / $height;
        $targetRatio = $ratioWidth / $ratioHeight;

        if (abs($sourceRatio - $targetRatio) < 0.0001) {
            return $sourceImage;
        }

        if ($sourceRatio > $targetRatio) {
            $cropHeight = $height;
            $cropWidth = (int) floor($height * $targetRatio);
            $srcX = (int) floor(($width - $cropWidth) / 2);
            $srcY = 0;
        } else {
            $cropWidth = $width;
            $cropHeight = (int) floor($width / $targetRatio);
            $srcX = 0;
            $srcY = (int) floor(($height - $cropHeight) / 2);
        }

        $cropped = imagecreatetruecolor($cropWidth, $cropHeight);
        imagealphablending($cropped, false);
        imagesavealpha($cropped, true);
        imagecopy($cropped, $sourceImage, 0, 0, $srcX, $srcY, $cropWidth, $cropHeight);

        return $cropped;
    }

    /**
     * @return array{0: float|null, 1: float|null}
     */
    private function parseAspectRatio(?string $cropAspect): array
    {
        $raw = strtolower(trim((string) $cropAspect));
        if ($raw === '' || $raw === 'free' || ! str_contains($raw, ':')) {
            return [null, null];
        }

        [$width, $height] = array_pad(explode(':', $raw, 2), 2, null);
        $ratioWidth = (float) $width;
        $ratioHeight = (float) $height;

        if ($ratioWidth <= 0 || $ratioHeight <= 0) {
            return [null, null];
        }

        return [$ratioWidth, $ratioHeight];
    }
}
