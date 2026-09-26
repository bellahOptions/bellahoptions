<?php

namespace Tests\Feature;

use App\Models\User;
use App\Support\PlatformSettings;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * The Platform Settings page used to be one screen holding every unrelated
 * setting. It was split so each concern has its own page:
 *
 *   Service Page & Modal Images -> dashboard
 *   Service Announcement Modal  -> admin.announcements
 *   Public SEO Meta             -> admin.seo-meta
 *   Client Reviews Manager      -> admin.client-reviews.index
 *   Legal Terms Manager         -> admin.legal-terms
 *
 * These tests cover the two things that could silently break in that split:
 * that each page still receives the slice it owns, and that saving one slice
 * does not overwrite another (all pages post to the same settings endpoint).
 */
class AdminSettingsSplitTest extends TestCase
{
    use RefreshDatabase;

    private function superAdmin(): User
    {
        return User::factory()->create(['role' => User::ROLE_SUPER_ADMIN]);
    }

    /**
     * @return array<string, mixed>
     */
    private function pageProps(\Illuminate\Testing\TestResponse $response): array
    {
        $response->assertOk();

        return (array) $response->viewData('page')['props'];
    }

    public function test_settings_page_no_longer_carries_the_moved_modules(): void
    {
        $response = $this->actingAs($this->superAdmin())->get(route('admin.settings.edit'));
        $response->assertOk();
        $this->assertSame('Admin/Settings', $response->viewData('page')['component']);

        $props = (array) $response->viewData('page')['props'];
        $settings = (array) $props['settings'];

        // The four settings this page still owns.
        foreach (['maintenance_mode', 'logo_path', 'favicon_path', 'payment_fallback'] as $kept) {
            $this->assertArrayHasKey($kept, $settings);
        }

        // Everything that moved away.
        foreach ([
            'public_seo',
            'service_announcement',
            'service_images',
            'service_image_defaults',
            'terms',
        ] as $moved) {
            $this->assertArrayNotHasKey($moved, $settings, "Settings still sends `{$moved}`.");
        }

        $this->assertArrayNotHasKey('clientReviews', $props, 'Settings still sends client reviews.');
    }

    public function test_each_split_page_renders_its_own_inertia_component(): void
    {
        $admin = $this->superAdmin();

        foreach ([
            'admin.announcements' => 'Admin/Announcements',
            'admin.seo-meta' => 'Admin/SeoMeta',
            'admin.client-reviews.index' => 'Admin/ClientReviews',
            'admin.legal-terms' => 'Admin/LegalTerms',
        ] as $routeName => $component) {
            $response = $this->actingAs($admin)->get(route($routeName));
            $response->assertOk();

            $this->assertSame(
                $component,
                $response->viewData('page')['component'],
                "Route `{$routeName}` did not render `{$component}`.",
            );
        }
    }

    public function test_each_split_page_renders_with_the_slice_it_owns(): void
    {
        PlatformSettings::setServiceAnnouncement([
            'enabled' => true,
            'badge' => 'New service',
            'title' => 'Social Media Management',
            'dismiss_days' => 5,
        ]);

        $admin = $this->superAdmin();

        $announcements = $this->pageProps($this->actingAs($admin)->get(route('admin.announcements')));
        $this->assertSame(
            'Social Media Management',
            $announcements['settings']['service_announcement']['title'] ?? null,
        );
        $this->assertSame(
            5,
            $announcements['settings']['service_announcement']['dismiss_days'] ?? null,
        );

        $seo = $this->pageProps($this->actingAs($admin)->get(route('admin.seo-meta')));
        $this->assertArrayHasKey('global', $seo['settings']['public_seo']);
        $this->assertArrayHasKey('pages', $seo['settings']['public_seo']);
        $this->assertArrayHasKey('home', $seo['settings']['public_seo']['pages']);

        $reviews = $this->pageProps($this->actingAs($admin)->get(route('admin.client-reviews.index')));
        $this->assertIsArray($reviews['clientReviews']);

        $terms = $this->pageProps($this->actingAs($admin)->get(route('admin.legal-terms')));
        $this->assertArrayHasKey('terms_of_service', $terms['settings']['terms']);
        $this->assertArrayHasKey('privacy_policy', $terms['settings']['terms']);
        $this->assertArrayHasKey('cookie_policy', $terms['settings']['terms']);
    }

    public function test_dashboard_carries_the_service_image_module(): void
    {
        $props = $this->pageProps($this->actingAs($this->superAdmin())->get(route('dashboard')));

        $this->assertTrue($props['can_manage_settings']);
        $this->assertArrayHasKey('service_images', $props);
        $this->assertArrayHasKey('service_image_defaults', $props);

        // The defaults come from the service landing content, so at least one
        // service must expose artwork for the manager to show a fallback hint.
        $this->assertNotEmpty($props['service_image_defaults']);
    }

    public function test_dashboard_hides_the_service_image_module_from_non_super_admins(): void
    {
        $rep = User::factory()->create(['role' => User::ROLE_CUSTOMER_REP]);

        $props = $this->pageProps($this->actingAs($rep)->get(route('dashboard')));

        // The route is reachable, but the module must be hidden because
        // admin.settings.update is super-admin only and would reject the write.
        $this->assertFalse($props['can_manage_settings']);
    }

    public function test_saving_one_slice_does_not_clobber_another(): void
    {
        PlatformSettings::setPublicSeoSettings([
            'global' => ['default_title' => 'Untouched SEO Title'],
        ]);
        PlatformSettings::setServiceAnnouncement([
            'enabled' => true,
            'badge' => 'Before',
            'title' => 'Before title',
        ]);
        PlatformSettings::setServiceImages(['announcement' => '/media/service-images/before.webp']);

        // Saving only the announcement — the behaviour every split page relies on.
        $this->actingAs($this->superAdmin())
            ->patch(route('admin.settings.update'), [
                'service_announcement' => [
                    'enabled' => true,
                    'badge' => 'After',
                    'title' => 'After title',
                    'dismiss_days' => 3,
                ],
            ])
            ->assertRedirect();

        $this->assertSame('After title', PlatformSettings::serviceAnnouncement()['title']);

        // The neighbouring slices must be exactly as they were.
        $this->assertSame(
            'Untouched SEO Title',
            PlatformSettings::publicSeoSettings()['global']['default_title'] ?? null,
        );
        $this->assertSame(
            '/media/service-images/before.webp',
            PlatformSettings::serviceImages()['announcement'] ?? null,
        );
    }

    public function test_service_image_slice_saves_without_touching_announcements(): void
    {
        PlatformSettings::setServiceAnnouncement(['title' => 'Keep me']);

        $this->actingAs($this->superAdmin())
            ->patch(route('admin.settings.update'), [
                'service_images' => ['announcement' => '/media/service-images/after.webp'],
            ])
            ->assertRedirect();

        $this->assertSame(
            '/media/service-images/after.webp',
            PlatformSettings::serviceImages()['announcement'] ?? null,
        );
        $this->assertSame('Keep me', PlatformSettings::serviceAnnouncement()['title']);
    }

    public function test_split_pages_are_super_admin_only(): void
    {
        $rep = User::factory()->create(['role' => User::ROLE_CUSTOMER_REP]);

        foreach ([
            'admin.settings.edit',
            'admin.announcements',
            'admin.seo-meta',
            'admin.legal-terms',
            'admin.client-reviews.index',
        ] as $routeName) {
            $this->actingAs($rep)
                ->get(route($routeName))
                ->assertForbidden();
        }
    }

    public function test_removed_menu_routes_still_resolve(): void
    {
        // Email Center and Questionnaires were removed from the admin sidebar only.
        // Their routes must stay registered so the features keep working and the
        // existing questionnaire and email tests do not regress.
        foreach ([
            'admin.email-center.index',
            'admin.questionnaire-templates.index',
        ] as $routeName) {
            $this->assertTrue(
                app('router')->has($routeName),
                "Route `{$routeName}` is no longer registered.",
            );
        }
    }

    /**
     * The sidebar is client-side React and this project has no JS test runner, so
     * the menu itself is guarded by inspecting the layout source. Matching on
     * route names rather than display labels keeps this from breaking when the
     * wording of a menu entry changes.
     */
    public function test_admin_sidebar_reflects_the_new_menu_structure(): void
    {
        $layout = (string) file_get_contents(resource_path('js/Layouts/AuthenticatedLayout.jsx'));

        // Dropped from the menu (routes still exist, asserted above).
        $this->assertStringNotContainsString('admin.email-center.index', $layout);
        $this->assertStringNotContainsString('admin.questionnaire-templates.index', $layout);

        // Screens split out of Platform Settings are now reachable from the menu.
        foreach ([
            'admin.announcements',
            'admin.seo-meta',
            'admin.legal-terms',
            'admin.client-reviews.index',
        ] as $routeName) {
            $this->assertStringContainsString(
                $routeName,
                $layout,
                "The admin sidebar is missing `{$routeName}`.",
            );
        }

        // Finance and My Earnings now sit inside the Invoices group.
        $this->assertStringContainsString("label: 'Invoices'", $layout);
        $this->assertStringContainsString("label: 'Finance'", $layout);
        $this->assertStringContainsString("label: 'My Earnings'", $layout);
    }
}
