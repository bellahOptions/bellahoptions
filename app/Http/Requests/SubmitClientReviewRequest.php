<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class SubmitClientReviewRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'reviewer_name' => trim((string) $this->input('reviewer_name', '')),
            'reviewer_email' => trim((string) $this->input('reviewer_email', '')),
            'comment' => trim((string) $this->input('comment', '')),
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
            'comment' => ['required', 'string', 'max:3000'],
        ];
    }
}
