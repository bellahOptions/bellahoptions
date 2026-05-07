<?php

namespace App\Http\Requests\Admin;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateServicePricingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user()?->canManageSettings();
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'package_overrides' => is_array($this->input('package_overrides')) ? $this->input('package_overrides') : [],
            'graphic_design_items' => is_array($this->input('graphic_design_items')) ? $this->input('graphic_design_items') : [],
            'social_graphic_trial_fee_ngn' => is_numeric($this->input('social_graphic_trial_fee_ngn'))
                ? round((float) $this->input('social_graphic_trial_fee_ngn'), 2)
                : 0,
        ]);
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'package_overrides' => ['required', 'array'],
            'package_overrides.*' => ['required', 'array'],
            'package_overrides.*.*' => ['required', 'array'],
            'package_overrides.*.*.price' => ['nullable', 'numeric', 'min:0.01', 'max:999999999.99'],
            'package_overrides.*.*.discount_price' => ['nullable', 'numeric', 'min:0.01', 'max:999999999.99'],
            'package_overrides.*.*.is_recommended' => ['required', 'boolean'],
            'package_overrides.*.*.features' => ['nullable'],
            'package_overrides.*.*.description' => ['nullable', 'string', 'max:500'],

            'graphic_design_items' => ['required', 'array'],
            'graphic_design_items.*.id' => ['nullable', 'string', 'max:80'],
            'graphic_design_items.*.title' => ['required', 'string', 'max:160'],
            'graphic_design_items.*.description' => ['nullable', 'string', 'max:800'],
            'graphic_design_items.*.image_path' => ['nullable', 'string', 'max:255'],
            'graphic_design_items.*.unit_price' => ['required', 'numeric', 'min:0.01', 'max:999999999.99'],

            'social_graphic_trial_fee_ngn' => ['required', 'numeric', 'min:0', 'max:999999999.99'],
        ];
    }
}
