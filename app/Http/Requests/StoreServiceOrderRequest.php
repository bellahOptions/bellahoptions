<?php

namespace App\Http\Requests;

use App\Models\User;
use App\Support\PlatformSettings;
use App\Support\ServiceOrderCatalog;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Http;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\Validator;
use Throwable;

class StoreServiceOrderRequest extends FormRequest
{
    private const TRIAL_PACKAGE_CODE = 'trial-request';

    /**
     * @var array<int, string>
     */
    private const TRIAL_SERVICE_SLUGS = [
        'social-media-design',
        'graphic-design',
    ];

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
            'has_content' => trim((string) $this->input('has_content')),
            'content_development_interest' => trim((string) $this->input('content_development_interest')),
            'logo_design_interest' => trim((string) $this->input('logo_design_interest')),
            'logo_addon_package' => trim((string) $this->input('logo_addon_package')),
            'service_package' => trim((string) $this->input('service_package')),
            'discount_code' => strtoupper(trim((string) $this->input('discount_code'))),
            'prospect_draft_token' => trim((string) $this->input('prospect_draft_token')),
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
            'human_check_answer' => strtoupper(trim((string) $this->input('human_check_answer'))),
            'human_check_nonce' => trim((string) $this->input('human_check_nonce')),
            'turnstile_token' => trim((string) $this->input('turnstile_token')),
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
            'has_content' => ['required', Rule::in(['yes', 'no'])],
            'content_development_interest' => [Rule::requiredIf(fn (): bool => $this->input('has_content') === 'no'), 'nullable', Rule::in(['yes', 'no'])],
            'logo_design_interest' => [Rule::requiredIf(fn (): bool => $this->input('has_logo') === 'no'), 'nullable', Rule::in(['yes', 'no'])],
            'logo_addon_package' => [Rule::requiredIf(fn (): bool => $this->input('has_logo') === 'no' && $this->input('logo_design_interest') === 'yes'), 'nullable', Rule::in($this->allowedLogoAddonCodes())],
            'service_package' => ['required', 'string', Rule::in($this->allowedPackageCodes())],
            'discount_code' => ['nullable', 'string', 'max:40', 'regex:/^[A-Z0-9\\-]+$/'],
            'prospect_draft_token' => ['nullable', 'uuid'],
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
            'human_check_nonce' => [Rule::requiredIf(! $this->usesTurnstile()), 'nullable', 'string', 'size:32'],
            'human_check_answer' => [Rule::requiredIf(! $this->usesTurnstile()), 'nullable', 'string', 'max:40'],
            'turnstile_token' => [Rule::requiredIf($this->usesTurnstile()), 'nullable', 'string', 'max:2048'],
            'form_rendered_at' => ['required', 'integer', 'min:1'],
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
            'human_check_answer.required' => 'Human verification is required.',
            'turnstile_token.required' => 'Please complete the captcha verification.',
            'password.required' => 'A password is required to create your account.',
            'password.confirmed' => 'Password confirmation does not match.',
            'has_logo.required' => 'Please tell us whether you already have a logo.',
            'has_content.required' => 'Please tell us whether you already have content for the designs.',
            'content_development_interest.required' => 'Please tell us whether you want us to develop content for your designs.',
            'logo_design_interest.required' => 'Please tell us whether you want Bellah Options to design a logo for you.',
            'logo_addon_package.required' => 'Please choose a logo or brand design package.',
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            if ($this->usesTurnstile()) {
                $this->validateTurnstileChallenge($validator);
            } else {
                $this->validateMathChallenge($validator);
            }

            $fullName = (string) $this->input('full_name');
            if (preg_match('/\s+/u', trim($fullName)) !== 1) {
                $validator->errors()->add('full_name', 'Please enter your full name.');
            }

            if ($this->boolean('create_account') && $this->user() === null) {
                $email = strtolower(trim((string) $this->input('email')));

                if ($email !== '' && User::query()->whereRaw('LOWER(email) = ?', [$email])->exists()) {
                    $validator->errors()->add('email', 'An account already exists with this email. Please log in to continue.');
                }
            }
        });
    }

    private function usesTurnstile(): bool
    {
        return app()->isProduction();
    }

    private function validateMathChallenge(Validator $validator): void
    {
        $challenge = $this->session()->get('service_order_human_check');

        if (! is_array($challenge)) {
            $validator->errors()->add('human_check_answer', 'Human verification expired. Please reload and try again.');

            return;
        }

        $nonceMatches = hash_equals(
            (string) ($challenge['nonce'] ?? ''),
            (string) $this->input('human_check_nonce'),
        );

        if (! $nonceMatches) {
            $validator->errors()->add('human_check_answer', 'Human verification failed. Please reload and try again.');

            return;
        }

        $issuedAt = (int) ($challenge['issued_at'] ?? 0);
        $submittedAt = now()->timestamp;

        if ($issuedAt <= 0 || ($submittedAt - $issuedAt) < 3 || ($submittedAt - $issuedAt) > 7200) {
            $validator->errors()->add('human_check_answer', 'Please take a moment and submit again.');

            return;
        }

        if ((int) $this->input('form_rendered_at') !== $issuedAt) {
            $validator->errors()->add('human_check_answer', 'Human verification failed. Please reload and try again.');

            return;
        }

        $providedAnswer = strtoupper(trim((string) $this->input('human_check_answer')));
        $expectedAnswer = strtoupper(trim((string) ($challenge['answer'] ?? '')));

        if ($providedAnswer === '' || ! hash_equals($expectedAnswer, $providedAnswer)) {
            $validator->errors()->add('human_check_answer', 'Human verification answer is incorrect.');
        }
    }

    private function validateTurnstileChallenge(Validator $validator): void
    {
        $token = trim((string) $this->input('turnstile_token'));
        $secret = trim((string) config('services.turnstile.secret_key', ''));

        if ($secret === '') {
            $validator->errors()->add('turnstile_token', 'Captcha verification is not configured. Please contact support.');

            return;
        }

        if ($token === '') {
            $validator->errors()->add('turnstile_token', 'Please complete the captcha verification.');

            return;
        }

        try {
            $response = Http::asForm()
                ->timeout(8)
                ->acceptJson()
                ->post('https://challenges.cloudflare.com/turnstile/v0/siteverify', [
                    'secret' => $secret,
                    'response' => $token,
                    'remoteip' => $this->ip(),
                ]);
        } catch (Throwable) {
            $validator->errors()->add('turnstile_token', 'Captcha verification failed. Please try again.');

            return;
        }

        if (! $response->successful()) {
            $validator->errors()->add('turnstile_token', 'Captcha verification failed. Please try again.');

            return;
        }

        $result = $response->json();
        $success = (bool) data_get($result, 'success', false);

        if ($success) {
            return;
        }

        $errorCodes = array_filter((array) data_get($result, 'error-codes', []), static fn (mixed $value): bool => is_string($value));
        $hasTimeoutError = in_array('timeout-or-duplicate', $errorCodes, true);

        $validator->errors()->add(
            'turnstile_token',
            $hasTimeoutError
                ? 'Captcha expired. Please complete the verification again.'
                : 'Captcha verification failed. Please try again.',
        );
    }

    /**
     * @return array<int, string>
     */
    private function allowedPackageCodes(): array
    {
        $serviceSlug = $this->serviceSlug();
        $codes = app(ServiceOrderCatalog::class)->packageCodes($serviceSlug);

        if (
            in_array($serviceSlug, self::TRIAL_SERVICE_SLUGS, true)
            && PlatformSettings::socialGraphicTrialFeeNgn() > 0
        ) {
            $codes[] = self::TRIAL_PACKAGE_CODE;
        }

        return array_values(array_unique($codes));
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
