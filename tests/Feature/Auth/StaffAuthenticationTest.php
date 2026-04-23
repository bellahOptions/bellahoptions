<?php

namespace Tests\Feature\Auth;

use App\Mail\StaffLoginOtpMail;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class StaffAuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_staff_login_screen_can_be_rendered(): void
    {
        $this->get(route('staff.login'))
            ->assertOk();
    }

    public function test_customer_rep_must_complete_otp_after_staff_login(): void
    {
        Mail::fake();

        $staff = User::factory()->create([
            'role' => User::ROLE_CUSTOMER_REP,
        ]);

        $response = $this->post(route('staff.login.store'), [
            'email' => $staff->email,
            'password' => 'password',
        ]);

        $response->assertRedirect(route('staff.otp.create'));
        $this->assertGuest();
        $this->assertNotNull(session('staff_login_otp'));
        Mail::assertSent(StaffLoginOtpMail::class);

        /** @var StaffLoginOtpMail $otpMail */
        $otpMail = Mail::sent(StaffLoginOtpMail::class)->first();

        $verifyResponse = $this->post(route('staff.otp.store'), [
            'otp' => $otpMail->otpCode,
        ]);

        $this->assertAuthenticatedAs($staff);
        $verifyResponse->assertRedirect(route('dashboard', absolute: false));
    }

    public function test_non_staff_user_cannot_authenticate_using_staff_login(): void
    {
        $user = User::factory()->create([
            'role' => 'user',
        ]);

        $this->post(route('staff.login.store'), [
            'email' => $user->email,
            'password' => 'password',
        ])->assertSessionHasErrors(['email']);

        $this->assertGuest();
    }

    public function test_staff_using_regular_login_is_redirected_to_otp(): void
    {
        Mail::fake();

        $staff = User::factory()->create([
            'role' => User::ROLE_SUPER_ADMIN,
        ]);

        $response = $this->post(route('login'), [
            'email' => $staff->email,
            'password' => 'password',
            'remember' => true,
        ]);

        $response->assertRedirect(route('staff.otp.create'));
        $this->assertGuest();
        Mail::assertSent(StaffLoginOtpMail::class);
    }

    public function test_staff_otp_rejects_invalid_codes(): void
    {
        Mail::fake();

        $staff = User::factory()->create([
            'role' => User::ROLE_CUSTOMER_REP,
        ]);

        $this->post(route('staff.login.store'), [
            'email' => $staff->email,
            'password' => 'password',
        ])->assertRedirect(route('staff.otp.create'));

        $this->post(route('staff.otp.store'), [
            'otp' => '123456',
        ])->assertSessionHasErrors(['otp']);

        $this->assertGuest();
    }
}
