<?php

namespace App\Support;

use App\Contracts\ImageUploader;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use RuntimeException;

/**
 * Default ImageUploader: the local image engine.
 *
 * Cloudinary remains supported (set CLOUDINARY_URL and the container rebinds),
 * but image upload must never be unusable just because a third-party credential
 * is missing. This driver always works, needs no network, and produces the
 * responsive variants the front end needs.
 */
class LocalImageUploader implements ImageUploader
{
    public function __construct(private readonly ImageEngine $engine) {}

    public function uploadImage(
        UploadedFile $file,
        string $folder,
        ?string $cropAspect = null,
        string $format = 'webp',
        string $quality = 'auto'
    ): array {
        $sourcePath = $file->getRealPath();

        if (! is_string($sourcePath) || $sourcePath === '' || ! is_file($sourcePath)) {
            throw new RuntimeException('Image upload failed. Please try again.');
        }

        // The folder becomes part of a filesystem path, so it is validated rather
        // than sanitised: a wrong folder is a programming error, not user input.
        $safeFolder = $this->normalizeFolder($folder);

        $stored = $this->engine->store(
            $sourcePath,
            (string) $file->getClientOriginalName(),
            $safeFolder,
        );

        return [
            'secure_url' => $stored['path'],
            'public_id' => $safeFolder.'/'.$stored['name'],
            'format' => pathinfo($stored['name'], PATHINFO_EXTENSION) ?: 'webp',
            'bytes' => $stored['bytes'],
            'width' => $stored['width'],
            'height' => $stored['height'],
        ];
    }

    public function uploadFromUrl(
        string $sourceUrl,
        string $folder,
        ?string $cropAspect = null,
        string $format = 'webp',
        string $quality = 'auto'
    ): array {
        // Only a locally stored image or an http(s) URL is re-processed. This is
        // the same allow-list the previous Cloudinary driver relied on, kept so
        // the crop flow cannot be pointed at a local file path.
        $candidate = trim($sourceUrl);

        if (! PublicContentSecurity::isSafeHttpUrl($candidate) && ! MediaPath::isMediaPath($candidate)) {
            throw new RuntimeException('That image cannot be processed from its current location.');
        }

        $absolute = str_starts_with($candidate, 'http://') || str_starts_with($candidate, 'https://')
            ? $candidate
            : rtrim((string) config('app.url'), '/').$candidate;

        $temporaryPath = tempnam(sys_get_temp_dir(), 'bellah-media-');

        if ($temporaryPath === false) {
            throw new RuntimeException('Image upload failed. Please try again.');
        }

        try {
            $contents = @file_get_contents($absolute);

            if ($contents === false || $contents === '') {
                throw new RuntimeException('That image could not be downloaded for processing.');
            }

            file_put_contents($temporaryPath, $contents);

            $engine = $this->engine;
            $safeFolder = $this->normalizeFolder($folder);

            $stored = $engine->store(
                $temporaryPath,
                basename((string) parse_url($absolute, PHP_URL_PATH)) ?: 'image.jpg',
                $safeFolder,
            );

            return [
                'secure_url' => $stored['path'],
                'public_id' => $safeFolder.'/'.$stored['name'],
                'format' => pathinfo($stored['name'], PATHINFO_EXTENSION) ?: 'webp',
                'bytes' => $stored['bytes'],
                'width' => $stored['width'],
                'height' => $stored['height'],
            ];
        } finally {
            if (is_file($temporaryPath)) {
                @unlink($temporaryPath);
            }
        }
    }

    public function destroy(string $publicId): void
    {
        $candidate = trim($publicId);

        if ($candidate === '') {
            return;
        }

        $segments = explode('/', $candidate);

        if (count($segments) !== 2) {
            return;
        }

        [$folder, $name] = $segments;

        if (! MediaPath::isValidFolder($folder) || ! MediaPath::isValidFileName($name)) {
            return;
        }

        $disk = Storage::disk(ImageEngine::DISK);
        $paths = [MediaPath::storagePath($folder, $name)];

        foreach (MediaPath::VARIANT_WIDTHS as $width) {
            $variantName = MediaPath::variantName($name, $width);

            if ($variantName !== null) {
                $paths[] = MediaPath::storagePath($folder, $variantName);
            }
        }

        // Everything for one asset is best-effort: a missing variant must not
        // block deleting the files that do exist.
        foreach ($paths as $path) {
            if ($disk->exists($path)) {
                $disk->delete($path);
            }
        }
    }

    public function extractPublicId(string $secureUrl): ?string
    {
        $parsed = MediaPath::parse($secureUrl);

        return $parsed === null ? null : $parsed['folder'].'/'.$parsed['name'];
    }

    private function normalizeFolder(string $folder): string
    {
        $candidate = strtolower(trim($folder));

        if (! MediaPath::isValidFolder($candidate)) {
            throw new RuntimeException('Image upload failed: invalid media folder.');
        }

        return $candidate;
    }
}
