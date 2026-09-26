<?php

namespace Tests\Feature;

use App\Contracts\ImageUploader;
use App\Models\MediaUpload;
use App\Models\User;
use App\Support\ImageEngine;
use App\Support\LocalImageUploader;
use App\Support\Media;
use App\Support\MediaPath;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * The local image engine: optimised storage, width variants, and delivery.
 *
 * Cloudinary is the only image store, so nothing here is on the production
 * upload path any more. The engine is retained because it still serves assets
 * that were written to this server before that policy, and these tests pin the
 * behaviour of that legacy path.
 */
class ImageEngineTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Cloudinary is the only image store in production, but the local engine
        // still exists: it serves assets that were stored on the server before
        // that policy, and these tests cover that engine's behaviour directly.
        // It is bound explicitly here so the tests exercise the engine rather
        // than the application's (Cloudinary-only) default binding.
        $this->app->instance(ImageUploader::class, app(LocalImageUploader::class));

        Storage::fake(ImageEngine::DISK);
    }

    private function superAdmin(): User
    {
        return User::factory()->create(['role' => User::ROLE_SUPER_ADMIN]);
    }

    /**
     * A genuinely large JPEG, so resizing and variant generation actually run.
     */
    private function largeImageUpload(int $width = 3000, int $height = 2000, string $name = 'shot.jpg'): UploadedFile
    {
        $image = imagecreatetruecolor($width, $height);

        // A gradient rather than a flat fill: a flat image compresses to almost
        // nothing and would make the size assertions meaningless.
        for ($x = 0; $x < $width; $x += 4) {
            $colour = imagecolorallocate($image, $x % 255, ($x * 2) % 255, 120);
            imagefilledrectangle($image, $x, 0, $x + 3, $height, $colour);
        }

        $path = tempnam(sys_get_temp_dir(), 'bellah-large-').'.jpg';
        imagejpeg($image, $path, 92);
        imagedestroy($image);

        return new UploadedFile($path, $name, 'image/jpeg', null, true);
    }

    public function test_the_local_engine_stores_a_media_path_when_explicitly_selected(): void
    {
        $admin = $this->superAdmin();

        $response = $this->actingAs($admin)->postJson(route('admin.gallery.media.upload'), [
            'file' => UploadedFile::fake()->image('cover.jpg', 1200, 800),
        ]);

        $response->assertCreated();

        $path = (string) $response->json('path');

        $this->assertStringStartsWith('/media/gallery-projects/', $path);
        $this->assertNotNull(MediaPath::parse($path), 'Stored path should be a valid media path.');
    }

    public function test_large_uploads_are_downscaled_and_get_width_variants(): void
    {
        $admin = $this->superAdmin();

        $response = $this->actingAs($admin)->postJson(route('admin.gallery.media.upload'), [
            'file' => $this->largeImageUpload(),
        ]);

        $response->assertCreated();

        $path = (string) $response->json('path');
        $variants = Media::variants($path);

        $this->assertNotEmpty($variants, 'A 3000px upload should produce smaller width variants.');

        $widths = array_column($variants, 'width');
        $this->assertContains(1280, $widths);
        $this->assertContains(640, $widths);

        // Every advertised variant must exist on disk, or the browser gets a 404.
        foreach ($variants as $variant) {
            $parsed = MediaPath::parse($variant['url']);
            $this->assertNotNull($parsed);
            $this->assertTrue(
                Storage::disk(ImageEngine::DISK)->exists(MediaPath::storagePath($parsed['folder'], $parsed['name'])),
                'Variant missing on disk: '.$variant['url'],
            );
        }
    }

    public function test_a_stored_original_is_smaller_than_the_source_upload(): void
    {
        $admin = $this->superAdmin();
        $upload = $this->largeImageUpload();
        $sourceBytes = (int) filesize((string) $upload->getRealPath());

        $response = $this->actingAs($admin)->postJson(route('admin.gallery.media.upload'), ['file' => $upload]);

        $response->assertCreated();

        // Unlike Storage::fake (which does not preserve byte counts), the engine
        // sizes the real file it wrote, so the reported bytes must be a genuine
        // reduction on the raw upload.
        $storedBytes = (int) $response->json('bytes');

        $this->assertGreaterThan(0, $storedBytes);
        $this->assertLessThan(
            $sourceBytes,
            $storedBytes,
            'The stored asset should be smaller than the raw upload; that is the whole point of the engine.',
        );
    }

    public function test_images_below_the_smallest_variant_get_no_variants(): void
    {
        $admin = $this->superAdmin();

        $response = $this->actingAs($admin)->postJson(route('admin.gallery.media.upload'), [
            'file' => UploadedFile::fake()->image('icon.jpg', 200, 200),
        ]);

        $response->assertCreated();

        // Nothing smaller than 320 exists as a variant, and the source is already
        // below every variant width, so there is nothing to generate.
        $this->assertSame([], Media::variants((string) $response->json('path')));
    }

    public function test_media_route_serves_a_stored_image_with_immutable_caching(): void
    {
        $admin = $this->superAdmin();

        $path = (string) $this->actingAs($admin)
            ->postJson(route('admin.gallery.media.upload'), [
                'file' => UploadedFile::fake()->image('cover.jpg', 800, 600),
            ])
            ->json('path');

        $response = $this->get($path)->assertOk();

        $this->assertStringContainsString('image/', (string) $response->headers->get('content-type'));
        $this->assertStringContainsString('immutable', (string) $response->headers->get('cache-control'));
        $this->assertStringContainsString('max-age=31536000', (string) $response->headers->get('cache-control'));
    }

    public function test_media_route_honours_conditional_requests(): void
    {
        $admin = $this->superAdmin();

        $path = (string) $this->actingAs($admin)
            ->postJson(route('admin.gallery.media.upload'), [
                'file' => UploadedFile::fake()->image('cover.jpg', 800, 600),
            ])
            ->json('path');

        $etag = (string) $this->get($path)->headers->get('etag');

        $this->assertNotSame('', $etag);

        $this->withHeaders(['If-None-Match' => $etag])
            ->get($path)
            ->assertStatus(304);
    }

    public function test_media_route_rejects_path_traversal_and_unknown_files(): void
    {
        // The route pattern already refuses these shapes; assert the 404 rather
        // than a 500 or a served file from outside the media disk.
        $this->get('/media/gallery-projects/../../.env')->assertNotFound();
        $this->get('/media/gallery-projects/'.str_repeat('a', 40).'.webp')->assertNotFound();
    }

    public function test_a_javascript_style_value_is_never_resolved_to_a_url(): void
    {
        $this->assertNull(Media::url('javascript:alert(1)'));
        $this->assertNull(Media::url('//evil.example/x.jpg'));
        $this->assertNull(Media::url(''));
        $this->assertNull(Media::url('relative/without/leading/slash.jpg'));
    }

    public function test_legacy_public_paths_and_cloudinary_urls_still_resolve(): void
    {
        $this->assertSame('/images/og-image.jpg', Media::url('/images/og-image.jpg'));

        $cloudinary = 'https://res.cloudinary.com/demo/image/upload/v1/gallery-projects/x.webp';
        $this->assertSame($cloudinary, Media::url($cloudinary));
    }

    public function test_deleting_a_media_asset_removes_its_variants(): void
    {
        $admin = $this->superAdmin();

        $response = $this->actingAs($admin)->postJson(route('admin.gallery.media.upload'), [
            'file' => $this->largeImageUpload(),
        ]);

        $response->assertCreated();

        $path = (string) $response->json('path');
        $parsed = MediaPath::parse($path);
        $this->assertNotNull($parsed);

        $variantNames = array_map(
            static fn (array $variant): string => (string) basename($variant['url']),
            Media::variants($path),
        );
        $this->assertNotEmpty($variantNames);

        app(\App\Contracts\ImageUploader::class)->destroy($parsed['folder'].'/'.$parsed['name']);

        $disk = Storage::disk(ImageEngine::DISK);
        $this->assertFalse($disk->exists(MediaPath::storagePath($parsed['folder'], $parsed['name'])));

        foreach ($variantNames as $variantName) {
            $this->assertFalse(
                $disk->exists(MediaPath::storagePath($parsed['folder'], $variantName)),
                'Variant should have been deleted: '.$variantName,
            );
        }
    }

    public function test_media_library_lists_engine_uploads_with_dimensions(): void
    {
        $admin = $this->superAdmin();

        $this->actingAs($admin)->postJson(route('admin.gallery.media.upload'), [
            'file' => UploadedFile::fake()->image('cover.jpg', 1200, 800),
        ])->assertCreated();

        $response = $this->actingAs($admin)->getJson(route('admin.gallery.media.index'))->assertOk();

        $engineFile = collect($response->json('files'))->first(
            static fn (array $file): bool => str_starts_with((string) ($file['path'] ?? ''), '/media/'),
        );

        $this->assertNotNull($engineFile, 'Media library should list files uploaded through the engine.');
        $this->assertSame('gallery-projects', $engineFile['directory']);
    }

    public function test_media_upload_record_is_written_for_the_engine_driver(): void
    {
        $admin = $this->superAdmin();

        $this->actingAs($admin)->postJson(route('admin.gallery.media.upload'), [
            'file' => UploadedFile::fake()->image('cover.jpg', 900, 600),
        ])->assertCreated();

        $this->assertSame(1, MediaUpload::query()->count());
        $this->assertStringStartsWith('/media/gallery-projects/', (string) MediaUpload::query()->first()?->secure_url);
    }
}
