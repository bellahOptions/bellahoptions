<?php

namespace App\Support;

use App\Models\User;
use Illuminate\Http\Request;

class StaffOtpChallenge
{
    public const SESSION_KEY = 'staff_login_otp';

    public const EXPIRES_IN_MINUTES = 10;

    public const MAX_VERIFY_ATTEMPTS = 5;

    public const RESEND_COOLDOWN_SECONDS = 30;

    /**
     * @return array<string, int|string>|null
     */
    public function get(Request $request): ?array
    {
        $payload = $request->session()->get(self::SESSION_KEY);

        if (! is_array($payload)) {
            return null;
        }

        $requiredKeys = ['user_id', 'email', 'code_hash', 'issued_at', 'expires_at', 'attempts', 'last_sent_at'];

        foreach ($requiredKeys as $key) {
            if (! array_key_exists($key, $payload)) {
                $this->clear($request);

                return null;
            }
        }

        return [
            'user_id' => (int) $payload['user_id'],
            'email' => strtolower(trim((string) $payload['email'])),
            'code_hash' => (string) $payload['code_hash'],
            'issued_at' => (int) $payload['issued_at'],
            'expires_at' => (int) $payload['expires_at'],
            'attempts' => (int) $payload['attempts'],
            'last_sent_at' => (int) $payload['last_sent_at'],
        ];
    }

    public function issue(Request $request, User $user): string
    {
        $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $now = now()->timestamp;

        $request->session()->put(self::SESSION_KEY, [
            'user_id' => $user->id,
            'email' => strtolower(trim((string) $user->email)),
            'code_hash' => $this->hashCode($code),
            'issued_at' => $now,
            'expires_at' => $now + (self::EXPIRES_IN_MINUTES * 60),
            'attempts' => 0,
            'last_sent_at' => $now,
        ]);

        return $code;
    }

    public function refresh(Request $request): ?string
    {
        $challenge = $this->get($request);

        if (! $challenge) {
            return null;
        }

        $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $now = now()->timestamp;

        $challenge['code_hash'] = $this->hashCode($code);
        $challenge['issued_at'] = $now;
        $challenge['expires_at'] = $now + (self::EXPIRES_IN_MINUTES * 60);
        $challenge['attempts'] = 0;
        $challenge['last_sent_at'] = $now;

        $request->session()->put(self::SESSION_KEY, $challenge);

        return $code;
    }

    /**
     * @param  array<string, int|string>  $challenge
     */
    public function isExpired(array $challenge): bool
    {
        return now()->timestamp > (int) $challenge['expires_at'];
    }

    /**
     * @param  array<string, int|string>  $challenge
     */
    public function verifyCode(array $challenge, string $code): bool
    {
        return hash_equals((string) $challenge['code_hash'], $this->hashCode($code));
    }

    public function recordFailedAttempt(Request $request): int
    {
        $challenge = $this->get($request);

        if (! $challenge) {
            return 0;
        }

        $challenge['attempts'] = (int) $challenge['attempts'] + 1;
        $request->session()->put(self::SESSION_KEY, $challenge);

        return (int) $challenge['attempts'];
    }

    public function resendAvailableIn(Request $request): int
    {
        $challenge = $this->get($request);

        if (! $challenge) {
            return 0;
        }

        $elapsed = now()->timestamp - (int) $challenge['last_sent_at'];
        $remaining = self::RESEND_COOLDOWN_SECONDS - $elapsed;

        return max(0, $remaining);
    }

    public function clear(Request $request): void
    {
        $request->session()->forget(self::SESSION_KEY);
    }

    private function hashCode(string $code): string
    {
        $secret = (string) config('app.key', 'bellah-options');

        return hash_hmac('sha256', $code, $secret);
    }
}
