<?php

namespace App\Providers;

use App\Contracts\ImageUploader;
use App\Support\CloudinaryUploader;
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
        // Cloudinary is the only image store.
        //
        // Every upload goes to Cloudinary and every image is served from
        // Cloudinary; nothing is written to this server's disk. That is a
        // deliberate policy, so there is no silent fall back to local storage:
        // a missing or stale CLOUDINARY_URL used to make uploads quietly land on
        // the server instead, which looked like success and only surfaced when a
        // redeploy removed the files.
        //
        // When the credential is absent the Cloudinary driver raises a clear,
        // logged error instead, so a misconfigured deploy is caught immediately.
        // The `media` disk and MediaController remain only to serve assets that
        // were stored locally before this policy existed.
        $this->app->bind(ImageUploader::class, CloudinaryUploader::class);
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

        RateLimiter::for('brief-form', function (Request $request): array {
            $email = Str::lower(trim((string) data_get($request->input('answers'), 'email', 'guest')));
            $serviceSlug = Str::lower(trim((string) $request->route('serviceSlug')));
            $fingerprint = implode('|', [
                (string) $request->ip(),
                $email !== '' ? $email : 'guest',
                $serviceSlug !== '' ? $serviceSlug : 'service',
            ]);

            return [
                Limit::perHour(5)->by($fingerprint),
            ];
        });

        // Degraded-mode human-verification challenge issuing. Kept tight because
        // each grant temporarily relaxes the primary Cloudflare Turnstile check.
        RateLimiter::for('human-verification-fallback', function (Request $request): array {
            $perMinute = max(1, (int) config('services.turnstile.fallback.endpoint_per_minute', 3));
            $perHour = max($perMinute, (int) config('services.turnstile.fallback.issues_per_ip_hourly', 6));

            return [
                Limit::perMinute($perMinute)->by((string) $request->ip()),
                Limit::perHour($perHour)->by((string) $request->ip()),
            ];
        });
    }
}
