<?php

namespace App\Services;

use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use RuntimeException;

class PaystackService
{
    /**
     * @param  array<string, mixed>  $metadata
     * @return array{authorization_url: string, access_code: string, reference: string}
     */
    public function initialize(
        string $email,
        int $amountInMinor,
        string $reference,
        string $callbackUrl,
        string $currency = 'NGN',
        array $metadata = [],
        ?string $planCode = null
    ): array
    {
        $splitCode = trim((string) config('services.paystack.split_code', ''));

        $response = Http::timeout(20)
            ->withToken($this->secretKey())
            ->post('https://api.paystack.co/transaction/initialize', array_filter([
                'email' => $email,
                'amount' => $amountInMinor,
                'reference' => $reference,
                'currency' => strtoupper(trim($currency)),
                'callback_url' => $callbackUrl,
                'metadata' => $metadata,
                'split_code' => $splitCode !== '' ? $splitCode : null,
                'plan' => $planCode !== null && trim($planCode) !== '' ? trim($planCode) : null,
            ], static fn (mixed $value): bool => $value !== null));

        $payload = $this->validatedPayload($response);
        $data = (array) ($payload['data'] ?? []);

        $authorizationUrl = (string) ($data['authorization_url'] ?? '');
        $accessCode = (string) ($data['access_code'] ?? '');
        $resolvedReference = (string) ($data['reference'] ?? $reference);

        if ($authorizationUrl === '' || $accessCode === '' || $resolvedReference === '') {
            throw new RuntimeException('Paystack initialization returned incomplete data.');
        }

        return [
            'authorization_url' => $authorizationUrl,
            'access_code' => $accessCode,
            'reference' => $resolvedReference,
        ];
    }

    /**
     * @return array{plan_code: string}
     */
    public function createPlan(string $name, int $amountInMinor, string $interval, string $currency = 'NGN'): array
    {
        $response = Http::timeout(20)
            ->withToken($this->secretKey())
            ->post('https://api.paystack.co/plan', [
                'name' => $name,
                'amount' => $amountInMinor,
                'interval' => $interval,
                'currency' => strtoupper(trim($currency)),
            ]);

        $payload = $this->validatedPayload($response);
        $data = (array) ($payload['data'] ?? []);
        $planCode = (string) ($data['plan_code'] ?? '');

        if ($planCode === '') {
            throw new RuntimeException('Paystack plan creation returned no plan code.');
        }

        return ['plan_code' => $planCode];
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    public function updatePlan(string $planCode, array $payload): array
    {
        $response = Http::timeout(20)
            ->withToken($this->secretKey())
            ->put('https://api.paystack.co/plan/'.$planCode, $payload);

        return $this->validatedPayload($response);
    }

    public static function toKobo(float $amount): int
    {
        return (int) round($amount * 100);
    }

    /**
     * @return array<string, mixed>
     */
    public function verify(string $reference): array
    {
        $response = Http::timeout(20)
            ->withToken($this->secretKey())
            ->get('https://api.paystack.co/transaction/verify/'.$reference);

        return $this->validatedPayload($response);
    }

    /**
     * @return array{available: bool, message: string}
     */
    public function healthCheck(): array
    {
        try {
            $response = Http::timeout(8)
                ->withToken($this->secretKey())
                ->acceptJson()
                ->get('https://api.paystack.co/bank', [
                    'country' => 'nigeria',
                    'perPage' => 1,
                ]);
        } catch (\Throwable) {
            return [
                'available' => false,
                'message' => 'Paystack is temporarily unreachable.',
            ];
        }

        if (! $response->successful()) {
            return [
                'available' => false,
                'message' => 'Paystack is currently unavailable.',
            ];
        }

        /** @var array<string, mixed> $payload */
        $payload = (array) $response->json();
        if (! ((bool) ($payload['status'] ?? false))) {
            return [
                'available' => false,
                'message' => 'Paystack health check failed.',
            ];
        }

        return [
            'available' => true,
            'message' => '',
        ];
    }

    /**
     * The bank list Paystack will resolve account numbers against.
     *
     * Resolving an account name needs a *bank code*, not a bank name, so the
     * settings screen needs this to turn the operator's choice into a code. The
     * list changes rarely, so it is cached for a day to keep the admin UI snappy
     * and to avoid spending API calls on every page load.
     *
     * @return array<int, array{name: string, code: string}>
     */
    public function banks(string $currency = 'NGN'): array
    {
        $currency = strtoupper(trim($currency));
        $currency = $currency !== '' ? $currency : 'NGN';

        return Cache::remember(
            'paystack:banks:'.strtolower($currency).':v1',
            now()->addDay(),
            fn (): array => $this->fetchBanks($currency),
        );
    }

    /**
     * Resolve the account name registered to an account number at a bank.
     *
     * Paystack verifies the number against the bank's records and returns the
     * registered name, which is what stops a typo in the settings screen from
     * sending customers to an account that does not exist.
     *
     * @return array{account_name: string, account_number: string}
     */
    public function resolveAccountNumber(string $accountNumber, string $bankCode): array
    {
        $accountNumber = trim($accountNumber);
        $bankCode = trim($bankCode);

        if ($accountNumber === '' || $bankCode === '') {
            throw new RuntimeException('An account number and bank are both required to resolve an account name.');
        }

        $response = Http::timeout(15)
            ->withToken($this->secretKey())
            ->acceptJson()
            ->get('https://api.paystack.co/bank/resolve', [
                'account_number' => $accountNumber,
                'bank_code' => $bankCode,
            ]);

        // Resolution is an operator-facing diagnostic, not a customer payment
        // call, so Paystack's own explanation ("Could not resolve account name.
        // Check parameters") is surfaced here: it is what tells an admin whether
        // the bank or the number is wrong. validatedPayload() deliberately keeps
        // a generic message for the customer-facing paths, so this branch cannot
        // be folded into it. The text is only ever returned to a super admin.
        if (! $response->successful()) {
            $errorPayload = (array) $response->json();
            $apiMessage = trim((string) ($errorPayload['message'] ?? ''));

            Log::warning('Paystack account name resolution failed.', [
                'status' => $response->status(),
                'message' => $apiMessage,
            ]);

            throw new RuntimeException(
                $apiMessage !== ''
                    ? $apiMessage
                    : 'Unable to reach Paystack right now. Please try again shortly.',
            );
        }

        $payload = $this->validatedPayload($response);
        $data = is_array($payload['data'] ?? null) ? $payload['data'] : [];

        $accountName = trim((string) ($data['account_name'] ?? ''));
        $resolvedNumber = trim((string) ($data['account_number'] ?? ''));

        if ($accountName === '') {
            throw new RuntimeException('Paystack did not return an account name for that account number.');
        }

        return [
            'account_name' => $accountName,
            'account_number' => $resolvedNumber !== '' ? $resolvedNumber : $accountNumber,
        ];
    }

    /**
     * Walk every page of the Paystack bank list.
     *
     * Paystack caps a page at 100 entries and Nigeria alone has more than that,
     * so stopping at the first page would silently hide most banks.
     *
     * @return array<int, array{name: string, code: string}>
     */
    private function fetchBanks(string $currency): array
    {
        // A hard page cap keeps a malformed meta.pageCount from looping forever.
        $maxPages = 10;
        $banks = [];

        for ($page = 1; $page <= $maxPages; $page++) {
            $response = Http::timeout(20)
                ->withToken($this->secretKey())
                ->acceptJson()
                ->get('https://api.paystack.co/bank', [
                    'currency' => $currency,
                    'perPage' => 100,
                    'page' => $page,
                ]);

            $payload = $this->validatedPayload($response);
            $data = is_array($payload['data'] ?? null) ? $payload['data'] : [];

            if ($data === []) {
                break;
            }

            foreach ($data as $bank) {
                if (! is_array($bank)) {
                    continue;
                }

                // Inactive entries cannot resolve an account number, so offering
                // them in the picker would only produce confusing failures.
                if (array_key_exists('active', $bank) && ! $bank['active']) {
                    continue;
                }

                $code = trim((string) ($bank['code'] ?? ''));
                $name = trim((string) ($bank['name'] ?? ''));

                if ($code === '' || $name === '') {
                    continue;
                }

                $banks[$code] = ['name' => $name, 'code' => $code];
            }

            $meta = is_array($payload['meta'] ?? null) ? $payload['meta'] : [];
            $pageCount = (int) ($meta['pageCount'] ?? 1);

            if ($page >= $pageCount) {
                break;
            }
        }

        // Sorted so the picker has a stable, scannable order.
        usort($banks, static fn (array $a, array $b): int => strcasecmp($a['name'], $b['name']));

        return array_values($banks);
    }

    /**
     * @return array<string, mixed>
     */
    private function validatedPayload(Response $response): array
    {
        if (! $response->successful()) {
            Log::error('Paystack API request failed.', [
                'status' => $response->status(),
                'body' => Str::limit($response->body(), 2000),
            ]);

            throw new RuntimeException('Unable to connect to Paystack right now.');
        }

        /** @var array<string, mixed> $payload */
        $payload = (array) $response->json();

        if (! ((bool) ($payload['status'] ?? false))) {
            $message = trim((string) ($payload['message'] ?? 'Paystack request failed.'));

            throw new RuntimeException($message !== '' ? $message : 'Paystack request failed.');
        }

        return $payload;
    }

    private function secretKey(): string
    {
        $secret = trim((string) config('services.paystack.secret_key', ''));

        if ($secret === '') {
            throw new RuntimeException('Paystack secret key is not configured.');
        }

        return $secret;
    }
}
