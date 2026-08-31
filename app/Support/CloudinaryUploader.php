<?php

namespace App\Support;

use App\Contracts\ImageUploader;
use Cloudinary\Api\ApiResponse;
use Cloudinary\Cloudinary;
use Illuminate\Http\UploadedFile;
use RuntimeException;
use Throwable;

class CloudinaryUploader implements ImageUploader
{
    private const CROP_ASPECTS = ['1:1', '4:3', '16:9', '3:4', '9:16'];

    public function uploadImage(
        UploadedFile $file,
        string $folder,
        ?string $cropAspect = null,
        string $format = 'webp',
        string $quality = 'auto'
    ): array {
        $path = $file->getRealPath();
        if (! is_string($path) || $path === '' || ! is_file($path)) {
            throw new RuntimeException('Image upload failed. Please try again.');
        }

        return $this->send($path, $folder, $cropAspect, $format, $quality);
    }

    public function uploadFromUrl(
        string $sourceUrl,
        string $folder,
        ?string $cropAspect = null,
        string $format = 'webp',
        string $quality = 'auto'
    ): array {
        return $this->send($sourceUrl, $folder, $cropAspect, $format, $quality);
    }

    public function destroy(string $publicId): void
    {
        if (trim($publicId) === '') {
            return;
        }

        try {
            $this->client()->uploadApi()->destroy($publicId);
        } catch (Throwable) {
            // Best-effort deletion: an already-removed or unreachable asset should not block the caller.
        }
    }

    public function extractPublicId(string $secureUrl): ?string
    {
        if (! str_contains($secureUrl, 'res.cloudinary.com')) {
            return null;
        }

        $path = (string) parse_url($secureUrl, PHP_URL_PATH);
        if ($path === '') {
            return null;
        }

        $segments = array_values(array_filter(explode('/', $path), static fn (string $segment): bool => $segment !== ''));
        $uploadIndex = array_search('upload', $segments, true);
        if ($uploadIndex === false) {
            return null;
        }

        $rest = array_slice($segments, $uploadIndex + 1);
        if ($rest === []) {
            return null;
        }

        if (isset($rest[0]) && preg_match('/^v\d+$/', $rest[0]) === 1) {
            array_shift($rest);
        }

        if ($rest === []) {
            return null;
        }

        $last = array_pop($rest);
        $rest[] = (string) preg_replace('/\.[a-zA-Z0-9]+$/', '', $last);

        $publicId = implode('/', $rest);

        return $publicId !== '' ? $publicId : null;
    }

    /**
     * @return array{secure_url: string, public_id: string, format: string, bytes: int, width: int, height: int}
     */
    private function send(string $source, string $folder, ?string $cropAspect, string $format, string $quality): array
    {
        try {
            $result = $this->client()->uploadApi()->upload($source, $this->buildOptions($folder, $cropAspect, $format, $quality));
        } catch (RuntimeException $exception) {
            throw $exception;
        } catch (Throwable $exception) {
            throw new RuntimeException('Image upload failed. Please try again.', previous: $exception);
        }

        return $this->normalize($result);
    }

    /**
     * @return array<string, mixed>
     */
    private function buildOptions(string $folder, ?string $cropAspect, string $format, string $quality): array
    {
        $options = [
            'folder' => $folder,
            'format' => $format,
            'quality' => $quality,
            'resource_type' => 'image',
        ];

        if (is_string($cropAspect) && in_array($cropAspect, self::CROP_ASPECTS, true)) {
            $options['crop'] = 'fill';
            $options['gravity'] = 'auto';
            $options['aspect_ratio'] = $cropAspect;
        }

        return $options;
    }

    /**
     * @return array{secure_url: string, public_id: string, format: string, bytes: int, width: int, height: int}
     */
    private function normalize(ApiResponse $result): array
    {
        $data = $result->getArrayCopy();

        return [
            'secure_url' => (string) ($data['secure_url'] ?? ''),
            'public_id' => (string) ($data['public_id'] ?? ''),
            'format' => (string) ($data['format'] ?? ''),
            'bytes' => (int) ($data['bytes'] ?? 0),
            'width' => (int) ($data['width'] ?? 0),
            'height' => (int) ($data['height'] ?? 0),
        ];
    }

    private function client(): Cloudinary
    {
        $url = trim((string) config('services.cloudinary.url', ''));

        if ($url === '') {
            throw new RuntimeException('Image upload is not configured yet. Please contact support.');
        }

        return new Cloudinary($url);
    }
}
