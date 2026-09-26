<?php

namespace App\Mail\Concerns;

use App\Support\EmailTemplateComposer;
use App\Support\NewsletterTemplating;
use App\Support\PlatformSettings;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;

trait UsesEmailTemplateLibrary
{
    /**
     * @param  array<string, scalar|null>  $fields
     */
    protected function resolveTemplateSubject(string $templateKey, string $fallbackSubject, array $fields): string
    {
        return EmailTemplateComposer::renderSubject($templateKey, $fields) ?: $fallbackSubject;
    }

    protected function resolveTemplateFromAddress(string $templateKey, string $fallbackEmail, string $fallbackName): Address
    {
        $library = PlatformSettings::emailTemplateLibrary();
        $template = is_array($library[$templateKey] ?? null) ? $library[$templateKey] : [];
        $fromEmail = strtolower(trim((string) ($template['from_email'] ?? '')));

        $resolvedEmail = filter_var($fromEmail, FILTER_VALIDATE_EMAIL)
            ? $fromEmail
            : $fallbackEmail;

        return new Address($resolvedEmail, $fallbackName);
    }

    /**
     * @param  array<string, scalar|null>  $fields
     * @param  array<string, mixed>  $fallbackViewData
     */
    protected function resolveTemplateContent(
        string $templateKey,
        string $fallbackView,
        array $fields,
        array $fallbackViewData = [],
    ): Content {
        $html = EmailTemplateComposer::renderHtml($templateKey, $fields);

        if (is_string($html) && trim($html) !== '') {
            $library = PlatformSettings::emailTemplateLibrary();
            $template = is_array($library[$templateKey] ?? null) ? $library[$templateKey] : [];

            return new Content(
                view: 'emails.dynamic-template',
                with: [
                    'htmlBody' => $html,
                    // The admin-authored body is wrapped in the shared layout, so
                    // it inherits the brand header and the legal footer rather
                    // than rendering as an unbranded white box.
                    'emailTemplateName' => (string) ($template['name'] ?? 'Bellah Options'),
                    'emailTemplatePreheader' => $this->resolveTemplatePreheader($template, $fields),
                ],
            );
        }

        return new Content(
            view: $fallbackView,
            with: $fallbackViewData,
        );
    }

    /**
     * A preview line for the inbox list. Falls back to the subject template
     * because that is the one line the recipient has already committed to
     * reading, and it beats the client inventing its own.
     *
     * @param  array<string, mixed>  $template
     * @param  array<string, scalar|null>  $fields
     */
    private function resolveTemplatePreheader(array $template, array $fields): string
    {
        $subjectTemplate = trim((string) ($template['subject_template'] ?? ''));

        if ($subjectTemplate === '') {
            return 'A message from '.(string) config('bellah.invoice.company_name', 'Bellah Options');
        }

        $subject = app(NewsletterTemplating::class)->renderSubject($subjectTemplate, $fields);

        return $subject !== ''
            ? $subject
            : 'A message from '.(string) config('bellah.invoice.company_name', 'Bellah Options');
    }
}
