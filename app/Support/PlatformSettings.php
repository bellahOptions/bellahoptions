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

    private const PUBLIC_SEO_SETTINGS_KEY = 'public_seo_settings_json';

    private const MAIN_WEBSITE_URI_KEY = 'main_website_uri';

    private const MANAGE_HIRES_LANDING_KEY = 'manage_hires_landing_json';

    private const EMAIL_TEMPLATE_LIBRARY_KEY = 'email_template_library_json';

    private const INVOICE_STYLE_KEY = 'invoice_style_json';

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
     * @return array{
     *   global: array{
     *     default_title:string,
     *     default_description:string,
     *     default_keywords:string|null,
     *     default_robots:string,
     *     default_og_image:string|null,
     *     default_twitter_image:string|null,
     *     twitter_card:string,
     *     twitter_site:string|null
     *   },
     *   pages: array<string, array{
     *     path:string,
     *     meta_title:string,
     *     meta_description:string,
     *     canonical_url:string|null,
     *     keywords:string|null,
     *     robots:string|null,
     *     og_image:string|null,
     *     twitter_image:string|null,
     *     og_type:string
     *   }>
     * }
     */
    public static function publicSeoSettings(): array
    {
        $defaults = self::defaultPublicSeoSettings();
        $raw = AppSetting::getValue(self::PUBLIC_SEO_SETTINGS_KEY);

        if (! is_string($raw) || trim($raw) === '') {
            return $defaults;
        }

        $decoded = json_decode($raw, true);
        if (! is_array($decoded)) {
            return $defaults;
        }

        $globalInput = is_array($decoded['global'] ?? null) ? $decoded['global'] : [];
        $pageInput = is_array($decoded['pages'] ?? null) ? $decoded['pages'] : [];

        $result = $defaults;
        $result['global'] = self::sanitizeSeoGlobalSettings($globalInput, $defaults['global']);

        foreach ($defaults['pages'] as $pageKey => $pageDefaults) {
            $candidate = is_array($pageInput[$pageKey] ?? null) ? $pageInput[$pageKey] : [];
            $result['pages'][$pageKey] = self::sanitizeSeoPageSettings($candidate, $pageDefaults);
        }

        return $result;
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    public static function setPublicSeoSettings(array $payload): void
    {
        $defaults = self::defaultPublicSeoSettings();
        $globalInput = is_array($payload['global'] ?? null) ? $payload['global'] : [];
        $pagesInput = is_array($payload['pages'] ?? null) ? $payload['pages'] : [];

        $sanitized = [
            'global' => self::sanitizeSeoGlobalSettings($globalInput, $defaults['global']),
            'pages' => [],
        ];

        foreach ($defaults['pages'] as $pageKey => $pageDefaults) {
            $candidate = is_array($pagesInput[$pageKey] ?? null) ? $pagesInput[$pageKey] : [];
            $sanitized['pages'][$pageKey] = self::sanitizeSeoPageSettings($candidate, $pageDefaults);
        }

        AppSetting::setValue(self::PUBLIC_SEO_SETTINGS_KEY, json_encode($sanitized, JSON_UNESCAPED_SLASHES));
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
     * @return array<string, array{
     *   name:string,
     *   subject_template:string,
     *   from_email:string,
     *   html_template:string,
     *   builder_layout:array<int, array<string, mixed>>
     * }>
     */
    public static function emailTemplateLibrary(): array
    {
        $defaults = self::defaultEmailTemplateLibrary();
        $raw = AppSetting::getValue(self::EMAIL_TEMPLATE_LIBRARY_KEY);

        if (! is_string($raw) || trim($raw) === '') {
            return $defaults;
        }

        $decoded = json_decode($raw, true);

        if (! is_array($decoded)) {
            return $defaults;
        }

        $result = [];

        foreach ($defaults as $key => $defaultTemplate) {
            $candidate = is_array($decoded[$key] ?? null) ? $decoded[$key] : [];
            $name = trim((string) ($candidate['name'] ?? ''));
            $subjectTemplate = trim((string) ($candidate['subject_template'] ?? ''));
            $fromEmail = self::sanitizeEmailAddress((string) ($candidate['from_email'] ?? ''));
            $htmlTemplate = trim((string) ($candidate['html_template'] ?? ''));
            $builderLayout = is_array($candidate['builder_layout'] ?? null)
                ? $candidate['builder_layout']
                : [];

            $result[$key] = [
                'name' => $name !== '' ? mb_substr($name, 0, 120) : $defaultTemplate['name'],
                'subject_template' => $subjectTemplate !== '' ? mb_substr($subjectTemplate, 0, 255) : $defaultTemplate['subject_template'],
                'from_email' => $fromEmail !== '' ? $fromEmail : (string) ($defaultTemplate['from_email'] ?? ''),
                'html_template' => $htmlTemplate !== '' ? mb_substr($htmlTemplate, 0, 200000) : $defaultTemplate['html_template'],
                'builder_layout' => $builderLayout,
            ];
        }

        return $result;
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    public static function setEmailTemplateLibrary(array $payload): void
    {
        $defaults = self::defaultEmailTemplateLibrary();
        $sanitized = [];

        foreach ($defaults as $key => $defaultTemplate) {
            $candidate = is_array($payload[$key] ?? null) ? $payload[$key] : [];
            $name = trim((string) ($candidate['name'] ?? $defaultTemplate['name']));
            $subjectTemplate = trim((string) ($candidate['subject_template'] ?? $defaultTemplate['subject_template']));
            $fromEmail = self::sanitizeEmailAddress((string) ($candidate['from_email'] ?? ($defaultTemplate['from_email'] ?? '')));
            $htmlTemplate = trim((string) ($candidate['html_template'] ?? $defaultTemplate['html_template']));
            $builderLayout = is_array($candidate['builder_layout'] ?? null)
                ? $candidate['builder_layout']
                : [];

            $sanitized[$key] = [
                'name' => mb_substr($name, 0, 120),
                'subject_template' => mb_substr($subjectTemplate, 0, 255),
                'from_email' => $fromEmail,
                'html_template' => mb_substr($htmlTemplate, 0, 200000),
                'builder_layout' => $builderLayout,
            ];
        }

        AppSetting::setValue(self::EMAIL_TEMPLATE_LIBRARY_KEY, json_encode($sanitized, JSON_UNESCAPED_SLASHES));
    }

    /**
     * @return array{
     *   primary_color:string,
     *   accent_color:string,
     *   text_color:string,
     *   company_lines:array<int,string>,
     *   footer_note:string
     * }
     */
    public static function invoiceStyle(): array
    {
        $defaults = self::defaultInvoiceStyle();
        $raw = AppSetting::getValue(self::INVOICE_STYLE_KEY);

        if (! is_string($raw) || trim($raw) === '') {
            return $defaults;
        }

        $decoded = json_decode($raw, true);

        if (! is_array($decoded)) {
            return $defaults;
        }

        $primaryColor = self::normalizeHexColor((string) ($decoded['primary_color'] ?? ''), $defaults['primary_color']);
        $accentColor = self::normalizeHexColor((string) ($decoded['accent_color'] ?? ''), $defaults['accent_color']);
        $textColor = self::normalizeHexColor((string) ($decoded['text_color'] ?? ''), $defaults['text_color']);
        $footerNote = trim((string) ($decoded['footer_note'] ?? ''));
        $companyLines = self::sanitizeFeatureList($decoded['company_lines'] ?? []);

        return [
            'primary_color' => $primaryColor,
            'accent_color' => $accentColor,
            'text_color' => $textColor,
            'company_lines' => $companyLines !== [] ? $companyLines : $defaults['company_lines'],
            'footer_note' => $footerNote !== '' ? mb_substr($footerNote, 0, 320) : $defaults['footer_note'],
        ];
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    public static function setInvoiceStyle(array $payload): void
    {
        $defaults = self::defaultInvoiceStyle();
        $companyLines = self::sanitizeFeatureList($payload['company_lines'] ?? $defaults['company_lines']);
        $footerNote = trim((string) ($payload['footer_note'] ?? $defaults['footer_note']));

        $sanitized = [
            'primary_color' => self::normalizeHexColor((string) ($payload['primary_color'] ?? ''), $defaults['primary_color']),
            'accent_color' => self::normalizeHexColor((string) ($payload['accent_color'] ?? ''), $defaults['accent_color']),
            'text_color' => self::normalizeHexColor((string) ($payload['text_color'] ?? ''), $defaults['text_color']),
            'company_lines' => $companyLines !== [] ? $companyLines : $defaults['company_lines'],
            'footer_note' => $footerNote !== '' ? mb_substr($footerNote, 0, 320) : $defaults['footer_note'],
        ];

        AppSetting::setValue(self::INVOICE_STYLE_KEY, json_encode($sanitized, JSON_UNESCAPED_SLASHES));
    }

    /**
     * @return array{
     *   badge:string,
     *   package_name:string,
     *   monthly_price_ngn:float,
     *   tagline:string,
     *   description:string,
     *   highlights:array<int,string>,
     *   exclusions_note:string,
     *   primary_cta_label:string,
     *   primary_cta_url:string,
     *   secondary_cta_label:string,
     *   secondary_cta_url:string
     * }
     */
    public static function manageHiresLanding(): array
    {
        $defaults = self::defaultManageHiresLanding();
        $raw = AppSetting::getValue(self::MANAGE_HIRES_LANDING_KEY);

        if (! is_string($raw) || trim($raw) === '') {
            return $defaults;
        }

        $decoded = json_decode($raw, true);

        if (! is_array($decoded)) {
            return $defaults;
        }

        $badge = trim((string) ($decoded['badge'] ?? ''));
        $packageName = trim((string) ($decoded['package_name'] ?? ''));
        $tagline = trim((string) ($decoded['tagline'] ?? ''));
        $description = trim((string) ($decoded['description'] ?? ''));
        $exclusionsNote = trim((string) ($decoded['exclusions_note'] ?? ''));
        $primaryCtaLabel = trim((string) ($decoded['primary_cta_label'] ?? ''));
        $primaryCtaUrl = trim((string) ($decoded['primary_cta_url'] ?? ''));
        $secondaryCtaLabel = trim((string) ($decoded['secondary_cta_label'] ?? ''));
        $secondaryCtaUrl = trim((string) ($decoded['secondary_cta_url'] ?? ''));
        $monthlyPriceNgn = is_numeric($decoded['monthly_price_ngn'] ?? null)
            ? max(0, round((float) $decoded['monthly_price_ngn'], 2))
            : $defaults['monthly_price_ngn'];
        $highlights = self::sanitizeFeatureList($decoded['highlights'] ?? []);

        return [
            'badge' => $badge !== '' ? mb_substr($badge, 0, 80) : $defaults['badge'],
            'package_name' => $packageName !== '' ? mb_substr($packageName, 0, 120) : $defaults['package_name'],
            'monthly_price_ngn' => $monthlyPriceNgn > 0 ? $monthlyPriceNgn : $defaults['monthly_price_ngn'],
            'tagline' => $tagline !== '' ? mb_substr($tagline, 0, 180) : $defaults['tagline'],
            'description' => $description !== '' ? mb_substr($description, 0, 1000) : $defaults['description'],
            'highlights' => $highlights !== [] ? $highlights : $defaults['highlights'],
            'exclusions_note' => $exclusionsNote !== '' ? mb_substr($exclusionsNote, 0, 260) : $defaults['exclusions_note'],
            'primary_cta_label' => $primaryCtaLabel !== '' ? mb_substr($primaryCtaLabel, 0, 80) : $defaults['primary_cta_label'],
            'primary_cta_url' => self::sanitizeAssetPath($primaryCtaUrl) ?? $defaults['primary_cta_url'],
            'secondary_cta_label' => $secondaryCtaLabel !== '' ? mb_substr($secondaryCtaLabel, 0, 80) : $defaults['secondary_cta_label'],
            'secondary_cta_url' => self::sanitizeAssetPath($secondaryCtaUrl) ?? $defaults['secondary_cta_url'],
        ];
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    public static function setManageHiresLanding(array $payload): void
    {
        $defaults = self::defaultManageHiresLanding();
        $merged = [
            ...$defaults,
            ...$payload,
        ];

        AppSetting::setValue(self::MANAGE_HIRES_LANDING_KEY, json_encode([
            'badge' => mb_substr(trim((string) ($merged['badge'] ?? $defaults['badge'])), 0, 80),
            'package_name' => mb_substr(trim((string) ($merged['package_name'] ?? $defaults['package_name'])), 0, 120),
            'monthly_price_ngn' => max(0, round((float) ($merged['monthly_price_ngn'] ?? $defaults['monthly_price_ngn']), 2)),
            'tagline' => mb_substr(trim((string) ($merged['tagline'] ?? $defaults['tagline'])), 0, 180),
            'description' => mb_substr(trim((string) ($merged['description'] ?? $defaults['description'])), 0, 1000),
            'highlights' => self::sanitizeFeatureList($merged['highlights'] ?? $defaults['highlights']),
            'exclusions_note' => mb_substr(trim((string) ($merged['exclusions_note'] ?? $defaults['exclusions_note'])), 0, 260),
            'primary_cta_label' => mb_substr(trim((string) ($merged['primary_cta_label'] ?? $defaults['primary_cta_label'])), 0, 80),
            'primary_cta_url' => self::sanitizeAssetPath($merged['primary_cta_url'] ?? $defaults['primary_cta_url']) ?? $defaults['primary_cta_url'],
            'secondary_cta_label' => mb_substr(trim((string) ($merged['secondary_cta_label'] ?? $defaults['secondary_cta_label'])), 0, 80),
            'secondary_cta_url' => self::sanitizeAssetPath($merged['secondary_cta_url'] ?? $defaults['secondary_cta_url']) ?? $defaults['secondary_cta_url'],
        ], JSON_UNESCAPED_SLASHES));
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
            'manage_hires' => [
                'title' => 'Dedicated unlimited design support for growth-stage teams.',
                'text' => 'Scale brand and social design execution with one retained creative partner.',
                'background_image' => null,
            ],
        ];
    }

    /**
     * @return array{
     *   badge:string,
     *   package_name:string,
     *   monthly_price_ngn:float,
     *   tagline:string,
     *   description:string,
     *   highlights:array<int,string>,
     *   exclusions_note:string,
     *   primary_cta_label:string,
     *   primary_cta_url:string,
     *   secondary_cta_label:string,
     *   secondary_cta_url:string
     * }
     */
    private static function defaultManageHiresLanding(): array
    {
        return [
            'badge' => 'Dedicated Design Retainer',
            'package_name' => 'Manage Your Hires',
            'monthly_price_ngn' => 220000,
            'tagline' => 'Unlimited design requests managed by a dedicated Bellah creative team.',
            'description' => 'This plan is for teams that need consistent design output without hiring full-time in-house designers. It covers design services only and excludes UI/UX.',
            'highlights' => [
                'Dedicated design team support',
                'Unlimited design requests (fair use)',
                'Batch delivery during work hours',
                'Brand-consistent design production',
            ],
            'exclusions_note' => 'UI/UX design is excluded from this package.',
            'primary_cta_label' => 'Start This Plan',
            'primary_cta_url' => '/contact-us',
            'secondary_cta_label' => 'Discuss Scope',
            'secondary_cta_url' => '/services',
        ];
    }

    /**
     * @return array{
     *   global: array{
     *     default_title:string,
     *     default_description:string,
     *     default_keywords:string|null,
     *     default_robots:string,
     *     default_og_image:string|null,
     *     default_twitter_image:string|null,
     *     twitter_card:string,
     *     twitter_site:string|null
     *   },
     *   pages: array<string, array{
     *     path:string,
     *     meta_title:string,
     *     meta_description:string,
     *     canonical_url:string|null,
     *     keywords:string|null,
     *     robots:string|null,
     *     og_image:string|null,
     *     twitter_image:string|null,
     *     og_type:string
     *   }>
     * }
     */
    private static function defaultPublicSeoSettings(): array
    {
        return [
            'global' => [
                'default_title' => 'Bellah Options | Creative Branding, Design, and Digital Solutions',
                'default_description' => 'Bellah Options helps businesses grow with branding, graphic design, social media design, websites, and digital product experiences.',
                'default_keywords' => 'branding agency, graphic design, web design, ui ux, nigeria creative agency',
                'default_robots' => 'index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1',
                'default_og_image' => '/images/og-image.jpg',
                'default_twitter_image' => '/images/og-image.jpg',
                'twitter_card' => 'summary_large_image',
                'twitter_site' => '@bellahoptions',
            ],
            'pages' => [
                'home' => [
                    'path' => '/',
                    'meta_title' => 'Bellah Options | Creative Branding, Design, and Digital Solutions',
                    'meta_description' => 'Bellah Options is a creative design and technology agency helping businesses scale with brand design, graphic design, web design, and UI/UX services.',
                    'canonical_url' => null,
                    'keywords' => null,
                    'robots' => null,
                    'og_image' => null,
                    'twitter_image' => null,
                    'og_type' => 'website',
                ],
                'about' => [
                    'path' => '/about-bellah-options',
                    'meta_title' => 'About Bellah Options | Creative Brand and Digital Agency',
                    'meta_description' => 'Learn about Bellah Options, our creative process, and how we help startups and businesses build clear digital presence.',
                    'canonical_url' => null,
                    'keywords' => null,
                    'robots' => null,
                    'og_image' => null,
                    'twitter_image' => null,
                    'og_type' => 'website',
                ],
                'services' => [
                    'path' => '/services',
                    'meta_title' => 'Services | Bellah Options',
                    'meta_description' => 'Explore Bellah Options services for branding, graphic design, social media content, websites, and product interface design.',
                    'canonical_url' => null,
                    'keywords' => null,
                    'robots' => null,
                    'og_image' => null,
                    'twitter_image' => null,
                    'og_type' => 'website',
                ],
                'gallery' => [
                    'path' => '/gallery',
                    'meta_title' => 'Gallery | Bellah Options',
                    'meta_description' => 'See portfolio projects and published client work from Bellah Options across branding, marketing visuals, and digital experiences.',
                    'canonical_url' => null,
                    'keywords' => null,
                    'robots' => null,
                    'og_image' => null,
                    'twitter_image' => null,
                    'og_type' => 'website',
                ],
                'blog' => [
                    'path' => '/blog',
                    'meta_title' => 'Blog | Bellah Options',
                    'meta_description' => 'Read practical insights from Bellah Options on branding, design systems, content strategy, and business growth.',
                    'canonical_url' => null,
                    'keywords' => null,
                    'robots' => null,
                    'og_image' => null,
                    'twitter_image' => null,
                    'og_type' => 'website',
                ],
                'blog_post' => [
                    'path' => '/blog/*',
                    'meta_title' => 'Bellah Options Blog Article',
                    'meta_description' => 'Read this Bellah Options article for practical branding, design, and digital growth insights.',
                    'canonical_url' => null,
                    'keywords' => null,
                    'robots' => null,
                    'og_image' => null,
                    'twitter_image' => null,
                    'og_type' => 'article',
                ],
                'events' => [
                    'path' => '/events',
                    'meta_title' => 'Events | Bellah Options',
                    'meta_description' => 'View Bellah Options events, workshops, and creative sessions for founders, teams, and growing brands.',
                    'canonical_url' => null,
                    'keywords' => null,
                    'robots' => null,
                    'og_image' => null,
                    'twitter_image' => null,
                    'og_type' => 'website',
                ],
                'reviews' => [
                    'path' => '/reviews',
                    'meta_title' => 'Reviews | Bellah Options',
                    'meta_description' => 'Read verified Bellah Options client reviews, ratings, and Google feedback from completed projects.',
                    'canonical_url' => null,
                    'keywords' => null,
                    'robots' => null,
                    'og_image' => null,
                    'twitter_image' => null,
                    'og_type' => 'website',
                ],
                'faqs' => [
                    'path' => '/faqs',
                    'meta_title' => 'FAQs | Bellah Options',
                    'meta_description' => 'Find clear answers to frequently asked questions about Bellah Options services, delivery, timelines, and process.',
                    'canonical_url' => null,
                    'keywords' => null,
                    'robots' => null,
                    'og_image' => null,
                    'twitter_image' => null,
                    'og_type' => 'website',
                ],
                'contact' => [
                    'path' => '/contact-us',
                    'meta_title' => 'Contact Bellah Options',
                    'meta_description' => 'Contact Bellah Options to discuss your brand, design, or digital project and get a tailored next step.',
                    'canonical_url' => null,
                    'keywords' => null,
                    'robots' => null,
                    'og_image' => null,
                    'twitter_image' => null,
                    'og_type' => 'website',
                ],
                'web_design_samples' => [
                    'path' => '/web-design-samples',
                    'meta_title' => 'Web Design Samples | Bellah Options',
                    'meta_description' => 'Browse web design samples and live website experiences delivered by Bellah Options.',
                    'canonical_url' => null,
                    'keywords' => null,
                    'robots' => null,
                    'og_image' => null,
                    'twitter_image' => null,
                    'og_type' => 'website',
                ],
                'manage_hires' => [
                    'path' => '/manage-your-hires',
                    'meta_title' => 'Manage Your Hires | Bellah Options',
                    'meta_description' => 'Dedicated unlimited design support for growth-stage teams with one retained creative partner.',
                    'canonical_url' => null,
                    'keywords' => null,
                    'robots' => null,
                    'og_image' => null,
                    'twitter_image' => null,
                    'og_type' => 'website',
                ],
                'order' => [
                    'path' => '/order/*',
                    'meta_title' => 'Start a Service Request | Bellah Options',
                    'meta_description' => 'Start your Bellah Options service request and submit your project details for branding, design, or web delivery.',
                    'canonical_url' => null,
                    'keywords' => null,
                    'robots' => null,
                    'og_image' => null,
                    'twitter_image' => null,
                    'og_type' => 'website',
                ],
                'terms' => [
                    'path' => '/terms-of-service',
                    'meta_title' => 'Terms of Service | Bellah Options',
                    'meta_description' => 'Review Bellah Options terms of service, billing policies, and delivery conditions.',
                    'canonical_url' => null,
                    'keywords' => null,
                    'robots' => null,
                    'og_image' => null,
                    'twitter_image' => null,
                    'og_type' => 'article',
                ],
                'privacy' => [
                    'path' => '/privacy-policy',
                    'meta_title' => 'Privacy Policy | Bellah Options',
                    'meta_description' => 'Understand how Bellah Options collects, uses, and protects your personal data.',
                    'canonical_url' => null,
                    'keywords' => null,
                    'robots' => null,
                    'og_image' => null,
                    'twitter_image' => null,
                    'og_type' => 'article',
                ],
                'cookie' => [
                    'path' => '/cookie-policy',
                    'meta_title' => 'Cookie Policy | Bellah Options',
                    'meta_description' => 'Learn how Bellah Options uses cookies and tracking technologies across public pages.',
                    'canonical_url' => null,
                    'keywords' => null,
                    'robots' => null,
                    'og_image' => null,
                    'twitter_image' => null,
                    'og_type' => 'article',
                ],
            ],
        ];
    }

    /**
     * @return array<string, array{name:string,subject_template:string,from_email:string,html_template:string,builder_layout:array<int, array<string,mixed>>}>
     */
    private static function defaultEmailTemplateLibrary(): array
    {
        return [
            'invoice_issued' => [
                'name' => 'Invoice Issued',
                'subject_template' => 'Customer Invoice: {{invoice_number}}',
                'from_email' => '',
                'html_template' => '',
                'builder_layout' => [],
            ],
            'invoice_paid_receipt' => [
                'name' => 'Invoice Paid Receipt',
                'subject_template' => 'Payment receipt for invoice {{invoice_number}}',
                'from_email' => '',
                'html_template' => '',
                'builder_layout' => [],
            ],
            'invoice_reminder' => [
                'name' => 'Invoice Reminder',
                'subject_template' => 'Reminder: invoice {{invoice_number}} is pending',
                'from_email' => '',
                'html_template' => '',
                'builder_layout' => [],
            ],
            'service_order_summary' => [
                'name' => 'Service Order Summary',
                'subject_template' => 'Order Received: {{service_name}} ({{order_code}})',
                'from_email' => '',
                'html_template' => '',
                'builder_layout' => [],
            ],
            'service_order_payment_thank_you' => [
                'name' => 'Service Order Payment Thank You',
                'subject_template' => 'Thank you for your purchase ({{order_code}})',
                'from_email' => '',
                'html_template' => '',
                'builder_layout' => [],
            ],
            'service_order_content_request' => [
                'name' => 'Service Order Content Request',
                'subject_template' => 'Next step: share your content/assets ({{order_code}})',
                'from_email' => '',
                'html_template' => '',
                'builder_layout' => [],
            ],
            'support_ticket_created_customer' => [
                'name' => 'Support Ticket Created (Customer)',
                'subject_template' => 'Support ticket received: {{ticket_number}}',
                'from_email' => '',
                'html_template' => '',
                'builder_layout' => [],
            ],
            'support_ticket_staff_reply' => [
                'name' => 'Support Ticket Staff Reply',
                'subject_template' => 'We replied to your ticket {{ticket_number}}',
                'from_email' => '',
                'html_template' => '',
                'builder_layout' => [],
            ],
            'waitlist_welcome' => [
                'name' => 'Waitlist Welcome',
                'subject_template' => 'You are on the Bellah Options waitlist',
                'from_email' => '',
                'html_template' => '',
                'builder_layout' => [],
            ],
            'invoice_issued_admin_alert' => [
                'name' => 'Invoice Issued Admin Alert',
                'subject_template' => 'Admin Alert: Invoice {{invoice_number}} {{invoice_action}} to {{customer_email}}',
                'from_email' => '',
                'html_template' => '',
                'builder_layout' => [],
            ],
            'service_order_submitted_admin_alert' => [
                'name' => 'Service Order Submitted Admin Alert',
                'subject_template' => 'New service order: {{service_name}} ({{order_code}})',
                'from_email' => '',
                'html_template' => '',
                'builder_layout' => [],
            ],
            'support_ticket_created_admin_alert' => [
                'name' => 'Support Ticket Created Admin Alert',
                'subject_template' => 'New support ticket: {{ticket_number}}',
                'from_email' => '',
                'html_template' => '',
                'builder_layout' => [],
            ],
            'support_ticket_customer_reply_admin_alert' => [
                'name' => 'Support Ticket Customer Reply Admin Alert',
                'subject_template' => 'Customer replied: {{ticket_number}}',
                'from_email' => '',
                'html_template' => '',
                'builder_layout' => [],
            ],
            'support_ticket_unanswered_reminder' => [
                'name' => 'Support Ticket Unanswered Reminder',
                'subject_template' => 'Reminder: unanswered ticket {{ticket_number}}',
                'from_email' => '',
                'html_template' => '',
                'builder_layout' => [],
            ],
            'waitlist_admin_alert' => [
                'name' => 'Waitlist Admin Alert',
                'subject_template' => 'New waitlist signup: {{customer_email}}',
                'from_email' => '',
                'html_template' => '',
                'builder_layout' => [],
            ],
            'contact_submission_admin_alert' => [
                'name' => 'Contact Submission Admin Alert',
                'subject_template' => 'New contact form submission from {{customer_name}}',
                'from_email' => '',
                'html_template' => '',
                'builder_layout' => [],
            ],
            'staff_login_otp' => [
                'name' => 'Staff Login OTP',
                'subject_template' => 'Your Bellah Options staff login OTP',
                'from_email' => '',
                'html_template' => '',
                'builder_layout' => [],
            ],
            'client_review_request' => [
                'name' => 'Client Review Request',
                'subject_template' => 'How was your experience with Bellah Options?',
                'from_email' => '',
                'html_template' => '',
                'builder_layout' => [],
            ],
        ];
    }

    /**
     * @return array{
     *   primary_color:string,
     *   accent_color:string,
     *   text_color:string,
     *   company_lines:array<int,string>,
     *   footer_note:string
     * }
     */
    private static function defaultInvoiceStyle(): array
    {
        return [
            'primary_color' => '#0f1f33',
            'accent_color' => '#11845b',
            'text_color' => '#182433',
            'company_lines' => [
                'Baba Ode, Onibukun Ota',
                'Ogun State, NG (BN3668420)',
                '(234) 810 867 1804',
            ],
            'footer_note' => 'Generated by Bellah Options',
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

    /**
     * @param  array<string, mixed>  $payload
     * @param  array<string, mixed>  $defaults
     * @return array{
     *     default_title:string,
     *     default_description:string,
     *     default_keywords:string|null,
     *     default_robots:string,
     *     default_og_image:string|null,
     *     default_twitter_image:string|null,
     *     twitter_card:string,
     *     twitter_site:string|null
     * }
     */
    private static function sanitizeSeoGlobalSettings(array $payload, array $defaults): array
    {
        $title = trim((string) ($payload['default_title'] ?? ''));
        $description = trim((string) ($payload['default_description'] ?? ''));
        $keywords = trim((string) ($payload['default_keywords'] ?? ''));
        $robots = trim((string) ($payload['default_robots'] ?? ''));
        $twitterCard = trim((string) ($payload['twitter_card'] ?? ''));
        $twitterSite = trim((string) ($payload['twitter_site'] ?? ''));

        if (! in_array($twitterCard, ['summary', 'summary_large_image'], true)) {
            $twitterCard = (string) $defaults['twitter_card'];
        }

        return [
            'default_title' => $title !== '' ? mb_substr($title, 0, 180) : (string) $defaults['default_title'],
            'default_description' => $description !== '' ? mb_substr($description, 0, 320) : (string) $defaults['default_description'],
            'default_keywords' => $keywords !== '' ? mb_substr($keywords, 0, 350) : ($defaults['default_keywords'] ?? null),
            'default_robots' => $robots !== '' ? mb_substr($robots, 0, 160) : (string) $defaults['default_robots'],
            'default_og_image' => self::sanitizeAssetPath($payload['default_og_image'] ?? null) ?? ($defaults['default_og_image'] ?? null),
            'default_twitter_image' => self::sanitizeAssetPath($payload['default_twitter_image'] ?? null) ?? ($defaults['default_twitter_image'] ?? null),
            'twitter_card' => $twitterCard,
            'twitter_site' => $twitterSite !== '' ? mb_substr($twitterSite, 0, 80) : ($defaults['twitter_site'] ?? null),
        ];
    }

    /**
     * @param  array<string, mixed>  $payload
     * @param  array<string, mixed>  $defaults
     * @return array{
     *   path:string,
     *   meta_title:string,
     *   meta_description:string,
     *   canonical_url:string|null,
     *   keywords:string|null,
     *   robots:string|null,
     *   og_image:string|null,
     *   twitter_image:string|null,
     *   og_type:string
     * }
     */
    private static function sanitizeSeoPageSettings(array $payload, array $defaults): array
    {
        $title = trim((string) ($payload['meta_title'] ?? ''));
        $description = trim((string) ($payload['meta_description'] ?? ''));
        $path = trim((string) ($payload['path'] ?? ''));
        $keywords = trim((string) ($payload['keywords'] ?? ''));
        $robots = trim((string) ($payload['robots'] ?? ''));
        $canonicalUrl = trim((string) ($payload['canonical_url'] ?? ''));
        $ogType = strtolower(trim((string) ($payload['og_type'] ?? '')));

        if (! in_array($ogType, ['website', 'article'], true)) {
            $ogType = (string) $defaults['og_type'];
        }

        if ($path === '') {
            $path = (string) $defaults['path'];
        }

        $normalizedPath = str_starts_with($path, '/') ? $path : '/'.$path;

        return [
            'path' => mb_substr($normalizedPath, 0, 255),
            'meta_title' => $title !== '' ? mb_substr($title, 0, 180) : (string) $defaults['meta_title'],
            'meta_description' => $description !== '' ? mb_substr($description, 0, 320) : (string) $defaults['meta_description'],
            'canonical_url' => self::sanitizeAssetPath($canonicalUrl),
            'keywords' => $keywords !== '' ? mb_substr($keywords, 0, 350) : null,
            'robots' => $robots !== '' ? mb_substr($robots, 0, 160) : null,
            'og_image' => self::sanitizeAssetPath($payload['og_image'] ?? null),
            'twitter_image' => self::sanitizeAssetPath($payload['twitter_image'] ?? null),
            'og_type' => $ogType,
        ];
    }

    private static function normalizeHexColor(string $value, string $fallback): string
    {
        $candidate = strtoupper(trim($value));
        if (preg_match('/^#[0-9A-F]{6}$/', $candidate) === 1) {
            return $candidate;
        }

        return strtoupper(trim($fallback));
    }

    private static function sanitizeEmailAddress(string $value): string
    {
        $candidate = strtolower(trim($value));

        return filter_var($candidate, FILTER_VALIDATE_EMAIL)
            ? $candidate
            : '';
    }

    private static function sanitizeAssetPath(mixed $value): ?string
    {
        $sanitized = PublicContentSecurity::sanitizeLenientRelativePathOrHttpUrl($value);

        return is_string($sanitized) && trim($sanitized) !== ''
            ? $sanitized
            : null;
    }

    /**
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
