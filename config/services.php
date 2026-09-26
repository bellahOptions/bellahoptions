<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'paystack' => [
        'public_key' => env('PAYSTACK_PUBLIC_KEY'),
        'secret_key' => env('PAYSTACK_SECRET_KEY'),
        'webhook_secret' => env('PAYSTACK_WEBHOOK_SECRET') ?: env('PAYSTACK_SECRET_KEY'),
        'split_code' => env('PAYSTACK_SPLIT_CODE'),
    ],

    'flutterwave' => [
        'public_key' => env('FLUTTERWAVE_PUBLIC_KEY'),
        'secret_key' => env('FLUTTERWAVE_SECRET_KEY'),
        'encryption_key' => env('FLUTTERWAVE_ENCRYPTION_KEY'),
        'webhook_hash' => env('FLUTTERWAVE_WEBHOOK_HASH'),
    ],

    'turnstile' => [
        'site_key' => env('TURNSTILE_SITEKEY', env('TURNSTILE_SITE_KEY')),
        'secret_key' => env('TURNSTILE_SECRET_KEY'),

        /*
        |--------------------------------------------------------------------------
        | Degraded-mode (fallback) challenge
        |--------------------------------------------------------------------------
        |
        | Cloudflare Turnstile stays the primary human check on every form. When
        | the widget cannot be delivered (CSP/proxy/CDN outage, blocked script,
        | siteverify outage) the server may issue a single-use, session-bound
        | fallback challenge instead of silently dropping all traffic.
        |
        | The fallback is never weaker than "no verification": it is rate
        | limited per visitor, capped globally, single-use, and completely
        | disableable. Set TURNSTILE_FALLBACK_ENABLED=false to fail closed.
        |
        */

        'fallback' => [
            'enabled' => filter_var(
                env('TURNSTILE_FALLBACK_ENABLED', true),
                FILTER_VALIDATE_BOOL,
                FILTER_NULL_ON_FAILURE,
            ) ?? true,

            // Minutes a server-issued fallback challenge stays valid.
            'ttl_minutes' => (int) env('TURNSTILE_FALLBACK_TTL_MINUTES', 10),

            // Accepted fallback (degraded-mode) submissions per IP per hour.
            'per_ip_hourly' => (int) env('TURNSTILE_FALLBACK_PER_IP_HOURLY', 2),

            // Accepted fallback submissions allowed platform-wide per hour before
            // the fallback trips its circuit breaker and fails closed again.
            'global_hourly' => (int) env('TURNSTILE_FALLBACK_GLOBAL_HOURLY', 150),

            // Fallback challenge mint requests allowed per IP per hour.
            'issues_per_ip_hourly' => (int) env('TURNSTILE_FALLBACK_ISSUES_PER_IP_HOURLY', 6),

            // Seconds a recorded primary-verification attempt unlocks a fallback.
            'attempt_ttl_minutes' => (int) env('TURNSTILE_FALLBACK_ATTEMPT_TTL_MINUTES', 120),

            // Requests to the degraded-mode endpoint allowed per IP per minute.
            'endpoint_per_minute' => (int) env('TURNSTILE_FALLBACK_ENDPOINT_PER_MINUTE', 3),
        ],
    ],

    'google_maps' => [
        'places_api_key' => env('GOOGLE_MAPS_PLACES_API_KEY'),
    ],

    'cloudinary' => [
        'url' => env('CLOUDINARY_URL'),
    ],

];
