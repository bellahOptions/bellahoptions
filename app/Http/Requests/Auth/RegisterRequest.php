<?php

namespace App\Http\Requests\Auth;

use App\Models\User;
use App\Support\HumanVerification;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\Validator;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'name' => trim((string) $this->input('name')),
            'first_name' => trim((string) $this->input('first_name')),
            'last_name' => trim((string) $this->input('last_name')),
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
            'name' => 'nullable|string|max:255',
            'first_name' => ['required_without:name', 'string', 'max:120', "regex:/^[a-zA-Z\\s\\-\\.'`]+$/"],
            'last_name' => ['required_without:name', 'string', 'max:120', "regex:/^[a-zA-Z\\s\\-\\.'`]+$/"],
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'password' => ['required', 'confirmed', Password::defaults()],
        ], HumanVerification::rules(), HumanVerification::honeypotRules());
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return array_merge([
            'first_name.regex' => 'Please enter a valid first name.',
            'last_name.regex' => 'Please enter a valid last name.',
        ], HumanVerification::messages());
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            HumanVerification::validate($this, $validator, 'auth_register_human_check');
        });
    }
}
