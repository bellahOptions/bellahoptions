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
        $this->get(route('staff.login'));
        $challenge = session('auth_login_human_check');
        $challenge['issued_at'] = now()->subSeconds(8)->timestamp;
        session(['auth_login_human_check' => $challenge]);

        $response = $this->post(route('staff.login.store'), [
            'email' => $staff->email,
            'password' => 'password',
            'human_check_answer' => $challenge['answer'],
            'human_check_nonce' => $challenge['nonce'],
            'form_rendered_at' => $challenge['issued_at'],
            'website' => '',
            'company_name' => '',
            'contact_notes' => '',
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
        $this->get(route('staff.login'));
        $challenge = session('auth_login_human_check');
        $challenge['issued_at'] = now()->subSeconds(8)->timestamp;
        session(['auth_login_human_check' => $challenge]);

        $this->post(route('staff.login.store'), [
            'email' => $user->email,
            'password' => 'password',
            'human_check_answer' => $challenge['answer'],
            'human_check_nonce' => $challenge['nonce'],
            'form_rendered_at' => $challenge['issued_at'],
            'website' => '',
            'company_name' => '',
            'contact_notes' => '',
        ])->assertSessionHasErrors(['email']);

        $this->assertGuest();
    }

    public function test_staff_using_regular_login_is_redirected_to_otp(): void
    {
        Mail::fake();

        $staff = User::factory()->create([
            'role' => User::ROLE_SUPER_ADMIN,
        ]);
        $this->get(route('login'));
        $challenge = session('auth_login_human_check');
        $challenge['issued_at'] = now()->subSeconds(8)->timestamp;
        session(['auth_login_human_check' => $challenge]);

        $response = $this->post(route('login'), [
            'email' => $staff->email,
            'password' => 'password',
            'remember' => true,
            'human_check_answer' => $challenge['answer'],
            'human_check_nonce' => $challenge['nonce'],
            'form_rendered_at' => $challenge['issued_at'],
            'website' => '',
            'company_name' => '',
            'contact_notes' => '',
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

        $this->post(route('staff.otp.store'), [
            'otp' => '123456',
        ])->assertSessionHasErrors(['otp']);

        $this->assertGuest();
    }
}
