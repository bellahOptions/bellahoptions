<?php

namespace App\Mail;

use App\Mail\Concerns\UsesEmailTemplateLibrary;
use App\Models\ClientReview;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ClientReviewRequestMail extends Mailable
{
    use Queueable, SerializesModels, UsesEmailTemplateLibrary;

    /**
     * Create a new message instance.
     */
    public function __construct(public ClientReview $review) {}

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        $senderEmail = (string) config('bellah.invoice.sender_email', 'billing@bellahoptions.com');
        $senderName = (string) config('bellah.invoice.company_name', 'Bellah Options');

        return new Envelope(
            subject: $this->resolveTemplateSubject(
                'client_review_request',
                'How was your experience with Bellah Options?',
                $this->templateFields(),
            ),
            from: $this->resolveTemplateFromAddress('client_review_request', $senderEmail, $senderName),
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return $this->resolveTemplateContent(
            'client_review_request',
            'emails.client-review-request',
            $this->templateFields(),
            [
                'review' => $this->review,
                'reviewLink' => route('reviews.submit.show', $this->review->review_token),
            ],
        );
    }

    /**
     * @return array<string, scalar|null>
     */
    private function templateFields(): array
    {
        return [
            'customer_name' => (string) ($this->review->name ?: 'Customer'),
            'customer_email' => (string) $this->review->email,
            'review_link' => route('reviews.submit.show', $this->review->review_token),
        ];
    }
}
