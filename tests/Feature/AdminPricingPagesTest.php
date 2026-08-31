<?php

namespace Tests\Feature;

use App\Models\User;
use App\Support\PlatformSettings;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AdminPricingPagesTest extends TestCase
{
    use RefreshDatabase;

    private const SERVICE_SLUGS = [
        'social-media-design',
        'graphic-design',
        'brand-design',
        'web-design',
        'special-service',
        'mobile-app-development',
        'ui-ux',
        'manage-hires',
    ];

    private function superAdmin(): User
    {
        return User::factory()->create(['role' => User::ROLE_SUPER_ADMIN]);
    }

    public function test_service_pricing_page_loads_for_each_of_the_eight_services(): void
    {
        $superAdmin = $this->superAdmin();

        foreach (self::SERVICE_SLUGS as $slug) {
            $this->actingAs($superAdmin)
                ->get(route('admin.service-pricing.edit', $slug))
                ->assertOk()
                ->assertInertia(fn (Assert $page) => $page
                    ->component('Admin/ServicePricing/Show')
                    ->where('serviceSlug', $slug)
                );
        }
    }

    public function test_saving_package_pricing_for_one_service_does_not_wipe_another_services_saved_pricing(): void
    {
        $superAdmin = $this->superAdmin();

        $this->actingAs($superAdmin)
            ->patch(route('admin.service-pricing.update', 'brand-design'), [
                'package_overrides' => [
                    'logo-design' => [
                        'price' => 77000,
                        'is_recommended' => false,
                    ],
                ],
            ])
            ->assertRedirect()
            ->assertSessionHasNoErrors();

        $this->actingAs($superAdmin)
            ->patch(route('admin.service-pricing.update', 'web-design'), [
                'package_overrides' => [
                    'landing-page' => [
                        'price' => 88000,
                        'is_recommended' => true,
                    ],
                ],
            ])
            ->assertRedirect()
            ->assertSessionHasNoErrors();

        $overrides = PlatformSettings::servicePackageOverrides();

        $this->assertSame(77000.0, (float) ($overrides['brand-design']['logo-design']['price'] ?? 0));
        $this->assertSame(88000.0, (float) ($overrides['web-design']['landing-page']['price'] ?? 0));
    }

    public function test_graphic_design_items_can_be_saved(): void
    {
        $superAdmin = $this->superAdmin();

        $this->actingAs($superAdmin)
            ->patch(route('admin.service-pricing.update', 'graphic-design'), [
                'graphic_design_items' => [
                    [
                        'id' => '',
                        'title' => 'Flyer Design',
                        'description' => 'A4 promotional flyer',
                        'image_path' => '',
                        'unit_price' => 15000,
                    ],
                ],
            ])
            ->assertRedirect();

        $items = PlatformSettings::graphicDesignItems();

        $this->assertCount(1, $items);
        $this->assertSame('Flyer Design', $items[0]['title']);
        $this->assertSame(15000.0, (float) $items[0]['unit_price']);
    }

    public function test_trial_fee_can_be_saved_from_the_social_media_design_page(): void
    {
        $superAdmin = $this->superAdmin();

        $this->actingAs($superAdmin)
            ->patch(route('admin.service-pricing.update', 'social-media-design'), [
                'package_overrides' => [
                    'starter' => [
                        'price' => 35000,
                        'is_recommended' => false,
                    ],
                ],
                'social_graphic_trial_fee_ngn' => 12500,
            ])
            ->assertRedirect()
            ->assertSessionHasNoErrors();

        $this->assertSame(12500.0, PlatformSettings::socialGraphicTrialFeeNgn());
    }

    public function test_trial_fee_field_is_not_required_or_present_for_unrelated_services(): void
    {
        $superAdmin = $this->superAdmin();

        $response = $this->actingAs($superAdmin)
            ->get(route('admin.service-pricing.edit', 'web-design'));

        $response->assertInertia(fn (Assert $page) => $page
            ->component('Admin/ServicePricing/Show')
            ->where('socialGraphicTrialFeeNgn', null)
        );
    }

    public function test_discount_codes_index_page_renders(): void
    {
        $superAdmin = $this->superAdmin();

        $this->actingAs($superAdmin)
            ->get(route('admin.discount-codes.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('Admin/DiscountCodes/Index'));
    }

    public function test_subscription_plans_index_page_renders(): void
    {
        $superAdmin = $this->superAdmin();

        $this->actingAs($superAdmin)
            ->get(route('admin.subscription-plans.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('Admin/SubscriptionPlans/Index'));
    }

    public function test_settings_page_still_loads_without_the_moved_sections(): void
    {
        $superAdmin = $this->superAdmin();

        $this->actingAs($superAdmin)
            ->get(route('admin.settings.edit'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Settings')
                ->missing('discountCodes')
                ->missing('subscriptionPlans')
                ->missing('serviceCatalog')
            );
    }
}
