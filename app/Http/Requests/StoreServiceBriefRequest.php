<?php

namespace App\Http\Requests;

use App\Support\HumanVerification;
use App\Support\ServiceBriefSchema;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreServiceBriefRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'answers' => (array) $this->input('answers', []),
            'human_check_answer' => strtoupper(trim((string) $this->input('human_check_answer'))),
            'human_check_nonce' => trim((string) $this->input('human_check_nonce')),
            'turnstile_token' => trim((string) $this->input('turnstile_token')),
        ]);
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        /** @var ServiceBriefSchema $schema */
        $schema = app(ServiceBriefSchema::class);
        $serviceSlug = $this->serviceSlug();
        $template = $schema->activeTemplate($serviceSlug);
        $steps = $schema->steps($serviceSlug, $template);
        $fields = $schema->flattenFields($steps);

        $rules = [
            'answers' => ['required', 'array'],
            // Hidden honeypot input — a real visitor never sees or fills it, so
            // anything non-empty here fails validation like any other bad input.
            'website_confirm' => ['nullable', 'string', 'size:0'],
            'upload_session_token' => ['nullable', 'string', 'max:64'],
        ];

        foreach ($fields as $field) {
            $key = (string) $field['key'];
            $type = (string) ($field['type'] ?? 'text');
            $required = (bool) ($field['required'] ?? false);

            $rules["answers.{$key}"] = array_merge(
                [
                    Rule::requiredIf(fn (): bool => $required && $schema->isFieldVisible($field, (array) $this->input('answers', []))),
                    'nullable',
                ],
                $this->rulesForType($type, $field),
            );

            if ($type === 'multiselect') {
                $options = (array) ($field['options'] ?? []);

                $rules["answers.{$key}.*"] = $options !== [] ? [Rule::in($options)] : ['string'];
            }

            if ($type === 'file') {
                $rules["answers.{$key}.*"] = ['integer'];
            }
        }

        return array_merge($rules, HumanVerification::rules());
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return array_merge(HumanVerification::messages(), [
            'answers.consent_ndpa.accepted' => 'Please confirm you agree to us storing this information to prepare your quote.',
        ]);
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            HumanVerification::validate($this, $validator, 'brief_human_check');

            $answers = (array) $this->input('answers', []);

            if (! in_array((bool) ($answers['consent_ndpa'] ?? false), [true], true)) {
                $validator->errors()->add('answers.consent_ndpa', 'Please confirm you agree to us storing this information to prepare your quote.');
            }
        });
    }

    public function serviceSlug(): string
    {
        return trim((string) $this->route('serviceSlug'));
    }

    /**
     * @param  array<string, mixed>  $field
     * @return array<int, ValidationRule|string>
     */
    private function rulesForType(string $type, array $field): array
    {
        $max = (int) ($field['max'] ?? ($type === 'textarea' ? 2500 : 255));

        return match ($type) {
            'email' => ['string', 'email:rfc', 'max:190'],
            'tel' => ['string', 'max:30', 'regex:/^[+0-9()\-\s]+$/'],
            'number' => ['numeric', 'min:'.((int) ($field['min'] ?? 0)), 'max:'.((int) ($field['max'] ?? 1000000))],
            'date' => ['date'],
            'url' => ['string', 'url:http,https', 'max:255'],
            'select', 'radio' => array_filter([
                'string',
                'max:255',
                (($field['options'] ?? []) !== []) ? Rule::in($field['options']) : null,
            ]),
            'multiselect' => ['array'],
            'checkbox' => ['boolean'],
            'scale' => ['integer', 'min:'.((int) ($field['min'] ?? 1)), 'max:'.((int) ($field['max'] ?? 5))],
            'file' => ['array'],
            'textarea' => ['string', 'min:'.((int) ($field['min'] ?? 0)), 'max:'.$max],
            default => ['string', 'min:'.((int) ($field['min'] ?? 0)), 'max:'.$max],
        };
    }
}
