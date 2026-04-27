<?php

namespace App\Http\Requests\Admin;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreDiscountCodeRequest extends FormRequest
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
            'code' => strtoupper(trim((string) $this->input('code'))),
            'discount_type' => strtolower(trim((string) $this->input('discount_type'))),
            'currency' => strtoupper(trim((string) $this->input('currency'))),
            'service_slug' => trim((string) $this->input('service_slug')),
            'package_code' => trim((string) $this->input('package_code')),
            'is_active' => $this->boolean('is_active', true),
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
            'name' => ['nullable', 'string', 'max:120'],
            'code' => ['required', 'string', 'min:4', 'max:40', 'regex:/^[A-Z0-9\-]+$/', 'unique:discount_codes,code'],
            'discount_type' => ['required', 'string', Rule::in(['percentage', 'fixed'])],
            'discount_value' => ['required', 'numeric', 'min:0.01', 'max:999999999.99'],
            'currency' => ['nullable', 'string', 'size:3'],
            'is_active' => ['required', 'boolean'],
            'service_slug' => ['required', 'string', Rule::in(array_keys((array) config('service_orders.services', [])))],
            'package_code' => ['nullable', 'string', 'max:80'],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date', 'after_or_equal:starts_at'],
            'max_redemptions' => ['nullable', 'integer', 'min:1', 'max:1000000'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $discountType = (string) $this->input('discount_type');
            $discountValue = (float) $this->input('discount_value');
            $serviceSlug = (string) $this->input('service_slug');
            $packageCode = trim((string) $this->input('package_code'));

            if ($discountType === 'percentage' && $discountValue > 100) {
                $validator->errors()->add('discount_value', 'Percentage discounts cannot exceed 100.');
            }

            if ($discountType === 'fixed' && trim((string) $this->input('currency')) === '') {
                $validator->errors()->add('currency', 'Currency is required for fixed discounts.');
            }

            if ($packageCode !== '') {
                $knownPackages = array_keys((array) data_get(config('service_orders.services'), $serviceSlug.'.packages', []));

                if (! in_array($packageCode, $knownPackages, true)) {
                    $validator->errors()->add('package_code', 'Selected package is invalid for the chosen service.');
                }
            }
        });
    }
}
