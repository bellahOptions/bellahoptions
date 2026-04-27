<?php

namespace App\Mail;

use App\Models\Invoice;
use App\Support\InvoicePdfBuilder;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Attachment;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class InvoiceReminderMail extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * Create a new message instance.
     */
    public function __construct(
        public Invoice $invoice,
        public bool $isAutomatic = true,
        public int $reminderNumber = 1,
    ) {}

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        $senderEmail = (string) config('bellah.invoice.sender_email', 'billing@bellahoptions.com');
        $senderName = (string) config('bellah.invoice.company_name', 'Bellah Options');
        $prefix = $this->isAutomatic
            ? sprintf('Reminder %d/13', max(1, $this->reminderNumber))
            : 'Payment Reminder';

        return new Envelope(
            subject: sprintf('%s: Invoice %s is still unpaid', $prefix, $this->invoice->invoice_number),
            from: new Address($senderEmail, $senderName),
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.invoice-reminder',
        );
    }

    /**
     * @return array<int, Attachment>
     */
    public function attachments(): array
    {
        $filename = 'Bellah-Options-Invoice-'.$this->invoice->invoice_number.'.pdf';

        return [
            Attachment::fromData(
                fn (): string => app(InvoicePdfBuilder::class)->buildInvoice($this->invoice),
                $filename,
            )->withMime('application/pdf'),
        ];
    }
}
