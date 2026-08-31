<?php

namespace App\Http\Requests\Admin;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateServicePricingRequest extends FormRequest
{
    private const TRIAL_FEE_SLUGS = ['social-media-design', 'graphic-design'];

    public function authorize(): bool
    {
        return (bool) $this->user()?->canManageSettings();
    }

    protected function prepareForValidation(): void
    {
        $merge = [
            'package_overrides' => is_array($this->input('package_overrides')) ? $this->input('package_overrides') : [],
        ];

        if ($this->isGraphicDesign()) {
            $merge['graphic_design_items'] = is_array($this->input('graphic_design_items')) ? $this->input('graphic_design_items') : [];
        }

        if ($this->usesTrialFee()) {
            $merge['social_graphic_trial_fee_ngn'] = is_numeric($this->input('social_graphic_trial_fee_ngn'))
                ? round((float) $this->input('social_graphic_trial_fee_ngn'), 2)
                : 0;
        }

        $this->merge($merge);
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $rules = [];

        if (! $this->isGraphicDesign()) {
            $rules['package_overrides'] = ['required', 'array'];
            $rules['package_overrides.*'] = ['required', 'array'];
            $rules['package_overrides.*.price'] = ['nullable', 'numeric', 'min:0.01', 'max:999999999.99'];
            $rules['package_overrides.*.discount_price'] = ['nullable', 'numeric', 'min:0.01', 'max:999999999.99'];
            $rules['package_overrides.*.is_recommended'] = ['required', 'boolean'];
            $rules['package_overrides.*.features'] = ['nullable'];
            $rules['package_overrides.*.description'] = ['nullable', 'string', 'max:500'];
        }

        if ($this->isGraphicDesign()) {
            $rules['graphic_design_items'] = ['required', 'array'];
            $rules['graphic_design_items.*.id'] = ['nullable', 'string', 'max:80'];
            $rules['graphic_design_items.*.title'] = ['required', 'string', 'max:160'];
            $rules['graphic_design_items.*.description'] = ['nullable', 'string', 'max:800'];
            $rules['graphic_design_items.*.image_path'] = ['nullable', 'string', 'max:255'];
            $rules['graphic_design_items.*.unit_price'] = ['required', 'numeric', 'min:0.01', 'max:999999999.99'];
        }

        if ($this->usesTrialFee()) {
            $rules['social_graphic_trial_fee_ngn'] = ['required', 'numeric', 'min:0', 'max:999999999.99'];
        }

        return $rules;
    }

    private function isGraphicDesign(): bool
    {
        return $this->route('serviceSlug') === 'graphic-design';
    }

    private function usesTrialFee(): bool
    {
        return in_array($this->route('serviceSlug'), self::TRIAL_FEE_SLUGS, true);
    }
}
