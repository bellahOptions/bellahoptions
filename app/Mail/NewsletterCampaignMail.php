<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class NewsletterCampaignMail extends Mailable
{
    use Queueable;
    use SerializesModels;

    public function __construct(
        public string $subjectLine,
        public string $htmlBody,
        public ?string $fromEmail = null,
    ) {}

    public function envelope(): Envelope
    {
        $configuredSender = (string) config('bellah.marketing.sender_email', 'sales@bellahoptions.com');
        $senderEmail = filter_var((string) $this->fromEmail, FILTER_VALIDATE_EMAIL)
            ? strtolower(trim((string) $this->fromEmail))
            : $configuredSender;
        $senderName = (string) config('bellah.marketing.sender_name', 'Bellah Options');

        return new Envelope(
            subject: $this->subjectLine,
            from: new Address($senderEmail, $senderName),
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.newsletter-campaign',
            with: [
                'htmlBody' => $this->htmlBody,
            ],
        );
    }
}
