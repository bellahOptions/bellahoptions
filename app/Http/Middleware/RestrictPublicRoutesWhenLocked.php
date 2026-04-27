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
        'home',
        'waitlist.create',
        'waitlist.store',
        'terms.show',
        'staff.login',
        'staff.login.store',
        'staff.otp.create',
        'staff.otp.store',
        'staff.otp.resend',
        'admin.login',
        'logout',
        'seo.sitemap',
        'seo.robots',
        'seo.llms',
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

        $maintenanceMode = AppSetting::getBool('maintenance_mode');
        $comingSoonMode = AppSetting::getBool('coming_soon_mode');

        if (! $maintenanceMode && ! $comingSoonMode) {
            return $next($request);
        }

        if ($request->user()?->isStaff()) {
            return $next($request);
        }

        $routeName = $request->route()?->getName();
        if ($routeName !== null && in_array($routeName, self::ALLOWED_ROUTE_NAMES, true)) {
            return $next($request);
        }

        $message = $maintenanceMode
            ? 'The website is in maintenance mode. Public access is temporarily disabled.'
            : 'The website is currently in coming-soon mode. Public access is temporarily limited.';

        if ($request->expectsJson()) {
            return response()->json([
                'message' => $message,
            ], 503);
        }

        return redirect()->route('home')->with('error', $message);
    }
}
