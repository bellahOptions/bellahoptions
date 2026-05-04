<?php

namespace App\Http\Middleware;

use App\Support\VisitorLocalization;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ResolveVisitorLocalization
{
    public function __construct(private readonly VisitorLocalization $visitorLocalization)
    {
    }

    public function handle(Request $request, Closure $next): Response
    {
        $context = $this->visitorLocalization->resolve($request);

        $request->attributes->set('visitor_localization', $context);

        $locale = str_replace('-', '_', (string) ($context['locale'] ?? 'en_NG'));
        app()->setLocale($locale);

        view()->share('visitorLocalization', $context);

        /** @var Response $response */
        $response = $next($request);

        $response->headers->set('Content-Language', str_replace('_', '-', $locale));

        return $response;
    }
}
