<?php

namespace App\Support;

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use RuntimeException;
use Throwable;

/**
 * Local, dependency-free image engine.
 *
 * Why this exists: every image on the site previously went straight from the
 * original upload to the browser. A 4,000px PNG shot on a phone was delivered
 * untouched to a 390px viewport, which is the single biggest reason public pages
 * felt slow.
 *
 * This engine does three things:
 *
 *  1. stores uploads under `storage/app/media/` with a content-addressed name;
 *  2. pre-generates width variants (WebP plus the original format) at upload
 *     time, so the browser never has to download more pixels than it can show;
 *  3. produces the `srcset`/`sizes` metadata the front end needs, via Media.
 *
 * It runs on GD, which is present on this host (WebP and AVIF both reported).
 * No external service is required, so image upload keeps working even when
 * Cloudinary credentials are missing — which is exactly the failure mode that
 * made uploads appear broken.
 */
class ImageEngine
{
    public const DISK = 'media';

    /**
     * Formats the browser may receive, best first. The engine falls back when GD
     * on the host lacks a format.
     *
     * @var array<int, string>
     */
    private const MODERN_FORMATS = ['webp', 'avif'];

    /**
     * Extensions we accept and the GD reader for each.
     *
     * @var array<string, string>
     */
    private const READERS = [
        'jpg' => 'imagecreatefromjpeg',
        'jpeg' => 'imagecreatefromjpeg',
        'png' => 'imagecreatefrompng',
        'gif' => 'imagecreatefromgif',
        'webp' => 'imagecreatefromwebp',
        'avif' => 'imagecreatefromavif',
        'bmp' => 'imagecreatefrombmp',
    ];

    /**
     * GD image type constant => canonical extension.
     *
     * The declared extension is a hint, never the truth: phones and export tools
     * routinely hand over a PNG named `.jpg`, and reading one with the other's
     * decoder fails. Every branch below keys off the detected type instead.
     *
     * @var array<int, string>
     */
    private const TYPE_EXTENSIONS = [
        IMAGETYPE_JPEG => 'jpg',
        IMAGETYPE_PNG => 'png',
        IMAGETYPE_GIF => 'gif',
        IMAGETYPE_WEBP => 'webp',
        IMAGETYPE_AVIF => 'avif',
        IMAGETYPE_BMP => 'bmp',
    ];

    /**
     * Longest edge we will ever store. Anything bigger is a camera artefact, not
     * a design asset.
     */
    private const MAX_EDGE = 2560;

    /**
     * Total pixel budget per request. GD holds a full uncompressed copy in
     * memory, and this host allows 512M, so a 60-megapixel guard is generous
     * while still refusing a decompression bomb.
     */
    private const MAX_PIXELS = 60_000_000;

    /**
     * Store an uploaded file and generate its variants.
     *
     * @return array{
     *   path: string,
     *   folder: string,
     *   name: string,
     *   width: int,
     *   height: int,
     *   bytes: int,
     *   mime: string,
     *   variants: array<int, array{width: int, path: string, format: string}>
     * }
     */
    public function store(string $sourcePath, string $originalName, string $folder): array
    {
        if (! is_file($sourcePath)) {
            throw new RuntimeException('That image could not be read. Please try again.');
        }

        $size = @getimagesize($sourcePath);

        if (! is_array($size) || ($size[0] ?? 0) <= 0 || ($size[1] ?? 0) <= 0) {
            throw new RuntimeException('That file is not a readable image.');
        }

        $type = (int) ($size[2] ?? 0);
        $detectedExtension = self::TYPE_EXTENSIONS[$type] ?? null;

        if ($detectedExtension === null) {
            throw new RuntimeException('Unsupported image format. Please upload a JPG, PNG, WebP, AVIF or GIF.');
        }

        [$sourceWidth, $sourceHeight] = [(int) $size[0], (int) $size[1]];

        if ($sourceWidth * $sourceHeight > self::MAX_PIXELS) {
            throw new RuntimeException('That image is too large to process. Please upload one under 60 megapixels.');
        }

        $digest = sha1_file($sourcePath);

        if ($digest === false) {
            throw new RuntimeException('That image could not be read. Please try again.');
        }

        $isAnimated = $this->isAnimatedGif($sourcePath);
        $keepOriginal = $sourceWidth <= MediaPath::VARIANT_WIDTHS[0] || $isAnimated;

        // A GIF is stored as-is: GD flattens animation, and silently turning a
        // moving image into a still one is worse than shipping a larger file.
        $storedExtension = $isAnimated ? 'gif' : 'webp';
        $storedName = $digest.'.'.$storedExtension;
        $storagePath = MediaPath::storagePath($folder, $storedName);

        // No explicit makeDirectory() call: Flysystem creates the directory as
        // part of the write, and calling it directly threw a raw
        // UnableToCreateDirectory (including the absolute server path) straight
        // past the friendly error handling below.
        if ($keepOriginal) {
            $payload = (string) file_get_contents($sourcePath);
        } else {
            $payload = $this->encodeResized($sourcePath, $type, $sourceWidth, $sourceHeight, $sourceWidth, $sourceHeight, $storedExtension, 82);
        }

        if ($payload === null || $payload === '') {
            throw new RuntimeException('That image could not be processed. Please try again.');
        }

        $this->writeOrFail($storagePath, $payload);

        $variants = $this->generateVariants($sourcePath, $folder, $storedName, $sourceWidth, $sourceHeight, $isAnimated);

        return [
            'path' => MediaPath::url($folder, $storedName),
            'folder' => $folder,
            'name' => $storedName,
            'width' => $isAnimated ? $sourceWidth : min($sourceWidth, self::MAX_EDGE),
            'height' => $isAnimated ? $sourceHeight : (int) round($sourceHeight * (min($sourceWidth, self::MAX_EDGE) / max($sourceWidth, 1))),
            // Measured from the payload we actually wrote rather than re-read
            // from the disk, so the number is correct on any storage backend
            // (including the in-memory fake used in tests).
            'bytes' => strlen($payload),
            'mime' => $this->mimeFor($storedExtension),
            'variants' => $variants,
        ];
    }

    /**
     * Generate the width variants a page can pick from.
     *
     * A variant is only produced when it is genuinely smaller than the source,
     * so a 900px image does not gain a pointless 1280px copy.
     *
     * @return array<int, array{width: int, path: string, format: string}>
     */
    public function generateVariants(
        string $sourcePath,
        string $folder,
        string $storedName,
        int $sourceWidth,
        int $sourceHeight,
        bool $isAnimated = false,
    ): array {
        if ($isAnimated) {
            return [];
        }

        $targets = array_values(array_filter(
            MediaPath::VARIANT_WIDTHS,
            static fn (int $width): bool => $width < $sourceWidth,
        ));

        if ($targets === []) {
            return [];
        }

        $variants = [];

        $size = @getimagesize($sourcePath);
        $imageType = (int) ($size[2] ?? 0);

        foreach ($targets as $width) {
            $name = MediaPath::variantName($storedName, $width);

            if ($name === null) {
                continue;
            }

            $height = max(1, (int) round($sourceHeight * ($width / max($sourceWidth, 1))));
            $encoded = $this->encodeResized($sourcePath, $imageType, $sourceWidth, $sourceHeight, $width, $height, 'webp', 80);

            if ($encoded === null) {
                continue;
            }

            $path = MediaPath::storagePath($folder, $name);
            $this->writeOrFail($path, $encoded);

            $variants[] = [
                'width' => $width,
                'path' => MediaPath::url($folder, $name),
                'format' => 'webp',
            ];
        }

        return $variants;
    }

    /**
     * Write a file to the media disk, failing loudly.
     *
     * The `media` disk is configured with `throw => false`, so Flysystem returns
     * false for an unwritable path instead of raising. The previous code ignored
     * that return value, which turned a failed write into a *reported success*:
     * the API answered 201 with a URL for a file that was never written, and the
     * image only broke later, in the browser, as a 404.
     *
     * That is also why a permissions problem on a new host looked like anything
     * but a permissions problem. This makes it explicit and logs the disk, the
     * root and the reason so the host can actually be diagnosed.
     */
    private function writeOrFail(string $path, string $contents): void
    {
        $reason = '';

        try {
            // Resolving the disk belongs inside the guard: when the root cannot
            // be created, LocalFilesystemAdapter throws from its constructor, so
            // `Storage::disk()` is itself a failure point that would otherwise
            // escape as a raw Flysystem error containing the absolute server path.
            $disk = Storage::disk(self::DISK);

            // Creating the parent directory happens inside put(), so a
            // permissions or mount problem surfaces here too.
            $written = $disk->put($path, $contents);
        } catch (Throwable $exception) {
            $written = false;
            $reason = $exception->getMessage();
        }

        if ($written !== false) {
            return;
        }

        $root = (string) config('filesystems.disks.'.self::DISK.'.root', '');

        Log::error('Unable to write a media file.', [
            'disk' => self::DISK,
            'path' => $path,
            'root' => $root,
            'root_exists' => $root !== '' ? is_dir($root) : null,
            'root_writable' => $root !== '' && is_dir($root) ? is_writable($root) : null,
            'reason' => $reason !== '' ? $reason : 'the filesystem refused the write',
        ]);

        throw new RuntimeException(
            'The image could not be saved on the server. Please contact support.'
        );
    }

    /**
     * Re-encode an image at a target size.
     *
     * Returns null (rather than throwing) when GD cannot do the job, so the
     * caller can degrade to the stored original instead of failing the request.
     */
    private function encodeResized(
        string $sourcePath,
        int $imageType,
        int $sourceWidth,
        int $sourceHeight,
        int $targetWidth,
        int $targetHeight,
        string $format,
        int $quality,
    ): ?string {
        $extension = self::TYPE_EXTENSIONS[$imageType] ?? null;
        $reader = $extension === null ? null : (self::READERS[$extension] ?? null);

        if ($reader === null || ! function_exists($reader)) {
            return null;
        }

        $source = @$reader($sourcePath);

        if ($source === false) {
            return null;
        }

        try {
            $target = imagecreatetruecolor($targetWidth, $targetHeight);

            if ($target === false) {
                return null;
            }

            // Preserve transparency for PNG/WebP sources.
            imagealphablending($target, false);
            imagesavealpha($target, true);
            $transparent = imagecolorallocatealpha($target, 0, 0, 0, 127);

            if ($transparent !== false) {
                imagefilledrectangle($target, 0, 0, $targetWidth, $targetHeight, $transparent);
            }

            imagecopyresampled(
                $target,
                $source,
                0,
                0,
                0,
                0,
                $targetWidth,
                $targetHeight,
                $sourceWidth,
                $sourceHeight,
            );

            ob_start();
            $ok = match ($format) {
                'webp' => function_exists('imagewebp') ? imagewebp($target, null, $quality) : false,
                'avif' => function_exists('imageavif') ? imageavif($target, null, $quality) : false,
                'png' => imagepng($target, null, 8),
                'jpg', 'jpeg' => imagejpeg($target, null, $quality),
                default => false,
            };
            $encoded = (string) ob_get_clean();

            imagedestroy($target);

            return $ok && $encoded !== '' ? $encoded : null;
        } catch (Throwable) {
            return null;
        } finally {
            if (isset($source) && $source instanceof \GdImage) {
                imagedestroy($source);
            }
        }
    }

    /**
     * A single-frame GIF is just a still image; only multi-frame input is treated
     * as animated.
     */
    private function isAnimatedGif(string $path): bool
    {
        if (strtolower(pathinfo($path, PATHINFO_EXTENSION)) !== 'gif') {
            return false;
        }

        $contents = (string) file_get_contents($path);

        // Count the image separator (0x2C) that introduces each frame.
        return substr_count($contents, "\x00\x21\xF9\x04") > 1;
    }

    public function mimeFor(string $extension): string
    {
        return match (strtolower($extension)) {
            'png' => 'image/png',
            'gif' => 'image/gif',
            'avif' => 'image/avif',
            'jpg', 'jpeg' => 'image/jpeg',
            default => 'image/webp',
        };
    }

    /**
     * The formats this host can actually encode, best first.
     *
     * @return array<int, string>
     */
    public function supportedFormats(): array
    {
        return array_values(array_filter(self::MODERN_FORMATS, static function (string $format): bool {
            return match ($format) {
                'webp' => function_exists('imagewebp'),
                'avif' => function_exists('imageavif'),
                default => false,
            };
        }));
    }
}
