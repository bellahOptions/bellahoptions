<?php

namespace Tests\Feature;

use App\Mail\StaffLoginOtpMail;
use App\Models\AppSetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
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

    public function test_logged_in_staff_can_still_browse_the_public_site_when_maintenance_mode_is_enabled(): void
    {
        AppSetting::setBool('maintenance_mode', true);

        $staff = User::factory()->create([
            'role' => User::ROLE_CUSTOMER_REP,
        ]);

        $this->actingAs($staff)
            ->get(route('home'))
            ->assertOk();
    }

    public function test_logged_in_super_admin_can_still_browse_the_public_site_when_maintenance_mode_is_enabled(): void
    {
        AppSetting::setBool('maintenance_mode', true);

        $superAdmin = User::factory()->create([
            'role' => User::ROLE_SUPER_ADMIN,
        ]);

        $this->actingAs($superAdmin)
            ->get(route('home'))
            ->assertOk();
    }

    public function test_regular_customer_user_is_still_blocked_from_public_home_when_maintenance_mode_is_enabled(): void
    {
        AppSetting::setBool('maintenance_mode', true);

        $customer = User::factory()->create([
            'role' => 'user',
        ]);

        $this->actingAs($customer)
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

    public function test_login_page_remains_reachable_when_maintenance_mode_is_enabled(): void
    {
        // Staff authenticate through this same "login" page (it detects staff
        // accounts and routes them into the OTP flow), so it must stay reachable
        // even while the rest of the public site is locked down.
        AppSetting::setBool('maintenance_mode', true);

        $this->get(route('login'))
            ->assertOk();
    }

    public function test_register_page_is_still_blocked_when_maintenance_mode_is_enabled(): void
    {
        AppSetting::setBool('maintenance_mode', true);

        $this->get(route('register'))
            ->assertRedirect(route('maintenance'));
    }

    public function test_public_routes_are_not_redirected_when_maintenance_mode_is_disabled(): void
    {
        AppSetting::setBool('maintenance_mode', false);

        $this->get(route('home'))->assertOk();
        $this->get(route('login'))->assertOk();
    }

    public function test_staff_can_complete_the_full_login_flow_via_the_regular_login_page_during_maintenance_mode(): void
    {
        Mail::fake();
        AppSetting::setBool('maintenance_mode', true);

        $staff = User::factory()->create(['role' => User::ROLE_CUSTOMER_REP]);

        $this->get(route('login'));
        $challenge = session('auth_login_human_check');
        $challenge['issued_at'] = now()->subSeconds(8)->timestamp;
        session(['auth_login_human_check' => $challenge]);

        $this->post(route('login'), [
            'email' => $staff->email,
            'password' => 'password',
            'human_check_answer' => $challenge['answer'],
            'human_check_nonce' => $challenge['nonce'],
            'form_rendered_at' => $challenge['issued_at'],
            'website' => '',
            'company_name' => '',
            'contact_notes' => '',
        ])->assertRedirect(route('staff.otp.create'));

        $otpMail = Mail::sent(StaffLoginOtpMail::class)->first();

        $this->post(route('staff.otp.store'), ['otp' => $otpMail->otpCode])
            ->assertRedirect(route('dashboard', absolute: false));

        $this->assertAuthenticatedAs($staff);
    }

    public function test_staff_can_complete_the_full_login_flow_via_the_staff_login_page_during_maintenance_mode(): void
    {
        Mail::fake();
        AppSetting::setBool('maintenance_mode', true);

        $staff = User::factory()->create(['role' => User::ROLE_SUPER_ADMIN]);

        $this->get(route('staff.login'));
        $challenge = session('auth_login_human_check');
        $challenge['issued_at'] = now()->subSeconds(8)->timestamp;
        session(['auth_login_human_check' => $challenge]);

        $this->post(route('staff.login.store'), [
            'email' => $staff->email,
            'password' => 'password',
            'human_check_answer' => $challenge['answer'],
            'human_check_nonce' => $challenge['nonce'],
            'form_rendered_at' => $challenge['issued_at'],
            'website' => '',
            'company_name' => '',
            'contact_notes' => '',
        ])->assertRedirect(route('staff.otp.create'));

        $otpMail = Mail::sent(StaffLoginOtpMail::class)->first();

        $this->post(route('staff.otp.store'), ['otp' => $otpMail->otpCode])
            ->assertRedirect(route('dashboard', absolute: false));

        $this->assertAuthenticatedAs($staff);
    }

    public function test_regular_customer_cannot_browse_past_login_during_maintenance_mode(): void
    {
        AppSetting::setBool('maintenance_mode', true);

        $customer = User::factory()->create(['role' => 'user']);

        $this->get(route('login'));
        $challenge = session('auth_login_human_check');
        $challenge['issued_at'] = now()->subSeconds(8)->timestamp;
        session(['auth_login_human_check' => $challenge]);

        $this->post(route('login'), [
            'email' => $customer->email,
            'password' => 'password',
            'human_check_answer' => $challenge['answer'],
            'human_check_nonce' => $challenge['nonce'],
            'form_rendered_at' => $challenge['issued_at'],
            'website' => '',
            'company_name' => '',
            'contact_notes' => '',
        ]);

        $this->assertAuthenticatedAs($customer);

        $this->get(route('home'))
            ->assertRedirect(route('maintenance'));
    }
}
