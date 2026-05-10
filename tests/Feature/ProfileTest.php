<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProfileTest extends TestCase
{
    use RefreshDatabase;

    public function test_profile_page_is_displayed(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->get('/profile');

        $response->assertOk();
    }

    public function test_profile_information_can_be_updated(): void
    {
        $user = User::factory()->create([
            'email' => 'original@example.com',
        ]);

        $response = $this
            ->actingAs($user)
            ->patch('/profile', [
                'name' => 'Test User',
                'email' => $user->email,
            ]);

        $response
            ->assertSessionHasNoErrors()
            ->assertRedirect('/profile');

        $user->refresh();

        $this->assertSame('Test User', $user->name);
        $this->assertSame('original@example.com', $user->email);
        $this->assertNotNull($user->email_verified_at);
    }

    public function test_registered_email_address_cannot_be_changed_from_profile(): void
    {
        $user = User::factory()->create([
            'email' => 'original@example.com',
        ]);

        $response = $this
            ->actingAs($user)
            ->from('/profile')
            ->patch('/profile', [
                'name' => 'Test User',
                'email' => 'changed@example.com',
            ]);

        $response
            ->assertRedirect('/profile')
            ->assertSessionHasErrors('email');

        $this->assertSame('original@example.com', $user->refresh()->email);
    }

    public function test_company_kyc_details_can_be_updated_from_profile(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->patch('/profile', [
                'name' => $user->name,
                'email' => $user->email,
                'address' => '4 Admiralty Way, Lagos',
                'company_name' => 'Bellah Industries Ltd',
                'social_media_info' => '@bellahoptions',
                'business_number' => '+2348100000000',
                'business_official_email' => 'ops@bellah.example',
                'business_address' => 'Plot 8, Marina, Lagos',
            ]);

        $response
            ->assertSessionHasNoErrors()
            ->assertRedirect('/profile');

        $user->refresh();

        $this->assertSame('4 Admiralty Way, Lagos', $user->address);
        $this->assertSame('Bellah Industries Ltd', $user->company_name);
        $this->assertSame('@bellahoptions', $user->social_media_info);
        $this->assertSame('+2348100000000', $user->business_number);
        $this->assertSame('ops@bellah.example', $user->business_official_email);
        $this->assertSame('Plot 8, Marina, Lagos', $user->business_address);
    }

    public function test_email_verification_status_is_unchanged_when_the_email_address_is_unchanged(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->patch('/profile', [
                'name' => 'Test User',
                'email' => $user->email,
            ]);

        $response
            ->assertSessionHasNoErrors()
            ->assertRedirect('/profile');

        $this->assertNotNull($user->refresh()->email_verified_at);
    }

    public function test_account_deletion_endpoint_is_disabled_for_users(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->delete('/profile', [
                'password' => 'password',
            ]);

        $response
            ->assertStatus(405);

        $this->assertAuthenticatedAs($user);
        $this->assertNotNull($user->fresh());
    }

    public function test_account_deletion_remains_disabled_even_with_wrong_password(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->from('/profile')
            ->delete('/profile', [
                'password' => 'wrong-password',
            ]);

        $response
            ->assertStatus(405);

        $this->assertNotNull($user->fresh());
    }
}
