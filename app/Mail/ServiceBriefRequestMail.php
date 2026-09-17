<?php

namespace App\Mail;

use App\Mail\Concerns\UsesEmailTemplateLibrary;
use App\Models\ServiceOrder;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ServiceBriefRequestMail extends Mailable
{
    use Queueable, SerializesModels, UsesEmailTemplateLibrary;

    /**
     * Create a new message instance.
     */
    public function __construct(public ServiceOrder $order, public string $briefLink) {}

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        $senderEmail = (string) config('bellah.invoice.sender_email', 'billing@bellahoptions.com');
        $senderName = (string) config('bellah.invoice.company_name', 'Bellah Options');

        return new Envelope(
            subject: $this->resolveTemplateSubject(
                'service_brief_request',
                "Tell us more about your {$this->serviceName()} project",
                $this->templateFields(),
            ),
            from: $this->resolveTemplateFromAddress('service_brief_request', $senderEmail, $senderName),
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return $this->resolveTemplateContent(
            'service_brief_request',
            'emails.service-brief-request',
            $this->templateFields(),
            [
                'order' => $this->order,
                'serviceName' => $this->serviceName(),
                'briefLink' => $this->briefLink,
                'estimatedMinutes' => (int) config("service_briefs.service_meta.{$this->order->service_slug}.estimated_minutes", 7),
            ],
        );
    }

    /**
     * @return array<string, scalar|null>
     */
    private function templateFields(): array
    {
        return [
            'customer_name' => (string) ($this->order->full_name ?: 'Customer'),
            'customer_email' => (string) $this->order->email,
            'service_name' => $this->serviceName(),
            'order_code' => (string) $this->order->order_code,
            'brief_link' => $this->briefLink,
        ];
    }

    private function serviceName(): string
    {
        return (string) config("service_briefs.service_meta.{$this->order->service_slug}.name", $this->order->service_slug);
    }
}
