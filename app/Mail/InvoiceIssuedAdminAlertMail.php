<?php

namespace App\Mail;

use App\Mail\Concerns\UsesEmailTemplateLibrary;
use App\Models\Invoice;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class InvoiceIssuedAdminAlertMail extends Mailable
{
    use Queueable, SerializesModels, UsesEmailTemplateLibrary;

    /**
     * Create a new message instance.
     */
    public function __construct(public Invoice $invoice, public string $action = 'issued') {}

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        $senderEmail = (string) config('bellah.invoice.sender_email', 'billing@bellahoptions.com');
        $senderName = (string) config('bellah.invoice.company_name', 'Bellah Options');

        return new Envelope(
            subject: $this->resolveTemplateSubject(
                'invoice_issued_admin_alert',
                sprintf(
                    'Admin Alert: Invoice %s %s to %s',
                    $this->invoice->invoice_number,
                    strtolower(trim($this->action)) === 'resent' ? 'resent' : 'issued',
                    $this->invoice->customer_email,
                ),
                $this->templateFields(),
            ),
            from: $this->resolveTemplateFromAddress('invoice_issued_admin_alert', $senderEmail, $senderName),
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return $this->resolveTemplateContent(
            'invoice_issued_admin_alert',
            'emails.invoice-issued-admin-alert',
            $this->templateFields(),
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
            'invoice_action' => strtolower(trim($this->action)) === 'resent' ? 'resent' : 'issued',
        ];
    }
}
