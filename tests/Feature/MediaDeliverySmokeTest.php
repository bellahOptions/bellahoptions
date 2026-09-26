<?php

namespace Tests\Feature;

use App\Models\User;
use App\Support\ImageEngine;
use App\Support\Media;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * Round-trips a real file through the real media disk and the delivery route.
 *
 * The other engine tests run against Storage::fake, which is fast but does not
 * prove the on-disk layout is right. A double-prefixed path
 * (`storage/app/media/media/...`) shipped once and every variant lookup missed,
 * so this test asserts the actual filesystem and the actual HTTP response.
 */
class MediaDeliverySmokeTest extends TestCase
{
    use RefreshDatabase;

    private array $writtenFolders = [];

    protected function tearDown(): void
    {
        foreach ($this->writtenFolders as $folder) {
            Storage::disk(ImageEngine::DISK)->deleteDirectory($folder);
        }

        parent::tearDown();
    }

    private function largeImageUpload(int $width = 2000, int $height = 1400): UploadedFile
    {
        $image = imagecreatetruecolor($width, $height);

        for ($x = 0; $x < $width; $x += 4) {
            $colour = imagecolorallocate($image, $x % 255, ($x * 5) % 255, 70);
            imagefilledrectangle($image, $x, 0, $x + 3, $height, $colour);
        }

        $path = tempnam(sys_get_temp_dir(), 'bellah-smoke-').'.jpg';
        imagejpeg($image, $path, 92);
        imagedestroy($image);

        return new UploadedFile($path, 'smoke.jpg', 'image/jpeg', null, true);
    }

    public function test_uploaded_original_and_variants_are_served_from_the_real_disk(): void
    {
        // This exercises the legacy local engine directly, so it is bound
        // explicitly rather than relying on the application default, which is
        // Cloudinary-only.
        $this->app->instance(
            \App\Contracts\ImageUploader::class,
            app(\App\Support\LocalImageUploader::class),
        );

        $admin = User::factory()->create(['role' => User::ROLE_SUPER_ADMIN]);

        $response = $this->actingAs($admin)->postJson(route('admin.media.upload'), [
            'file' => $this->largeImageUpload(),
            'folder' => 'smoke-test',
        ]);

        $response->assertCreated();

        $this->writtenFolders[] = 'smoke-test';

        $path = (string) $response->json('path');
        $parsed = \App\Support\MediaPath::parse($path);
        $this->assertNotNull($parsed);

        $disk = Storage::disk(ImageEngine::DISK);
        $absolute = $disk->path(\App\Support\MediaPath::storagePath($parsed['folder'], $parsed['name']));

        // The file must physically exist where the disk root says it should.
        $this->assertFileExists($absolute);
        $this->assertStringNotContainsString(
            'media'.DIRECTORY_SEPARATOR.'media',
            $absolute,
            'Media disk paths must not repeat the media/ segment.',
        );

        // The original is delivered with immutable caching.
        $original = $this->get($path)->assertOk();
        $this->assertStringContainsString('image/webp', (string) $original->headers->get('content-type'));
        $this->assertStringContainsString('immutable', (string) $original->headers->get('cache-control'));

        // And every advertised variant is really there and really served.
        $variants = Media::variants($path);
        $this->assertNotEmpty($variants);

        foreach ($variants as $variant) {
            $this->get($variant['url'])->assertOk();
        }
    }
}
