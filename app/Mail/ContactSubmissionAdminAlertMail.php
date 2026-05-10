<?php

namespace App\Mail;

use App\Mail\Concerns\UsesEmailTemplateLibrary;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ContactSubmissionAdminAlertMail extends Mailable
{
    use Queueable, SerializesModels, UsesEmailTemplateLibrary;

    /**
     * @param  array<string, mixed>  $submission
     */
    public function __construct(public array $submission) {}

    public function envelope(): Envelope
    {
        $senderEmail = (string) config('bellah.marketing.sender_email', 'sales@bellahoptions.com');
        $senderName = (string) config('bellah.marketing.sender_name', 'Bellah Options');

        return new Envelope(
            subject: $this->resolveTemplateSubject(
                'contact_submission_admin_alert',
                'New Bellah Options contact form submission',
                $this->templateFields(),
            ),
            from: $this->resolveTemplateFromAddress('contact_submission_admin_alert', $senderEmail, $senderName),
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
        return $this->resolveTemplateContent(
            'contact_submission_admin_alert',
            'emails.contact-submission-admin-alert',
            $this->templateFields(),
        );
    }

    /**
     * @return array<string, scalar|null>
     */
    private function templateFields(): array
    {
        return [
            'customer_name' => (string) ($this->submission['name'] ?? 'Website Contact'),
            'customer_email' => (string) ($this->submission['email'] ?? ''),
            'message' => (string) ($this->submission['message'] ?? ''),
            'service_name' => (string) ($this->submission['service'] ?? ''),
        ];
    }
}
