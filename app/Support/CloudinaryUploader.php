<?php

namespace App\Support;

use App\Contracts\ImageUploader;
use Cloudinary\Api\ApiResponse;
use Cloudinary\Cloudinary;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
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
            // The generic message below is all a customer should ever see, which
            // used to mean the real cause vanished: Cloudinary chose this driver
            // (CLOUDINARY_URL is set), so a rejected credential, a blocked
            // outbound request or a quota failure all looked identical from the
            // outside and left nothing in the log to work from.
            Log::error('Cloudinary image upload failed.', [
                'driver' => 'cloudinary',
                'folder' => $folder,
                'cloud_name' => $this->cloudName(),
                'exception' => $exception::class,
                'reason' => $exception->getMessage(),
            ]);

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

    /**
     * Check that the configured credentials can reach Cloudinary.
     *
     * Used by `media:doctor`. Kept here rather than in the command so the doctor
     * exercises exactly the same client the upload path uses — a diagnostic that
     * builds its own client can pass while the real one fails.
     *
     * @return array{ok: bool, message: string}
     */
    public function ping(): array
    {
        try {
            $cloudinary = $this->client();
        } catch (Throwable $exception) {
            return ['ok' => false, 'message' => $exception->getMessage()];
        }

        try {
            $cloudinary->adminApi()->ping();

            return ['ok' => true, 'message' => ''];
        } catch (Throwable $exception) {
            return ['ok' => false, 'message' => $exception->getMessage()];
        }
    }

    /**
     * End-to-end proof that an upload actually works.
     *
     * A ping only proves the credentials authenticate; it does not prove an
     * upload is allowed (a read-only key, an exhausted quota or a locked upload
     * preset still fail). This uploads a 1x1 PNG from a data URI and deletes it
     * again, so the account is left exactly as it was found.
     *
     * @return array{ok: bool, message: string}
     */
    public function verifyUpload(): array
    {
        try {
            $result = $this->uploadFromUrl(self::PROBE_IMAGE, 'doctor');
            $this->destroy($result['public_id']);

            return ['ok' => true, 'message' => $result['secure_url']];
        } catch (Throwable $exception) {
            return ['ok' => false, 'message' => $exception->getMessage()];
        }
    }

    /**
     * A 1x1 transparent PNG, small enough to be a safe round-trip probe.
     */
    private const PROBE_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

    private function client(): Cloudinary
    {
        $url = trim((string) config('services.cloudinary.url', ''));

        if ($url === '') {
            // Cloudinary is the only image store, so this is a deployment fault,
            // not a degraded mode. It is logged as an error because the operator
            // otherwise only sees a generic message in the admin UI.
            Log::error('Cloudinary is not configured; image uploads cannot run.', [
                'driver' => 'cloudinary',
                'CLOUDINARY_URL' => 'missing or empty',
                'config_cached' => app()->configurationIsCached(),
            ]);

            throw new RuntimeException('Image upload is not configured yet. Please contact support.');
        }

        return new Cloudinary($url);
    }

    /**
     * The cloud name from the configured URL, for logging only.
     *
     * CLOUDINARY_URL embeds the API secret, so the raw value must never be
     * logged; the cloud name is the part that identifies which account rejected
     * the request.
     */
    private function cloudName(): string
    {
        $url = trim((string) config('services.cloudinary.url', ''));

        if ($url === '') {
            return '';
        }

        // cloudinary://<api_key>:<api_secret>@<cloud_name>
        $host = (string) parse_url($url, PHP_URL_HOST);

        return $host !== '' ? $host : '';
    }
}
