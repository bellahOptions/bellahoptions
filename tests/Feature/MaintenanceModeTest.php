<?php

namespace Tests\Feature;

use App\Models\AppSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MaintenanceModeTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_is_redirected_from_public_home_when_maintenance_mode_is_enabled(): void
    {
        AppSetting::setBool('maintenance_mode', true);

        $this->get(route('home'))
            ->assertRedirect(route('maintenance'));
    }

    public function test_staff_user_is_still_blocked_from_public_home_when_maintenance_mode_is_enabled(): void
    {
        AppSetting::setBool('maintenance_mode', true);

        $staff = User::factory()->create([
            'role' => User::ROLE_CUSTOMER_REP,
        ]);

        $this->actingAs($staff)
            ->get(route('home'))
            ->assertRedirect(route('maintenance'));
    }

    public function test_staff_portal_routes_remain_accessible_when_maintenance_mode_is_enabled(): void
    {
        AppSetting::setBool('maintenance_mode', true);

        $this->get(route('staff.login'))
            ->assertOk();
    }

    public function test_maintenance_landing_page_itself_remains_reachable_and_renders(): void
    {
        AppSetting::setBool('maintenance_mode', true);

        $this->get(route('maintenance'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Maintenance'));
    }

    public function test_guest_is_redirected_from_regular_login_to_maintenance_page(): void
    {
        AppSetting::setBool('maintenance_mode', true);

        $this->get(route('login'))
            ->assertRedirect(route('maintenance'));
    }

    public function test_public_routes_are_not_redirected_when_maintenance_mode_is_disabled(): void
    {
        AppSetting::setBool('maintenance_mode', false);

        $this->get(route('home'))->assertOk();
        $this->get(route('login'))->assertOk();
    }
}
