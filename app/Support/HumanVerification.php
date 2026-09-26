<?php

namespace App\Support;

use Illuminate\Contracts\Cache\Repository as CacheRepository;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;
use Throwable;

/**
 * Server-authoritative human verification.
 *
 * Security model
 * --------------
 * 1. The server decides which challenge a visitor must solve. The client can
 *    never declare "I am using the fallback" and skip verification: the
 *    challenge type is minted server-side into the session and the submitted
 *    values are only accepted when they match that server-side state.
 * 2. Cloudflare Turnstile is always the preferred primary path, and a submitted
 *    Turnstile token is *always* verified when present - even when a fallback
 *    challenge exists. A token that fails verification is a hard failure and
 *    can never be "downgraded" to the fallback.
 * 3. The degraded-mode (fallback) challenge is only reachable when the primary
 *    path is genuinely unavailable to that visitor. It requires all of:
 *      - Turnstile configured as the primary challenge for this session;
 *      - a primary-verification attempt registered server-side for this session
 *        (a client that never tried can never fall back);
 *      - a server-issued, session-bound, single-use fallback challenge that has
 *        not expired, been consumed, or been replayed;
 *      - a per-IP hourly cap and a platform-wide hourly cap with an automatic
 *        circuit breaker that fails closed once exceeded.
 * 4. Every challenge is single-use: it is consumed by the request that presents
 *    it, so a solved challenge can never be replayed. A concurrent in-flight
 *    request for the same challenge is rejected with an atomic claim.
 */
class HumanVerification
{
    public const MODE_MATH = 'math';

    public const MODE_TURNSTILE = 'turnstile';

    private const CHALLENGE_TTL_SECONDS = 7200;

    private const MIN_ELAPSED_SECONDS = 3;

    private const SITEVERIFY_ENDPOINT = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

    /**
     * Build the challenge payload shared with the Inertia page.
     *
     * `humanVerificationFallback.active` tells the browser that the payload
     * already contains a server-issued degraded-mode challenge (question and
     * nonce), which happens when the previous challenge was consumed.
     *
     * @return array{
     *   humanVerificationMode:string,
     *   humanCheckQuestion:string,
     *   humanCheckNonce:string,
     *   turnstileSiteKey:string,
     *   humanVerificationFallback:array{available:bool,issueUrl:string,active:bool},
     *   formRenderedAt:int
     * }
     */
    public static function createChallenge(Request $request, string $sessionKey): array
    {
        $issuedAt = now()->timestamp;

        if (self::usesTurnstile()) {
            $consumedFallback = (bool) $request->session()->pull(self::fallbackUsedKey($sessionKey), false);

            $challenge = [
                'mode' => self::MODE_TURNSTILE,
                'session_key' => $sessionKey,
                'issued_at' => $issuedAt,
                'attempted_at' => $issuedAt,
                'fallback' => null,
            ];

            $request->session()->put($sessionKey, $challenge);

            // Record the primary challenge delivery so the degraded path stays
            // reachable for this visitor while the widget is unavailable.
            self::recordAttemptSignal($request);

            $fallbackAvailable = self::fallbackEnabled();

            // A visitor whose previous fallback challenge was consumed (for
            // example after an unrelated validation error) is handed a fresh
            // one right away: the degraded path is re-verified server-side.
            if ($consumedFallback) {
                $reissued = self::mintFallbackChallenge($request, $sessionKey, $challenge);

                if ($reissued !== null) {
                    return [
                        'humanVerificationMode' => self::MODE_TURNSTILE,
                        'humanCheckQuestion' => $reissued['question'],
                        'humanCheckNonce' => $reissued['nonce'],
                        'turnstileSiteKey' => self::configuredTurnstileSiteKey(),
                        'humanVerificationFallback' => [
                            'available' => $fallbackAvailable,
                            'issueUrl' => route('human-verification.fallback', absolute: false),
                            'active' => true,
                        ],
                        'formRenderedAt' => $reissued['issuedAt'],
                    ];
                }
            }

            return [
                'humanVerificationMode' => self::MODE_TURNSTILE,
                'humanCheckQuestion' => '',
                'humanCheckNonce' => '',
                'turnstileSiteKey' => self::configuredTurnstileSiteKey(),
                'humanVerificationFallback' => [
                    'available' => $fallbackAvailable,
                    'issueUrl' => route('human-verification.fallback', absolute: false),
                    'active' => false,
                ],
                'formRenderedAt' => $issuedAt,
            ];
        }

        $math = self::buildMathFallback();
        $nonce = Str::random(32);

        $request->session()->put($sessionKey, [
            'mode' => self::MODE_MATH,
            'issued_at' => $issuedAt,
            // Legacy "answer" key is retained for operators reading session
            // payloads by hand: verification itself uses the hashed digest so
            // the solved value is never stored in plain text.
            'answer' => $math['answer'],
            'digest' => self::mathDigest($math['answer'], $nonce),
            'nonce' => $nonce,
        ]);

        return [
            'humanVerificationMode' => self::MODE_MATH,
            'humanCheckQuestion' => $math['question'],
            'humanCheckNonce' => $nonce,
            'turnstileSiteKey' => '',
            'humanVerificationFallback' => [
                'available' => false,
                'issueUrl' => '',
                'active' => false,
            ],
            'formRenderedAt' => $issuedAt,
        ];
    }

    public static function usesTurnstile(): bool
    {
        return self::configuredTurnstileSiteKey() !== '' && self::configuredTurnstileSecretKey() !== '';
    }

    /**
     * Validation rules for the human-check fields.
     *
     * Both the math fields and the captcha token are validated by
     * {@see self::validate()} against server-side session state. Nothing here is
     * unconditionally "required", because the requirement itself is decided by
     * the challenge the server issued (and whether that challenge is currently
     * in Turnstile or degraded mode). Declaring the token required at rule level
     * would reject a legitimate degraded-mode submission, while not declaring it
     * at all cannot be abused: a request without a token and without a
     * server-issued fallback challenge always fails validation.
     *
     * @return array<string, array<int, mixed>>
     */
    public static function rules(): array
    {
        return [
            'human_check_nonce' => [Rule::requiredIf(fn (): bool => self::requiresMathFields()), 'nullable', 'string', 'size:32'],
            'human_check_answer' => [Rule::requiredIf(fn (): bool => self::requiresMathFields()), 'nullable', 'string', 'max:40'],
            'turnstile_token' => ['nullable', 'string', 'max:2048'],
            'form_rendered_at' => ['required', 'integer', 'min:1'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public static function messages(): array
    {
        return [
            'human_check_answer.required' => 'Human verification is required.',
            'turnstile_token.required' => 'Please complete the captcha verification.',
        ];
    }

    public static function validate(FormRequest $request, Validator $validator, string $sessionKey): void
    {
        $challenge = $request->session()->get($sessionKey);

        if (! is_array($challenge)) {
            $validator->errors()->add('turnstile_token', 'Human verification expired. Please reload the page and try again.');

            return;
        }

        $mode = (string) ($challenge['mode'] ?? self::MODE_MATH);

        if ($mode !== self::MODE_TURNSTILE || ! self::usesTurnstile()) {
            self::validateMathChallenge($request, $validator, $sessionKey, $challenge);

            return;
        }

        $token = trim((string) $request->input('turnstile_token'));

        if ($token !== '') {
            // A presented token is authoritative: verify it and never fall back.
            self::validateTurnstileToken($request, $validator, $token, $sessionKey);

            return;
        }

        self::validateTurnstileFallback($request, $validator, $sessionKey);
    }

    /**
     * Mint a degraded-mode challenge for a visitor whose primary challenge could
     * not be delivered. Called only when the client reports a failed Turnstile
     * load/render; the server re-checks every precondition itself.
     *
     * @return array{question:string, nonce:string, issuedAt:int}|null
     */
    public static function issueFallbackChallenge(Request $request, string $sessionKey): ?array
    {
        $challenge = $request->session()->get($sessionKey);

        if (! is_array($challenge) || (string) ($challenge['mode'] ?? '') !== self::MODE_TURNSTILE) {
            return null;
        }

        if (! self::fallbackEnabled()) {
            return null;
        }

        if (! self::usesTurnstile()) {
            return null;
        }

        if (self::rateLimitReached('accepted', (string) $request->ip(), self::fallbackPerIpPerHour())) {
            Log::warning('Turnstile fallback challenge denied: per-IP fallback quota already exhausted.', [
                'ip_hash' => self::ipHash($request),
            ]);

            return null;
        }

        if (! self::globalRateLimitRemaining(self::fallbackGlobalPerHour())) {
            Log::critical('Turnstile fallback challenge denied: platform-wide fallback circuit breaker is open.', []);

            return null;
        }

        if (! self::consumeRateLimit('issues', (string) $request->ip(), self::fallbackIssuesPerIpPerHour())) {
            Log::warning('Turnstile fallback challenge denied: per-IP issuance rate limit reached.', [
                'ip_hash' => self::ipHash($request),
            ]);

            return null;
        }

        return self::mintFallbackChallenge($request, $sessionKey, $challenge);
    }

    /**
     * Write a fresh degraded-mode challenge into the existing primary challenge
     * record. Callers are responsible for the quota and circuit-breaker checks.
     *
     * @param  array<string, mixed>  $challenge
     * @return array{question:string, nonce:string, issuedAt:int}|null
     */
    private static function mintFallbackChallenge(Request $request, string $sessionKey, array $challenge): ?array
    {
        $math = self::buildMathFallback();
        $nonce = Str::random(32);
        $issuedAt = now()->timestamp;

        $challenge['attempted_at'] = $issuedAt;
        $challenge['fallback'] = [
            'issued_at' => $issuedAt,
            'digest' => self::mathDigest($math['answer'], $nonce),
            'nonce' => $nonce,
            'consumed_at' => null,
        ];

        $request->session()->put($sessionKey, $challenge);

        self::recordAttemptSignal($request);

        Log::warning('Turnstile fallback challenge issued.', [
            'ip_hash' => self::ipHash($request),
            'site_key_suffix' => substr(self::configuredTurnstileSiteKey(), -6),
        ]);

        return [
            'question' => $math['question'],
            'nonce' => $nonce,
            'issuedAt' => $issuedAt,
        ];
    }

    /**
     * Register that a visitor attempted the primary challenge. Called while
     * detecting and minting the degraded-mode path so an entirely skipped
     * primary challenge can never unlock the fallback.
     */
    public static function registerPrimaryAttempt(Request $request, string $sessionKey): void
    {
        $challenge = $request->session()->get($sessionKey);

        if (! is_array($challenge) || (string) ($challenge['mode'] ?? '') !== self::MODE_TURNSTILE) {
            return;
        }

        $challenge['attempted_at'] = now()->timestamp;
        $request->session()->put($sessionKey, $challenge);

        self::recordAttemptSignal($request);
    }

    /**
     * Resolve the session key of the Turnstile challenge currently held by this
     * session, or null when the visitor has no primary challenge in flight.
     *
     * Used by the degraded-mode endpoint so the session key is always chosen
     * from the server-side allow-list rather than from client input.
     */
    public static function turnstileSessionKey(Request $request): ?string
    {
        foreach (self::sessionKeys() as $sessionKey) {
            $challenge = $request->session()->get($sessionKey);

            if (! is_array($challenge)) {
                continue;
            }

            if ((string) ($challenge['mode'] ?? '') === self::MODE_TURNSTILE) {
                return $sessionKey;
            }
        }

        return null;
    }

    private static function requiresMathFields(): bool    {
        if (! self::usesTurnstile()) {
            return true;
        }
        // With Turnstile configured the math fields are only mandatory once the
        // server has issued a degraded-mode (fallback) challenge for this
        // session. The challenge is looked up in the session directly so the
        // requirement can never be flipped by a request parameter.
        $activeKey = function_exists('request')
            ? self::turnstileSessionKey(request())
            : null;

        if ($activeKey === null) {
            return false;
        }

        return self::isFallbackActive(request()->session()->get($activeKey));
    }

    /**
     * @return array<int, string>
     */
    private static function sessionKeys(): array
    {
        return [
            'service_order_human_check',
            'brief_human_check',
            'waitlist_human_check',
            'contact_human_check',
            'auth_login_human_check',
            'auth_register_human_check',
            'auth_forgot_password_human_check',
        ];
    }

    /**
     * @param  array<string, mixed>  $challenge
     */
    private static function isFallbackActive(mixed $challenge): bool
    {
        if (! is_array($challenge)) {
            return false;
        }

        if ((string) ($challenge['mode'] ?? '') !== self::MODE_TURNSTILE) {
            return false;
        }

        $fallback = $challenge['fallback'] ?? null;

        if (! is_array($fallback) || (string) ($fallback['digest'] ?? '') === '') {
            return false;
        }

        if (($fallback['consumed_at'] ?? null) !== null) {
            return false;
        }

        $issuedAt = (int) ($fallback['issued_at'] ?? 0);

        return $issuedAt > 0 && (now()->timestamp - $issuedAt) <= self::fallbackTtlSeconds();
    }

    /**
     * @param  array<string, mixed>  $challenge
     */
    private static function validateMathChallenge(
        FormRequest $request,
        Validator $validator,
        string $sessionKey,
        array $challenge,
    ): void {
        $issuedAt = (int) ($challenge['issued_at'] ?? 0);
        $submittedAt = now()->timestamp;
        $nonce = trim((string) $request->input('human_check_nonce'));

        if (! hash_equals((string) ($challenge['nonce'] ?? ''), $nonce)) {
            $validator->errors()->add('human_check_answer', 'Human verification failed. Please reload the page and try again.');

            return;
        }

        if ($issuedAt <= 0 || ($submittedAt - $issuedAt) < self::MIN_ELAPSED_SECONDS || ($submittedAt - $issuedAt) > self::CHALLENGE_TTL_SECONDS) {
            self::discardChallenge($request, $sessionKey);
            $validator->errors()->add('human_check_answer', 'Human verification expired. Please reload the page and try again.');

            return;
        }

        if ((int) $request->input('form_rendered_at') !== $issuedAt) {
            $validator->errors()->add('human_check_answer', 'Human verification failed. Please reload the page and try again.');

            return;
        }

        if (! self::claimChallenge($request, $sessionKey, $nonce)) {
            $validator->errors()->add('human_check_answer', 'Human verification is already being processed. Please wait a moment and try again.');

            return;
        }

        $providedAnswer = strtoupper(trim((string) $request->input('human_check_answer')));
        $expectedDigest = self::mathDigest($providedAnswer, $nonce);
        $storedDigest = (string) ($challenge['digest'] ?? '');

        if ($storedDigest === '' && isset($challenge['answer'])) {
            // Legacy session payloads written before digests existed.
            $storedDigest = self::mathDigest(strtoupper(trim((string) $challenge['answer'])), $nonce);
        }

        if ($providedAnswer === '' || $storedDigest === '' || ! hash_equals($storedDigest, $expectedDigest)) {
            self::releaseChallengeClaim($request, $sessionKey, $nonce);
            $validator->errors()->add('human_check_answer', 'Human verification answer is incorrect.');

            return;
        }

        // Single-use: the challenge is consumed by this successful submission.
        self::discardChallenge($request, $sessionKey);
    }

    private static function validateTurnstileFallback(
        FormRequest $request,
        Validator $validator,
        string $sessionKey,
    ): void {
        $challenge = (array) $request->session()->get($sessionKey, []);
        $fallback = $challenge['fallback'] ?? null;

        if (! self::fallbackEnabled()) {
            $validator->errors()->add('turnstile_token', 'Please complete the captcha verification. If it keeps failing, refresh the page and try again.');

            return;
        }

        // A fallback challenge can only ever exist for a response the server
        // itself served for this session: the client cannot invent one.
        if (! self::isFallbackActive($challenge)) {
            $validator->errors()->add('turnstile_token', 'Captcha verification is unavailable right now. Please refresh the page to load the backup security check.');

            return;
        }

        if (! self::primaryAttemptRecorded($request, $challenge)) {
            Log::warning('Turnstile fallback rejected: no primary verification attempt recorded for this session.', [
                'ip_hash' => self::ipHash($request),
            ]);

            $validator->errors()->add('turnstile_token', 'Please complete the captcha verification. If it keeps failing, refresh the page and try again.');

            return;
        }

        if (! is_array($fallback)) {
            $validator->errors()->add('turnstile_token', 'Backup security check unavailable. Please refresh the page and try again.');

            return;
        }

        $issuedAt = (int) ($fallback['issued_at'] ?? 0);
        $nonce = trim((string) $request->input('human_check_nonce'));

        if (! hash_equals((string) ($fallback['nonce'] ?? ''), $nonce)) {
            $validator->errors()->add('turnstile_token', 'Backup security check failed. Please refresh the page and try again.');

            return;
        }

        if (now()->timestamp - $issuedAt < self::MIN_ELAPSED_SECONDS) {
            $validator->errors()->add('turnstile_token', 'Please take a moment and submit again.');

            return;
        }

        if (! self::claimChallenge($request, $sessionKey, $nonce)) {
            $validator->errors()->add('turnstile_token', 'This security check is already being processed. Please wait a moment and try again.');

            return;
        }

        $providedAnswer = strtoupper(trim((string) $request->input('human_check_answer')));
        $expectedDigest = self::mathDigest($providedAnswer, $nonce);
        $storedDigest = (string) $fallback['digest'];

        if ($providedAnswer === '' || ! hash_equals($storedDigest, $expectedDigest)) {
            self::releaseChallengeClaim($request, $sessionKey, $nonce);
            $validator->errors()->add('turnstile_token', 'Backup security check answer is incorrect.');

            return;
        }

        $perIpLimit = self::fallbackPerIpPerHour();
        $globalLimit = self::fallbackGlobalPerHour();

        if (! self::consumeRateLimit('accepted', (string) $request->ip(), $perIpLimit)) {
            Log::warning('Turnstile fallback blocked: per-IP hourly fallback quota exhausted.', [
                'ip_hash' => self::ipHash($request),
                'limit' => $perIpLimit,
            ]);

            self::releaseChallengeClaim($request, $sessionKey, $nonce);
            $validator->errors()->add('turnstile_token', 'Captcha verification could not be completed. Please refresh the page and try again later.');

            return;
        }

        if (! self::consumeGlobalRateLimit($globalLimit)) {
            Log::critical('Turnstile fallback circuit breaker tripped: platform-wide hourly fallback quota exhausted.', [
                'limit' => $globalLimit,
            ]);

            self::releaseChallengeClaim($request, $sessionKey, $nonce);
            $validator->errors()->add('turnstile_token', 'Captcha verification could not be completed. Please refresh the page and try again later.');

            return;
        }

        Log::warning('Turnstile fallback accepted.', [
            'ip_hash' => self::ipHash($request),
            'site_key_suffix' => substr(self::configuredTurnstileSiteKey(), -6),
        ]);

        // Single-use: consume the fallback challenge on success.
        self::discardChallenge($request, $sessionKey, true);
    }

    private static function validateTurnstileToken(
        FormRequest $request,
        Validator $validator,
        string $token,
        string $sessionKey,
    ): void {
        $secret = self::configuredTurnstileSecretKey();

        if ($secret === '') {
            $validator->errors()->add('turnstile_token', 'Captcha verification is not configured. Please contact support.');

            return;
        }

        try {
            $response = Http::asForm()
                ->timeout(8)
                ->acceptJson()
                ->post(self::SITEVERIFY_ENDPOINT, [
                    'secret' => $secret,
                    'response' => $token,
                    'remoteip' => $request->ip(),
                ]);
        } catch (Throwable $exception) {
            Log::error('Turnstile siteverify request threw an exception.', [
                'exception_class' => get_class($exception),
                'message' => $exception->getMessage(),
            ]);

            $validator->errors()->add('turnstile_token', 'Captcha verification failed. Please try again.');

            return;
        }

        if (! $response->successful()) {
            Log::error('Turnstile siteverify returned a non-successful HTTP response.', [
                'status' => $response->status(),
                'body' => Str::limit($response->body(), 1000),
            ]);

            $validator->errors()->add('turnstile_token', 'Captcha verification failed. Please try again.');

            return;
        }

        $result = $response->json();
        $success = (bool) data_get($result, 'success', false);

        if ($success) {
            // The primary path succeeded: drop any degraded-mode leftovers.
            $request->session()->forget(self::fallbackUsedKey($sessionKey));

            return;
        }

        $errorCodes = array_filter((array) data_get($result, 'error-codes', []), static fn (mixed $value): bool => is_string($value));
        $hasTimeoutError = in_array('timeout-or-duplicate', $errorCodes, true);

        Log::warning('Turnstile siteverify reported failure.', [
            'error-codes' => $errorCodes,
            'site_key_suffix' => substr(self::configuredTurnstileSiteKey(), -6),
        ]);

        $validator->errors()->add(
            'turnstile_token',
            $hasTimeoutError
                ? 'Captcha expired. Please complete the verification again.'
                : 'Captcha verification failed. Please try again.',
        );
    }

    /**
     * @param  array<string, mixed>  $challenge
     */
    private static function primaryAttemptRecorded(Request $request, array $challenge): bool
    {
        $attemptedAt = (int) ($challenge['attempted_at'] ?? 0);

        if ($attemptedAt > 0 && (now()->timestamp - $attemptedAt) <= self::fallbackAttemptTtlSeconds()) {
            return true;
        }

        $signalAt = (int) Cache::get(self::attemptSignalKey($request), 0);

        return $signalAt > 0 && (now()->timestamp - $signalAt) <= self::fallbackAttemptTtlSeconds();
    }

    private static function recordAttemptSignal(Request $request): void
    {
        Cache::put(
            self::attemptSignalKey($request),
            now()->timestamp,
            now()->addSeconds(self::fallbackAttemptTtlSeconds()),
        );
    }

    /**
     * @return array{answer:string, question:string}
     */
    private static function buildMathFallback(): array
    {
        $leftOperand = random_int(2, 12);
        $rightOperand = random_int(1, 12);
        $answer = (string) ($leftOperand + $rightOperand);

        return [
            'answer' => $answer,
            'question' => "{$leftOperand} + {$rightOperand} = ?",
        ];
    }

    private static function mathDigest(string $answer, string $nonce): string
    {
        return hash_hmac('sha256', $nonce.':'.strtoupper(trim($answer)), self::digestKey());
    }

    private static function digestKey(): string
    {
        $key = (string) config('app.key');

        return $key !== '' ? $key : 'bellah-human-verification';
    }

    /**
     * Atomically claim a challenge so concurrent requests cannot both verify it.
     */
    private static function claimChallenge(Request $request, string $sessionKey, string $nonce): bool
    {
        return self::cache()->add(
            self::claimKey($request, $sessionKey, $nonce),
            now()->timestamp,
            now()->addSeconds(self::CHALLENGE_TTL_SECONDS),
        );
    }

    private static function releaseChallengeClaim(Request $request, string $sessionKey, string $nonce): void
    {
        self::cache()->forget(self::claimKey($request, $sessionKey, $nonce));
    }

    private static function claimKey(Request $request, string $sessionKey, string $nonce): string
    {
        return 'human-verification:claim:'.self::sessionFingerprint($request).':'.$sessionKey.':'.hash('sha256', $nonce);
    }

    private static function discardChallenge(Request $request, string $sessionKey, bool $markFallbackConsumed = false): void
    {
        if ($markFallbackConsumed) {
            // Remember that the degraded path was consumed so the next form
            // render can hand out a fresh single-use challenge instead of
            // leaving the visitor with a spent one.
            $request->session()->put(self::fallbackUsedKey($sessionKey), now()->timestamp);
        }

        $request->session()->forget($sessionKey);
    }

    private static function fallbackUsedKey(string $sessionKey): string
    {
        return 'human_verification_fallback_used.'.$sessionKey;
    }

    private static function consumeRateLimit(string $bucket, string $identifier, int $limit): bool
    {
        $key = self::rateLimitKey($bucket, $identifier);

        if ($limit <= 0) {
            return false;
        }

        $added = self::cache()->add($key, 1, now()->addHour());

        if ($added) {
            return true;
        }

        $current = (int) self::cache()->get($key, 0);

        if ($current >= $limit) {
            return false;
        }

        self::cache()->put($key, $current + 1, now()->addHour());

        return true;
    }

    private static function rateLimitReached(string $bucket, string $identifier, int $limit): bool
    {
        if ($limit <= 0) {
            return true;
        }

        return (int) self::cache()->get(self::rateLimitKey($bucket, $identifier), 0) >= $limit;
    }

    private static function consumeGlobalRateLimit(int $limit): bool
    {
        if ($limit <= 0) {
            return false;
        }

        $key = self::globalRateLimitKey();
        $added = self::cache()->add($key, 1, now()->addHour());

        if ($added) {
            return true;
        }

        $current = (int) self::cache()->get($key, 0);

        if ($current >= $limit) {
            return false;
        }

        self::cache()->put($key, $current + 1, now()->addHour());

        return true;
    }

    private static function globalRateLimitRemaining(int $limit): bool
    {
        if ($limit <= 0) {
            return false;
        }

        return (int) self::cache()->get(self::globalRateLimitKey(), 0) < $limit;
    }

    private static function rateLimitKey(string $bucket, string $identifier): string
    {
        $window = now()->utc()->format('YmdH');

        return 'human-verification:v1:'.$bucket.':'.$window.':'.hash('sha256', $identifier);
    }

    private static function globalRateLimitKey(): string
    {
        return 'human-verification:v1:accepted:global:'.now()->utc()->format('YmdH');
    }

    private static function attemptSignalKey(Request $request): string
    {
        return 'human-verification:attempt:'.self::sessionFingerprint($request);
    }

    private static function sessionFingerprint(Request $request): string
    {
        return hash('sha256', (string) $request->session()->getId());
    }

    private static function ipHash(Request $request): string
    {
        return substr(hash('sha256', (string) $request->ip()), 0, 16);
    }

    private static function cache(): CacheRepository
    {
        return Cache::store();
    }

    private static function fallbackEnabled(): bool
    {
        return (bool) config('services.turnstile.fallback.enabled', true);
    }

    private static function fallbackTtlSeconds(): int
    {
        return max(1, (int) config('services.turnstile.fallback.ttl_minutes', 10)) * 60;
    }

    private static function fallbackAttemptTtlSeconds(): int
    {
        return max(1, (int) config('services.turnstile.fallback.attempt_ttl_minutes', 120)) * 60;
    }

    private static function fallbackPerIpPerHour(): int
    {
        return (int) config('services.turnstile.fallback.per_ip_hourly', 2);
    }

    private static function fallbackGlobalPerHour(): int
    {
        return (int) config('services.turnstile.fallback.global_hourly', 150);
    }

    private static function fallbackIssuesPerIpPerHour(): int
    {
        return (int) config('services.turnstile.fallback.issues_per_ip_hourly', 6);
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
