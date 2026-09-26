<?php

namespace App\Support;

use Illuminate\Http\Request;

/**
 * Single source of truth for "may a search engine index this request?".
 *
 * Used by AddSecurityHeaders (normal responses), the exception handler
 * (redirects and error pages produced outside the middleware pipeline) and by
 * the public head-tags partial, so the robots meta tag and the X-Robots-Tag
 * header can never disagree.
 */
class CrawlerPolicy
{
    /**
     * @var array<int, string>
     */
    private const PRIVATE_ROUTE_PREFIXES = [
        'login',
        'register',
        'password.',
        'verification.',
        'staff.',
        'profile.',
        'dashboard',
        'admin.',
        'human-verification.',
    ];

    /**
     * @var array<int, string>
     */
    private const PRIVATE_PATH_PATTERNS = [
        'orders/*',
        'order/*',
        'admin',
        'admin/*',
        'staff',
        'staff/*',
        'dashboard',
        'dashboard/*',
        'profile',
        'profile/*',
        'login',
        'register',
        'forgot-password',
        'reset-password',
        'verify-email',
        'verify-email/*',
        'confirm-password',
        'human-verification',
        'human-verification/*',
    ];

    public static function shouldNoIndex(Request $request): bool
    {
        // Signed-in users only ever see account, checkout or staff screens.
        if ($request->user() !== null) {
            return true;
        }

        $routeName = (string) ($request->route()?->getName() ?? '');

        foreach (self::PRIVATE_ROUTE_PREFIXES as $prefix) {
            if ($routeName === rtrim($prefix, '.') || str_starts_with($routeName, $prefix)) {
                return true;
            }
        }

        return $request->is(...self::PRIVATE_PATH_PATTERNS);
    }
}
