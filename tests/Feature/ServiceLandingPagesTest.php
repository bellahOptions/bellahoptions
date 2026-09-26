<?php

namespace Tests\Feature;

use App\Models\AppSetting;
use App\Models\User;
use App\Support\PlatformSettings;
use App\Support\ServiceOrderCatalog;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/**
 * Service landing pages, the dynamic order CTA, the new Social Media Management
 * service and the announcement modal that promotes it.
 */
class ServiceLandingPagesTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        AppSetting::setValue('main_website_uri', 'https://bellahoptions.com');
    }

    /**
     * @return array<int, string>
     */
    private function catalogSlugs(): array
    {
        return array_keys((array) config('service_orders.services', []));
    }

    public function test_social_media_management_is_a_catalogued_service(): void
    {
        $service = app(ServiceOrderCatalog::class)->service('social-media-management');

        $this->assertIsArray($service);
        $this->assertSame('Social Media Management', $service['name']);
        $this->assertNotEmpty($service['packages']);
    }

    public function test_social_media_management_is_quoted_through_the_consultation_lane(): void
    {
        $catalog = app(ServiceOrderCatalog::class);

        $this->assertSame('special-service', $catalog->orderSlug('social-media-management'));
        // Every other service keeps its own order lane.
        $this->assertSame('web-design', $catalog->orderSlug('web-design'));
        $this->assertSame('graphic-design', $catalog->orderSlug('graphic-design'));
    }

    public function test_order_slug_falls_back_when_an_override_points_nowhere(): void
    {
        config()->set('service_orders.services.broken-service', [
            'name' => 'Broken Service',
            'description' => 'Has an order_slug that does not exist.',
            'order_slug' => 'does-not-exist',
            'intake' => [],
            'packages' => [
                'only' => ['name' => 'Only Package', 'price' => 1000, 'description' => 'Test.'],
            ],
        ]);

        // A bad override must not produce a route that 404s; it degrades to the
        // service's own slug.
        $this->assertSame('broken-service', app(ServiceOrderCatalog::class)->orderSlug('broken-service'));
    }

    public function test_every_catalogued_service_has_a_reachable_landing_page(): void
    {
        foreach ($this->catalogSlugs() as $slug) {
            $this->get('/services/'.$slug)
                ->assertOk()
                ->assertInertia(fn (Assert $page) => $page
                    ->component('ServiceDetail')
                    ->where('service.slug', $slug)
                    ->has('content.headline')
                    ->has('content.faqs')
                    ->has('content.deliverables')
                );
        }
    }

    public function test_landing_page_renders_the_new_service_with_packages_and_cta(): void
    {
        $this->get('/services/social-media-management')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('ServiceDetail')
                ->where('service.name', 'Social Media Management')
                ->where('service.order_slug', 'special-service')
                ->where('orderUrl', '/order/special-service')
                ->where('content.eyebrow', 'New service')
                ->has('service.packages', 1)
                ->has('content.faqs', 7)
                ->has('content.outcomes', 4)
            );
    }

    public function test_landing_page_for_an_unknown_service_is_not_found(): void
    {
        $this->get('/services/not-a-real-service')->assertNotFound();
    }

    public function test_landing_page_prices_match_the_order_catalogue(): void
    {
        $catalog = app(ServiceOrderCatalog::class);
        $package = $catalog->package('brand-design', 'logo-design');
        $expectedPrice = round((float) $package['price'], 2);

        $response = $this->get('/services/brand-design')->assertOk();

        $response->assertInertia(fn (Assert $page) => $page
            ->where('service.packages.0.code', 'logo-design')
        );

        // Compare numerically: JSON round-trips 70000.0 as 70000.
        $rendered = $response->viewData('page')['props']['service']['packages'][0]['price'];
        $this->assertSame($expectedPrice, round((float) $rendered, 2));
    }

    public function test_landing_page_boilerplate_page_is_indexable(): void
    {
        $this->withoutVite();

        $this->get('/services/social-media-management')
            ->assertOk()
            ->assertHeaderMissing('x-robots-tag');
    }

    public function test_landing_pages_appear_in_the_sitemap_and_order_forms_do_not(): void
    {
        $sitemap = $this->get('/sitemap.xml')->assertOk()->getContent();

        $this->assertStringContainsString('<loc>https://bellahoptions.com/services/social-media-management</loc>', $sitemap);
        $this->assertStringContainsString('<loc>https://bellahoptions.com/services/web-design</loc>', $sitemap);
        $this->assertStringNotContainsString('<loc>https://bellahoptions.com/order/web-design</loc>', $sitemap);
    }

    public function test_llms_file_lists_service_landing_pages(): void
    {
        $this->get('/llms.txt')
            ->assertOk()
            ->assertSee('Service Landing Pages:')
            ->assertSee('https://bellahoptions.com/services/social-media-management');
    }

    /*
    |--------------------------------------------------------------------------
    | Announcement modal
    |--------------------------------------------------------------------------
    */

    public function test_announcement_defaults_promote_the_new_service(): void
    {
        $announcement = PlatformSettings::serviceAnnouncement();

        $this->assertTrue($announcement['enabled']);
        $this->assertSame('/services/social-media-management', $announcement['cta_url']);
        $this->assertNotSame('', $announcement['title']);
    }

    public function test_public_pages_receive_the_announcement_payload(): void
    {
        $this->get('/services')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('serviceAnnouncement.enabled', true)
                ->where('serviceAnnouncement.cta_url', '/services/social-media-management')
            );
    }

    public function test_announcement_is_absent_from_checkout_and_account_screens(): void
    {
        // The order form is a conversion step; a marketing modal must not
        // interrupt it.
        $this->get(route('orders.create', 'brand-design'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->where('serviceAnnouncement', null));
    }

    public function test_announcement_is_absent_for_signed_in_users(): void
    {
        $user = User::factory()->create(['role' => 'user']);

        $this->actingAs($user)
            ->get('/services')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->where('serviceAnnouncement', null));
    }

    public function test_disabled_announcement_is_sent_as_null(): void
    {
        PlatformSettings::setServiceAnnouncement([
            'enabled' => false,
            'title' => 'Should not appear',
        ]);

        $this->get('/services')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->where('serviceAnnouncement', null));
    }

    public function test_super_admin_can_update_the_announcement(): void
    {
        $superAdmin = User::factory()->create(['role' => User::ROLE_SUPER_ADMIN]);

        $this->actingAs($superAdmin)
            ->patch(route('admin.settings.update'), [
                'service_announcement' => [
                    'enabled' => true,
                    'badge' => 'Just launched',
                    'title' => 'Social Media Management',
                    'body' => 'We now run your channels end to end.',
                    'cta_label' => 'See the service',
                    'cta_url' => '/services/social-media-management',
                    'image' => '/sa2.jpeg',
                    'dismiss_days' => 30,
                ],
            ])
            ->assertRedirect();

        $announcement = PlatformSettings::serviceAnnouncement();

        $this->assertSame('Just launched', $announcement['badge']);
        $this->assertSame('Social Media Management', $announcement['title']);
        $this->assertSame(30, $announcement['dismiss_days']);
    }

    public function test_announcement_rejects_a_javascript_cta_url(): void
    {
        $superAdmin = User::factory()->create(['role' => User::ROLE_SUPER_ADMIN]);

        $this->actingAs($superAdmin)
            ->patch(route('admin.settings.update'), [
                'service_announcement' => ['cta_url' => 'javascript:alert(1)'],
            ])
            ->assertSessionHasErrors(['service_announcement.cta_url']);
    }

    public function test_announcement_rejects_a_javascript_image_path(): void
    {
        $superAdmin = User::factory()->create(['role' => User::ROLE_SUPER_ADMIN]);

        $this->actingAs($superAdmin)
            ->patch(route('admin.settings.update'), [
                'service_announcement' => ['image' => 'javascript:alert(1)'],
            ])
            ->assertSessionHasErrors(['service_announcement.image']);
    }

    public function test_announcements_screen_exposes_the_announcement_to_super_admins(): void
    {
        $superAdmin = User::factory()->create(['role' => User::ROLE_SUPER_ADMIN]);

        // The announcement module moved off the Platform Settings page onto its
        // own screen (admin.announcements).
        $this->actingAs($superAdmin)
            ->get(route('admin.announcements'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Announcements')
                ->where('settings.service_announcement.cta_url', '/services/social-media-management')
                ->has('settings.service_announcement.title')
            );
    }
}
