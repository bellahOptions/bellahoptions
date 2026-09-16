<?php

namespace App\Http\Requests\Admin;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateQuestionnaireTemplateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user()?->isSuperAdmin();
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'name' => trim((string) $this->input('name', '')),
            'is_active' => $this->boolean('is_active', true),
        ]);
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:160'],
            'questions' => ['required', 'array', 'min:1'],
            'questions.*.id' => ['required', 'string', 'max:60'],
            'questions.*.label' => ['required', 'string', 'max:255'],
            'questions.*.type' => ['required', 'in:rating,text,choice'],
            'questions.*.options' => ['required_if:questions.*.type,choice', 'array'],
            'questions.*.options.*' => ['string', 'max:120'],
            'is_active' => ['required', 'boolean'],
        ];
    }
}
