<?php

namespace App\Services;

use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
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
        array $metadata = []
    ): array
    {
        $response = Http::timeout(20)
            ->withToken($this->secretKey())
            ->post('https://api.paystack.co/transaction/initialize', [
                'email' => $email,
                'amount' => $amountInMinor,
                'reference' => $reference,
                'currency' => strtoupper(trim($currency)),
                'callback_url' => $callbackUrl,
                'metadata' => $metadata,
            ]);

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
     * @return array<string, mixed>
     */
    private function validatedPayload(Response $response): array
    {
        if (! $response->successful()) {
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
