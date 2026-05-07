<?php

namespace App\Support;

use App\Models\AppSetting;
use Illuminate\Support\Str;

class PlatformSettings
{
    private const CONTACT_INFO_KEY = 'default_contact_info_json';

    private const HOME_SLIDES_KEY = 'home_slides_json';

    private const SERVICE_PRICE_OVERRIDES_KEY = 'service_price_overrides_json';

    private const SERVICE_PACKAGE_OVERRIDES_KEY = 'service_package_overrides_json';

    private const GRAPHIC_DESIGN_ITEMS_KEY = 'graphic_design_items_json';

    private const SOCIAL_GRAPHIC_TRIAL_FEE_KEY = 'social_graphic_trial_fee_ngn';

    private const GOOGLE_REVIEWS_CONFIG_KEY = 'google_reviews_config_json';

    private const BRAND_ASSETS_KEY = 'brand_assets_json';

    private const PUBLIC_PAGE_HEADERS_KEY = 'public_page_headers_json';

    private const MAIN_WEBSITE_URI_KEY = 'main_website_uri';

    /**
     * @return array{phone: string, email: string, location: string, whatsapp_url: string, behance_url: string, map_embed_url: string}
     */
    public static function contactInfo(): array
    {
        $defaults = self::defaultContactInfo();
        $raw = AppSetting::getValue(self::CONTACT_INFO_KEY);

        if (! is_string($raw) || trim($raw) === '') {
            return $defaults;
        }

        $decoded = json_decode($raw, true);
        if (! is_array($decoded)) {
            return $defaults;
        }

        return [
            'phone' => self::stringOrDefault($decoded['phone'] ?? null, $defaults['phone']),
            'email' => self::stringOrDefault($decoded['email'] ?? null, $defaults['email']),
            'location' => self::stringOrDefault($decoded['location'] ?? null, $defaults['location']),
            'whatsapp_url' => self::stringOrDefault($decoded['whatsapp_url'] ?? null, $defaults['whatsapp_url']),
            'behance_url' => self::stringOrDefault($decoded['behance_url'] ?? null, $defaults['behance_url']),
            'map_embed_url' => self::stringOrDefault($decoded['map_embed_url'] ?? null, $defaults['map_embed_url']),
        ];
    }

    /**
     * @param  array<string, mixed>  $contactInfo
     */
    public static function setContactInfo(array $contactInfo): void
    {
        $defaults = self::defaultContactInfo();

        $payload = [
            'phone' => self::stringOrDefault($contactInfo['phone'] ?? null, $defaults['phone']),
            'email' => self::stringOrDefault($contactInfo['email'] ?? null, $defaults['email']),
            'location' => self::stringOrDefault($contactInfo['location'] ?? null, $defaults['location']),
            'whatsapp_url' => self::stringOrDefault($contactInfo['whatsapp_url'] ?? null, $defaults['whatsapp_url']),
            'behance_url' => self::stringOrDefault($contactInfo['behance_url'] ?? null, $defaults['behance_url']),
            'map_embed_url' => self::stringOrDefault($contactInfo['map_embed_url'] ?? null, $defaults['map_embed_url']),
        ];

        AppSetting::setValue(self::CONTACT_INFO_KEY, json_encode($payload, JSON_UNESCAPED_SLASHES));
    }

    /**
     * @return array<int, array{title: string, subtitle: string, image: string, cta_label: string, cta_url: string}>
     */
    public static function homeSlides(): array
    {
        $defaults = self::defaultHomeSlides();
        $raw = AppSetting::getValue(self::HOME_SLIDES_KEY);

        if (! is_string($raw) || trim($raw) === '') {
            return $defaults;
        }

        $decoded = json_decode($raw, true);
        if (! is_array($decoded)) {
            return $defaults;
        }

        $slides = [];

        foreach ($decoded as $candidate) {
            if (! is_array($candidate)) {
                continue;
            }

            $sanitized = self::sanitizeSlide($candidate);

            if ($sanitized === null) {
                continue;
            }

            $slides[] = $sanitized;
        }

        return $slides === [] ? $defaults : array_slice($slides, 0, 10);
    }

    /**
     * @param  array<int, array<string, mixed>>  $slides
     */
    public static function setHomeSlides(array $slides): void
    {
        $payload = [];

        foreach ($slides as $candidate) {
            if (! is_array($candidate)) {
                continue;
            }

            $sanitized = self::sanitizeSlide($candidate);
            if ($sanitized === null) {
                continue;
            }

            $payload[] = $sanitized;
        }

        if ($payload === []) {
            $payload = self::defaultHomeSlides();
        }

        AppSetting::setValue(self::HOME_SLIDES_KEY, json_encode(array_slice($payload, 0, 10), JSON_UNESCAPED_SLASHES));
    }

    /**
     * @return array{logo_path: string, favicon_path: string}
     */
    public static function brandAssets(): array
    {
        $defaults = self::defaultBrandAssets();
        $raw = AppSetting::getValue(self::BRAND_ASSETS_KEY);

        if (! is_string($raw) || trim($raw) === '') {
            return $defaults;
        }

        $decoded = json_decode($raw, true);

        if (! is_array($decoded)) {
            return $defaults;
        }

        return [
            'logo_path' => self::sanitizeAssetPath($decoded['logo_path'] ?? null) ?? $defaults['logo_path'],
            'favicon_path' => self::sanitizeAssetPath($decoded['favicon_path'] ?? null) ?? $defaults['favicon_path'],
        ];
    }

    /**
     * @param  array<string, mixed>  $assets
     */
    public static function setBrandAssets(array $assets): void
    {
        $defaults = self::defaultBrandAssets();

        $payload = [
            'logo_path' => self::sanitizeAssetPath($assets['logo_path'] ?? null) ?? $defaults['logo_path'],
            'favicon_path' => self::sanitizeAssetPath($assets['favicon_path'] ?? null) ?? $defaults['favicon_path'],
        ];

        AppSetting::setValue(self::BRAND_ASSETS_KEY, json_encode($payload, JSON_UNESCAPED_SLASHES));
    }

    /**
     * @return array<string, array{title: string, text: string, background_image: string|null}>
     */
    public static function publicPageHeaders(): array
    {
        $defaults = self::defaultPublicPageHeaders();
        $raw = AppSetting::getValue(self::PUBLIC_PAGE_HEADERS_KEY);

        if (! is_string($raw) || trim($raw) === '') {
            return $defaults;
        }

        $decoded = json_decode($raw, true);

        if (! is_array($decoded)) {
            return $defaults;
        }

        $normalized = [];

        foreach ($defaults as $pageKey => $defaultConfig) {
            $candidate = is_array($decoded[$pageKey] ?? null) ? $decoded[$pageKey] : [];

            $title = trim((string) ($candidate['title'] ?? ''));
            $text = trim((string) ($candidate['text'] ?? ''));

            $normalized[$pageKey] = [
                'title' => $title !== '' ? mb_substr($title, 0, 180) : $defaultConfig['title'],
                'text' => $text !== '' ? mb_substr($text, 0, 500) : $defaultConfig['text'],
                'background_image' => self::sanitizeAssetPath($candidate['background_image'] ?? null),
            ];
        }

        return $normalized;
    }

    /**
     * @param  array<string, mixed>  $headers
     */
    public static function setPublicPageHeaders(array $headers): void
    {
        $defaults = self::defaultPublicPageHeaders();
        $payload = [];

        foreach ($defaults as $pageKey => $defaultConfig) {
            $candidate = is_array($headers[$pageKey] ?? null) ? $headers[$pageKey] : [];
            $title = trim((string) ($candidate['title'] ?? ''));
            $text = trim((string) ($candidate['text'] ?? ''));

            $payload[$pageKey] = [
                'title' => $title !== '' ? mb_substr($title, 0, 180) : $defaultConfig['title'],
                'text' => $text !== '' ? mb_substr($text, 0, 500) : $defaultConfig['text'],
                'background_image' => self::sanitizeAssetPath($candidate['background_image'] ?? null),
            ];
        }

        AppSetting::setValue(self::PUBLIC_PAGE_HEADERS_KEY, json_encode($payload, JSON_UNESCAPED_SLASHES));
    }

    /**
     * @return array<string, array<string, float>>
     */
    public static function servicePriceOverrides(): array
    {
        $raw = AppSetting::getValue(self::SERVICE_PRICE_OVERRIDES_KEY);

        if (! is_string($raw) || trim($raw) === '') {
            return [];
        }

        $decoded = json_decode($raw, true);

        if (! is_array($decoded)) {
            return [];
        }

        $normalized = [];

        foreach ($decoded as $serviceSlug => $packagePrices) {
            if (! is_string($serviceSlug) || ! is_array($packagePrices)) {
                continue;
            }

            foreach ($packagePrices as $packageCode => $price) {
                if (! is_string($packageCode) || ! is_numeric($price)) {
                    continue;
                }

                $priceValue = round((float) $price, 2);

                if ($priceValue <= 0) {
                    continue;
                }

                $normalized[$serviceSlug][$packageCode] = $priceValue;
            }
        }

        return $normalized;
    }

    /**
     * @param  array<string, mixed>  $servicePrices
     */
    public static function setServicePriceOverrides(array $servicePrices): void
    {
        $normalized = [];

        foreach ($servicePrices as $serviceSlug => $packagePrices) {
            if (! is_string($serviceSlug) || ! is_array($packagePrices)) {
                continue;
            }

            foreach ($packagePrices as $packageCode => $price) {
                if (! is_string($packageCode) || ! is_numeric($price)) {
                    continue;
                }

                $priceValue = round((float) $price, 2);

                if ($priceValue <= 0) {
                    continue;
                }

                $normalized[$serviceSlug][$packageCode] = $priceValue;
            }
        }

        AppSetting::setValue(self::SERVICE_PRICE_OVERRIDES_KEY, json_encode($normalized, JSON_UNESCAPED_SLASHES));
    }

    /**
     * @return array<string, array<string, array{price: float|null, discount_price: float|null, is_recommended: bool, features: array<int, string>, description: string|null}>>
     */
    public static function servicePackageOverrides(): array
    {
        $raw = AppSetting::getValue(self::SERVICE_PACKAGE_OVERRIDES_KEY);

        if (! is_string($raw) || trim($raw) === '') {
            return [];
        }

        $decoded = json_decode($raw, true);

        if (! is_array($decoded)) {
            return [];
        }

        $serviceConfig = (array) config('service_orders.services', []);
        $normalized = [];

        foreach ($decoded as $serviceSlug => $packages) {
            if (! is_string($serviceSlug) || ! is_array($packages) || ! isset($serviceConfig[$serviceSlug])) {
                continue;
            }

            $knownPackages = (array) data_get($serviceConfig, $serviceSlug.'.packages', []);

            foreach ($packages as $packageCode => $value) {
                if (! is_string($packageCode) || ! is_array($value) || ! isset($knownPackages[$packageCode])) {
                    continue;
                }

                $price = is_numeric($value['price'] ?? null) ? round((float) $value['price'], 2) : null;
                if ($price !== null && $price <= 0) {
                    $price = null;
                }

                $discountPrice = is_numeric($value['discount_price'] ?? null) ? round((float) $value['discount_price'], 2) : null;
                if ($discountPrice !== null && $discountPrice <= 0) {
                    $discountPrice = null;
                }

                if ($discountPrice !== null && $price !== null && $discountPrice >= $price) {
                    $discountPrice = null;
                }

                $features = self::sanitizeFeatureList($value['features'] ?? []);
                $description = trim((string) ($value['description'] ?? ''));

                $normalized[$serviceSlug][$packageCode] = [
                    'price' => $price,
                    'discount_price' => $discountPrice,
                    'is_recommended' => (bool) ($value['is_recommended'] ?? false),
                    'features' => $features,
                    'description' => $description !== '' ? mb_substr($description, 0, 500) : null,
                ];
            }
        }

        return $normalized;
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    public static function setServicePackageOverrides(array $overrides): void
    {
        $normalized = self::servicePackageOverridesFromInput($overrides);

        AppSetting::setValue(self::SERVICE_PACKAGE_OVERRIDES_KEY, json_encode($normalized, JSON_UNESCAPED_SLASHES));
    }

    /**
     * @return array<int, array{id: string, title: string, description: string, image_path: string|null, unit_price: float}>
     */
    public static function graphicDesignItems(): array
    {
        $raw = AppSetting::getValue(self::GRAPHIC_DESIGN_ITEMS_KEY);

        if (! is_string($raw) || trim($raw) === '') {
            return [];
        }

        $decoded = json_decode($raw, true);

        if (! is_array($decoded)) {
            return [];
        }

        $items = [];

        foreach ($decoded as $item) {
            if (! is_array($item)) {
                continue;
            }

            $title = trim((string) ($item['title'] ?? ''));
            $description = trim((string) ($item['description'] ?? ''));
            $price = is_numeric($item['unit_price'] ?? null) ? round((float) $item['unit_price'], 2) : 0;

            if ($title === '' || $price <= 0) {
                continue;
            }

            $id = trim((string) ($item['id'] ?? ''));
            if ($id === '') {
                $id = Str::uuid()->toString();
            }

            $items[] = [
                'id' => mb_substr($id, 0, 80),
                'title' => mb_substr($title, 0, 160),
                'description' => mb_substr($description, 0, 800),
                'image_path' => self::sanitizeAssetPath($item['image_path'] ?? null),
                'unit_price' => $price,
            ];
        }

        return array_values($items);
    }

    /**
     * @param  array<int, array<string, mixed>>  $items
     */
    public static function setGraphicDesignItems(array $items): void
    {
        $payload = [];

        foreach ($items as $item) {
            if (! is_array($item)) {
                continue;
            }

            $title = trim((string) ($item['title'] ?? ''));
            $description = trim((string) ($item['description'] ?? ''));
            $price = is_numeric($item['unit_price'] ?? null) ? round((float) $item['unit_price'], 2) : 0;

            if ($title === '' || $price <= 0) {
                continue;
            }

            $id = trim((string) ($item['id'] ?? ''));
            if ($id === '') {
                $id = Str::uuid()->toString();
            }

            $payload[] = [
                'id' => mb_substr($id, 0, 80),
                'title' => mb_substr($title, 0, 160),
                'description' => mb_substr($description, 0, 800),
                'image_path' => self::sanitizeAssetPath($item['image_path'] ?? null),
                'unit_price' => $price,
            ];
        }

        AppSetting::setValue(self::GRAPHIC_DESIGN_ITEMS_KEY, json_encode(array_values($payload), JSON_UNESCAPED_SLASHES));
    }

    public static function socialGraphicTrialFeeNgn(): float
    {
        $raw = AppSetting::getValue(self::SOCIAL_GRAPHIC_TRIAL_FEE_KEY);

        if (! is_string($raw) || trim($raw) === '' || ! is_numeric($raw)) {
            return 0.0;
        }

        $fee = round((float) $raw, 2);

        return $fee > 0 ? $fee : 0.0;
    }

    public static function setSocialGraphicTrialFeeNgn(float $feeNgn): void
    {
        $normalized = round($feeNgn, 2);

        AppSetting::setValue(
            self::SOCIAL_GRAPHIC_TRIAL_FEE_KEY,
            $normalized > 0 ? (string) $normalized : '0',
        );
    }

    /**
     * @return array{place_id: string, featured_review_ids: array<int, string>}
     */
    public static function googleReviewsConfig(): array
    {
        $defaults = self::defaultGoogleReviewsConfig();
        $raw = AppSetting::getValue(self::GOOGLE_REVIEWS_CONFIG_KEY);

        if (! is_string($raw) || trim($raw) === '') {
            return $defaults;
        }

        $decoded = json_decode($raw, true);
        if (! is_array($decoded)) {
            return $defaults;
        }

        $placeId = trim((string) ($decoded['place_id'] ?? ($decoded['widget_id'] ?? '')));
        $featuredIds = is_array($decoded['featured_review_ids'] ?? null)
            ? $decoded['featured_review_ids']
            : [];

        $sanitizedFeaturedIds = [];
        foreach ($featuredIds as $value) {
            $id = trim((string) $value);
            if ($id === '') {
                continue;
            }

            $sanitizedFeaturedIds[] = mb_substr($id, 0, 220);
        }

        return [
            'place_id' => mb_substr($placeId, 0, 512),
            'featured_review_ids' => array_values(array_unique(array_slice($sanitizedFeaturedIds, 0, 20))),
        ];
    }

    /**
     * @param  array<string, mixed>  $config
     */
    public static function setGoogleReviewsConfig(array $config): void
    {
        $defaults = self::defaultGoogleReviewsConfig();

        $placeId = trim((string) ($config['place_id'] ?? ($config['widget_id'] ?? '')));
        $featuredIds = is_array($config['featured_review_ids'] ?? null)
            ? $config['featured_review_ids']
            : [];

        $sanitizedFeaturedIds = [];
        foreach ($featuredIds as $value) {
            $id = trim((string) $value);
            if ($id === '') {
                continue;
            }

            $sanitizedFeaturedIds[] = mb_substr($id, 0, 220);
        }

        $payload = [
            'place_id' => mb_substr($placeId, 0, 512),
            'featured_review_ids' => array_values(array_unique(array_slice($sanitizedFeaturedIds, 0, 20))),
        ];

        AppSetting::setValue(self::GOOGLE_REVIEWS_CONFIG_KEY, json_encode($payload, JSON_UNESCAPED_SLASHES));
    }

    public static function siteUrl(): string
    {
        $default = self::defaultSiteUrl();
        $raw = AppSetting::getValue(self::MAIN_WEBSITE_URI_KEY);

        if (! is_string($raw) || trim($raw) === '') {
            return $default;
        }

        return self::normalizeHttpUrl($raw, $default);
    }

    public static function setSiteUrl(string $siteUrl): void
    {
        AppSetting::setValue(self::MAIN_WEBSITE_URI_KEY, self::normalizeHttpUrl($siteUrl, self::defaultSiteUrl()));
    }

    /**
     * @return array{phone: string, email: string, location: string, whatsapp_url: string, behance_url: string, map_embed_url: string}
     */
    private static function defaultContactInfo(): array
    {
        return [
            'phone' => '+234 810 867 1804',
            'email' => 'hello@bellahoptions.com',
            'location' => 'Otta, Ogun State, Nigeria',
            'whatsapp_url' => 'https://wa.link/gy2bys',
            'behance_url' => 'https://www.behance.net/bellahoptionsNG',
            'map_embed_url' => 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d126810.84581005335!2d3.040254481676433!3d6.666872574467273!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x103b8d112a733495%3A0xdb046cdd13b275d9!2sBellah%20Options!5e0!3m2!1sen!2sng!4v1760510153493!5m2!1sen!2sng',
        ];
    }

    /**
     * @return array{logo_path: string, favicon_path: string}
     */
    private static function defaultBrandAssets(): array
    {
        return [
            'logo_path' => '/logo-06.svg',
            'favicon_path' => '/images/icon/favicon-32x32.png',
        ];
    }

    /**
     * @return array<string, array{title: string, text: string, background_image: string|null}>
     */
    private static function defaultPublicPageHeaders(): array
    {
        return [
            'about' => [
                'title' => 'We are a creative tech agency built for ambitious brands.',
                'text' => 'Bellah Options helps businesses grow faster through brand identity, graphic design, social media content, websites, and product experiences that look polished and work clearly.',
                'background_image' => null,
            ],
            'services' => [
                'title' => 'Creative services built for launch, growth, and consistency.',
                'text' => 'Choose the service lane that matches your next move. Every package is structured to make the brief clearer and the output easier to use.',
                'background_image' => null,
            ],
            'gallery' => [
                'title' => 'A look at visual systems, campaigns, and brand assets.',
                'text' => 'Every project shown here is published directly by the Bellah Options team.',
                'background_image' => null,
            ],
            'blog' => [
                'title' => 'Ideas on branding, content, design, and digital growth.',
                'text' => 'Notes from Bellah Options for founders, creators, and growing teams building stronger digital presence.',
                'background_image' => null,
            ],
            'events' => [
                'title' => 'Workshops, launches, and creative sessions.',
                'text' => 'Events published by the Bellah Options team appear here automatically.',
                'background_image' => null,
            ],
            'reviews' => [
                'title' => 'Google Reviews From Real Clients',
                'text' => 'Read public Google feedback from founders, teams, and businesses that worked with Bellah Options.',
                'background_image' => null,
            ],
            'faqs' => [
                'title' => 'Frequently Asked Questions',
                'text' => 'Clear answers to common questions about Bellah Options services, process, timelines, and delivery.',
                'background_image' => null,
            ],
            'contact' => [
                'title' => 'Tell us what you are building.',
                'text' => 'Share the project, launch, campaign, or brand challenge. We will help you pick a clear next step.',
                'background_image' => null,
            ],
            'web_design_samples' => [
                'title' => 'Web Design Samples',
                'text' => 'A focused set of live web experiences from Bellah Options projects.',
                'background_image' => null,
            ],
        ];
    }

    private static function defaultSiteUrl(): string
    {
        $configured = trim((string) config('app.url', 'http://localhost'));

        return self::normalizeHttpUrl($configured, 'http://localhost');
    }

    /**
     * @return array{place_id: string, featured_review_ids: array<int, string>}
     */
    private static function defaultGoogleReviewsConfig(): array
    {
        return [
            'place_id' => '',
            'featured_review_ids' => [],
        ];
    }

    /**
     * @return array<int, array{title: string, subtitle: string, image: string, cta_label: string, cta_url: string}>
     */
    private static function defaultHomeSlides(): array
    {
        return [
            [
                'title' => 'Brand Identity System',
                'subtitle' => 'Logo suite, color strategy, and campaign templates for market visibility.',
                'image' => '3.png',
                'cta_label' => 'Explore Brand Design',
                'cta_url' => '/order/brand-design',
            ],
            [
                'title' => 'Conversion Web Experience',
                'subtitle' => 'Clean information architecture and persuasive interface for lead capture.',
                'image' => 't-site.PNG',
                'cta_label' => 'Explore Web Design',
                'cta_url' => '/order/web-design',
            ],
            [
                'title' => 'Social Media Campaign',
                'subtitle' => 'Audience-specific content templates designed for reach and conversion.',
                'image' => '23.jpeg',
                'cta_label' => 'Explore Graphic Design',
                'cta_url' => '/order/graphic-design',
            ],
        ];
    }

    /**
     * @param  array<string, mixed>  $candidate
     * @return array{title: string, subtitle: string, image: string, cta_label: string, cta_url: string}|null
     */
    private static function sanitizeSlide(array $candidate): ?array
    {
        $title = trim((string) ($candidate['title'] ?? ''));
        $subtitle = trim((string) ($candidate['subtitle'] ?? ''));
        $image = ltrim(trim((string) ($candidate['image'] ?? '')), '/');
        $ctaLabel = trim((string) ($candidate['cta_label'] ?? ''));
        $ctaUrl = trim((string) ($candidate['cta_url'] ?? ''));

        if ($title === '' && $subtitle === '' && $image === '' && $ctaLabel === '' && $ctaUrl === '') {
            return null;
        }

        if ($title === '' || $image === '') {
            return null;
        }

        return [
            'title' => mb_substr($title, 0, 120),
            'subtitle' => mb_substr($subtitle, 0, 260),
            'image' => mb_substr($image, 0, 255),
            'cta_label' => mb_substr($ctaLabel !== '' ? $ctaLabel : 'Learn More', 0, 60),
            'cta_url' => mb_substr($ctaUrl !== '' ? $ctaUrl : '/contact-us', 0, 255),
        ];
    }

    private static function stringOrDefault(mixed $value, string $default): string
    {
        $resolved = trim((string) $value);

        return $resolved !== '' ? $resolved : $default;
    }

    private static function normalizeHttpUrl(string $value, string $fallback): string
    {
        $candidate = rtrim(trim($value), '/');

        if ($candidate === '') {
            return rtrim($fallback, '/');
        }

        if (filter_var($candidate, FILTER_VALIDATE_URL) === false) {
            return rtrim($fallback, '/');
        }

        $scheme = strtolower((string) parse_url($candidate, PHP_URL_SCHEME));

        if (! in_array($scheme, ['http', 'https'], true)) {
            return rtrim($fallback, '/');
        }

        return $candidate;
    }

    private static function sanitizeAssetPath(mixed $value): ?string
    {
        $sanitized = PublicContentSecurity::sanitizeLenientRelativePathOrHttpUrl($value);

        return is_string($sanitized) && trim($sanitized) !== ''
            ? $sanitized
            : null;
    }

    /**
     * @param  mixed  $input
     * @return array<int, string>
     */
    private static function sanitizeFeatureList(mixed $input): array
    {
        $items = is_array($input) ? $input : preg_split('/\r\n|\r|\n/', (string) $input);

        if (! is_array($items)) {
            return [];
        }

        $features = [];

        foreach ($items as $item) {
            $feature = trim((string) $item);
            if ($feature === '') {
                continue;
            }

            $features[] = mb_substr($feature, 0, 140);
        }

        return array_values(array_unique(array_slice($features, 0, 20)));
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, array<string, array{price: float|null, discount_price: float|null, is_recommended: bool, features: array<int, string>, description: string|null}>>
     */
    private static function servicePackageOverridesFromInput(array $overrides): array
    {
        $serviceConfig = (array) config('service_orders.services', []);
        $normalized = [];

        foreach ($overrides as $serviceSlug => $packages) {
            if (! is_string($serviceSlug) || ! is_array($packages) || ! isset($serviceConfig[$serviceSlug])) {
                continue;
            }

            $knownPackages = (array) data_get($serviceConfig, $serviceSlug.'.packages', []);

            foreach ($packages as $packageCode => $value) {
                if (! is_string($packageCode) || ! is_array($value) || ! isset($knownPackages[$packageCode])) {
                    continue;
                }

                $price = is_numeric($value['price'] ?? null) ? round((float) $value['price'], 2) : null;
                if ($price !== null && $price <= 0) {
                    $price = null;
                }

                $discountPrice = is_numeric($value['discount_price'] ?? null) ? round((float) $value['discount_price'], 2) : null;
                if ($discountPrice !== null && $discountPrice <= 0) {
                    $discountPrice = null;
                }

                if ($discountPrice !== null && $price !== null && $discountPrice >= $price) {
                    $discountPrice = null;
                }

                $features = self::sanitizeFeatureList($value['features'] ?? []);
                $description = trim((string) ($value['description'] ?? ''));

                $normalized[$serviceSlug][$packageCode] = [
                    'price' => $price,
                    'discount_price' => $discountPrice,
                    'is_recommended' => (bool) ($value['is_recommended'] ?? false),
                    'features' => $features,
                    'description' => $description !== '' ? mb_substr($description, 0, 500) : null,
                ];
            }
        }

        return $normalized;
    }
}
