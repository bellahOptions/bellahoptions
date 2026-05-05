<?php

namespace App\Http\Requests\Admin;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Arr;
use Illuminate\Validation\Validator;

class UpdatePlatformSettingsRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return (bool) $this->user()?->canManageSettings();
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'maintenance_mode' => $this->boolean('maintenance_mode'),
            'website_uri' => trim((string) $this->input('website_uri')),
            'contact_phone' => trim((string) $this->input('contact_phone')),
            'contact_email' => strtolower(trim((string) $this->input('contact_email'))),
            'contact_location' => trim((string) $this->input('contact_location')),
            'contact_whatsapp_url' => trim((string) $this->input('contact_whatsapp_url')),
            'contact_behance_url' => trim((string) $this->input('contact_behance_url')),
            'contact_map_embed_url' => trim((string) $this->input('contact_map_embed_url')),
            'home_slides' => is_array($this->input('home_slides')) ? $this->input('home_slides') : [],
            'service_prices' => is_array($this->input('service_prices')) ? $this->input('service_prices') : [],
            'terms' => $this->has('terms')
                ? (is_array($this->input('terms')) ? $this->input('terms') : null)
                : null,
        ]);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'maintenance_mode' => ['required', 'boolean'],
            'website_uri' => ['required', 'url:http,https', 'max:255'],

            'contact_phone' => ['required', 'string', 'min:7', 'max:40'],
            'contact_email' => ['required', 'string', 'email:rfc', 'max:255'],
            'contact_location' => ['required', 'string', 'max:180'],
            'contact_whatsapp_url' => ['required', 'url:http,https', 'max:255'],
            'contact_behance_url' => ['required', 'url:http,https', 'max:255'],
            'contact_map_embed_url' => ['required', 'url:http,https', 'max:4000'],

            'home_slides' => ['required', 'array', 'min:1', 'max:10'],
            'home_slides.*.title' => ['required', 'string', 'max:120'],
            'home_slides.*.subtitle' => ['nullable', 'string', 'max:260'],
            'home_slides.*.image' => ['required', 'string', 'max:255', "regex:/^[a-zA-Z0-9_\/.\-]+$/"],
            'home_slides.*.cta_label' => ['required', 'string', 'max:60'],
            'home_slides.*.cta_url' => ['required', 'string', 'max:255', "regex:/^(https?:\/\/|\/).+/i"],

            'service_prices' => ['required', 'array', 'min:1'],
            'service_prices.*' => ['required', 'array', 'min:1'],
            'service_prices.*.*' => ['required', 'numeric', 'min:1', 'max:999999999.99'],

            'terms' => ['nullable', 'array'],
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
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            /** @var array<string, array<string, mixed>> $services */
            $services = (array) config('service_orders.services', []);
            /** @var array<string, mixed> $servicePrices */
            $servicePrices = (array) $this->input('service_prices', []);

            foreach ($servicePrices as $serviceSlug => $packageMatrix) {
                if (! array_key_exists((string) $serviceSlug, $services)) {
                    $validator->errors()->add('service_prices', 'One or more service pricing entries are invalid.');

                    continue;
                }

                if (! is_array($packageMatrix)) {
                    $validator->errors()->add('service_prices', 'Each service must include package prices.');

                    continue;
                }

                $knownPackages = array_keys((array) Arr::get($services, $serviceSlug.'.packages', []));

                foreach ($packageMatrix as $packageCode => $value) {
                    if (! in_array((string) $packageCode, $knownPackages, true)) {
                        $validator->errors()->add('service_prices', 'One or more package pricing entries are invalid.');
                    }

                    if (! is_numeric($value) || (float) $value <= 0) {
                        $validator->errors()->add('service_prices', 'All package prices must be greater than zero.');
                    }
                }
            }
        });
    }
}
