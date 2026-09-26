@php
    $visitorLocalization = (array) ($visitorLocalization ?? []);
    $metaLocale = str_replace('_', '-', (string) ($visitorLocalization['locale'] ?? app()->getLocale()));
    $metaCountry = strtoupper((string) ($visitorLocalization['country_code'] ?? 'NG'));
    $metaLanguage = strtolower((string) ($visitorLocalization['language'] ?? 'en'));
    $siteUrl = rtrim(\App\Support\PlatformSettings::siteUrl(), '/');
    $requestPath = '/'.ltrim((string) request()->path(), '/');
    if ($requestPath === '/index.php') {
        $requestPath = '/';
    }
    $canonicalUrl = $requestPath === '/' ? $siteUrl : $siteUrl.$requestPath;

    $seoSettings = \App\Support\PlatformSettings::publicSeoSettings();
    $seoGlobal = is_array($seoSettings['global'] ?? null) ? $seoSettings['global'] : [];
    $seoPages = is_array($seoSettings['pages'] ?? null) ? $seoSettings['pages'] : [];

    $matchedPage = null;
    foreach ($seoPages as $page) {
        if (! is_array($page)) {
            continue;
        }

        $pathPattern = trim((string) ($page['path'] ?? ''));
        if ($pathPattern === '') {
            continue;
        }

        if (! str_contains($pathPattern, '*') && $requestPath === $pathPattern) {
            $matchedPage = $page;
            break;
        }
    }

    if (! is_array($matchedPage)) {
        foreach ($seoPages as $page) {
            if (! is_array($page)) {
                continue;
            }

            $pathPattern = trim((string) ($page['path'] ?? ''));
            if ($pathPattern === '' || ! str_ends_with($pathPattern, '*')) {
                continue;
            }

            $prefix = substr($pathPattern, 0, -1);
            if ($prefix !== '' && str_starts_with($requestPath, $prefix)) {
                $matchedPage = $page;
                break;
            }
        }
    }

    $resolveUrl = static function (?string $value) use ($siteUrl): ?string {
        $candidate = trim((string) $value);
        if ($candidate === '') {
            return null;
        }

        if (str_starts_with($candidate, 'http://') || str_starts_with($candidate, 'https://')) {
            return $candidate;
        }

        if (str_starts_with($candidate, '/')) {
            return $siteUrl.$candidate;
        }

        return null;
    };

    $canonicalOverride = is_array($matchedPage)
        ? $resolveUrl($matchedPage['canonical_url'] ?? null)
        : null;
    if (is_string($canonicalOverride) && $canonicalOverride !== '') {
        $canonicalUrl = $canonicalOverride;
    }

    $metaTitle = trim((string) ($matchedPage['meta_title'] ?? $seoGlobal['default_title'] ?? 'Bellah Options'));
    $metaDescription = trim((string) ($matchedPage['meta_description'] ?? $seoGlobal['default_description'] ?? 'Bellah Options service portal'));
    $metaKeywords = trim((string) ($matchedPage['keywords'] ?? $seoGlobal['default_keywords'] ?? ''));
    $metaRobots = trim((string) ($matchedPage['robots'] ?? $seoGlobal['default_robots'] ?? 'index,follow'));
    $ogType = trim((string) ($matchedPage['og_type'] ?? 'website'));
    $twitterCard = trim((string) ($seoGlobal['twitter_card'] ?? 'summary_large_image'));
    $twitterSite = trim((string) ($seoGlobal['twitter_site'] ?? ''));

    // Account, checkout and verification pages must never be indexed even if a
    // shared SEO configuration accidentally enables indexing globally.
    if (\App\Support\CrawlerPolicy::shouldNoIndex(request())) {
        $metaRobots = 'noindex, nofollow';
    }

    $ogImageUrl = $resolveUrl($matchedPage['og_image'] ?? null)
        ?? $resolveUrl($seoGlobal['default_og_image'] ?? null)
        ?? ($siteUrl.'/images/og-image.jpg');
    $twitterImageUrl = $resolveUrl($matchedPage['twitter_image'] ?? null)
        ?? $resolveUrl($seoGlobal['default_twitter_image'] ?? null)
        ?? $ogImageUrl;

    $brandAssets = \App\Support\PlatformSettings::brandAssets();
    $faviconPath = (string) ($brandAssets['favicon_path'] ?? '/favicon.ico');
    $logoPath = (string) ($brandAssets['logo_path'] ?? '/logo-06.svg');
    $logoUrl = str_starts_with($logoPath, 'http://') || str_starts_with($logoPath, 'https://')
        ? $logoPath
        : $siteUrl.'/'.ltrim($logoPath, '/');
    $contact = \App\Support\PlatformSettings::contactInfo();

    /*
     | Structured data (schema.org).
     |
     | Emitted as JSON via json_encode so every dynamic value is escaped safely
     | (a literal "</script>" in a configured value cannot break out of the tag).
     */
    $socialProfiles = array_values(array_filter([
        'https://www.facebook.com/BellahOptions/',
        'https://www.instagram.com/bellahgroup/',
        'https://www.behance.net/bellahoptionsNG',
        'https://ng.linkedin.com/company/bellahoptions',
    ], static fn ($profile): bool => is_string($profile) && $profile !== ''));

    $organizationSchema = array_filter([
        '@type' => 'Organization',
        '@id' => $siteUrl.'/#organization',
        'name' => 'Bellah Options',
        'url' => $siteUrl,
        'logo' => $logoUrl,
        'image' => $ogImageUrl,
        'email' => trim((string) ($contact['email'] ?? '')),
        'telephone' => trim((string) ($contact['phone'] ?? '')),
        'sameAs' => $socialProfiles,
    ], static fn ($value): bool => $value !== '' && $value !== []);

    $websiteSchema = array_filter([
        '@type' => 'WebSite',
        '@id' => $siteUrl.'/#website',
        'url' => $siteUrl,
        'name' => 'Bellah Options',
        'inLanguage' => str_replace('_', '-', (string) ($visitorLocalization['locale'] ?? 'en_NG')),
        'publisher' => ['@id' => $siteUrl.'/#organization'],
    ], static fn ($value): bool => $value !== '' && $value !== []);

    $structuredData = [
        '@context' => 'https://schema.org',
        '@graph' => [$organizationSchema, $websiteSchema],
    ];

    $titlesByPath = [];
    foreach ($seoPages as $seoPage) {
        if (! is_array($seoPage)) {
            continue;
        }

        $seoPath = trim((string) ($seoPage['path'] ?? ''));
        $seoPageTitle = trim((string) ($seoPage['meta_title'] ?? ''));

        if ($seoPath === '' || $seoPageTitle === '') {
            continue;
        }

        // Keep the most specific (longest) pattern for a given path so nested
        // pages get a meaningful breadcrumb label.
        $titlesByPath[$seoPath] = $seoPageTitle;
    }

    if ($requestPath !== '/') {
        $breadcrumbElements = [[
            '@type' => 'ListItem',
            'position' => 1,
            'name' => 'Home',
            'item' => $siteUrl,
        ]];

        // Walk the path so nested pages produce /services followed by
        // /services/example rather than a single flat crumb.
        $segments = array_values(array_filter(explode('/', trim($requestPath, '/')), static fn ($segment): bool => $segment !== ''));
        $accumulated = '';

        foreach ($segments as $index => $segment) {
            $accumulated .= '/'.$segment;
            $labelSource = $titlesByPath[$accumulated]
                ?? $titlesByPath[$accumulated.'/*']
                ?? ($accumulated === $requestPath ? $metaTitle : '');

            if ($labelSource === '') {
                $labelSource = ucwords(str_replace(['-', '_'], ' ', $segment));
            }

            // Strip brand suffixes so crumbs read as page names, not page titles.
            // Separators: pipe, en dash, em dash, hyphen.
            $label = trim((string) preg_split('/\s+[|\x{2013}\x{2014}-]\s+/u', $labelSource, 2)[0]);

            $breadcrumbElements[] = [
                '@type' => 'ListItem',
                'position' => count($breadcrumbElements) + 1,
                'name' => $label !== '' ? $label : ucfirst($segment),
                'item' => $siteUrl.($accumulated === '/' ? '' : $accumulated),
            ];
        }

        $structuredData['@graph'][] = [
            '@type' => 'BreadcrumbList',
            '@id' => $canonicalUrl.'#breadcrumb',
            'itemListElement' => $breadcrumbElements,
        ];
    }
@endphp

<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-VX46CPP2M8"></script>
<script>
    window.dataLayer = window.dataLayer || [];

    function gtag() {
        dataLayer.push(arguments);
    }

    gtag('js', new Date());
    gtag('config', 'G-VX46CPP2M8');
</script>

<!-- Favicons -->
<link rel="apple-touch-icon" href="{{ $faviconPath }}">
<link rel="icon" href="{{ $faviconPath }}">
<link rel="canonical" href="{{ $canonicalUrl }}">
<meta name="description" content="{{ $metaDescription }}">
@if ($metaKeywords !== '')
<meta name="keywords" content="{{ $metaKeywords }}">
@endif
<meta name="robots" content="{{ $metaRobots }}">

<!-- Open Graph -->
<meta property="og:title" content="{{ $metaTitle }}">
<meta property="og:description" content="{{ $metaDescription }}">
<meta property="og:url" content="{{ $canonicalUrl }}">
<meta property="og:site_name" content="Bellah Options">
<meta property="og:type" content="{{ $ogType }}">
<meta property="og:image" content="{{ $ogImageUrl }}">
<meta property="og:locale" content="{{ $metaLocale }}">

<!-- Twitter Card -->
<meta name="twitter:card" content="{{ $twitterCard }}">
<meta name="twitter:title" content="{{ $metaTitle }}">
<meta name="twitter:description" content="{{ $metaDescription }}">
<meta name="twitter:image" content="{{ $twitterImageUrl }}">
@if ($twitterSite !== '')
<meta name="twitter:site" content="{{ $twitterSite }}">
@endif
<meta name="language" content="{{ $metaLanguage }}">
<meta name="geo.country" content="{{ $metaCountry }}">

<script type="application/ld+json">
{!! json_encode($structuredData, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) !!}
</script>
