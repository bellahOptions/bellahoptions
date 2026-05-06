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
        'admin.login',
        'logout',
        'storage.local',
        'sanctum.csrf-cookie',
        'webhooks.paystack',
        'webhooks.flutterwave',
        'orders.payment.callback',
    ];

    /**
     * @var array<int, string>
     */
    private const ALLOWED_ROUTE_PREFIXES = [
        'admin.',
        'staff.',
        'profile.',
        'verification.',
        'password.',
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

        $routeName = $request->route()?->getName();
        if ($routeName !== null && $this->isAllowedRouteName($routeName)) {
            return $next($request);
        }

        // Keep framework health checks reachable during maintenance windows.
        if ($request->is('up')) {
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

    private function isAllowedRouteName(string $routeName): bool
    {
        if (in_array($routeName, self::ALLOWED_ROUTE_NAMES, true)) {
            return true;
        }

        foreach (self::ALLOWED_ROUTE_PREFIXES as $prefix) {
            if (str_starts_with($routeName, $prefix)) {
                return true;
            }
        }

        return $routeName === 'dashboard';
    }
}
