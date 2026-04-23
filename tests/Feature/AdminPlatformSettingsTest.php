<?php

namespace Tests\Feature;

use App\Models\AppSetting;
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
            ])
            ->assertRedirect();

        $this->assertTrue(AppSetting::getBool('maintenance_mode'));
        $this->assertFalse(AppSetting::getBool('coming_soon_mode'));
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
            ])
            ->assertForbidden();
    }

    public function test_public_login_and_register_are_blocked_when_coming_soon_mode_is_enabled(): void
    {
        AppSetting::setBool('coming_soon_mode', true);

        $this->get(route('login'))
            ->assertRedirect(route('waitlist.create'));

        $this->get(route('register'))
            ->assertRedirect(route('waitlist.create'));
    }
}
