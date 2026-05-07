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

    $pageDescriptions = [
        '/' => 'Bellah Options is a creative design and technology agency helping businesses scale with brand design, graphic design, web design, and UI/UX services.',
        '/about-bellah-options' => 'Learn about Bellah Options, our creative process, and how we help startups and businesses build clear digital presence.',
        '/services' => 'Explore Bellah Options services for branding, graphic design, social media content, websites, and product interface design.',
        '/gallery' => 'See portfolio projects and published client work from Bellah Options across branding, marketing visuals, and digital experiences.',
        '/blog' => 'Read practical insights from Bellah Options on branding, design systems, content strategy, and business growth.',
        '/events' => 'View Bellah Options events, workshops, and creative sessions for founders, teams, and growing brands.',
        '/reviews' => 'Read verified Bellah Options client reviews, ratings, and Google feedback from completed projects.',
        '/contact-us' => 'Contact Bellah Options to discuss your brand, design, or digital project and get a tailored next step.',
        '/web-design-samples' => 'Browse web design samples and live website experiences delivered by Bellah Options.',
        '/faqs' => 'Find clear answers to frequently asked questions about Bellah Options services, delivery, timelines, and process.',
    ];

    $pageTitles = [
        '/' => 'Bellah Options | Creative Branding, Design, and Digital Solutions',
        '/about-bellah-options' => 'About Bellah Options | Creative Brand and Digital Agency',
        '/services' => 'Services | Bellah Options',
        '/gallery' => 'Gallery | Bellah Options',
        '/blog' => 'Blog | Bellah Options',
        '/events' => 'Events | Bellah Options',
        '/reviews' => 'Reviews | Bellah Options',
        '/contact-us' => 'Contact Bellah Options',
        '/web-design-samples' => 'Web Design Samples | Bellah Options',
        '/faqs' => 'FAQs | Bellah Options',
    ];

    $defaultDescription = 'Bellah Options helps businesses grow with branding, graphic design, social media design, websites, and digital product experiences.';
    $metaDescription = $pageDescriptions[$requestPath] ?? $defaultDescription;
    $metaTitle = $pageTitles[$requestPath] ?? 'Bellah Options | Creative Branding, Design, and Digital Solutions';

    if (str_starts_with($requestPath, '/blog/')) {
        $metaDescription = 'Read this Bellah Options article for practical branding, design, and digital growth insights.';
        $metaTitle = 'Bellah Options Blog Article';
    } elseif (str_starts_with($requestPath, '/order/')) {
        $metaDescription = 'Start your Bellah Options service request and submit your project details for branding, design, or web delivery.';
        $metaTitle = 'Start a Service Request | Bellah Options';
    }
    $brandAssets = \App\Support\PlatformSettings::brandAssets();
    $faviconPath = (string) ($brandAssets['favicon_path'] ?? '/favicon.ico');
    $logoPath = (string) ($brandAssets['logo_path'] ?? '/logo-06.svg');
    $logoUrl = str_starts_with($logoPath, 'http://') || str_starts_with($logoPath, 'https://')
        ? $logoPath
        : $siteUrl.'/'.ltrim($logoPath, '/');
    $ogImageUrl = $siteUrl.'/images/og-image.jpg';
    $contact = \App\Support\PlatformSettings::contactInfo();
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
<meta name="robots" content="index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1">

<!-- Open Graph -->
<meta property="og:title" content="{{ $metaTitle }}">
<meta property="og:description" content="{{ $metaDescription }}">
<meta property="og:url" content="{{ $canonicalUrl }}">
<meta property="og:site_name" content="Bellah Options">
<meta property="og:type" content="website">
<meta property="og:image" content="{{ $ogImageUrl }}">
<meta property="og:locale" content="{{ $metaLocale }}">

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="{{ $metaTitle }}">
<meta name="twitter:description" content="{{ $metaDescription }}">
<meta name="twitter:image" content="{{ $ogImageUrl }}">
<meta name="language" content="{{ $metaLanguage }}">
<meta name="geo.country" content="{{ $metaCountry }}">

<script type="application/ld+json">
{
  "@@context": "https://schema.org",
  "@@type": "Organization",
  "name": "Bellah Options",
  "url": "{{ $siteUrl }}",
  "logo": "{{ $logoUrl }}",
  "email": "{{ (string) ($contact['email'] ?? '') }}",
  "telephone": "{{ (string) ($contact['phone'] ?? '') }}",
  "sameAs": [
    "https://www.facebook.com/BellahOptions/",
    "https://www.instagram.com/bellahgroup/",
    "https://www.behance.net/bellahoptionsNG",
    "https://ng.linkedin.com/company/bellahoptions"
  ]
}
</script>
