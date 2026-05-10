<?php

namespace App\Mail;

use App\Mail\Concerns\UsesEmailTemplateLibrary;
use App\Models\ServiceOrder;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ServiceOrderPaymentThankYouMail extends Mailable
{
    use Queueable, SerializesModels, UsesEmailTemplateLibrary;

    public function __construct(public ServiceOrder $order) {}

    public function envelope(): Envelope
    {
        $senderEmail = (string) config('bellah.invoice.sender_email', 'billing@bellahoptions.com');
        $senderName = (string) config('bellah.invoice.company_name', 'Bellah Options');

        return new Envelope(
            subject: $this->resolveTemplateSubject(
                'service_order_payment_thank_you',
                sprintf('Thank you for your purchase (%s)', (string) $this->order->order_code),
                $this->templateFields(),
            ),
            from: $this->resolveTemplateFromAddress('service_order_payment_thank_you', $senderEmail, $senderName),
        );
    }

    public function content(): Content
    {
        return $this->resolveTemplateContent(
            'service_order_payment_thank_you',
            'emails.service-order-payment-thank-you',
            $this->templateFields(),
            [
                'estimatedTimeline' => $this->estimatedTimeline(),
            ],
        );
    }

    private function estimatedTimeline(): string
    {
        $timelineFromBrief = trim((string) data_get($this->order->brief_payload, 'timeline_preference', ''));
        if ($timelineFromBrief !== '') {
            return $timelineFromBrief;
        }

        $serviceSlug = strtolower(trim((string) $this->order->service_slug));
        $packageCode = strtolower(trim((string) $this->order->package_code));

        if ($serviceSlug === 'brand-design' && $packageCode === 'logo-design') {
            return '8 working days';
        }

        if ($serviceSlug === 'brand-design') {
            return '2 weeks';
        }

        if ($serviceSlug === 'social-media-design') {
            return '2 weeks (batch delivery in sets of 5 designs every 3 working days)';
        }

        if (in_array($serviceSlug, ['ui-ux', 'web-design', 'mobile-app-development'], true)) {
            return 'Timeline will be confirmed after scope review by the Bellah team';
        }

        return 'Timeline will be confirmed after project kickoff review';
    }

    /**
     * @return array<string, scalar|null>
     */
    private function templateFields(): array
    {
        return [
            'customer_name' => (string) ($this->order->name ?: 'Customer'),
            'customer_email' => (string) $this->order->email,
            'order_code' => (string) $this->order->order_code,
            'service_name' => (string) $this->order->service_name,
            'estimated_timeline' => $this->estimatedTimeline(),
        ];
    }
}
