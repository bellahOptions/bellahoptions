<?php

namespace App\Mail;

use App\Mail\Concerns\UsesEmailTemplateLibrary;
use App\Models\Invoice;
use App\Models\InvoiceStaffCommission;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class InvoiceCommissionInvalidatedMail extends Mailable
{
    use Queueable, SerializesModels, UsesEmailTemplateLibrary;

    /**
     * Create a new message instance.
     */
    public function __construct(public InvoiceStaffCommission $commission, public Invoice $invoice) {}

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        $senderEmail = (string) config('bellah.invoice.sender_email', 'billing@bellahoptions.com');
        $senderName = (string) config('bellah.invoice.company_name', 'Bellah Options');

        return new Envelope(
            subject: $this->resolveTemplateSubject(
                'invoice_commission_invalidated',
                'Commission voided: invoice '.$this->invoice->invoice_number.' was deleted',
                $this->templateFields(),
            ),
            from: $this->resolveTemplateFromAddress('invoice_commission_invalidated', $senderEmail, $senderName),
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return $this->resolveTemplateContent(
            'invoice_commission_invalidated',
            'emails.invoice-commission-invalidated',
            $this->templateFields(),
            ['commission' => $this->commission, 'invoice' => $this->invoice],
        );
    }

    /**
     * @return array<string, scalar|null>
     */
    private function templateFields(): array
    {
        return [
            'staff_name' => (string) ($this->commission->user?->name ?: 'Team member'),
            'invoice_number' => (string) $this->invoice->invoice_number,
            'invoice_title' => (string) $this->invoice->title,
            'commission_amount' => number_format((float) $this->commission->commission_amount, 2),
            'commission_percent' => rtrim(rtrim(number_format((float) $this->commission->commission_percent, 2), '0'), '.'),
            'currency' => (string) $this->commission->currency,
        ];
    }
}
