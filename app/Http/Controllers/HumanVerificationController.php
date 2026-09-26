<?php

namespace App\Http\Controllers;

use App\Support\HumanVerification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Issues a degraded-mode (fallback) human-verification challenge when the
 * primary Cloudflare Turnstile challenge cannot be delivered to the visitor.
 *
 * The response is deliberately terse: it never discloses whether Turnstile is
 * configured, what the upstream failure was, or how much quota remains.
 *
 * The visitor's browser reaches this endpoint after `loadTurnstileScript()`
 * fails or the widget reports an error. Every precondition is re-checked
 * server-side, so calling this endpoint directly grants nothing by itself.
 */
class HumanVerificationController extends Controller
{
    public function fallback(Request $request): JsonResponse
    {
        $sessionKey = HumanVerification::turnstileSessionKey($request);

        if ($sessionKey === null) {
            return response()->json([
                'available' => false,
                'message' => 'Please reload the page and try again.',
            ], 409);
        }

        $challenge = HumanVerification::issueFallbackChallenge($request, $sessionKey);

        if ($challenge === null) {
            return response()->json([
                'available' => false,
                'message' => 'The backup security check is not available right now. Please refresh the page and try again.',
            ], 503);
        }

        return response()->json([
            'available' => true,
            'question' => $challenge['question'],
            'nonce' => $challenge['nonce'],
            'issuedAt' => $challenge['issuedAt'],
        ]);
    }
}
