<?php

namespace App\Mail;

use App\Mail\Concerns\UsesEmailTemplateLibrary;
use App\Models\Questionnaire;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class QuestionnaireRequestMail extends Mailable
{
    use Queueable, SerializesModels, UsesEmailTemplateLibrary;

    /**
     * Create a new message instance.
     */
    public function __construct(public Questionnaire $questionnaire) {}

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        $senderEmail = (string) config('bellah.invoice.sender_email', 'billing@bellahoptions.com');
        $senderName = (string) config('bellah.invoice.company_name', 'Bellah Options');

        return new Envelope(
            subject: $this->resolveTemplateSubject(
                'questionnaire_request',
                'Tell us about your '.($this->serviceName() ?: 'Bellah Options').' experience',
                $this->templateFields(),
            ),
            from: $this->resolveTemplateFromAddress('questionnaire_request', $senderEmail, $senderName),
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return $this->resolveTemplateContent(
            'questionnaire_request',
            'emails.questionnaire-request',
            $this->templateFields(),
            [
                'questionnaire' => $this->questionnaire,
                'serviceName' => $this->serviceName(),
                'questions' => $this->questionnaire->template?->questions ?? [],
                'questionnaireLink' => route('questionnaires.submit.show', $this->questionnaire->token),
            ],
        );
    }

    /**
     * @return array<string, scalar|null>
     */
    private function templateFields(): array
    {
        return [
            'customer_name' => (string) ($this->questionnaire->customer_name ?: 'Customer'),
            'customer_email' => (string) $this->questionnaire->customer_email,
            'service_name' => (string) $this->serviceName(),
            'invoice_number' => (string) ($this->questionnaire->invoice?->invoice_number ?? ''),
            'questionnaire_link' => route('questionnaires.submit.show', $this->questionnaire->token),
        ];
    }

    private function serviceName(): string
    {
        return (string) ($this->questionnaire->serviceOrder?->service_name ?? '');
    }
}
