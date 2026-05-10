<?php

namespace App\Support;

class EmailTemplateComposer
{
    /**
     * @param  array<string, scalar|null>  $fields
     */
    public static function renderHtml(string $templateKey, array $fields): ?string
    {
        $template = PlatformSettings::emailTemplateLibrary()[$templateKey] ?? null;

        if (! is_array($template)) {
            return null;
        }

        $htmlTemplate = trim((string) ($template['html_template'] ?? ''));
        if ($htmlTemplate === '') {
            return null;
        }

        $templating = app(NewsletterTemplating::class);
        $mergedFields = [...self::defaultFields(), ...self::normalizeScalarFields($fields)];

        return $templating->renderHtml($htmlTemplate, $mergedFields);
    }

    /**
     * @param  array<string, scalar|null>  $fields
     */
    public static function renderSubject(string $templateKey, array $fields): ?string
    {
        $template = PlatformSettings::emailTemplateLibrary()[$templateKey] ?? null;

        if (! is_array($template)) {
            return null;
        }

        $subjectTemplate = trim((string) ($template['subject_template'] ?? ''));
        if ($subjectTemplate === '') {
            return null;
        }

        $templating = app(NewsletterTemplating::class);
        $mergedFields = [...self::defaultFields(), ...self::normalizeScalarFields($fields)];
        $subject = $templating->renderSubject($subjectTemplate, $mergedFields);

        return $subject !== '' ? $subject : null;
    }

    /**
     * @param  array<string, mixed>  $fields
     * @return array<string, scalar|null>
     */
    private static function normalizeScalarFields(array $fields): array
    {
        $normalized = [];

        foreach ($fields as $key => $value) {
            if (! is_string($key) || trim($key) === '') {
                continue;
            }

            if (is_scalar($value) || $value === null) {
                $normalized[$key] = $value;
            }
        }

        return $normalized;
    }

    /**
     * @return array<string, scalar|null>
     */
    private static function defaultFields(): array
    {
        $contact = PlatformSettings::contactInfo();

        return [
            'main_website_url' => PlatformSettings::siteUrl(),
            'contact_email' => (string) ($contact['email'] ?? ''),
            'contact_phone' => (string) ($contact['phone'] ?? ''),
            'contact_whatsapp_url' => (string) ($contact['whatsapp_url'] ?? ''),
            'current_year' => now()->format('Y'),
            'sent_at' => now()->toDateTimeString(),
        ];
    }
}
