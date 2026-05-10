<?php

namespace App\Mail;

use App\Mail\Concerns\UsesEmailTemplateLibrary;
use App\Models\Waitlist;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class WaitlistWelcomeMail extends Mailable
{
    use Queueable, SerializesModels, UsesEmailTemplateLibrary;

    /**
     * Create a new message instance.
     */
    public function __construct(public Waitlist $waitlist) {}

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        $senderEmail = (string) config('bellah.marketing.sender_email', 'sales@bellahoptions.com');
        $senderName = (string) config('bellah.marketing.sender_name', 'Bellah Options');

        return new Envelope(
            subject: $this->resolveTemplateSubject(
                'waitlist_welcome',
                "You're on the Bellah Options waitlist",
                $this->templateFields(),
            ),
            from: $this->resolveTemplateFromAddress('waitlist_welcome', $senderEmail, $senderName),
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return $this->resolveTemplateContent(
            'waitlist_welcome',
            'emails.waitlist-welcome',
            $this->templateFields(),
        );
    }

    /**
     * @return array<string, scalar|null>
     */
    private function templateFields(): array
    {
        return [
            'customer_name' => (string) ($this->waitlist->name ?: 'Customer'),
            'customer_email' => (string) $this->waitlist->email,
            'recipient_name' => (string) ($this->waitlist->name ?: 'Customer'),
            'recipient_email' => (string) $this->waitlist->email,
        ];
    }
}
