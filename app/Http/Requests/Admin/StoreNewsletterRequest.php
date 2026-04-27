<?php

namespace App\Http\Requests\Admin;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreNewsletterRequest extends FormRequest
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
        $this->merge([
            'name' => trim((string) $this->input('name')),
            'audience' => strtolower(trim((string) $this->input('audience'))),
            'subject_template' => trim((string) $this->input('subject_template')),
            'html_template' => (string) $this->input('html_template'),
            'dynamic_fields_json' => trim((string) $this->input('dynamic_fields_json')),
            'is_active' => $this->boolean('is_active', true),
        ]);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'min:3', 'max:160'],
            'audience' => ['required', 'string', Rule::in(['waitlist', 'customers', 'users', 'all'])],
            'subject_template' => ['required', 'string', 'min:3', 'max:255'],
            'html_template' => ['required', 'string', 'min:20', 'max:200000'],
            'dynamic_fields_json' => ['nullable', 'string', 'max:20000'],
            'is_active' => ['required', 'boolean'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $dynamicFieldsJson = trim((string) $this->input('dynamic_fields_json'));

            if ($dynamicFieldsJson === '') {
                return;
            }

            $decoded = json_decode($dynamicFieldsJson, true);

            if (! is_array($decoded) || array_is_list($decoded)) {
                $validator->errors()->add('dynamic_fields_json', 'Dynamic fields must be a JSON object of key-value pairs.');

                return;
            }

            if (count($decoded) > 50) {
                $validator->errors()->add('dynamic_fields_json', 'Dynamic fields are limited to 50 entries.');

                return;
            }

            foreach ($decoded as $key => $value) {
                $resolvedKey = trim((string) $key);

                if (! preg_match('/^[a-zA-Z][a-zA-Z0-9_]{1,50}$/', $resolvedKey)) {
                    $validator->errors()->add('dynamic_fields_json', 'Dynamic field keys must start with a letter and contain only letters, numbers, and underscores.');

                    return;
                }

                if (is_array($value) || is_object($value)) {
                    $validator->errors()->add('dynamic_fields_json', 'Dynamic field values must be scalar values.');

                    return;
                }

                if (mb_strlen(trim((string) $value)) > 1000) {
                    $validator->errors()->add('dynamic_fields_json', 'Dynamic field values must be 1000 characters or less.');

                    return;
                }
            }
        });
    }

    /**
     * @return array<string, string>
     */
    public function dynamicFields(): array
    {
        $raw = trim((string) $this->input('dynamic_fields_json'));

        if ($raw === '') {
            return [];
        }

        $decoded = json_decode($raw, true);

        if (! is_array($decoded) || array_is_list($decoded)) {
            return [];
        }

        $normalized = [];

        foreach ($decoded as $key => $value) {
            $resolvedKey = trim((string) $key);

            if (! preg_match('/^[a-zA-Z][a-zA-Z0-9_]{1,50}$/', $resolvedKey)) {
                continue;
            }

            if (is_array($value) || is_object($value)) {
                continue;
            }

            $normalized[$resolvedKey] = trim((string) $value);
        }

        return $normalized;
    }
}

