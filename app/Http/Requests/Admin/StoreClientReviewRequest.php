<?php

namespace App\Http\Requests\Admin;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreClientReviewRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user()?->canManageSettings();
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'reviewer_name' => trim((string) $this->input('reviewer_name', '')),
            'reviewer_email' => trim((string) $this->input('reviewer_email', '')),
            'comment' => trim((string) $this->input('comment', '')),
            'screenshot_path' => trim((string) $this->input('screenshot_path', '')) ?: null,
            'is_public' => $this->boolean('is_public', true),
            'is_featured' => $this->boolean('is_featured'),
        ]);
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'reviewer_name' => ['required', 'string', 'max:160'],
            'reviewer_email' => ['nullable', 'string', 'email:rfc', 'max:190'],
            'rating' => ['required', 'numeric', 'min:1', 'max:5'],
            'comment' => ['required_without:screenshot_path', 'nullable', 'string', 'max:3000'],
            'screenshot_path' => ['nullable', 'string', 'max:255'],
            'is_public' => ['required', 'boolean'],
            'is_featured' => ['nullable', 'boolean'],
        ];
    }
}
