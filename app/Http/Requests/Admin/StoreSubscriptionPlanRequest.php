<?php

namespace App\Http\Requests\Admin;

use App\Support\ServiceOrderCatalog;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreSubscriptionPlanRequest extends FormRequest
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
            'name' => trim((string) $this->input('name')),
            'service_slug' => trim((string) $this->input('service_slug')),
            'package_code' => trim((string) $this->input('package_code')),
            'image_path' => trim((string) $this->input('image_path')),
            'short_description' => trim((string) $this->input('short_description')),
            'long_description' => trim((string) $this->input('long_description')),
            'billing_cycle' => strtolower(trim((string) $this->input('billing_cycle'))),
            'position' => $this->input('position') === null || $this->input('position') === ''
                ? 0
                : (int) $this->input('position'),
            'is_active' => $this->boolean('is_active', true),
            'show_on_homepage' => $this->boolean('show_on_homepage', true),
            'is_homepage_featured' => $this->boolean('is_homepage_featured', false),
            'is_recommended' => $this->boolean('is_recommended', false),
        ]);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $serviceKeys = array_keys((array) config('service_orders.services', []));

        return [
            'name' => ['required', 'string', 'min:3', 'max:160'],
            'service_slug' => ['required', 'string', Rule::in($serviceKeys)],
            'package_code' => [
                'required',
                'string',
                'max:80',
                Rule::unique('subscription_plans', 'package_code')
                    ->where(fn ($query) => $query->where('service_slug', (string) $this->input('service_slug'))),
            ],
            'image_path' => ['nullable', 'string', 'max:255'],
            'short_description' => ['nullable', 'string', 'max:280'],
            'long_description' => ['nullable', 'string', 'max:5000'],
            'billing_cycle' => ['required', 'string', Rule::in(['monthly', 'quarterly', 'biannually', 'yearly'])],
            'position' => ['required', 'integer', 'min:0', 'max:1000000'],
            'is_active' => ['required', 'boolean'],
            'show_on_homepage' => ['required', 'boolean'],
            'is_homepage_featured' => ['required', 'boolean'],
            'is_recommended' => ['required', 'boolean'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $serviceSlug = (string) $this->input('service_slug');
            $packageCode = (string) $this->input('package_code');
            $packages = app(ServiceOrderCatalog::class)->packageCodes($serviceSlug);

            if (! in_array($packageCode, $packages, true)) {
                $validator->errors()->add('package_code', 'Selected package is invalid for the chosen service.');
            }
        });
    }
}
