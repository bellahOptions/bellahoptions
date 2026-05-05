<?php

namespace App\Http\Requests;

use App\Models\User;
use App\Support\ServiceOrderCatalog;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\Validator;

class StoreServiceOrderRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $payload = [
            'full_name' => trim((string) $this->input('full_name')),
            'email' => strtolower(trim((string) $this->input('email'))),
            'phone' => trim((string) $this->input('phone')),
            'business_name' => trim((string) $this->input('business_name')),
            'position' => trim((string) $this->input('position')),
            'business_website' => trim((string) $this->input('business_website')),
            'has_logo' => trim((string) $this->input('has_logo')),
            'logo_design_interest' => trim((string) $this->input('logo_design_interest')),
            'logo_addon_package' => trim((string) $this->input('logo_addon_package')),
            'service_package' => trim((string) $this->input('service_package')),
            'discount_code' => strtoupper(trim((string) $this->input('discount_code'))),
            'project_summary' => trim((string) $this->input('project_summary')),
            'project_goals' => trim((string) $this->input('project_goals')),
            'target_audience' => trim((string) $this->input('target_audience')),
            'preferred_style' => trim((string) $this->input('preferred_style')),
            'deliverables' => trim((string) $this->input('deliverables')),
            'additional_details' => trim((string) $this->input('additional_details')),
            'timeline_preference' => trim((string) $this->input('timeline_preference')),
            'website' => trim((string) $this->input('website')),
            'company_name' => trim((string) $this->input('company_name')),
            'contact_notes' => trim((string) $this->input('contact_notes')),
            'order_nonce' => trim((string) $this->input('order_nonce')),
            'create_account' => $this->boolean('create_account'),
        ];

        foreach ($this->serviceIntakeFields() as $field) {
            $name = (string) ($field['name'] ?? '');
            $type = (string) ($field['type'] ?? 'text');

            if ($name === '') {
                continue;
            }

            if ($type === 'number') {
                $payload[$name] = $this->input($name);

                continue;
            }

            $payload[$name] = trim((string) $this->input($name));
        }

        $this->merge($payload);
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return array_merge([
            'full_name' => ['required', 'string', 'min:3', 'max:120', "regex:/^[\\pL\\s\\-\\.'`]+$/u"],
            'email' => ['required', 'string', 'email:rfc,filter', 'max:255'],
            'phone' => ['required', 'string', 'min:7', 'max:30', 'regex:/^[+0-9()\-\s]+$/'],
            'business_name' => ['required', 'string', 'min:2', 'max:180'],
            'position' => ['nullable', 'string', 'max:120'],
            'business_website' => ['nullable', 'url:http,https', 'max:255', 'regex:/^https?:\/\/[^\s\/$.?#].[^\s]*$/i'],
            'has_logo' => ['required', Rule::in(['yes', 'no'])],
            'logo_design_interest' => [Rule::requiredIf(fn (): bool => $this->input('has_logo') === 'no'), 'nullable', Rule::in(['yes', 'no'])],
            'logo_addon_package' => [Rule::requiredIf(fn (): bool => $this->input('has_logo') === 'no' && $this->input('logo_design_interest') === 'yes'), 'nullable', Rule::in($this->allowedLogoAddonCodes())],
            'service_package' => ['required', 'string', Rule::in($this->allowedPackageCodes())],
            'discount_code' => ['nullable', 'string', 'max:40', 'regex:/^[A-Z0-9\\-]+$/'],
            'project_summary' => ['required', 'string', 'min:30', 'max:2500'],
            'project_goals' => ['nullable', 'string', 'max:1500'],
            'target_audience' => ['nullable', 'string', 'max:1000'],
            'preferred_style' => ['nullable', 'string', 'max:1000'],
            'deliverables' => ['nullable', 'string', 'max:1500'],
            'additional_details' => ['nullable', 'string', 'max:2000'],
            'timeline_preference' => ['nullable', 'string', 'max:120'],
            'create_account' => ['boolean'],
            'password' => [
                Rule::requiredIf(fn (): bool => $this->boolean('create_account') && $this->user() === null),
                'nullable',
                'confirmed',
                Password::defaults(),
            ],
            'order_nonce' => ['required', 'string', 'size:32'],
            'order_rendered_at' => ['required', 'integer', 'min:1'],
            'website' => ['nullable', 'string', 'max:0'],
            'company_name' => ['nullable', 'string', 'max:0'],
            'contact_notes' => ['nullable', 'string', 'max:0'],
        ], $this->serviceSpecificRules());
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'full_name.regex' => 'Please enter a valid full name.',
            'phone.regex' => 'Please enter a valid phone number.',
            'business_website.regex' => 'Please enter a valid full website URL, including http:// or https://.',
            'service_package.in' => 'Please select a valid package.',
            'discount_code.regex' => 'Please enter a valid discount code.',
            'website.max' => 'Human verification failed.',
            'company_name.max' => 'Human verification failed.',
            'contact_notes.max' => 'Human verification failed.',
            'password.required' => 'A password is required to create your account.',
            'password.confirmed' => 'Password confirmation does not match.',
            'has_logo.required' => 'Please tell us whether you already have a logo.',
            'logo_design_interest.required' => 'Please tell us whether you want Bellah Options to design a logo for you.',
            'logo_addon_package.required' => 'Please choose a logo or brand design package.',
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $challenge = $this->session()->get('service_order_guard');

            if (! is_array($challenge)) {
                $validator->errors()->add('project_summary', 'Security validation expired. Please reload and try again.');

                return;
            }

            if ((string) ($challenge['service_slug'] ?? '') !== $this->serviceSlug()) {
                $validator->errors()->add('project_summary', 'Security validation failed. Please reload and try again.');

                return;
            }

            $nonceMatches = hash_equals(
                (string) ($challenge['nonce'] ?? ''),
                (string) $this->input('order_nonce'),
            );

            if (! $nonceMatches) {
                $validator->errors()->add('project_summary', 'Security validation failed. Please reload and try again.');

                return;
            }

            $issuedAt = (int) ($challenge['issued_at'] ?? 0);
            $submittedAt = now()->timestamp;

            if ($issuedAt <= 0 || ($submittedAt - $issuedAt) < 4 || ($submittedAt - $issuedAt) > 7200) {
                $validator->errors()->add('project_summary', 'Please take a moment and submit again.');

                return;
            }

            if ((int) $this->input('order_rendered_at') !== $issuedAt) {
                $validator->errors()->add('project_summary', 'Security validation failed. Please reload and try again.');

                return;
            }

            $userAgent = Str::lower(trim((string) $this->userAgent()));
            $blockedSignatures = [
                'curl',
                'wget',
                'python-requests',
                'python urllib',
                'httpclient',
                'libwww-perl',
                'scrapy',
                'headlesschrome',
                'phantomjs',
            ];

            if ($userAgent === '' || Str::length($userAgent) < 12) {
                $validator->errors()->add('project_summary', 'Unable to verify this submission. Please use a standard browser and try again.');

                return;
            }

            foreach ($blockedSignatures as $signature) {
                if (Str::contains($userAgent, $signature)) {
                    $validator->errors()->add('project_summary', 'Automated submissions are not allowed.');

                    return;
                }
            }

            $summary = (string) $this->input('project_summary');
            $linkCount = preg_match_all('/(?:https?:\/\/|www\.)/iu', $summary);
            if ($linkCount !== false && $linkCount > 3) {
                $validator->errors()->add('project_summary', 'Please keep links in your project brief to a maximum of three.');
            }

            if (preg_match('/(.)\1{9,}/u', $summary) === 1) {
                $validator->errors()->add('project_summary', 'Please provide a clear project brief.');
            }

            $fullName = (string) $this->input('full_name');
            if (preg_match('/\s+/u', trim($fullName)) !== 1) {
                $validator->errors()->add('full_name', 'Please enter your full name.');
            }

            $suspiciousPayload = implode(' ', array_filter([
                (string) $this->input('full_name'),
                (string) $this->input('business_name'),
                (string) $this->input('project_summary'),
                (string) $this->input('project_goals'),
                (string) $this->input('additional_details'),
            ]));

            if (preg_match('/<[^>]+>/u', $suspiciousPayload) === 1 || preg_match('/(?:javascript:|data:text\/html|<script|\[url=)/iu', $suspiciousPayload) === 1) {
                $validator->errors()->add('project_summary', 'Please remove code or embedded markup from your project brief.');
            }

            if ($this->boolean('create_account') && $this->user() === null) {
                $email = strtolower(trim((string) $this->input('email')));

                if ($email !== '' && User::query()->whereRaw('LOWER(email) = ?', [$email])->exists()) {
                    $validator->errors()->add('email', 'An account already exists with this email. Please log in to continue.');
                }
            }
        });
    }

    /**
     * @return array<int, string>
     */
    private function allowedPackageCodes(): array
    {
        $serviceSlug = $this->serviceSlug();

        return app(ServiceOrderCatalog::class)->packageCodes($serviceSlug);
    }

    /**
     * @return array<int, string>
     */
    private function allowedLogoAddonCodes(): array
    {
        return array_values(array_keys(app(ServiceOrderCatalog::class)->logoAddons()));
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    private function serviceSpecificRules(): array
    {
        $rules = [];

        foreach ($this->serviceIntakeFields() as $field) {
            $name = (string) ($field['name'] ?? '');
            $type = (string) ($field['type'] ?? 'text');
            $required = (bool) ($field['required'] ?? false);

            if ($name === '') {
                continue;
            }

            $fieldRules = [
                Rule::requiredIf($required),
                'nullable',
            ];

            if ($type === 'number') {
                $fieldRules[] = 'integer';
                $fieldRules[] = 'min:'.((int) ($field['min'] ?? 0));
                $fieldRules[] = 'max:'.((int) ($field['max'] ?? 1000000));
            } else {
                $fieldRules[] = 'string';
                $fieldRules[] = 'max:'.((int) ($field['max'] ?? ($type === 'textarea' ? 2500 : 255)));

                if ($type === 'url') {
                    $fieldRules[] = 'url:http,https';
                    $fieldRules[] = 'regex:/^https?:\/\/[^\s\/$.?#].[^\s]*$/i';
                }

                if ($type === 'select') {
                    $options = (array) ($field['options'] ?? []);
                    $allowedValues = array_is_list($options)
                        ? $options
                        : array_keys($options);

                    if ($allowedValues !== []) {
                        $fieldRules[] = Rule::in($allowedValues);
                    }
                }
            }

            $rules[$name] = $fieldRules;
        }

        return $rules;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function serviceIntakeFields(): array
    {
        return app(ServiceOrderCatalog::class)->intakeFields($this->serviceSlug());
    }

    private function serviceSlug(): string
    {
        return trim((string) $this->route('serviceSlug'));
    }
}
