<?php

namespace App\Mail;

use App\Mail\Concerns\UsesEmailTemplateLibrary;
use App\Models\Invoice;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class InvoiceDeletedMail extends Mailable
{
    use Queueable, SerializesModels, UsesEmailTemplateLibrary;

    /**
     * Create a new message instance.
     */
    public function __construct(
        public Invoice $invoice,
        public User $deletedBy,
        public ?string $reason = null,
    ) {}

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        $senderEmail = (string) config('bellah.invoice.sender_email', 'billing@bellahoptions.com');
        $senderName = (string) config('bellah.invoice.company_name', 'Bellah Options');

        return new Envelope(
            subject: $this->resolveTemplateSubject(
                'invoice_deleted',
                'Regarding invoice '.$this->invoice->invoice_number,
                $this->templateFields(),
            ),
            from: $this->resolveTemplateFromAddress('invoice_deleted', $senderEmail, $senderName),
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return $this->resolveTemplateContent(
            'invoice_deleted',
            'emails.invoice-deleted',
            $this->templateFields(),
            [
                'invoice' => $this->invoice,
                'staffName' => $this->deletedBy->name,
                'staffPosition' => $this->deletedBy->signatureTitle(),
                'reason' => $this->reason,
            ],
        );
    }

    /**
     * @return array<string, scalar|null>
     */
    private function templateFields(): array
    {
        return [
            'customer_name' => (string) ($this->invoice->customer_name ?: 'Customer'),
            'customer_email' => (string) $this->invoice->customer_email,
            'invoice_number' => (string) $this->invoice->invoice_number,
            'invoice_title' => (string) ($this->invoice->title ?: ''),
            'reason' => (string) ($this->reason ?: ''),
            'staff_name' => (string) $this->deletedBy->name,
            'staff_position' => (string) $this->deletedBy->signatureTitle(),
        ];
    }
}
