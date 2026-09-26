<?php

namespace Tests\Feature;

use App\Models\User;
use App\Support\ImageEngine;
use App\Support\PlatformSettings;
use App\Support\ServiceLandingContent;
use App\Support\ServiceOrderCatalog;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/**
 * Super-admin control over the service landing page hero image and the
 * announcement modal image, plus the shared admin media endpoints that back it.
 */
class ServiceImageSettingsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config(['services.cloudinary.url' => null]);
        Storage::fake(ImageEngine::DISK);
    }

    private function superAdmin(): User
    {
        return User::factory()->create(['role' => User::ROLE_SUPER_ADMIN]);
    }

    private function staff(): User
    {
        return User::factory()->create(['role' => User::ROLE_CUSTOMER_REP]);
    }

    private function defaultImageFor(string $slug): string
    {
        $catalog = app(ServiceOrderCatalog::class);

        return (string) (ServiceLandingContent::for($slug, (array) $catalog->service($slug))['image'] ?? '');
    }

    public function test_super_admin_can_override_a_service_page_image(): void
    {
        $this->actingAs($this->superAdmin())
            ->patch(route('admin.settings.update'), [
                'service_images' => ['brand-design' => '/images/custom-brand.png'],
            ])
            ->assertRedirect();

        $this->assertSame('/images/custom-brand.png', PlatformSettings::serviceImages()['brand-design']);

        $this->get('/services/brand-design')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->where('content.image', '/images/custom-brand.png'));
    }

    public function test_clearing_an_override_restores_the_built_in_artwork(): void
    {
        PlatformSettings::setServiceImages(['brand-design' => '/images/custom-brand.png']);
        $default = $this->defaultImageFor('brand-design');

        $this->actingAs($this->superAdmin())
            ->patch(route('admin.settings.update'), [
                'service_images' => ['brand-design' => ''],
            ])
            ->assertRedirect();

        $this->assertArrayNotHasKey('brand-design', PlatformSettings::serviceImages());

        $this->get('/services/brand-design')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->where('content.image', $default));
    }

    public function test_a_partial_update_leaves_other_service_images_untouched(): void
    {
        PlatformSettings::setServiceImages([
            'brand-design' => '/images/brand.png',
            'web-design' => '/images/web.png',
        ]);

        $this->actingAs($this->superAdmin())
            ->patch(route('admin.settings.update'), [
                'service_images' => ['web-design' => '/images/web-v2.png'],
            ])
            ->assertRedirect();

        $images = PlatformSettings::serviceImages();

        $this->assertSame('/images/brand.png', $images['brand-design']);
        $this->assertSame('/images/web-v2.png', $images['web-design']);
    }

    public function test_announcement_image_override_reaches_the_modal_payload(): void
    {
        PlatformSettings::setServiceImages(['announcement' => '/images/launch-banner.png']);

        $this->get('/services')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('serviceAnnouncement.image', '/images/launch-banner.png')
            );
    }

    public function test_a_javascript_image_value_is_rejected(): void
    {
        $this->actingAs($this->superAdmin())
            ->patch(route('admin.settings.update'), [
                'service_images' => ['brand-design' => 'javascript:alert(1)'],
            ])
            ->assertSessionHasErrors(['service_images.brand-design']);
    }

    public function test_an_unsafe_stored_value_is_never_returned(): void
    {
        // Simulates a record written before validation existed.
        \App\Models\AppSetting::setValue(
            'service_images_json',
            json_encode([
                'brand-design' => 'javascript:alert(1)',
                'web-design' => '//evil.example/x.png',
                'graphic-design' => '/images/ok.png',
            ]),
        );

        $images = PlatformSettings::serviceImages();

        $this->assertArrayNotHasKey('brand-design', $images);
        $this->assertArrayNotHasKey('web-design', $images);
        $this->assertSame('/images/ok.png', $images['graphic-design']);
    }

    public function test_dashboard_exposes_service_images_and_their_defaults(): void
    {
        PlatformSettings::setServiceImages(['brand-design' => '/images/brand.png']);

        // The service image manager moved off the Platform Settings page onto the
        // dashboard, so it is super-admin gated there via can_manage_settings.
        $this->actingAs($this->superAdmin())
            ->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/AdminDashboard')
                ->where('service_images.brand-design', '/images/brand.png')
                ->has('service_image_defaults')
                ->where('can_manage_settings', true)
            );
    }

    /*
    |--------------------------------------------------------------------------
    | Shared admin media endpoints
    |--------------------------------------------------------------------------
    */

    public function test_super_admin_can_upload_through_the_shared_media_endpoint(): void
    {
        $response = $this->actingAs($this->superAdmin())
            ->postJson(route('admin.media.upload'), [
                'file' => UploadedFile::fake()->image('hero.jpg', 1400, 900),
                'folder' => 'service-images',
            ]);

        $response->assertCreated();
        $this->assertStringStartsWith('/media/service-images/', (string) $response->json('path'));
    }

    public function test_shared_media_endpoint_rejects_an_unsafe_folder(): void
    {
        $this->actingAs($this->superAdmin())
            ->postJson(route('admin.media.upload'), [
                'file' => UploadedFile::fake()->image('hero.jpg'),
                'folder' => '../secrets',
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['folder']);
    }

    public function test_shared_media_endpoint_refuses_non_super_admins(): void
    {
        $this->actingAs($this->staff())
            ->postJson(route('admin.media.upload'), [
                'file' => UploadedFile::fake()->image('hero.jpg'),
            ])
            ->assertForbidden();

        $this->actingAs($this->staff())
            ->getJson(route('admin.media.library'))
            ->assertForbidden();
    }

    public function test_landing_page_advertises_width_variants_for_a_large_hero(): void
    {
        // Upload a large hero, then point the service page at it: the page should
        // carry the variants the browser needs to build a srcset.
        $path = (string) $this->actingAs($this->superAdmin())
            ->postJson(route('admin.media.upload'), [
                'file' => $this->largeImageUpload(),
                'folder' => 'service-images',
            ])
            ->json('path');

        PlatformSettings::setServiceImages(['brand-design' => $path]);

        $response = $this->get('/services/brand-design')->assertOk();

        $variants = $response->viewData('page')['props']['content']['image_variants'];

        $this->assertNotEmpty($variants);

        $widths = array_column($variants, 'width');

        // Ascending, so the browser can pick the smallest sufficient candidate.
        $sorted = $widths;
        sort($sorted);
        $this->assertSame($sorted, $widths);
        $this->assertContains(1280, $widths);
    }

    private function largeImageUpload(int $width = 2400, int $height = 1600): UploadedFile
    {
        $image = imagecreatetruecolor($width, $height);

        for ($x = 0; $x < $width; $x += 4) {
            $colour = imagecolorallocate($image, $x % 255, ($x * 3) % 255, 90);
            imagefilledrectangle($image, $x, 0, $x + 3, $height, $colour);
        }

        $path = tempnam(sys_get_temp_dir(), 'bellah-hero-').'.jpg';
        imagejpeg($image, $path, 92);
        imagedestroy($image);

        return new UploadedFile($path, 'hero.jpg', 'image/jpeg', null, true);
    }
}
