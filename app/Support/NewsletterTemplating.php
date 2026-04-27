<?php

namespace App\Support;

class NewsletterTemplating
{
    /**
     * @var array<string, string>
     */
    private const BUILTIN_PLACEHOLDERS = [
        'recipient_name' => 'Recipient full name',
        'recipient_first_name' => 'Recipient first name',
        'recipient_last_name' => 'Recipient last name',
        'recipient_email' => 'Recipient email address',
        'recipient_occupation' => 'Recipient occupation (if available)',
        'recipient_company' => 'Recipient company (if available)',
        'audience_segment' => 'Audience source: waitlist/customers/users',
        'main_website_url' => 'Configured main website URL',
        'contact_email' => 'Default marketing contact email',
        'contact_phone' => 'Default marketing contact phone',
        'contact_whatsapp_url' => 'Default WhatsApp URL',
        'current_year' => 'Current 4-digit year',
        'sent_at' => 'Send timestamp (UTC)',
    ];

    /**
     * @return array<string, string>
     */
    public function placeholders(): array
    {
        return self::BUILTIN_PLACEHOLDERS;
    }

    /**
     * @param  array<string, scalar|null>  $fields
     */
    public function renderSubject(string $template, array $fields): string
    {
        return trim($this->replacePlaceholders($template, $fields, false));
    }

    /**
     * @param  array<string, scalar|null>  $fields
     */
    public function renderHtml(string $template, array $fields): string
    {
        return $this->replacePlaceholders($template, $fields, true);
    }

    /**
     * @param  array<string, scalar|null>  $fields
     */
    private function replacePlaceholders(string $template, array $fields, bool $escapeHtml): string
    {
        return (string) preg_replace_callback(
            '/\{\{\s*([a-zA-Z][a-zA-Z0-9_]*)\s*\}\}/',
            function (array $matches) use ($fields, $escapeHtml): string {
                $key = (string) ($matches[1] ?? '');

                if (! array_key_exists($key, $fields)) {
                    return '';
                }

                $resolved = trim((string) ($fields[$key] ?? ''));

                if ($resolved === '') {
                    return '';
                }

                return $escapeHtml ? e($resolved) : $resolved;
            },
            $template,
        );
    }
}

