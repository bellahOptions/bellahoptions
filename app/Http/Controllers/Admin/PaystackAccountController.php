<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ResolveBankAccountRequest;
use App\Services\PaystackService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Paystack-backed helpers for the bank-transfer fallback accounts.
 *
 * The settings screen uses these to turn a bank choice into a Paystack bank
 * code and then to resolve the account name registered to a number, so an
 * operator cannot publish a mistyped account to customers.
 *
 * Both endpoints are super-admin only and throttled: they spend Paystack API
 * calls, and the resolve endpoint takes an arbitrary account number.
 */
class PaystackAccountController extends Controller
{
    public function __construct(private readonly PaystackService $paystack) {}

    /**
     * The bank list used to populate the bank picker.
     *
     * A failure here is reported as `available: false` with HTTP 200 rather than
     * an error status: the settings screen degrades to a free-text bank name, so
     * a Paystack outage must not block editing the fallback accounts.
     */
    public function banks(Request $request): JsonResponse
    {
        abort_unless((bool) $request->user()?->canManageSettings(), 403);

        try {
            $banks = $this->paystack->banks();
        } catch (Throwable $exception) {
            Log::warning('Unable to load the Paystack bank list.', [
                'message' => $exception->getMessage(),
            ]);

            return response()->json([
                'banks' => [],
                'available' => false,
                'message' => $exception->getMessage(),
            ]);
        }

        return response()->json([
            'banks' => $banks,
            'available' => true,
            'message' => '',
        ]);
    }

    /**
     * Resolve the account name registered to an account number.
     */
    public function resolve(ResolveBankAccountRequest $request): JsonResponse
    {
        $payload = $request->validated();

        try {
            $resolved = $this->paystack->resolveAccountNumber(
                (string) $payload['account_number'],
                (string) $payload['bank_code'],
            );
        } catch (Throwable $exception) {
            Log::warning('Paystack account name resolution failed.', [
                'message' => $exception->getMessage(),
            ]);

            // The operator needs to know whether the bank, the number or the API
            // key is wrong, so Paystack's own explanation is passed through. It
            // is a validation-style message and never contains credentials.
            return response()->json([
                'message' => $exception->getMessage(),
            ], 422);
        }

        return response()->json($resolved);
    }
}
