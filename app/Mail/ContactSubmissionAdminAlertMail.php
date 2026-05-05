<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ContactSubmissionAdminAlertMail extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * @param  array<string, mixed>  $submission
     */
    public function __construct(public array $submission) {}

    public function envelope(): Envelope
    {
        $senderEmail = (string) config('bellah.marketing.sender_email', 'sales@bellahoptions.com');
        $senderName = (string) config('bellah.marketing.sender_name', 'Bellah Options');

        return new Envelope(
            subject: 'New Bellah Options contact form submission',
            from: new Address($senderEmail, $senderName),
            replyTo: [
                new Address(
                    (string) ($this->submission['email'] ?? $senderEmail),
                    (string) ($this->submission['name'] ?? 'Website Contact'),
                ),
            ],
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.contact-submission-admin-alert',
        );
    }
}
