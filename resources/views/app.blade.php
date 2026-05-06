<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <title inertia>{{ config('app.name', 'Laravel') }}</title>

        @php
            $routeMiddleware = collect(request()->route()?->gatherMiddleware() ?? []);
            $isAuthenticatedRoute = $routeMiddleware->contains(fn ($middleware) => $middleware === 'auth' || str_starts_with($middleware, 'auth:'));
            $isAdminRoute = request()->is('admin', 'admin/*', 'staff', 'staff/*');
            $brandAssets = \App\Support\PlatformSettings::brandAssets();
            $faviconPath = (string) ($brandAssets['favicon_path'] ?? '/favicon.ico');
        @endphp

        <link rel="icon" href="{{ $faviconPath }}">
        <link rel="apple-touch-icon" href="{{ $faviconPath }}">

        @unless ($isAuthenticatedRoute || $isAdminRoute)
            @include('partials.public-head-tags')
        @endunless

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />

        <!-- Scripts -->
        @routes
        @viteReactRefresh
        @vite(['resources/js/app.jsx', "resources/js/Pages/{$page['component']}.jsx"])
        @inertiaHead
    </head>
    <body class="font-sans antialiased">
        @inertia
    </body>
</html>
