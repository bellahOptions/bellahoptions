<?php

namespace App\Support;

use Illuminate\Http\Request;

class VisitorLocalization
{
    /**
     * @return array{country_code: string, country: string, locale: string, language: string, currency: string, payment_processor: string, is_nigeria: bool}
     */
    public function resolve(Request $request): array
    {
        $countryCode = $this->resolveCountryCode($request);

        /** @var array<string, array<string, string>> $profiles */
        $profiles = (array) config('localization.country_profiles', []);

        $profile = $profiles[$countryCode] ?? $profiles[(string) config('localization.default_country', 'NG')] ?? [
            'country' => 'Nigeria',
            'locale' => 'en_NG',
            'language' => 'en',
            'currency' => 'NGN',
            'payment_processor' => 'paystack',
        ];

        $currency = strtoupper((string) ($profile['currency'] ?? 'NGN'));

        return [
            'country_code' => $countryCode,
            'country' => (string) ($profile['country'] ?? 'Nigeria'),
            'locale' => (string) ($profile['locale'] ?? 'en_NG'),
            'language' => (string) ($profile['language'] ?? 'en'),
            'currency' => $currency,
            'payment_processor' => (string) ($profile['payment_processor'] ?? 'paystack'),
            'is_nigeria' => $countryCode === 'NG' && $currency === 'NGN',
        ];
    }

    public function convertFromNgn(float $amountNgn, string $targetCurrency): float
    {
        $currency = strtoupper(trim($targetCurrency));

        /** @var array<string, float|int|string> $rates */
        $rates = (array) config('localization.ngn_per_currency', []);

        $rate = (float) ($rates[$currency] ?? 0);

        if ($rate <= 0) {
            $fallbackRate = (float) ($rates['NGN'] ?? 1);
            $rate = $fallbackRate > 0 ? $fallbackRate : 1.0;
        }

        if ($currency === 'NGN') {
            return round($amountNgn, 2);
        }

        return round($amountNgn / $rate, 2);
    }

    private function resolveCountryCode(Request $request): string
    {
        $candidateHeaders = [
            'CF-IPCountry',
            'CloudFront-Viewer-Country',
            'X-AppEngine-Country',
            'X-Vercel-IP-Country',
            'X-Country-Code',
            'X-Geo-Country',
        ];

        foreach ($candidateHeaders as $header) {
            $value = strtoupper(trim((string) $request->headers->get($header, '')));

            if ($this->isValidCountryCode($value)) {
                return $value;
            }
        }

        return strtoupper((string) config('localization.default_country', 'NG'));
    }

    private function isValidCountryCode(string $value): bool
    {
        return strlen($value) === 2 && ctype_alpha($value);
    }
}
