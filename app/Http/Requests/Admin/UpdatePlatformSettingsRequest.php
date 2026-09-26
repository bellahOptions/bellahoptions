<?php

namespace App\Http\Requests\Admin;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdatePlatformSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user()?->canManageSettings();
    }

    protected function prepareForValidation(): void
    {
        $fields = [];

        if ($this->has('maintenance_mode')) {
            $fields['maintenance_mode'] = $this->boolean('maintenance_mode');
        }

        foreach ([
            'website_uri',
            'contact_phone',
            'contact_email',
            'contact_location',
            'contact_whatsapp_url',
            'contact_behance_url',
            'contact_map_embed_url',
            'logo_path',
            'favicon_path',
        ] as $field) {
            if ($this->has($field)) {
                $fields[$field] = trim((string) $this->input($field));
            }
        }

        if (array_key_exists('contact_email', $fields)) {
            $fields['contact_email'] = strtolower($fields['contact_email']);
        }

        if ($this->has('public_seo')) {
            $fields['public_seo'] = is_array($this->input('public_seo')) ? $this->input('public_seo') : [];
        }

        if ($this->has('payment_fallback')) {
            $paymentFallback = is_array($this->input('payment_fallback')) ? $this->input('payment_fallback') : [];

            // The fallback exposes a list of bank accounts, so each row is
            // normalised in place. Blank strings become null so that clearing a
            // field is not rejected by the account-number pattern.
            if (array_key_exists('accounts', $paymentFallback) && is_array($paymentFallback['accounts'])) {
                $paymentFallback['accounts'] = array_values(array_map(
                    static function ($account): array {
                        $account = is_array($account) ? $account : [];

                        return [
                            'bank_name' => self::nullableTrim($account['bank_name'] ?? null),
                            'bank_code' => self::nullableTrim($account['bank_code'] ?? null),
                            'account_name' => self::nullableTrim($account['account_name'] ?? null),
                            'account_number' => self::nullableTrim($account['account_number'] ?? null),
                        ];
                    },
                    $paymentFallback['accounts'],
                ));
            }

            foreach (['instructions', 'support_email', 'reference_hint'] as $field) {
                if (array_key_exists($field, $paymentFallback)) {
                    $paymentFallback[$field] = trim((string) $paymentFallback[$field]);
                }
            }

            if (array_key_exists('enabled', $paymentFallback)) {
                $paymentFallback['enabled'] = filter_var(
                    $paymentFallback['enabled'],
                    FILTER_VALIDATE_BOOL,
                );
            }

            if (array_key_exists('support_email', $paymentFallback)) {
                $paymentFallback['support_email'] = strtolower($paymentFallback['support_email']);
            }

            $fields['payment_fallback'] = $paymentFallback;
        }

        if ($this->has('service_announcement')) {
            $announcement = is_array($this->input('service_announcement')) ? $this->input('service_announcement') : [];

            foreach (['badge', 'title', 'body', 'cta_label', 'cta_url', 'image'] as $field) {
                if (array_key_exists($field, $announcement)) {
                    $announcement[$field] = trim((string) $announcement[$field]);
                }
            }

            if (array_key_exists('enabled', $announcement)) {
                $announcement['enabled'] = filter_var($announcement['enabled'], FILTER_VALIDATE_BOOL);
            }

            if (array_key_exists('dismiss_days', $announcement)) {
                $announcement['dismiss_days'] = (int) $announcement['dismiss_days'];
            }

            $fields['service_announcement'] = $announcement;
        }

        if ($this->has('terms')) {
            $fields['terms'] = is_array($this->input('terms')) ? $this->input('terms') : null;
        }

        $this->merge($fields);
    }

    /**
     * Trim a value, turning a blank string into null.
     *
     * The admin form autosaves whatever is in the field, so clearing a
     * bank-account input posts "". `nullable` only forgives null, so without this
     * the account-number pattern would reject a deliberately blanked field.
     */
    private static function nullableTrim(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $trimmed = trim((string) $value);

        return $trimmed === '' ? null : $trimmed;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'maintenance_mode' => ['sometimes', 'required', 'boolean'],
            'website_uri' => ['sometimes', 'required', 'url:http,https', 'max:255'],

            'contact_phone' => ['sometimes', 'required', 'string', 'min:7', 'max:40'],
            'contact_email' => ['sometimes', 'required', 'string', 'email:rfc', 'max:255'],
            'contact_location' => ['sometimes', 'required', 'string', 'max:180'],
            'contact_whatsapp_url' => ['sometimes', 'required', 'url:http,https', 'max:255'],
            'contact_behance_url' => ['sometimes', 'required', 'url:http,https', 'max:255'],
            'contact_map_embed_url' => ['sometimes', 'required', 'url:http,https', 'max:4000'],

            'logo_path' => ['sometimes', 'required', 'string', 'max:255'],
            'favicon_path' => ['sometimes', 'required', 'string', 'max:255'],

            'public_seo' => ['sometimes', 'required', 'array'],
            'public_seo.global' => ['required_with:public_seo', 'array'],
            'public_seo.global.default_title' => ['nullable', 'string', 'max:180'],
            'public_seo.global.default_description' => ['nullable', 'string', 'max:320'],
            'public_seo.global.default_keywords' => ['nullable', 'string', 'max:350'],
            'public_seo.global.default_robots' => ['nullable', 'string', 'max:160'],
            'public_seo.global.default_og_image' => ['nullable', 'string', 'max:255', 'regex:/^(https?:\/\/|\/).+/i'],
            'public_seo.global.default_twitter_image' => ['nullable', 'string', 'max:255', 'regex:/^(https?:\/\/|\/).+/i'],
            'public_seo.global.twitter_card' => ['nullable', 'string', 'in:summary,summary_large_image'],
            'public_seo.global.twitter_site' => ['nullable', 'string', 'max:80'],
            'public_seo.pages' => ['required_with:public_seo', 'array'],
            'public_seo.pages.*' => ['required_with:public_seo.pages', 'array'],
            'public_seo.pages.*.path' => ['nullable', 'string', 'max:255', 'regex:/^\/.*/'],
            'public_seo.pages.*.meta_title' => ['nullable', 'string', 'max:180'],
            'public_seo.pages.*.meta_description' => ['nullable', 'string', 'max:320'],
            'public_seo.pages.*.canonical_url' => ['nullable', 'string', 'max:255', 'regex:/^(https?:\/\/|\/).+/i'],
            'public_seo.pages.*.keywords' => ['nullable', 'string', 'max:350'],
            'public_seo.pages.*.robots' => ['nullable', 'string', 'max:160'],
            'public_seo.pages.*.og_image' => ['nullable', 'string', 'max:255', 'regex:/^(https?:\/\/|\/).+/i'],
            'public_seo.pages.*.twitter_image' => ['nullable', 'string', 'max:255', 'regex:/^(https?:\/\/|\/).+/i'],
            'public_seo.pages.*.og_type' => ['nullable', 'string', 'in:website,article'],

            'terms' => ['sometimes', 'nullable', 'array'],
            'terms.terms_of_service' => ['nullable', 'string', 'max:200000'],
            'terms.privacy_policy' => ['nullable', 'string', 'max:200000'],
            'terms.cookie_policy' => ['nullable', 'string', 'max:200000'],

            // Bank-transfer fallback account shown when an online gateway is
            // down. Every field is independently optional so the admin form can
            // auto-save one field at a time; completeness is enforced at read
            // time, where an incomplete account is simply never offered to a
            // customer.
            'payment_fallback' => ['sometimes', 'required', 'array'],
            'payment_fallback.enabled' => ['sometimes', 'boolean'],
            // A business can hold several accounts, so the fallback is a list.
            // Capped to keep a runaway client from posting thousands of rows.
            'payment_fallback.accounts' => ['sometimes', 'array', 'max:10'],
            'payment_fallback.accounts.*' => ['array'],
            'payment_fallback.accounts.*.bank_name' => ['nullable', 'string', 'max:120'],
            // The Paystack bank code used to resolve the account name. Stored so
            // the name can be re-resolved without re-picking the bank.
            'payment_fallback.accounts.*.bank_code' => ['nullable', 'string', 'max:20', 'regex:/^[0-9]{2,10}$/'],
            'payment_fallback.accounts.*.account_name' => ['nullable', 'string', 'max:120'],
            'payment_fallback.accounts.*.account_number' => [
                'nullable',
                'string',
                'max:34',
                'regex:/^[0-9][0-9\s-]{4,33}$/',
            ],
            'payment_fallback.instructions' => ['nullable', 'string', 'max:500'],
            'payment_fallback.reference_hint' => ['nullable', 'string', 'max:160'],
            'payment_fallback.support_email' => ['nullable', 'string', 'email:rfc', 'max:255'],

            // Service announcement modal. Every field is optional so the auto
            // saving form can write one field at a time.
            'service_announcement' => ['sometimes', 'required', 'array'],
            'service_announcement.enabled' => ['sometimes', 'boolean'],
            'service_announcement.badge' => ['nullable', 'string', 'max:40'],
            'service_announcement.title' => ['nullable', 'string', 'max:120'],
            'service_announcement.body' => ['nullable', 'string', 'max:600'],
            'service_announcement.cta_label' => ['nullable', 'string', 'max:60'],
            'service_announcement.cta_url' => ['nullable', 'string', 'max:255', 'regex:/^(https?:\/\/|\/)[^\s]+$/i'],
            'service_announcement.image' => ['nullable', 'string', 'max:255', 'regex:/^(https?:\/\/|\/)[^\s]+$/i'],
            'service_announcement.dismiss_days' => ['sometimes', 'integer', 'min:0', 'max:365'],

            // Per-service landing page artwork, keyed by service slug, plus the
            // reserved `announcement` key. Only keys present are written.
            'service_images' => ['sometimes', 'required', 'array'],
            'service_images.*' => ['nullable', 'string', 'max:255', 'regex:/^(https?:\/\/|\/)[^\s]+$/i'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'public_seo.global.default_og_image.regex' => 'Default OG image must start with "https://", "http://", or "/".',
            'public_seo.global.default_twitter_image.regex' => 'Default Twitter image must start with "https://", "http://", or "/".',
            'public_seo.pages.*.canonical_url.regex' => 'Canonical URL must start with "https://", "http://", or "/".',
            'public_seo.pages.*.path.regex' => 'SEO page path must start with "/".',
            'public_seo.pages.*.og_image.regex' => 'OG image must start with "https://", "http://", or "/".',
            'public_seo.pages.*.twitter_image.regex' => 'Twitter image must start with "https://", "http://", or "/".',
            'payment_fallback.accounts.*.account_number.regex' => 'Enter a valid bank account number (digits only, 6-34 characters).',
            'payment_fallback.accounts.*.bank_code.regex' => 'Choose a bank from the list so the account name can be verified.',
            'service_announcement.cta_url.regex' => 'The button link must start with "/", "http://", or "https://".',
            'service_announcement.image.regex' => 'The image must start with "/", "http://", or "https://".',
            'service_images.*.regex' => 'An image must start with "/", "http://", or "https://".',
        ];
    }
}
