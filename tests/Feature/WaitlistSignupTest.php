<?php

namespace Tests\Feature;

use App\Mail\WaitlistAdminAlertMail;
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
        config()->set('bellah.waitlist_admin_emails', ['ops@bellahoptions.com']);
        Mail::fake();

        $this->get('/');
        $challenge = session('waitlist_human_check');
        $challenge['issued_at'] = now()->subSeconds(5)->timestamp;
        session(['waitlist_human_check' => $challenge]);

        $response = $this->from('/')->post(route('waitlist.store'), [
            'name' => 'Ada Lovelace',
            'email' => 'ada@example.com',
            'occupation' => 'Software Engineer',
            'human_check_answer' => $challenge['answer'],
            'human_check_nonce' => $challenge['nonce'],
            'form_rendered_at' => $challenge['issued_at'],
            'company_name' => '',
        ]);

        $response->assertRedirect('/');

        $this->assertDatabaseHas('waitlists', [
            'name' => 'Ada Lovelace',
            'email' => 'ada@example.com',
            'occupation' => 'Software Engineer',
        ]);

        Mail::assertSent(WaitlistWelcomeMail::class, function (WaitlistWelcomeMail $mail): bool {
            return $mail->hasTo('ada@example.com')
                && $mail->waitlist->name === 'Ada Lovelace';
        });

        Mail::assertSent(WaitlistAdminAlertMail::class, function (WaitlistAdminAlertMail $mail): bool {
            return $mail->hasTo('ops@bellahoptions.com')
                && $mail->waitlist->email === 'ada@example.com';
        });
    }

    public function test_waitlist_rejects_duplicate_emails(): void
    {
        Waitlist::create([
            'name' => 'First User',
            'email' => 'dupe@example.com',
            'occupation' => 'Trader',
        ]);

        $this->get('/');
        $challenge = session('waitlist_human_check');
        $challenge['issued_at'] = now()->subSeconds(5)->timestamp;
        session(['waitlist_human_check' => $challenge]);

        $response = $this->from('/')->post(route('waitlist.store'), [
            'name' => 'Second User',
            'email' => 'dupe@example.com',
            'occupation' => 'Data Analyst',
            'human_check_answer' => $challenge['answer'],
            'human_check_nonce' => $challenge['nonce'],
            'form_rendered_at' => $challenge['issued_at'],
            'company_name' => '',
        ]);

        $response
            ->assertRedirect('/')
            ->assertSessionHasErrors(['email']);

        $this->assertDatabaseCount('waitlists', 1);
    }

    public function test_waitlist_rejects_honeypot_submissions(): void
    {
        $this->get('/');
        $challenge = session('waitlist_human_check');
        $challenge['issued_at'] = now()->subSeconds(5)->timestamp;
        session(['waitlist_human_check' => $challenge]);

        $response = $this->from('/')->post(route('waitlist.store'), [
            'name' => 'Robot User',
            'email' => 'robot@example.com',
            'occupation' => 'Software Engineer',
            'human_check_answer' => $challenge['answer'],
            'human_check_nonce' => $challenge['nonce'],
            'form_rendered_at' => $challenge['issued_at'],
            'company_name' => 'https://spam.example.com',
        ]);

        $response->assertRedirect('/')->assertSessionHasErrors(['company_name']);

        $this->assertDatabaseMissing('waitlists', [
            'email' => 'robot@example.com',
        ]);
    }
}
