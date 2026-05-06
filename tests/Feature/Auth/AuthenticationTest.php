<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_screen_can_be_rendered(): void
    {
        $response = $this->get('/login');

        $response->assertStatus(200);
    }

    public function test_users_can_authenticate_using_the_login_screen(): void
    {
        $user = User::factory()->create();
        $this->get('/login');
        $challenge = session('auth_login_human_check');
        $challenge['issued_at'] = now()->subSeconds(8)->timestamp;
        session(['auth_login_human_check' => $challenge]);

        $response = $this->post('/login', [
            'email' => $user->email,
            'password' => 'password',
            'human_check_answer' => $challenge['answer'],
            'human_check_nonce' => $challenge['nonce'],
            'form_rendered_at' => $challenge['issued_at'],
            'website' => '',
            'company_name' => '',
            'contact_notes' => '',
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect(route('dashboard', absolute: false));
    }

    public function test_users_can_not_authenticate_with_invalid_password(): void
    {
        $user = User::factory()->create();
        $this->get('/login');
        $challenge = session('auth_login_human_check');
        $challenge['issued_at'] = now()->subSeconds(8)->timestamp;
        session(['auth_login_human_check' => $challenge]);

        $this->post('/login', [
            'email' => $user->email,
            'password' => 'wrong-password',
            'human_check_answer' => $challenge['answer'],
            'human_check_nonce' => $challenge['nonce'],
            'form_rendered_at' => $challenge['issued_at'],
            'website' => '',
            'company_name' => '',
            'contact_notes' => '',
        ]);

        $this->assertGuest();
    }

    public function test_users_can_logout(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post('/logout');

        $this->assertGuest();
        $response->assertRedirect('/');
    }
}
