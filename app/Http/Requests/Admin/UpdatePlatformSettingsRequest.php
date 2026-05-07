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
            'google_reviews_widget_id',
            'google_reviews_widget_version',
        ] as $field) {
            if ($this->has($field)) {
                $fields[$field] = trim((string) $this->input($field));
            }
        }

        if (array_key_exists('contact_email', $fields)) {
            $fields['contact_email'] = strtolower($fields['contact_email']);
        }

        if ($this->has('home_slides')) {
            $fields['home_slides'] = is_array($this->input('home_slides')) ? $this->input('home_slides') : [];
        }

        if ($this->has('public_page_headers')) {
            $fields['public_page_headers'] = is_array($this->input('public_page_headers')) ? $this->input('public_page_headers') : [];
        }

        if ($this->has('terms')) {
            $fields['terms'] = is_array($this->input('terms')) ? $this->input('terms') : null;
        }

        if ($this->has('featured_google_review_ids')) {
            $fields['featured_google_review_ids'] = is_array($this->input('featured_google_review_ids'))
                ? $this->input('featured_google_review_ids')
                : [];
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
            'google_reviews_widget_id' => ['sometimes', 'nullable', 'string', 'max:160', 'regex:/^[A-Za-z0-9\-]*$/'],
            'google_reviews_widget_version' => ['sometimes', 'nullable', 'string', 'in:v1,v2'],
            'featured_google_review_ids' => ['sometimes', 'required', 'array', 'max:20'],
            'featured_google_review_ids.*' => ['required_with:featured_google_review_ids', 'string', 'max:220'],

            'home_slides' => ['sometimes', 'required', 'array', 'min:1', 'max:10'],
            'home_slides.*.title' => ['required_with:home_slides', 'string', 'max:120'],
            'home_slides.*.subtitle' => ['nullable', 'string', 'max:260'],
            'home_slides.*.image' => ['required_with:home_slides', 'string', 'max:255', 'regex:/^[a-zA-Z0-9_\/.\-]+$/'],
            'home_slides.*.cta_label' => ['required_with:home_slides', 'string', 'max:60'],
            'home_slides.*.cta_url' => ['required_with:home_slides', 'string', 'max:255', 'regex:/^(https?:\/\/|\/).+/i'],

            'public_page_headers' => ['sometimes', 'required', 'array'],
            'public_page_headers.*' => ['required_with:public_page_headers', 'array'],
            'public_page_headers.*.title' => ['nullable', 'string', 'max:180'],
            'public_page_headers.*.text' => ['nullable', 'string', 'max:500'],
            'public_page_headers.*.background_image' => ['nullable', 'string', 'max:255'],

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
            'home_slides.*.image.regex' => 'Slide image paths may only include letters, numbers, slashes, dots, dashes, and underscores.',
            'home_slides.*.cta_url.regex' => 'Slide CTA URL must start with "https://", "http://", or "/".',
            'google_reviews_widget_id.regex' => 'Google reviews widget ID may only contain letters, numbers, and dashes.',
        ];
    }
}
