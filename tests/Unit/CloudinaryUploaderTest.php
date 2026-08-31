<?php

namespace Tests\Unit;

use App\Support\CloudinaryUploader;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Config;
use RuntimeException;
use Tests\TestCase;

class CloudinaryUploaderTest extends TestCase
{
    public function test_upload_image_throws_a_friendly_message_when_not_configured(): void
    {
        Config::set('services.cloudinary.url', null);

        $uploader = new CloudinaryUploader();
        $file = UploadedFile::fake()->image('photo.jpg');

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('Image upload is not configured yet. Please contact support.');

        $uploader->uploadImage($file, 'gallery-projects');
    }

    public function test_upload_from_url_throws_a_friendly_message_when_not_configured(): void
    {
        Config::set('services.cloudinary.url', '');

        $uploader = new CloudinaryUploader();

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('Image upload is not configured yet. Please contact support.');

        $uploader->uploadFromUrl('https://example.com/image.jpg', 'gallery-projects');
    }

    public function test_destroy_is_a_no_op_when_not_configured(): void
    {
        Config::set('services.cloudinary.url', null);

        $uploader = new CloudinaryUploader();

        // Best-effort deletion should never throw, even without credentials.
        $uploader->destroy('gallery-projects/some-public-id');

        $this->addToAssertionCount(1);
    }

    public function test_extract_public_id_parses_a_real_shaped_cloudinary_url(): void
    {
        $uploader = new CloudinaryUploader();

        $publicId = $uploader->extractPublicId(
            'https://res.cloudinary.com/demo-cloud/image/upload/v1699999999/gallery-projects/abc123.webp'
        );

        $this->assertSame('gallery-projects/abc123', $publicId);
    }

    public function test_extract_public_id_parses_a_url_without_a_version_segment(): void
    {
        $uploader = new CloudinaryUploader();

        $publicId = $uploader->extractPublicId(
            'https://res.cloudinary.com/demo-cloud/image/upload/gallery-projects/abc123.jpg'
        );

        $this->assertSame('gallery-projects/abc123', $publicId);
    }

    public function test_extract_public_id_returns_null_for_a_non_cloudinary_url(): void
    {
        $uploader = new CloudinaryUploader();

        $this->assertNull($uploader->extractPublicId('/storage/gallery-projects/legacy.webp'));
        $this->assertNull($uploader->extractPublicId('https://example.com/image.jpg'));
    }
}
