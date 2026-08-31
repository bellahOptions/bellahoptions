<?php

namespace App\Contracts;

use Illuminate\Http\UploadedFile;

interface ImageUploader
{
    /**
     * Upload a local file to the media store.
     *
     * @return array{secure_url: string, public_id: string, format: string, bytes: int, width: int, height: int}
     */
    public function uploadImage(
        UploadedFile $file,
        string $folder,
        ?string $cropAspect = null,
        string $format = 'webp',
        string $quality = 'auto'
    ): array;

    /**
     * Upload a remote asset (fetched by URL) to the media store.
     *
     * @return array{secure_url: string, public_id: string, format: string, bytes: int, width: int, height: int}
     */
    public function uploadFromUrl(
        string $sourceUrl,
        string $folder,
        ?string $cropAspect = null,
        string $format = 'webp',
        string $quality = 'auto'
    ): array;

    public function destroy(string $publicId): void;

    public function extractPublicId(string $secureUrl): ?string;
}
