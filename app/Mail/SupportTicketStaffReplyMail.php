<?php

namespace App\Mail;

use App\Mail\Concerns\UsesEmailTemplateLibrary;
use App\Models\SupportTicket;
use App\Models\SupportTicketMessage;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class SupportTicketStaffReplyMail extends Mailable
{
    use Queueable, SerializesModels, UsesEmailTemplateLibrary;

    public function __construct(public SupportTicket $ticket, public SupportTicketMessage $message) {}

    public function envelope(): Envelope
    {
        $senderEmail = (string) config('bellah.invoice.sender_email', 'billing@bellahoptions.com');
        $senderName = (string) config('bellah.invoice.company_name', 'Bellah Options');

        return new Envelope(
            subject: $this->resolveTemplateSubject(
                'support_ticket_staff_reply',
                sprintf('Support Reply: %s', $this->ticket->ticket_number),
                $this->templateFields(),
            ),
            from: $this->resolveTemplateFromAddress('support_ticket_staff_reply', $senderEmail, $senderName),
        );
    }

    public function content(): Content
    {
        return $this->resolveTemplateContent(
            'support_ticket_staff_reply',
            'emails.support-ticket-staff-reply',
            $this->templateFields(),
        );
    }

    /**
     * @return array<string, scalar|null>
     */
    private function templateFields(): array
    {
        return [
            'customer_name' => (string) ($this->ticket->customer_name ?: 'Customer'),
            'customer_email' => (string) $this->ticket->customer_email,
            'ticket_number' => (string) $this->ticket->ticket_number,
            'ticket_subject' => (string) $this->ticket->subject,
            'latest_ticket_message' => (string) ($this->message->body ?: ''),
        ];
    }
}
