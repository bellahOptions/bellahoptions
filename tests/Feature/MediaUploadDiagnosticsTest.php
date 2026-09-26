<?php

namespace Tests\Feature;

use App\Contracts\ImageUploader;
use App\Models\User;
use App\Support\CloudinaryUploader;
use App\Support\ImageEngine;
use App\Support\LocalImageUploader;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use RuntimeException;
use Tests\TestCase;

/**
 * Diagnosability of image upload failures.
 *
 * The reported production symptom was a generic "Image upload failed. Please try
 * again." with nothing in the log to act on. Two things caused that:
 *
 *  1. every driver threw the same generic message, so the cause was unknowable
 *     from the response AND from the log;
 *  2. the `media` disk is configured with `throw => false`, so an ignored
 *     `put()` result turned a failed write into a reported success.
 *
 * These tests pin the fixes for both.
 */
class MediaUploadDiagnosticsTest extends TestCase
{
    use RefreshDatabase;

    private function superAdmin(): User
    {
        return User::factory()->create(['role' => User::ROLE_SUPER_ADMIN]);
    }

    /**
     * Point the media disk at a path that cannot be created, by putting a plain
     * file where the root needs a directory. This is portable, unlike chmod.
     *
     * @return string the blocking file, for cleanup
     */
    private function breakMediaDisk(): string
    {
        $blocker = (string) tempnam(sys_get_temp_dir(), 'bellah-block-');

        config()->set('filesystems.disks.media.root', $blocker.'/nested');
        Storage::forgetDisk(ImageEngine::DISK);

        return $blocker;
    }

    public function test_a_failed_disk_write_is_reported_instead_of_silently_succeeding(): void
    {
        Log::spy();

        $blocker = $this->breakMediaDisk();

        // The fake file must stay referenced: it wraps a tmpfile() resource that
        // PHP deletes as soon as the object is collected.
        $file = UploadedFile::fake()->image('photo.jpg', 800, 600);

        try {
            $engine = app(ImageEngine::class);

            $this->expectException(RuntimeException::class);
            $this->expectExceptionMessage('The image could not be saved on the server. Please contact support.');

            $engine->store($file->getRealPath(), 'photo.jpg', 'doctor');
        } finally {
            @unlink($blocker);
        }
    }

    public function test_a_storage_failure_never_leaks_the_server_path_to_the_operator(): void
    {
        $blocker = $this->breakMediaDisk();
        $file = UploadedFile::fake()->image('photo.jpg', 800, 600);

        try {
            app(ImageEngine::class)->store($file->getRealPath(), 'photo.jpg', 'doctor');

            $this->fail('Expected the engine to refuse the write.');
        } catch (RuntimeException $exception) {
            // Storage::disk() throws from the adapter constructor with the
            // absolute root in the message, so this is the path most likely to
            // leak a host layout into the admin UI.
            $this->assertStringNotContainsString($blocker, $exception->getMessage());
            $this->assertStringNotContainsString('Unable to create a directory', $exception->getMessage());
        } finally {
            @unlink($blocker);
        }
    }

    public function test_a_failed_disk_write_logs_the_root_and_the_reason(): void
    {
        Log::spy();

        $blocker = $this->breakMediaDisk();
        $file = UploadedFile::fake()->image('photo.jpg', 800, 600);

        try {
            app(ImageEngine::class)->store($file->getRealPath(), 'photo.jpg', 'doctor');

            $this->fail('The engine should have refused to report a failed write as a success.');
        } catch (RuntimeException) {
            // Expected: asserted in detail below.
        } finally {
            @unlink($blocker);
        }

        // Without the root and the reason in the log, a host permissions problem
        // is indistinguishable from a bad upload.
        Log::shouldHaveReceived('error')
            ->withArgs(function (string $message, array $context = []): bool {
                return str_contains($message, 'Unable to write a media file')
                    && array_key_exists('root', $context)
                    && array_key_exists('reason', $context)
                    && $context['disk'] === ImageEngine::DISK;
            })
            ->atLeast()->once();
    }

    public function test_the_local_uploader_logs_an_unreadable_temporary_file(): void
    {
        Log::spy();

        $file = UploadedFile::fake()->image('photo.jpg', 400, 300);
        $path = $file->getRealPath();

        // Simulate the host losing the upload temp file: PHP accepted the upload
        // but the process can no longer reach it.
        @unlink($path);

        try {
            app(LocalImageUploader::class)->uploadImage($file, 'gallery-projects');

            $this->fail('An unreadable temporary file should not be treated as a successful upload.');
        } catch (RuntimeException $exception) {
            $this->assertStringContainsString('could not be read on the server', $exception->getMessage());
        }

        Log::shouldHaveReceived('error')
            ->withArgs(fn (string $message, array $context = []): bool => str_contains($message, 'no readable temporary path')
                && array_key_exists('upload_tmp_dir', $context))
            ->atLeast()->once();
    }

    public function test_the_upload_endpoint_logs_which_driver_failed(): void
    {
        Log::spy();

        $this->app->bind(ImageUploader::class, fn (): ImageUploader => new class implements ImageUploader
        {
            public function uploadImage(UploadedFile $file, string $folder, ?string $cropAspect = null, string $format = 'webp', string $quality = 'auto'): array
            {
                throw new RuntimeException('Image upload failed. Please try again.');
            }

            public function uploadFromUrl(string $sourceUrl, string $folder, ?string $cropAspect = null, string $format = 'webp', string $quality = 'auto'): array
            {
                throw new RuntimeException('Image upload failed. Please try again.');
            }

            public function destroy(string $publicId): void {}

            public function extractPublicId(string $secureUrl): ?string
            {
                return null;
            }
        });

        $this->actingAs($this->superAdmin())
            ->postJson(route('admin.media.upload'), [
                'file' => UploadedFile::fake()->image('photo.jpg', 600, 400),
                'folder' => 'gallery-projects',
            ])
            ->assertStatus(422)
            ->assertJsonPath('errors.file.0', 'Image upload failed. Please try again.');

        // The driver class is the first thing worth knowing: an unexpected
        // CloudinaryUploader means CLOUDINARY_URL is set in that environment.
        Log::shouldHaveReceived('error')
            ->withArgs(function (string $message, array $context = []): bool {
                return str_contains($message, 'Admin image upload failed')
                    && array_key_exists('driver', $context)
                    && array_key_exists('media_disk_root', $context)
                    && $context['folder'] === 'gallery-projects';
            })
            ->atLeast()->once();
    }

    public function test_the_media_doctor_fails_without_cloudinary_credentials(): void
    {
        config()->set('services.cloudinary.url', '');

        // Cloudinary is the only image store, so an unconfigured host must be
        // reported as a failure rather than quietly recommending local storage.
        $this->artisan('media:doctor')
            ->expectsOutputToContain('Uploads cannot run')
            ->assertExitCode(1);
    }

    public function test_the_media_doctor_reports_the_active_driver(): void
    {
        config()->set('services.cloudinary.url', '');

        $this->artisan('media:doctor')
            ->expectsOutputToContain(CloudinaryUploader::class)
            ->assertExitCode(1);
    }

    public function test_the_doctor_never_suggests_falling_back_to_the_server_disk(): void
    {
        config()->set('services.cloudinary.url', '');

        // The previous version of this command told the operator to unset
        // CLOUDINARY_URL and store images locally, which is the opposite of the
        // intended architecture.
        $this->artisan('media:doctor')
            ->doesntExpectOutputToContain('local image engine handles uploads')
            ->assertExitCode(1);
    }

    public function test_ping_reports_a_missing_credential_without_calling_out(): void
    {
        config()->set('services.cloudinary.url', '');

        $result = (new CloudinaryUploader())->ping();

        // Deterministic and offline: this is the branch a bad deploy hits.
        $this->assertFalse($result['ok']);
        $this->assertStringContainsString('not configured', $result['message']);
    }

    public function test_verify_upload_reports_a_missing_credential_without_calling_out(): void
    {
        config()->set('services.cloudinary.url', '');

        $result = (new CloudinaryUploader())->verifyUpload();

        $this->assertFalse($result['ok']);
        $this->assertStringContainsString('not configured', $result['message']);
    }
}
