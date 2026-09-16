<?php

namespace App\Mail;

use App\Mail\Concerns\UsesEmailTemplateLibrary;
use App\Models\ServiceBrief;
use App\Support\ServiceBriefSchema;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ServiceBriefReceivedMail extends Mailable
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
                'service_brief_received',
                "We've received your brief — {$this->brief->reference_number}",
                $this->templateFields(),
            ),
            from: $this->resolveTemplateFromAddress('service_brief_received', $senderEmail, $senderName),
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        $schema = app(ServiceBriefSchema::class);
        $labels = $schema->labels($this->brief->service_slug, $this->brief->template);

        $answers = [];
        foreach ((array) $this->brief->answers as $key => $value) {
            if ($key === 'consent_ndpa' || $key === 'consent_marketing' || $value === null || $value === '') {
                continue;
            }

            $answers[] = [
                'label' => $labels[$key] ?? $key,
                'value' => is_array($value) ? implode(', ', $value) : (string) $value,
            ];
        }

        return $this->resolveTemplateContent(
            'service_brief_received',
            'emails.service-brief-received',
            $this->templateFields(),
            [
                'brief' => $this->brief,
                'answers' => $answers,
            ],
        );
    }

    /**
     * @return array<string, scalar|null>
     */
    private function templateFields(): array
    {
        return [
            'customer_name' => (string) ($this->brief->customer_name ?: 'Customer'),
            'reference_number' => (string) $this->brief->reference_number,
            'service_name' => (string) config("service_briefs.service_meta.{$this->brief->service_slug}.name", $this->brief->service_slug),
        ];
    }
}
