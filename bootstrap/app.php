<?php

use App\Http\Middleware\EnsureStaffUser;
use App\Http\Middleware\EnsureSuperAdmin;
use App\Http\Middleware\AddSecurityHeaders;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\ResolveVisitorLocalization;
use App\Http\Middleware\RestrictPublicAuthWhenLocked;
use App\Http\Middleware\RestrictPublicRoutesWhenLocked;
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
            if ($request->expectsJson()) {
                return $response;
            }

            $status = $response->getStatusCode();

            if (! in_array($status, [400, 401, 403, 404, 419, 429, 500, 503], true)) {
                return $response;
            }

            return Inertia::render('Error', [
                'status' => $status,
            ])->toResponse($request)->setStatusCode($status);
        });
    })->create();
