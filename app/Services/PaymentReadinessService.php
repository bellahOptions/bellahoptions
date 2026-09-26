<?php

namespace App\Services;

use App\Support\PlatformSettings;
use Illuminate\Support\Facades\Cache;

/**
 * Readiness of the online payment gateway for a visitor, plus the bank-transfer
 * fallback that should be offered when that gateway is unavailable.
 *
 * Shared by the order form and the service landing pages so a landing page can
 * never claim online payment is ready when the order form disagrees.
 *
 * The transfer side is a *list* of accounts (a business may hold several), so
 * every consumer renders the whole list rather than a single account. The shape
 * returned by transferPayload() is the one shape used everywhere: the order
 * form, the service landing pages, the payment screen, the invoice email and the
 * invoice PDF all read the same keys.
 */
class PaymentReadinessService
{
    public function __construct(private readonly PaystackService $paystackService) {}

    /**
     * @param  array<string, mixed>  $localization
     * @return array{
     *   preferred_provider:string,
     *   paystack:array{available:bool,message:string},
     *   bank_transfer:array{
     *     available:bool,
     *     accounts:array<int, array{bank_name:string,account_name:string,account_number:string}>,
     *     instructions:string,
     *     support_email:string,
     *     reference_hint:string
     *   }
     * }
     */
    public function forVisitor(array $localization): array
    {
        $preferredProvider = strtolower(trim((string) ($localization['payment_processor'] ?? 'paystack')));

        // The checkout link the visitor is about to follow uses the localized
        // preferred processor, so the fallback has to appear when *that* gateway
        // is unavailable - not only when Paystack is.
        $onlinePayment = $preferredProvider === 'flutterwave'
            ? $this->flutterwaveReadiness()
            : $this->paystackReadiness();

        return [
            'preferred_provider' => $preferredProvider,
            'paystack' => $onlinePayment,
            'bank_transfer' => $this->bankTransferPayload(hideDetails: $onlinePayment['available']),
        ];
    }

    /**
     * Why online payment cannot start for this provider, or null when it can.
     */
    public function gatewayIssue(string $provider): ?string
    {
        $provider = strtolower(trim($provider));
        $appUrl = strtolower(trim((string) config('app.url', '')));

        if (app()->isProduction() && ! str_starts_with($appUrl, 'https://')) {
            return 'Secure HTTPS must be enabled before online payments can start.';
        }

        if ($provider === 'flutterwave') {
            $publicKey = trim((string) config('services.flutterwave.public_key', ''));
            $secretKey = trim((string) config('services.flutterwave.secret_key', ''));

            if ($publicKey === '' || $secretKey === '') {
                return 'Flutterwave is not configured yet. Please contact support.';
            }

            return null;
        }

        $publicKey = trim((string) config('services.paystack.public_key', ''));
        $secretKey = trim((string) config('services.paystack.secret_key', ''));

        if ($publicKey === '' || $secretKey === '') {
            return 'Paystack is not configured yet. Please contact support.';
        }

        return null;
    }

    /**
     * Bank-transfer details to show a customer.
     *
     * `available` is false when the fallback is switched off or no account is
     * completely configured, in which case `accounts` is empty too — a caller can
     * simply render the list and show nothing when it is empty.
     *
     * @return array{
     *   available:bool,
     *   accounts:array<int, array{bank_name:string,account_name:string,account_number:string}>,
     *   instructions:string,
     *   support_email:string,
     *   reference_hint:string
     * }
     */
    public function transferPayload(): array
    {
        return $this->bankTransferPayload();
    }

    /**
     * Builds the transfer payload, withholding the details entirely — rather
     * than merely flagging them unavailable — when the online gateway works or
     * the fallback is switched off.
     *
     * The previous single-account implementation returned null in both of those
     * cases, so no bank details reached the browser. Keeping the shape but
     * emptying it preserves that: a super admin who turns the transfer option
     * off expects the accounts to stop being served, not just to be ignored by
     * the UI.
     *
     * @return array{
     *   available:bool,
     *   accounts:array<int, array{bank_name:string,account_name:string,account_number:string}>,
     *   instructions:string,
     *   support_email:string,
     *   reference_hint:string
     * }
     */
    private function bankTransferPayload(bool $hideDetails = false): array
    {
        $fallback = PlatformSettings::usablePaymentFallback();

        if ($hideDetails || ! $fallback['enabled']) {
            return [
                'available' => false,
                'accounts' => [],
                'instructions' => '',
                'support_email' => '',
                'reference_hint' => '',
            ];
        }

        return [
            'available' => true,
            'accounts' => $fallback['accounts'],
            'instructions' => $fallback['instructions'],
            'support_email' => $fallback['support_email'],
            'reference_hint' => $fallback['reference_hint'],
        ];
    }

    /**
     * @return array{available:bool,message:string}
     */
    private function flutterwaveReadiness(): array
    {
        $issue = $this->gatewayIssue('flutterwave');

        return [
            'available' => $issue === null,
            'message' => $issue ?? '',
        ];
    }

    /**
     * @return array{available:bool,message:string}
     */
    private function paystackReadiness(): array
    {
        $issue = $this->gatewayIssue('paystack');

        if ($issue !== null) {
            return ['available' => false, 'message' => $issue];
        }

        // Outside production the health probe is skipped: a local or testing
        // environment has no reason to reach out to Paystack.
        if (app()->environment('testing') || ! app()->isProduction()) {
            return ['available' => true, 'message' => ''];
        }

        return Cache::remember('paystack:health-check:v1', now()->addMinutes(5), function (): array {
            return $this->paystackService->healthCheck();
        });
    }
}
