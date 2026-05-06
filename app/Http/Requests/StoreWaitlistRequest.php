<?php

namespace App\Http\Requests;

use App\Support\HumanVerification;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreWaitlistRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return array_merge([
            'name' => ['required', 'string', 'min:2', 'max:120', "regex:/^[a-zA-Z\\s\\-\\.'`]+$/"],
            'email' => ['required', 'string', 'email:rfc', 'max:255', 'unique:waitlists,email'],
            'occupation' => ['required', 'string', Rule::in(config('occupations.list', []))],
        ], HumanVerification::rules(), HumanVerification::honeypotRules());
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return array_merge([
            'email.unique' => 'This email is already on our waitlist.',
            'occupation.in' => 'Please choose a valid occupation from the dropdown list.',
            'name.regex' => 'Please enter a valid name.',
        ], HumanVerification::messages());
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            HumanVerification::validate($this, $validator, 'waitlist_human_check');
        });
    }
}
