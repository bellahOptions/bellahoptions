<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Carbon;
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
        return [
            'name' => ['required', 'string', 'min:2', 'max:120', "regex:/^[a-zA-Z\\s\\-\\.'`]+$/"],
            'email' => ['required', 'string', 'email:rfc', 'max:255', 'unique:waitlists,email'],
            'occupation' => ['required', 'string', Rule::in(config('occupations.list', []))],
            'company_name' => ['nullable', 'string', 'max:0'],
            'human_check_nonce' => ['required', 'string', 'size:32'],
            'human_check_answer' => ['required', 'integer', 'between:0,100'],
            'form_rendered_at' => ['required', 'integer', 'min:1'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'email.unique' => 'This email is already on our waitlist.',
            'occupation.in' => 'Please choose a valid occupation from the dropdown list.',
            'name.regex' => 'Please enter a valid name.',
            'company_name.max' => 'Human verification failed.',
            'human_check_answer.required' => 'Human verification is required.',
            'human_check_answer.integer' => 'Human verification is required.',
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $challenge = $this->session()->get('waitlist_human_check');

            if (! is_array($challenge)) {
                $validator->errors()->add('human_check_answer', 'Human verification expired. Please try again.');

                return;
            }

            $nonceMatches = hash_equals(
                (string) ($challenge['nonce'] ?? ''),
                (string) $this->input('human_check_nonce'),
            );

            if (! $nonceMatches) {
                $validator->errors()->add('human_check_answer', 'Human verification failed.');

                return;
            }

            $issuedAt = (int) ($challenge['issued_at'] ?? 0);
            $submittedAt = Carbon::now()->timestamp;

            if ($issuedAt <= 0 || ($submittedAt - $issuedAt) < 3 || ($submittedAt - $issuedAt) > 3600) {
                $validator->errors()->add('human_check_answer', 'Please take a moment and try again.');

                return;
            }

            if ((int) $this->input('form_rendered_at') !== $issuedAt) {
                $validator->errors()->add('human_check_answer', 'Human verification failed.');

                return;
            }

            $providedAnswer = (int) $this->input('human_check_answer');
            $expectedAnswer = (int) ($challenge['answer'] ?? -1);

            if ($providedAnswer !== $expectedAnswer) {
                $validator->errors()->add('human_check_answer', 'Human verification answer is incorrect.');
            }
        });
    }
}
