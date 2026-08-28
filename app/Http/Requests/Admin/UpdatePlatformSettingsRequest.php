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

        if ($this->has('terms')) {
            $fields['terms'] = is_array($this->input('terms')) ? $this->input('terms') : null;
        }

        $this->merge($fields);
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
        ];
    }
}
