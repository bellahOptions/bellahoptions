<?php

namespace App\Http\Middleware;

use App\Models\AppSetting;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Symfony\Component\HttpFoundation\Response;

class RestrictPublicRoutesWhenLocked
{
    /**
     * @var array<int, string>
     */
    private const ALLOWED_ROUTE_NAMES = [
        'staff.login',
        'staff.login.store',
        'staff.otp.create',
        'staff.otp.store',
        'staff.otp.resend',
        'admin.login',
        'logout',
        'webhooks.paystack',
        'webhooks.flutterwave',
        'orders.payment.callback',
    ];

    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (! Schema::hasTable('app_settings')) {
            return $next($request);
        }

        if (! AppSetting::getBool('maintenance_mode')) {
            return $next($request);
        }

        if ($request->user()?->isStaff()) {
            return $next($request);
        }

        $routeName = $request->route()?->getName();
        if ($routeName !== null && in_array($routeName, self::ALLOWED_ROUTE_NAMES, true)) {
            return $next($request);
        }

        $message = 'The website is currently in maintenance mode. Public access is temporarily disabled.';

        if ($request->expectsJson()) {
            return response()->json([
                'message' => $message,
            ], 503);
        }

        return redirect()->route('staff.login')->with('error', $message);
    }
}
