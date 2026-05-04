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
    ): string {
        $webpBinary = $this->toWebpBinary($file, $quality);
        $cleanDirectory = trim($directory, '/');
        $path = $cleanDirectory.'/'.Str::uuid().'.webp';

        Storage::disk($disk)->put($path, $webpBinary, ['visibility' => 'public']);

        return $path;
    }

    /**
     * @throws RuntimeException
     */
    private function toWebpBinary(UploadedFile $file, int $quality): string
    {
        if (class_exists(\Imagick::class)) {
            return $this->convertWithImagick($file, $quality);
        }

        return $this->convertWithGd($file, $quality);
    }

    /**
     * @throws RuntimeException
     */
    private function convertWithImagick(UploadedFile $file, int $quality): string
    {
        $imagick = new \Imagick();

        try {
            $imagick->readImage($file->getRealPath() ?: '');
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
    private function convertWithGd(UploadedFile $file, int $quality): string
    {
        if (! function_exists('imagewebp')) {
            throw new RuntimeException('WebP conversion is not supported on this server.');
        }

        $mime = strtolower((string) $file->getMimeType());
        $path = $file->getRealPath();
        if (! is_string($path) || $path === '') {
            throw new RuntimeException('Uploaded image path is invalid.');
        }

        $sourceImage = match ($mime) {
            'image/jpeg', 'image/jpg' => @imagecreatefromjpeg($path),
            'image/png' => @imagecreatefrompng($path),
            'image/gif' => @imagecreatefromgif($path),
            'image/webp' => function_exists('imagecreatefromwebp') ? @imagecreatefromwebp($path) : false,
            'image/bmp', 'image/x-ms-bmp' => function_exists('imagecreatefrombmp') ? @imagecreatefrombmp($path) : false,
            default => false,
        };

        if ($sourceImage === false) {
            throw new RuntimeException('Unsupported image format. Please upload JPG, PNG, GIF, BMP, or WebP.');
        }

        if (function_exists('imagepalettetotruecolor')) {
            imagepalettetotruecolor($sourceImage);
        }
        imagealphablending($sourceImage, true);
        imagesavealpha($sourceImage, true);

        ob_start();
        $written = imagewebp($sourceImage, null, $quality);
        $binary = ob_get_clean();
        imagedestroy($sourceImage);

        if (! $written || ! is_string($binary) || $binary === '') {
            throw new RuntimeException('Unable to convert image to WebP.');
        }

        return $binary;
    }
}

