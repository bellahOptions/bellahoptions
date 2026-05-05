<?php

namespace App\Mail;

use App\Models\ServiceOrder;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ServiceOrderClientSummaryMail extends Mailable
{
    use Queueable, SerializesModels;

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
            subject: sprintf('Order Received: %s (%s)', $this->order->service_name, $this->order->order_code),
            from: new Address($senderEmail, $senderName),
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        $this->order->loadMissing('invoice');

        return new Content(
            view: 'emails.service-order-client-summary',
        );
    }
}
