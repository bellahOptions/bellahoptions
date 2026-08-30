<?php

namespace App\Mail;

use App\Mail\Concerns\UsesEmailTemplateLibrary;
use App\Models\IncomeSplit;
use App\Models\Invoice;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class IncomeSplitPartnerNotificationMail extends Mailable
{
    use Queueable, SerializesModels, UsesEmailTemplateLibrary;

    /**
     * Create a new message instance.
     */
    public function __construct(public IncomeSplit $split, public Invoice $invoice) {}

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        $senderEmail = (string) config('bellah.invoice.sender_email', 'billing@bellahoptions.com');
        $senderName = (string) config('bellah.invoice.company_name', 'Bellah Options');

        return new Envelope(
            subject: $this->resolveTemplateSubject(
                'income_split_partner_notification',
                'Your cut from invoice '.$this->invoice->invoice_number,
                $this->templateFields(),
            ),
            from: $this->resolveTemplateFromAddress('income_split_partner_notification', $senderEmail, $senderName),
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return $this->resolveTemplateContent(
            'income_split_partner_notification',
            'emails.income-split-partner-notification',
            $this->templateFields(),
            ['split' => $this->split, 'invoice' => $this->invoice],
        );
    }

    /**
     * @return array<string, scalar|null>
     */
    private function templateFields(): array
    {
        return [
            'invoice_number' => (string) $this->invoice->invoice_number,
            'invoice_title' => (string) $this->invoice->title,
            'invoice_amount' => number_format((float) $this->invoice->amount, 2),
            'currency' => (string) $this->invoice->currency,
            'partner_amount' => number_format((float) $this->split->partner_amount, 2),
            'partner_percent' => rtrim(rtrim(number_format((float) $this->split->partner_percent, 2), '0'), '.'),
        ];
    }
}
