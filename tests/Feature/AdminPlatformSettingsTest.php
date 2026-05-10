<?php

namespace Tests\Feature;

use App\Models\AppSetting;
use App\Models\DiscountCode;
use App\Models\SubscriptionPlan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminPlatformSettingsTest extends TestCase
{
    use RefreshDatabase;

    public function test_super_admin_can_update_platform_settings(): void
    {
        $superAdmin = User::factory()->create([
            'role' => User::ROLE_SUPER_ADMIN,
        ]);

        $this->actingAs($superAdmin)
            ->get(route('admin.settings.edit'))
            ->assertOk();

        $this->actingAs($superAdmin)
            ->patch(route('admin.settings.update'), [
                'maintenance_mode' => true,
                'coming_soon_mode' => false,
                'website_uri' => 'https://bellahoptions.com',
                'contact_phone' => '+234 801 111 2222',
                'contact_email' => 'support@bellahoptions.com',
                'contact_location' => 'Ikeja, Lagos, Nigeria',
                'contact_whatsapp_url' => 'https://wa.me/2348011112222',
                'contact_behance_url' => 'https://www.behance.net/bellahoptionsNG',
                'contact_map_embed_url' => 'https://maps.google.com/maps?q=Ikeja&t=&z=13&ie=UTF8&iwloc=&output=embed',
                'home_slides' => [
                    [
                        'title' => 'Slide One',
                        'subtitle' => 'Slide one subtitle',
                        'image' => '3.png',
                        'cta_label' => 'Learn More',
                        'cta_url' => '/services/graphic-design',
                    ],
                ],
                'service_prices' => [
                    'social-media-design' => [
                        'starter' => 35000,
                        'standard' => 65000,
                        'business' => 95000,
                    ],
                    'graphic-design' => [
                        'basic' => 50000,
                        'growth' => 90000,
                        'premium' => 160000,
                    ],
                ],
            ])
            ->assertRedirect();

        $this->assertTrue(AppSetting::getBool('maintenance_mode'));
        $this->assertFalse(AppSetting::getBool('coming_soon_mode'));
        $this->assertSame('https://bellahoptions.com', AppSetting::getValue('main_website_uri'));
        $this->assertSame('support@bellahoptions.com', AppSetting::getValue('default_contact_info_json') !== null
            ? (json_decode((string) AppSetting::getValue('default_contact_info_json'), true)['email'] ?? null)
            : null);
    }

    public function test_super_admin_settings_update_returns_json_for_ajax_requests(): void
    {
        $superAdmin = User::factory()->create([
            'role' => User::ROLE_SUPER_ADMIN,
        ]);

        $this->actingAs($superAdmin)
            ->patchJson(route('admin.settings.update'), [
                'maintenance_mode' => true,
            ])
            ->assertOk()
            ->assertJson([
                'success' => true,
                'message' => 'Platform settings updated successfully.',
            ]);
    }

    public function test_customer_rep_cannot_access_platform_settings(): void
    {
        $customerRep = User::factory()->create([
            'role' => User::ROLE_CUSTOMER_REP,
        ]);

        $this->actingAs($customerRep)
            ->get(route('admin.settings.edit'))
            ->assertForbidden();

        $this->actingAs($customerRep)
            ->patch(route('admin.settings.update'), [
                'maintenance_mode' => true,
                'coming_soon_mode' => true,
                'website_uri' => 'https://bellahoptions.com',
                'contact_phone' => '+234 801 111 2222',
                'contact_email' => 'support@bellahoptions.com',
                'contact_location' => 'Ikeja, Lagos, Nigeria',
                'contact_whatsapp_url' => 'https://wa.me/2348011112222',
                'contact_behance_url' => 'https://www.behance.net/bellahoptionsNG',
                'contact_map_embed_url' => 'https://maps.google.com/maps?q=Ikeja&t=&z=13&ie=UTF8&iwloc=&output=embed',
                'home_slides' => [
                    [
                        'title' => 'Slide One',
                        'subtitle' => 'Slide one subtitle',
                        'image' => '3.png',
                        'cta_label' => 'Learn More',
                        'cta_url' => '/services/graphic-design',
                    ],
                ],
                'service_prices' => [
                    'social-media-design' => [
                        'starter' => 35000,
                    ],
                ],
            ])
            ->assertForbidden();
    }

    public function test_super_admin_can_create_discount_code_for_service_checkout_link(): void
    {
        $superAdmin = User::factory()->create([
            'role' => User::ROLE_SUPER_ADMIN,
        ]);

        $this->actingAs($superAdmin)
            ->post(route('admin.settings.discounts.store'), [
                'name' => 'Launch Promo',
                'code' => 'LAUNCH20',
                'discount_type' => 'percentage',
                'discount_value' => 20,
                'service_slug' => 'social-media-design',
                'package_code' => 'starter',
                'is_active' => true,
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('discount_codes', [
            'code' => 'LAUNCH20',
            'discount_type' => 'percentage',
            'service_slug' => 'social-media-design',
            'package_code' => 'starter',
            'is_active' => 1,
        ]);

        $this->assertNotNull(DiscountCode::query()->where('code', 'LAUNCH20')->first());
    }

    public function test_super_admin_can_create_and_manage_subscription_plan(): void
    {
        $superAdmin = User::factory()->create([
            'role' => User::ROLE_SUPER_ADMIN,
        ]);

        $this->actingAs($superAdmin)
            ->post(route('admin.settings.subscription-plans.store'), [
                'name' => 'Growth Social Plan',
                'service_slug' => 'social-media-design',
                'package_code' => 'standard',
                'short_description' => 'Monthly content design support for growing brands.',
                'billing_cycle' => 'monthly',
                'position' => 1,
                'is_active' => true,
                'show_on_homepage' => true,
                'is_homepage_featured' => true,
                'is_recommended' => true,
            ])
            ->assertRedirect();

        $plan = SubscriptionPlan::query()
            ->where('service_slug', 'social-media-design')
            ->where('package_code', 'standard')
            ->first();

        $this->assertNotNull($plan);
        $this->assertSame('Growth Social Plan', $plan?->name);
        $this->assertTrue((bool) $plan?->is_homepage_featured);
        $this->assertTrue((bool) $plan?->is_recommended);

        $this->actingAs($superAdmin)
            ->patch(route('admin.settings.subscription-plans.update', $plan), [
                'show_on_homepage' => false,
            ])
            ->assertRedirect();

        $plan?->refresh();
        $this->assertFalse((bool) $plan?->show_on_homepage);
        $this->assertFalse((bool) $plan?->is_homepage_featured);
    }

    public function test_public_login_and_register_are_blocked_when_coming_soon_mode_is_enabled(): void
    {
        AppSetting::setBool('coming_soon_mode', true);

        $this->get(route('login'))
            ->assertRedirect(route('home'));

        $this->get(route('register'))
            ->assertRedirect(route('home'));
    }

    public function test_public_non_staff_routes_are_blocked_when_coming_soon_mode_is_enabled(): void
    {
        AppSetting::setBool('coming_soon_mode', true);

        $this->get(route('orders.create', 'social-media-design'))
            ->assertRedirect(route('home'));

        $customer = User::factory()->create([
            'role' => 'user',
        ]);

        $this->actingAs($customer)
            ->get(route('dashboard'))
            ->assertRedirect(route('home'));
    }

    public function test_staff_can_still_access_dashboard_when_maintenance_mode_is_enabled(): void
    {
        AppSetting::setBool('maintenance_mode', true);

        $staff = User::factory()->create([
            'role' => User::ROLE_CUSTOMER_REP,
        ]);

        $this->actingAs($staff)
            ->get(route('dashboard'))
            ->assertOk();
    }
}
