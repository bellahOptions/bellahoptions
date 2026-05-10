<?php

namespace App\Mail;

use App\Models\OrderProspect;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class AbandonedOrderProspectReminderMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public OrderProspect $prospect,
        public string $resumeUrl,
    ) {}

    public function envelope(): Envelope
    {
        $senderEmail = (string) config('bellah.marketing.sender_email', 'sales@bellahoptions.com');
        $senderName = (string) config('bellah.marketing.sender_name', 'Bellah Options');

        return new Envelope(
            subject: 'Complete your Bellah Options order',
            from: new Address($senderEmail, $senderName),
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.abandoned-order-prospect-reminder',
            with: [
                'prospect' => $this->prospect,
                'resumeUrl' => $this->resumeUrl,
            ],
        );
    }
}
