<?php

namespace App\Http\Requests\Admin;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateSubscriptionPlanRequest extends FormRequest
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
        $fields = [];

        if ($this->has('name')) {
            $fields['name'] = trim((string) $this->input('name'));
        }

        if ($this->has('short_description')) {
            $fields['short_description'] = trim((string) $this->input('short_description'));
        }

        if ($this->has('billing_cycle')) {
            $fields['billing_cycle'] = strtolower(trim((string) $this->input('billing_cycle')));
        }

        if ($this->has('position')) {
            $position = $this->input('position');
            $fields['position'] = $position === null || $position === '' ? 0 : (int) $position;
        }

        foreach (['is_active', 'show_on_homepage', 'is_homepage_featured', 'is_recommended'] as $flag) {
            if ($this->has($flag)) {
                $fields[$flag] = $this->boolean($flag);
            }
        }

        $this->merge($fields);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'required', 'string', 'min:3', 'max:160'],
            'short_description' => ['sometimes', 'nullable', 'string', 'max:280'],
            'billing_cycle' => ['sometimes', 'required', 'string', Rule::in(['monthly', 'quarterly', 'biannually', 'yearly'])],
            'position' => ['sometimes', 'required', 'integer', 'min:0', 'max:1000000'],
            'is_active' => ['sometimes', 'required', 'boolean'],
            'show_on_homepage' => ['sometimes', 'required', 'boolean'],
            'is_homepage_featured' => ['sometimes', 'required', 'boolean'],
            'is_recommended' => ['sometimes', 'required', 'boolean'],
            'service_slug' => ['prohibited'],
            'package_code' => ['prohibited'],
        ];
    }
}
