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

class ServiceOrderClientSummaryMail extends Mailable
{
    use Queueable, SerializesModels, UsesEmailTemplateLibrary;

    /**
     * Create a new message instance.
     */
    public function __construct(public ServiceOrder $order) {}

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        $senderEmail = (string) config('bellah.invoice.sender_email', 'billing@bellahoptions.com');
        $senderName = (string) config('bellah.invoice.company_name', 'Bellah Options');

        return new Envelope(
            subject: $this->resolveTemplateSubject(
                'service_order_summary',
                sprintf('Order Received: %s (%s)', $this->order->service_name, $this->order->order_code),
                $this->templateFields(),
            ),
            from: $this->resolveTemplateFromAddress('service_order_summary', $senderEmail, $senderName),
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        $this->order->loadMissing('invoice');

        return $this->resolveTemplateContent(
            'service_order_summary',
            'emails.service-order-client-summary',
            $this->templateFields(),
        );
    }

    /**
     * @return array<string, scalar|null>
     */
    private function templateFields(): array
    {
        $this->order->loadMissing('invoice');

        return [
            'customer_name' => (string) ($this->order->name ?: 'Customer'),
            'customer_email' => (string) $this->order->email,
            'order_code' => (string) $this->order->order_code,
            'service_name' => (string) $this->order->service_name,
            'invoice_number' => (string) ($this->order->invoice?->invoice_number ?: ''),
        ];
    }
}
