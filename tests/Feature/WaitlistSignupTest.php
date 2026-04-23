<?php

namespace Tests\Feature;

use App\Mail\WaitlistWelcomeMail;
use App\Models\Waitlist;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class WaitlistSignupTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_can_join_waitlist_and_receive_confirmation_email(): void
    {
        Mail::fake();

        $response = $this->from('/')->post(route('waitlist.store'), [
            'name' => 'Ada Lovelace',
            'email' => 'ada@example.com',
            'occupation' => 'Engineer',
        ]);

        $response->assertRedirect('/');

        $this->assertDatabaseHas('waitlists', [
            'name' => 'Ada Lovelace',
            'email' => 'ada@example.com',
            'occupation' => 'Engineer',
        ]);

        Mail::assertSent(WaitlistWelcomeMail::class, function (WaitlistWelcomeMail $mail) {
            return $mail->hasTo('ada@example.com')
                && $mail->waitlist->name === 'Ada Lovelace';
        });
    }

    public function test_waitlist_rejects_duplicate_emails(): void
    {
        Waitlist::create([
            'name' => 'First User',
            'email' => 'dupe@example.com',
            'occupation' => 'Trader',
        ]);

        $response = $this->from('/')->post(route('waitlist.store'), [
            'name' => 'Second User',
            'email' => 'dupe@example.com',
            'occupation' => 'Analyst',
        ]);

        $response
            ->assertRedirect('/')
            ->assertSessionHasErrors(['email']);

        $this->assertDatabaseCount('waitlists', 1);
    }
}
