<?php

namespace Tests\Feature;

use App\Contracts\ImageUploader;
use App\Models\GalleryProject;
use App\Models\MediaUpload;
use App\Models\SupportTicket;
use App\Models\User;
use App\Support\ImageEngine;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Tests\Support\FakeImageUploader;
use Tests\TestCase;

class CloudinaryUploadIntegrationTest extends TestCase
{
    use RefreshDatabase;

    private function fakeUploader(): FakeImageUploader
    {
        $fake = new FakeImageUploader();
        $this->app->instance(ImageUploader::class, $fake);

        return $fake;
    }

    private function superAdmin(): User
    {
        return User::factory()->create(['role' => User::ROLE_SUPER_ADMIN]);
    }

    private function staff(): User
    {
        return User::factory()->create(['role' => User::ROLE_CUSTOMER_REP]);
    }

    public function test_gallery_upload_stores_the_cloudinary_url_and_records_a_media_upload(): void
    {
        $this->fakeUploader();
        $admin = $this->superAdmin();

        $response = $this->actingAs($admin)->postJson(route('admin.gallery.media.upload'), [
            'file' => UploadedFile::fake()->image('cover.jpg'),
            'crop_aspect' => '16:9',
        ]);

        $response->assertCreated();
        $url = $response->json('url');

        $this->assertStringStartsWith('https://res.cloudinary.com/', $url);
        $this->assertDatabaseHas('media_uploads', ['secure_url' => $url, 'folder' => 'gallery-projects']);
    }

    public function test_cloudinary_is_the_only_bound_image_uploader(): void
    {
        // The policy in one assertion: image upload always goes to Cloudinary,
        // with no silent fall back to writing on this server.
        $this->assertInstanceOf(
            \App\Support\CloudinaryUploader::class,
            app(ImageUploader::class),
        );
    }

    public function test_gallery_upload_fails_loudly_without_cloudinary_and_writes_nothing_to_disk(): void
    {
        // Cloudinary is the only image store. A missing credential used to fall
        // back to the server's disk, which looked like success and only broke
        // when a redeploy removed the files. It must now fail with a clear,
        // actionable message instead.
        config(['services.cloudinary.url' => null]);
        Storage::fake(ImageEngine::DISK);

        $admin = $this->superAdmin();

        $response = $this->actingAs($admin)->postJson(route('admin.gallery.media.upload'), [
            'file' => UploadedFile::fake()->image('cover.jpg', 800, 600),
        ]);

        $response->assertStatus(422);
        $this->assertStringContainsString(
            'not configured',
            (string) $response->json('errors.file.0'),
        );

        $this->assertSame(
            [],
            Storage::disk(ImageEngine::DISK)->allFiles(),
            'Nothing may be written to the server as a fallback.',
        );
    }

    public function test_the_cloudinary_driver_reports_a_missing_credential(): void
    {
        // This is now the single binding, so this is what a misconfigured deploy
        // sees: a clear failure rather than a silent write to the server disk.
        config(['services.cloudinary.url' => null]);

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('not configured');

        app(\App\Support\CloudinaryUploader::class)->uploadImage(
            UploadedFile::fake()->image('cover.jpg'),
            'gallery-projects',
        );
    }

    public function test_gallery_crop_re_uploads_via_cloudinary_and_records_a_media_upload(): void
    {
        $this->fakeUploader();
        $admin = $this->superAdmin();

        $response = $this->actingAs($admin)->postJson(route('admin.gallery.media.crop'), [
            'path' => 'https://res.cloudinary.com/demo/image/upload/v1/gallery-projects/original.webp',
            'crop_aspect' => '1:1',
        ]);

        $response->assertCreated();
        $this->assertDatabaseHas('media_uploads', ['secure_url' => $response->json('url')]);
    }

    public function test_media_library_merges_legacy_local_files_with_cloudinary_uploads(): void
    {
        MediaUpload::query()->create([
            'public_id' => 'gallery-projects/new-upload',
            'secure_url' => 'https://res.cloudinary.com/demo/image/upload/v1/gallery-projects/new-upload.webp',
            'folder' => 'gallery-projects',
            'format' => 'webp',
            'bytes' => 1000,
            'width' => 800,
            'height' => 600,
        ]);

        $admin = $this->superAdmin();

        $response = $this->actingAs($admin)->getJson(route('admin.gallery.media.index'));

        $response->assertOk();
        $paths = collect($response->json('files'))->pluck('path');
        $this->assertTrue($paths->contains('https://res.cloudinary.com/demo/image/upload/v1/gallery-projects/new-upload.webp'));
    }

    public function test_deleting_a_gallery_project_with_a_cloudinary_image_destroys_the_cloudinary_asset(): void
    {
        $fake = $this->fakeUploader();

        MediaUpload::query()->create([
            'public_id' => 'gallery-projects/to-delete',
            'secure_url' => 'https://res.cloudinary.com/fake/image/upload/gallery-projects/to-delete.webp',
            'folder' => 'gallery-projects',
            'format' => 'webp',
        ]);

        $admin = $this->superAdmin();
        $project = GalleryProject::query()->create([
            'title' => 'Sample project',
            'image_path' => 'https://res.cloudinary.com/fake/image/upload/gallery-projects/to-delete.webp',
            'is_published' => true,
            'position' => 0,
        ]);

        $this->actingAs($admin)->delete(route('admin.gallery.destroy', $project))->assertRedirect();

        $this->assertNotEmpty($fake->destroyed);
        $this->assertDatabaseMissing('media_uploads', ['public_id' => 'gallery-projects/to-delete']);
    }

    public function test_email_header_image_upload_returns_a_cloudinary_url(): void
    {
        $this->fakeUploader();
        $staff = $this->superAdmin();

        $response = $this->actingAs($staff)->postJson(route('admin.email-center.assets.header-image'), [
            'file' => UploadedFile::fake()->image('header.jpg'),
        ]);

        $response->assertCreated();
        $this->assertStringStartsWith('https://res.cloudinary.com/', $response->json('url'));
    }

    public function test_profile_photo_and_company_logo_uploads_go_through_cloudinary(): void
    {
        $fake = $this->fakeUploader();
        $user = User::factory()->create();

        $response = $this->actingAs($user)->patch(route('profile.update'), [
            'name' => $user->name,
            'email' => $user->email,
            'profile_photo' => UploadedFile::fake()->image('me.jpg'),
            'company_logo' => UploadedFile::fake()->image('logo.png'),
        ]);

        $response->assertRedirect(route('profile.edit'));

        $user->refresh();
        $this->assertStringStartsWith('https://res.cloudinary.com/', (string) $user->profile_photo_path);
        $this->assertStringStartsWith('https://res.cloudinary.com/', (string) $user->company_logo_path);
        $this->assertCount(2, $fake->uploads);
        $this->assertDatabaseHas('media_uploads', ['secure_url' => $user->profile_photo_path]);
        $this->assertDatabaseHas('media_uploads', ['secure_url' => $user->company_logo_path]);
    }

    public function test_replacing_a_cloudinary_profile_photo_destroys_the_previous_asset(): void
    {
        $fake = $this->fakeUploader();
        $user = User::factory()->create([
            'profile_photo_path' => 'https://res.cloudinary.com/fake/image/upload/profile-photos/old.webp',
        ]);

        MediaUpload::query()->create([
            'public_id' => 'profile-photos/old',
            'secure_url' => 'https://res.cloudinary.com/fake/image/upload/profile-photos/old.webp',
            'folder' => 'profile-photos',
            'format' => 'webp',
        ]);

        $this->actingAs($user)->patch(route('profile.update'), [
            'name' => $user->name,
            'email' => $user->email,
            'profile_photo' => UploadedFile::fake()->image('new.jpg'),
        ])->assertRedirect();

        $this->assertContains('profile-photos/old', $fake->destroyed);
        $this->assertDatabaseMissing('media_uploads', ['public_id' => 'profile-photos/old']);
    }

    public function test_support_ticket_creation_uploads_attachment_via_cloudinary(): void
    {
        Mail::fake();
        $this->fakeUploader();
        $customer = User::factory()->create(['role' => 'user']);

        $response = $this->actingAs($customer)->post(route('dashboard.support.tickets.store'), [
            'subject' => 'Need help with my order',
            'priority' => 'medium',
            'message' => 'Something is broken, see attached screenshot.',
            'attachment' => UploadedFile::fake()->image('screenshot.jpg'),
        ]);

        $response->assertRedirect();

        $ticket = SupportTicket::query()->where('user_id', $customer->id)->first();
        $this->assertNotNull($ticket);
        $attachmentPath = $ticket->messages()->first()?->attachment_path;
        $this->assertStringStartsWith('https://res.cloudinary.com/', (string) $attachmentPath);
        $this->assertDatabaseHas('media_uploads', ['secure_url' => $attachmentPath, 'folder' => 'support-tickets']);
    }

    public function test_support_ticket_reply_uploads_attachment_via_cloudinary(): void
    {
        Mail::fake();
        $this->fakeUploader();
        $customer = User::factory()->create(['role' => 'user']);

        $ticket = SupportTicket::query()->create([
            'user_id' => $customer->id,
            'subject' => 'Existing ticket',
            'priority' => 'normal',
            'status' => SupportTicket::STATUS_OPEN,
        ]);

        $response = $this->actingAs($customer)->post(route('dashboard.support.tickets.reply', $ticket), [
            'message' => 'Here is another screenshot.',
            'attachment' => UploadedFile::fake()->image('follow-up.jpg'),
        ]);

        $response->assertRedirect();

        $message = $ticket->messages()->latest('id')->first();
        $this->assertStringStartsWith('https://res.cloudinary.com/', (string) $message?->attachment_path);
    }
}
