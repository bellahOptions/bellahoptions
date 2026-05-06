<?php

namespace App\Support;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;
use Throwable;

class HumanVerification
{
    /**
     * @return array{
     *   humanVerificationMode:string,
     *   humanCheckQuestion:string,
     *   humanCheckNonce:string,
     *   turnstileSiteKey:string,
     *   formRenderedAt:int
     * }
     */
    public static function createChallenge(Request $request, string $sessionKey): array
    {
        if (self::usesTurnstile()) {
            $request->session()->forget($sessionKey);

            return [
                'humanVerificationMode' => 'turnstile',
                'humanCheckQuestion' => '',
                'humanCheckNonce' => '',
                'turnstileSiteKey' => self::configuredTurnstileSiteKey(),
                'formRenderedAt' => now()->timestamp,
            ];
        }

        $leftOperand = random_int(2, 12);
        $rightOperand = random_int(1, 12);
        $issuedAt = now()->timestamp;
        $nonce = Str::random(32);

        $request->session()->put($sessionKey, [
            'answer' => (string) ($leftOperand + $rightOperand),
            'issued_at' => $issuedAt,
            'nonce' => $nonce,
        ]);

        return [
            'humanVerificationMode' => 'math',
            'humanCheckQuestion' => "{$leftOperand} + {$rightOperand} = ?",
            'humanCheckNonce' => $nonce,
            'turnstileSiteKey' => '',
            'formRenderedAt' => $issuedAt,
        ];
    }

    public static function usesTurnstile(): bool
    {
        return self::configuredTurnstileSiteKey() !== '' && self::configuredTurnstileSecretKey() !== '';
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public static function rules(): array
    {
        return [
            'human_check_nonce' => [Rule::requiredIf(! self::usesTurnstile()), 'nullable', 'string', 'size:32'],
            'human_check_answer' => [Rule::requiredIf(! self::usesTurnstile()), 'nullable', 'string', 'max:40'],
            'turnstile_token' => [Rule::requiredIf(self::usesTurnstile()), 'nullable', 'string', 'max:2048'],
            'form_rendered_at' => ['required', 'integer', 'min:1'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public static function honeypotRules(): array
    {
        return [
            'website' => 'nullable|string|max:0',
            'company_name' => 'nullable|string|max:0',
            'contact_notes' => 'nullable|string|max:0',
        ];
    }

    /**
     * @return array<string, string>
     */
    public static function messages(): array
    {
        return [
            'website.max' => 'Human verification failed.',
            'company_name.max' => 'Human verification failed.',
            'contact_notes.max' => 'Human verification failed.',
            'human_check_answer.required' => 'Human verification is required.',
            'turnstile_token.required' => 'Please complete the captcha verification.',
        ];
    }

    public static function validate(FormRequest $request, Validator $validator, string $sessionKey): void
    {
        if (self::usesTurnstile()) {
            self::validateTurnstileChallenge($request, $validator);

            return;
        }

        self::validateMathChallenge($request, $validator, $sessionKey);
    }

    private static function validateMathChallenge(FormRequest $request, Validator $validator, string $sessionKey): void
    {
        $challenge = $request->session()->get($sessionKey);

        if (! is_array($challenge)) {
            $validator->errors()->add('human_check_answer', 'Human verification expired. Please reload and try again.');

            return;
        }

        $nonceMatches = hash_equals(
            (string) ($challenge['nonce'] ?? ''),
            (string) $request->input('human_check_nonce'),
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

        if ((int) $request->input('form_rendered_at') !== $issuedAt) {
            $validator->errors()->add('human_check_answer', 'Human verification failed. Please reload and try again.');

            return;
        }

        $providedAnswer = strtoupper(trim((string) $request->input('human_check_answer')));
        $expectedAnswer = strtoupper(trim((string) ($challenge['answer'] ?? '')));

        if ($providedAnswer === '' || ! hash_equals($expectedAnswer, $providedAnswer)) {
            $validator->errors()->add('human_check_answer', 'Human verification answer is incorrect.');
        }
    }

    private static function validateTurnstileChallenge(FormRequest $request, Validator $validator): void
    {
        $token = trim((string) $request->input('turnstile_token'));
        $secret = self::configuredTurnstileSecretKey();

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
                    'remoteip' => $request->ip(),
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

    private static function configuredTurnstileSiteKey(): string
    {
        return trim((string) config('services.turnstile.site_key', ''));
    }

    private static function configuredTurnstileSecretKey(): string
    {
        return trim((string) config('services.turnstile.secret_key', ''));
    }
}
