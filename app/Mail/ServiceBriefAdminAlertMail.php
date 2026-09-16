<?php

namespace App\Mail;

use App\Mail\Concerns\UsesEmailTemplateLibrary;
use App\Models\ServiceBrief;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ServiceBriefAdminAlertMail extends Mailable
{
    use Queueable, SerializesModels, UsesEmailTemplateLibrary;

    /**
     * Create a new message instance.
     */
    public function __construct(public ServiceBrief $brief) {}

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        $senderEmail = (string) config('bellah.invoice.sender_email', 'billing@bellahoptions.com');
        $senderName = (string) config('bellah.invoice.company_name', 'Bellah Options');

        return new Envelope(
            subject: $this->resolveTemplateSubject(
                'service_brief_admin_alert',
                sprintf(
                    'New brief: %s (%s)%s',
                    $this->brief->reference_number,
                    (string) config("service_briefs.service_meta.{$this->brief->service_slug}.name", $this->brief->service_slug),
                    $this->brief->is_rush ? ' — RUSH' : '',
                ),
                $this->templateFields(),
            ),
            from: $this->resolveTemplateFromAddress('service_brief_admin_alert', $senderEmail, $senderName),
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return $this->resolveTemplateContent(
            'service_brief_admin_alert',
            'emails.service-brief-admin-alert',
            $this->templateFields(),
            [
                'brief' => $this->brief,
            ],
        );
    }

    /**
     * @return array<string, scalar|null>
     */
    private function templateFields(): array
    {
        return [
            'reference_number' => (string) $this->brief->reference_number,
            'customer_name' => (string) ($this->brief->customer_name ?: 'Customer'),
            'customer_email' => (string) $this->brief->customer_email,
            'service_name' => (string) config("service_briefs.service_meta.{$this->brief->service_slug}.name", $this->brief->service_slug),
        ];
    }
}
