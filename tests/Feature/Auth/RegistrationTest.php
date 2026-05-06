<?php

namespace Tests\Feature\Auth;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_screen_can_be_rendered(): void
    {
        $response = $this->get('/register');

        $response->assertStatus(200);
    }

    public function test_new_users_can_register(): void
    {
        $this->get('/register');
        $challenge = session('auth_register_human_check');
        $challenge['issued_at'] = now()->subSeconds(8)->timestamp;
        session(['auth_register_human_check' => $challenge]);

        $response = $this->post('/register', [
            'name' => 'Test User',
            'first_name' => 'Test',
            'last_name' => 'User',
            'email' => 'test@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
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
}
