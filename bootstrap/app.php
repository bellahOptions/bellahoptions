<?php

use App\Http\Middleware\EnsureStaffUser;
use App\Http\Middleware\EnsureSuperAdmin;
use App\Http\Middleware\AddSecurityHeaders;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\ResolveVisitorLocalization;
use App\Http\Middleware\RestrictPublicAuthWhenLocked;
use App\Http\Middleware\RestrictPublicRoutesWhenLocked;
use App\Support\CrawlerPolicy;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->validateCsrfTokens(except: [
            'webhooks/paystack',
            'webhooks/flutterwave',
        ]);

        $middleware->web(append: [
            ResolveVisitorLocalization::class,
            HandleInertiaRequests::class,
            AddSecurityHeaders::class,
            AddLinkHeadersForPreloadedAssets::class,
            RestrictPublicRoutesWhenLocked::class,
        ]);

        $middleware->alias([
            'staff' => EnsureStaffUser::class,
            'super-admin' => EnsureSuperAdmin::class,
            'public-auth-open' => RestrictPublicAuthWhenLocked::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->respond(function (Response $response, Throwable $exception, Request $request): Response {
            // Redirects and error pages produced outside the middleware pipeline
            // (authentication redirects, unmatched routes) never reach
            // AddSecurityHeaders, so the noindex signal is applied here too.
            if (CrawlerPolicy::shouldNoIndex($request) && ! $response->headers->has('X-Robots-Tag')) {
                $response->headers->set('X-Robots-Tag', 'noindex, nofollow');
            }

            if ($request->expectsJson()) {
                return $response;
            }

            $status = $response->getStatusCode();

            if (! in_array($status, [400, 401, 403, 404, 419, 429, 500, 503], true)) {
                return $response;
            }

            // Error responses are never useful search results, and an indexed
            // error URL can outlive the problem that produced it. The header has
            // to be set on the final response because the error view is rendered
            // lazily when this response is prepared.
            $rendered = Inertia::render('Error', [
                'status' => $status,
            ])->toResponse($request)->setStatusCode($status);

            $rendered->headers->set('X-Robots-Tag', 'noindex, nofollow');

            return $rendered;
        });
    })->create();
