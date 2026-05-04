<?php

namespace App\Services;

use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class FlutterwaveService
{
    /**
     * @param  array<string, mixed>  $metadata
     * @return array{authorization_url: string, reference: string}
     */
    public function initialize(
        string $email,
        float $amount,
        string $reference,
        string $callbackUrl,
        string $currency,
        array $metadata = []
    ): array {
        $response = Http::timeout(20)
            ->withToken($this->secretKey())
            ->post('https://api.flutterwave.com/v3/payments', [
                'tx_ref' => $reference,
                'amount' => round($amount, 2),
                'currency' => strtoupper(trim($currency)),
                'redirect_url' => $callbackUrl,
                'customer' => [
                    'email' => $email,
                ],
                'customizations' => [
                    'title' => 'Bellah Options Service Order',
                    'description' => 'Secure service payment checkout',
                ],
                'meta' => $metadata,
            ]);

        $payload = $this->validatedPayload($response);
        $data = (array) ($payload['data'] ?? []);

        $authorizationUrl = (string) ($data['link'] ?? '');

        if ($authorizationUrl === '') {
            throw new RuntimeException('Flutterwave initialization returned incomplete data.');
        }

        return [
            'authorization_url' => $authorizationUrl,
            'reference' => $reference,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function verify(string $reference): array
    {
        $response = Http::timeout(20)
            ->withToken($this->secretKey())
            ->get('https://api.flutterwave.com/v3/transactions/verify_by_reference', [
                'tx_ref' => $reference,
            ]);

        return $this->validatedPayload($response);
    }

    /**
     * @return array<string, mixed>
     */
    private function validatedPayload(Response $response): array
    {
        if (! $response->successful()) {
            throw new RuntimeException('Unable to connect to Flutterwave right now.');
        }

        /** @var array<string, mixed> $payload */
        $payload = (array) $response->json();

        $status = strtolower(trim((string) ($payload['status'] ?? '')));
        if ($status !== 'success') {
            $message = trim((string) ($payload['message'] ?? 'Flutterwave request failed.'));

            throw new RuntimeException($message !== '' ? $message : 'Flutterwave request failed.');
        }

        return $payload;
    }

    private function secretKey(): string
    {
        $secret = trim((string) config('services.flutterwave.secret_key', ''));

        if ($secret === '') {
            throw new RuntimeException('Flutterwave secret key is not configured.');
        }

        return $secret;
    }
}
