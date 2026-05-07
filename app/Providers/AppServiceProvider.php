<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);
        Schema::defaultStringLength(191);

        RateLimiter::for('waitlist', function (Request $request): array {
            return [
                Limit::perMinute(4)->by($request->ip()),
                Limit::perHour(20)->by($request->ip()),
            ];
        });

        RateLimiter::for('contact-form', function (Request $request): array {
            $email = Str::lower(trim((string) $request->input('email', 'guest')));

            return [
                Limit::perMinute(3)->by($request->ip()),
                Limit::perHour(12)->by($request->ip()),
                Limit::perDay(6)->by($request->ip().'|'.$email),
            ];
        });

        RateLimiter::for('order-form', function (Request $request): array {
            $email = Str::lower(trim((string) $request->input('email', 'guest')));
            $serviceSlug = Str::lower(trim((string) $request->route('serviceSlug')));
            $fingerprint = implode('|', [
                (string) $request->ip(),
                $email !== '' ? $email : 'guest',
                $serviceSlug !== '' ? $serviceSlug : 'service',
            ]);

            return [
                Limit::perMinute(2)->by((string) $request->ip()),
                Limit::perHour(8)->by((string) $request->ip()),
                Limit::perDay(10)->by($fingerprint),
            ];
        });

        RateLimiter::for('live-chat-read', function (Request $request): array {
            $token = Str::lower(trim((string) $request->header('X-Live-Chat-Token', $request->query('token', ''))));
            $fingerprint = implode('|', [
                (string) $request->ip(),
                $token !== '' ? $token : 'no-token',
            ]);

            return [
                Limit::perMinute(90)->by($fingerprint),
                Limit::perHour(900)->by($fingerprint),
            ];
        });

        RateLimiter::for('live-chat-signal', function (Request $request): array {
            $token = Str::lower(trim((string) $request->header('X-Live-Chat-Token', $request->query('token', ''))));
            $fingerprint = implode('|', [
                (string) $request->ip(),
                $token !== '' ? $token : 'no-token',
            ]);

            return [
                Limit::perMinute(120)->by($fingerprint),
                Limit::perHour(1200)->by($fingerprint),
            ];
        });
    }
}
