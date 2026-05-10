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

class ServiceOrderContentAssetRequestMail extends Mailable
{
    use Queueable, SerializesModels, UsesEmailTemplateLibrary;

    public function __construct(
        public ServiceOrder $order,
        public bool $hasContentReady,
        public bool $hasBrandAssetsReady,
    ) {}

    public function envelope(): Envelope
    {
        $senderEmail = (string) config('bellah.invoice.sender_email', 'billing@bellahoptions.com');
        $senderName = (string) config('bellah.invoice.company_name', 'Bellah Options');

        return new Envelope(
            subject: $this->resolveTemplateSubject(
                'service_order_content_request',
                sprintf('Next step: share your content/assets (%s)', (string) $this->order->order_code),
                $this->templateFields(),
            ),
            from: $this->resolveTemplateFromAddress('service_order_content_request', $senderEmail, $senderName),
        );
    }

    public function content(): Content
    {
        return $this->resolveTemplateContent(
            'service_order_content_request',
            'emails.service-order-content-asset-request',
            $this->templateFields(),
        );
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
            'content_is_ready' => $this->hasContentReady ? 'yes' : 'no',
            'brand_assets_are_ready' => $this->hasBrandAssetsReady ? 'yes' : 'no',
        ];
    }
}
