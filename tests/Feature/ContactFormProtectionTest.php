<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class ContactFormProtectionTest extends TestCase
{
    public function test_contact_page_is_rolled_back_to_home(): void
    {
        $this->get(route('contact'))
            ->assertRedirect(route('home'));
    }

    public function test_contact_submission_route_is_rolled_back_to_home_and_sends_no_mail(): void
    {
        Mail::fake();

        $this->post(route('contact.submit'), [
            'full_name' => 'Ada Lovelace',
            'email' => 'ada@example.com',
            'phone' => '+2348108671804',
            'service' => 'Brand Design',
            'message' => 'Test message',
        ])->assertRedirect(route('home'));

        Mail::assertNothingSent();
    }
}
