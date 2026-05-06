<?php

namespace App\Http\Requests\Auth;

use App\Support\HumanVerification;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class ForgotPasswordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'email' => strtolower(trim((string) $this->input('email'))),
            'human_check_answer' => strtoupper(trim((string) $this->input('human_check_answer'))),
            'human_check_nonce' => trim((string) $this->input('human_check_nonce')),
            'turnstile_token' => trim((string) $this->input('turnstile_token')),
            'website' => trim((string) $this->input('website')),
            'company_name' => trim((string) $this->input('company_name')),
            'contact_notes' => trim((string) $this->input('contact_notes')),
        ]);
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return array_merge([
            'email' => ['required', 'email'],
        ], HumanVerification::rules(), HumanVerification::honeypotRules());
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return HumanVerification::messages();
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            HumanVerification::validate($this, $validator, 'auth_forgot_password_human_check');
        });
    }
}
