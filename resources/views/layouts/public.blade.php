<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        <title>@yield('title', 'Bellah Options')</title>
        <meta name="description" content="@yield('description', 'Bellah Options service portal')">

        @include('partials.public-head-tags')

        @vite(['resources/css/app.css', 'resources/js/app.js'])
    </head>
    <body class="marketing-ui site-body">
        <header class="site-header">
            <div class="container" style="display:flex; align-items:center; justify-content:space-between; gap:1rem; padding-block:0.9rem;">
                <a href="{{ route('home') }}" style="display:inline-flex; align-items:center; gap:0.6rem; text-decoration:none; color:inherit;">
                    <img src="/logo-06.svg" alt="Bellah Options" style="height:38px; width:auto;" />
                </a>
                <a class="btn-outline" href="{{ route('home') }}">Back Home</a>
            </div>
        </header>

        <main>
            @yield('content')
        </main>

        @stack('scripts')
    </body>
</html>
