@php
    $visitorLocalization = (array) ($visitorLocalization ?? []);
    $metaLocale = str_replace('_', '-', (string) ($visitorLocalization['locale'] ?? app()->getLocale()));
    $metaCountry = strtoupper((string) ($visitorLocalization['country_code'] ?? 'NG'));
    $metaLanguage = strtolower((string) ($visitorLocalization['language'] ?? 'en'));

    $localizedDescriptions = [
        'fr' => 'Bellah Options est une agence creative-tech qui accompagne les entreprises avec l\'identite de marque, le design graphique, le design web et les experiences produit.',
        'es' => 'Bellah Options es una agencia creative-tech que ayuda a empresas con identidad de marca, diseno grafico, diseno web y experiencias de producto.',
        'de' => 'Bellah Options ist eine Creative-Tech-Agentur fur Markenaufbau, Grafikdesign, Webdesign und digitale Produkterlebnisse.',
        'it' => 'Bellah Options e una agenzia creative-tech che supporta brand identity, graphic design, web design ed esperienze prodotto.',
    ];

    $defaultDescription = 'Bellah Options is a creative tech startup helping businesses with branding, graphic design, social media management, and custom websites to scale digital presence.';
    $metaDescription = $localizedDescriptions[$metaLanguage] ?? $defaultDescription;
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
<link rel="apple-touch-icon" sizes="180x180" href="https://bellahoptions.com/images/icon/apple-touch-icon.png">
<link rel="icon" type="image/png" sizes="32x32" href="https://bellahoptions.com/images/icon/favicon-32x32.png">
<link rel="icon" type="image/png" sizes="16x16" href="https://bellahoptions.com/images/icon/favicon-16x16.png">
<link rel="manifest" href="https://bellahoptions.com/images/icon/site.webmanifest">

<!-- Open Graph -->
<meta property="og:title" content="Bellah Options | Creative Branding & Tech Solutions for Startups">
<meta property="og:description" content="{{ $metaDescription }}">
<meta property="og:url" content="https://bellahoptions.com/">
<meta property="og:site_name" content="Bellah Options">
<meta property="og:type" content="website">
<meta property="og:image" content="https://bellahoptions.com/images/og-image.jpg">
<meta property="og:locale" content="{{ $metaLocale }}">

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="Bellah Options | Creative Branding & Tech Solutions for Startups">
<meta name="twitter:description" content="{{ $metaDescription }}">
<meta name="twitter:image" content="https://bellahoptions.com/images/og-image.jpg">
<meta name="language" content="{{ $metaLanguage }}">
<meta name="geo.country" content="{{ $metaCountry }}">
