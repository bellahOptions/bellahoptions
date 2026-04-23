<?php

namespace App\Http\Middleware;

use App\Models\AppSetting;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Symfony\Component\HttpFoundation\Response;

class RestrictPublicAuthWhenLocked
{
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

        $message = $maintenanceMode
            ? 'The portal is temporarily in maintenance mode. Please check back later.'
            : 'The portal is currently in coming-soon mode. New sign-ins and registrations are paused.';

        return redirect()->route('waitlist.create')->with('error', $message);
    }
}
