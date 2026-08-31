<?php

namespace Tests\Support;

use App\Contracts\ImageUploader;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Str;

class FakeImageUploader implements ImageUploader
{
    /** @var array<int, array{source: string, folder: string, cropAspect: ?string}> */
    public array $uploads = [];

    /** @var array<int, string> */
    public array $destroyed = [];

    public function uploadImage(
        UploadedFile $file,
        string $folder,
        ?string $cropAspect = null,
        string $format = 'webp',
        string $quality = 'auto'
    ): array {
        $this->uploads[] = [
            'source' => $file->getClientOriginalName(),
            'folder' => $folder,
            'cropAspect' => $cropAspect,
        ];

        return $this->fakeResult($folder, $format);
    }

    public function uploadFromUrl(
        string $sourceUrl,
        string $folder,
        ?string $cropAspect = null,
        string $format = 'webp',
        string $quality = 'auto'
    ): array {
        $this->uploads[] = [
            'source' => $sourceUrl,
            'folder' => $folder,
            'cropAspect' => $cropAspect,
        ];

        return $this->fakeResult($folder, $format);
    }

    public function destroy(string $publicId): void
    {
        $this->destroyed[] = $publicId;
    }

    public function extractPublicId(string $secureUrl): ?string
    {
        if (! str_contains($secureUrl, 'res.cloudinary.com')) {
            return null;
        }

        $path = (string) parse_url($secureUrl, PHP_URL_PATH);
        $withoutExtension = (string) preg_replace('/\.[a-zA-Z0-9]+$/', '', $path);

        return ltrim(str_replace('/fake/image/upload/', '', $withoutExtension), '/');
    }

    /**
     * @return array{secure_url: string, public_id: string, format: string, bytes: int, width: int, height: int}
     */
    private function fakeResult(string $folder, string $format): array
    {
        $publicId = $folder.'/'.Str::uuid()->toString();

        return [
            'secure_url' => 'https://res.cloudinary.com/fake/image/upload/'.$publicId.'.'.$format,
            'public_id' => $publicId,
            'format' => $format,
            'bytes' => 12345,
            'width' => 800,
            'height' => 600,
        ];
    }
}
