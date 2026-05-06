<?php

namespace App\Http\Requests;

use App\Support\HumanVerification;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreContactRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return array_merge([
            'name' => ['required', 'string', 'min:2', 'max:120', "regex:/^[a-zA-Z\\s\\-\\.'`]+$/"],
            'email' => ['required', 'string', 'email:rfc', 'max:255'],
            'phone' => ['nullable', 'string', 'min:7', 'max:40'],
            'project_type' => ['required', 'string', 'min:3', 'max:160'],
            'message' => ['required', 'string', 'min:20', 'max:2500'],
        ], HumanVerification::rules(), HumanVerification::honeypotRules());
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return array_merge([
            'name.regex' => 'Please enter a valid name.',
        ], HumanVerification::messages());
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            HumanVerification::validate($this, $validator, 'contact_human_check');
        });
    }
}
