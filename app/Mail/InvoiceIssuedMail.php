<?php

namespace App\Mail;

use App\Mail\Concerns\UsesEmailTemplateLibrary;
use App\Models\Invoice;
use App\Support\InvoicePdfBuilder;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class InvoiceIssuedMail extends Mailable
{
    use Queueable, SerializesModels, UsesEmailTemplateLibrary;

    /**
     * Create a new message instance.
     */
    public function __construct(public Invoice $invoice) {}

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        $senderEmail = (string) config('bellah.invoice.sender_email', 'billing@bellahoptions.com');
        $senderName = (string) config('bellah.invoice.company_name', 'Bellah Options');

        return new Envelope(
            subject: $this->resolveTemplateSubject(
                'invoice_issued',
                'Customer Invoice: '.$this->invoice->invoice_number,
                $this->templateFields(),
            ),
            from: $this->resolveTemplateFromAddress('invoice_issued', $senderEmail, $senderName),
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        $this->invoice->loadMissing('serviceOrder');

        return $this->resolveTemplateContent(
            'invoice_issued',
            'emails.invoice-issued',
            $this->templateFields(),
        );
    }

    /**
     * @return array<int, Attachment>
     */
    public function attachments(): array
    {
        $this->invoice->loadMissing('serviceOrder');
        $filename = 'Bellah-Options-Invoice-'.$this->invoice->invoice_number.'.pdf';

        return [
            Attachment::fromData(
                fn (): string => app(InvoicePdfBuilder::class)->buildInvoice($this->invoice),
                $filename,
            )->withMime('application/pdf'),
        ];
    }

    /**
     * @return array<string, scalar|null>
     */
    private function templateFields(): array
    {
        $this->invoice->loadMissing('serviceOrder');

        return [
            'customer_name' => (string) ($this->invoice->customer_name ?: 'Customer'),
            'customer_email' => (string) $this->invoice->customer_email,
            'invoice_number' => (string) $this->invoice->invoice_number,
            'order_code' => (string) ($this->invoice->serviceOrder?->order_code ?: ''),
            'service_name' => (string) ($this->invoice->title ?: ''),
        ];
    }
}
