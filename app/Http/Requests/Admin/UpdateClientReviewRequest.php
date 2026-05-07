<?php

namespace App\Http\Requests\Admin;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateClientReviewRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user()?->canManageSettings();
    }

    protected function prepareForValidation(): void
    {
        $payload = [];

        foreach (['reviewer_name', 'reviewer_email', 'comment'] as $field) {
            if ($this->has($field)) {
                $payload[$field] = trim((string) $this->input($field));
            }
        }

        if ($this->has('is_public')) {
            $payload['is_public'] = $this->boolean('is_public');
        }

        if ($this->has('is_featured')) {
            $payload['is_featured'] = $this->boolean('is_featured');
        }

        $this->merge($payload);
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'reviewer_name' => ['sometimes', 'required', 'string', 'max:160'],
            'reviewer_email' => ['sometimes', 'nullable', 'string', 'email:rfc', 'max:190'],
            'rating' => ['sometimes', 'required', 'numeric', 'min:1', 'max:5'],
            'comment' => ['sometimes', 'required', 'string', 'max:3000'],
            'is_public' => ['sometimes', 'required', 'boolean'],
            'is_featured' => ['sometimes', 'required', 'boolean'],
        ];
    }
}
