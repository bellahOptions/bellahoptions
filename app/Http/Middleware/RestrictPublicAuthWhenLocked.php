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

        if (! AppSetting::getBool('maintenance_mode')) {
            return $next($request);
        }

        // Staff authenticate through this same "login" page (it detects staff
        // accounts and routes them into the OTP flow), so it must stay reachable
        // during maintenance even though registration/password-reset do not.
        if ($request->is('login')) {
            return $next($request);
        }

        $message = 'The portal is temporarily in maintenance mode. Please check back later.';

        return redirect()->route('maintenance')->with('error', $message);
    }
}
