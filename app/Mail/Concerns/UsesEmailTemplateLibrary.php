<?php

namespace App\Mail\Concerns;

use App\Support\EmailTemplateComposer;
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
            return new Content(
                view: 'emails.dynamic-template',
                with: ['htmlBody' => $html],
            );
        }

        return new Content(
            view: $fallbackView,
            with: $fallbackViewData,
        );
    }
}
