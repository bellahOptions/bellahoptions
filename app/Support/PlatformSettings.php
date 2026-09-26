<?php

namespace App\Support;

use App\Models\AppSetting;
use Illuminate\Support\Str;

class PlatformSettings
{
    private const CONTACT_INFO_KEY = 'default_contact_info_json';

    private const SERVICE_PRICE_OVERRIDES_KEY = 'service_price_overrides_json';

    private const SERVICE_PACKAGE_OVERRIDES_KEY = 'service_package_overrides_json';

    private const GRAPHIC_DESIGN_ITEMS_KEY = 'graphic_design_items_json';

    private const SOCIAL_GRAPHIC_TRIAL_FEE_KEY = 'social_graphic_trial_fee_ngn';

    private const BRAND_ASSETS_KEY = 'brand_assets_json';

    private const PUBLIC_SEO_SETTINGS_KEY = 'public_seo_settings_json';

    private const MAIN_WEBSITE_URI_KEY = 'main_website_uri';

    private const EMAIL_TEMPLATE_LIBRARY_KEY = 'email_template_library_json';

    private const INVOICE_STYLE_KEY = 'invoice_style_json';

    private const PAYMENT_FALLBACK_KEY = 'payment_fallback_json';

    /**
     * The three fields that make up a single transfer account. Records written
     * before the fallback became a list stored these at the top level, so this
     * list is also what the legacy migration looks for.
     *
     * @var array<int, string>
     */
    private const PAYMENT_FALLBACK_ACCOUNT_FIELDS = ['bank_name', 'account_name', 'account_number'];

    private const ANNOUNCEMENT_KEY = 'service_announcement_json';

    private const SERVICE_IMAGES_KEY = 'service_images_json';

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
     * The "new service" announcement modal shown on public pages.
     *
     * @return array{enabled: bool, badge: string, title: string, body: string, cta_label: string, cta_url: string, image: string, dismiss_days: int}
     */
    public static function serviceAnnouncement(): array
    {
        $defaults = self::defaultServiceAnnouncement();
        $raw = AppSetting::getValue(self::ANNOUNCEMENT_KEY);

        if (! is_string($raw) || trim($raw) === '') {
            return self::applyAnnouncementImageOverride($defaults);
        }

        $decoded = json_decode($raw, true);

        if (! is_array($decoded)) {
            return self::applyAnnouncementImageOverride($defaults);
        }

        return self::applyAnnouncementImageOverride([
            'enabled' => array_key_exists('enabled', $decoded) ? (bool) $decoded['enabled'] : $defaults['enabled'],
            'badge' => array_key_exists('badge', $decoded) ? mb_substr(trim((string) $decoded['badge']), 0, 40) : $defaults['badge'],
            'title' => array_key_exists('title', $decoded) ? mb_substr(trim((string) $decoded['title']), 0, 120) : $defaults['title'],
            'body' => array_key_exists('body', $decoded) ? mb_substr(trim((string) $decoded['body']), 0, 600) : $defaults['body'],
            'cta_label' => array_key_exists('cta_label', $decoded) ? mb_substr(trim((string) $decoded['cta_label']), 0, 60) : $defaults['cta_label'],
            'cta_url' => array_key_exists('cta_url', $decoded)
                ? self::normalizeInternalOrHttpUrl((string) $decoded['cta_url'], $defaults['cta_url'])
                : $defaults['cta_url'],
            'image' => array_key_exists('image', $decoded)
                ? self::normalizeInternalOrHttpUrl((string) $decoded['image'], $defaults['image'])
                : $defaults['image'],
            'dismiss_days' => array_key_exists('dismiss_days', $decoded)
                ? max(0, min(365, (int) $decoded['dismiss_days']))
                : $defaults['dismiss_days'],
        ]);
    }

    /**
     * The media picker writes to one shared image record, so an `announcement`
     * entry there overrides whatever the announcement record itself carries.
     *
     * @param  array<string, mixed>  $announcement
     * @return array<string, mixed>
     */
    private static function applyAnnouncementImageOverride(array $announcement): array
    {
        $override = self::serviceImages()['announcement'] ?? null;

        if (is_string($override) && $override !== '') {
            $announcement['image'] = $override;
        }

        return $announcement;
    }
    /**
     * @param  array<string, mixed>  $announcement
     */
    public static function setServiceAnnouncement(array $announcement): void
    {
        $existing = self::serviceAnnouncement();
        $defaults = self::defaultServiceAnnouncement();

        $payload = [
            'enabled' => array_key_exists('enabled', $announcement) ? (bool) $announcement['enabled'] : $existing['enabled'],
            'badge' => mb_substr(self::stringOrDefault($announcement['badge'] ?? null, $existing['badge']), 0, 40),
            'title' => mb_substr(self::stringOrDefault($announcement['title'] ?? null, $existing['title']), 0, 120),
            'body' => mb_substr(self::stringOrDefault($announcement['body'] ?? null, $existing['body']), 0, 600),
            'cta_label' => mb_substr(self::stringOrDefault($announcement['cta_label'] ?? null, $existing['cta_label']), 0, 60),
            'cta_url' => self::normalizeInternalOrHttpUrl(
                self::stringOrDefault($announcement['cta_url'] ?? null, $existing['cta_url']),
                $defaults['cta_url'],
            ),
            'image' => self::normalizeInternalOrHttpUrl(
                self::stringOrDefault($announcement['image'] ?? null, $existing['image']),
                $defaults['image'],
            ),
            'dismiss_days' => array_key_exists('dismiss_days', $announcement)
                ? max(0, min(365, (int) $announcement['dismiss_days']))
                : $existing['dismiss_days'],
        ];

        AppSetting::setValue(self::ANNOUNCEMENT_KEY, json_encode($payload, JSON_UNESCAPED_SLASHES));
    }

    /**
     * Super-admin image overrides for the service landing pages and the
     * announcement modal, keyed by an arbitrary string ("social-media-design",
     * "announcement", ...).
     *
     * Values are stored exactly as the media picker returns them — a `/media/...`
     * engine path, a legacy `/images/...` public path, or an absolute URL — and
     * are validated on write so a stored value is always safe to render.
     *
     * @return array<string, string>
     */
    public static function serviceImages(): array
    {
        $raw = AppSetting::getValue(self::SERVICE_IMAGES_KEY);

        if (! is_string($raw) || trim($raw) === '') {
            return [];
        }

        $decoded = json_decode($raw, true);

        if (! is_array($decoded)) {
            return [];
        }

        $images = [];

        foreach ($decoded as $key => $value) {
            if (! is_string($key) || ! is_string($value)) {
                continue;
            }

            $safeKey = self::sanitizeMediaKey($key);
            $safeValue = Media::url($value);

            if ($safeKey === null || $safeValue === null) {
                continue;
            }

            $images[$safeKey] = $safeValue;
        }

        return $images;
    }

    /**
     * Partial update: only the keys provided are written, so the admin form can
     * auto-save one image at a time. An empty string clears the override and the
     * page falls back to its built-in artwork.
     *
     * @param  array<string, mixed>  $images
     */
    public static function setServiceImages(array $images): void
    {
        $stored = self::serviceImages();

        foreach ($images as $key => $value) {
            if (! is_string($key)) {
                continue;
            }

            $safeKey = self::sanitizeMediaKey($key);

            if ($safeKey === null) {
                continue;
            }

            if (! is_string($value) || trim($value) === '') {
                unset($stored[$safeKey]);

                continue;
            }

            $safeValue = Media::url($value);

            if ($safeValue !== null) {
                $stored[$safeKey] = $safeValue;
            }
        }

        AppSetting::setValue(self::SERVICE_IMAGES_KEY, json_encode($stored, JSON_UNESCAPED_SLASHES));
    }

    /**
     * Keys are service slugs plus a small set of reserved names.
     */
    private static function sanitizeMediaKey(string $key): ?string
    {
        $candidate = strtolower(trim($key));

        if ($candidate === '' || preg_match('/^[a-z0-9][a-z0-9-]{0,60}$/', $candidate) !== 1) {
            return null;
        }

        return $candidate;
    }

    /**
     * @return array{enabled: bool, badge: string, title: string, body: string, cta_label: string, cta_url: string, image: string, dismiss_days: int}
     */
    private static function defaultServiceAnnouncement(): array
    {
        return [
            'enabled' => true,
            'badge' => 'New service',
            'title' => 'Social Media Management is here',
            'body' => 'We now plan, create, publish and manage your social channels end to end, with community replies and a monthly report. Book a free scoping call and we will send a fixed monthly quote.',
            'cta_label' => 'Explore the service',
            'cta_url' => '/services/social-media-management',
            'image' => '/sa2.jpeg',
            'dismiss_days' => 3,
        ];
    }

    /**
     * Accept an in-app path or an absolute http(s) URL; anything else falls back.
     */
    private static function normalizeInternalOrHttpUrl(string $value, string $fallback): string
    {
        $candidate = trim($value);

        if ($candidate === '') {
            return $fallback;
        }

        if (str_starts_with($candidate, '/') && ! str_starts_with($candidate, '//')) {
            return $candidate;
        }

        return self::normalizeHttpUrl($candidate, $fallback);
    }

    /**
     * Super-admin-managed bank-transfer fallback accounts.
     *
     * A business can legitimately hold several accounts (different banks, NGN
     * and domiciliary, or a per-brand account), so this is a list rather than a
     * single record. "Fallback" does not mean unverified: accounts come from the
     * platform settings record and are only allowed to reach a customer when
     * they are complete, so an empty or half-filled entry is simply not offered
     * instead of showing broken payment instructions.
     *
     * Fields a super admin has never saved fall back to the environment
     * configuration, so an existing install keeps working untouched. Records
     * written before this became a list stored the three account fields at the
     * top level; those are migrated into a single account on read.
     *
     * @return array{enabled: bool, accounts: array<int, array{bank_name: string, account_name: string, account_number: string}>, instructions: string, support_email: string, reference_hint: string}
     */
    public static function paymentFallback(): array
    {
        $defaults = self::defaultPaymentFallback();
        $decoded = self::storedPaymentFallback();

        if ($decoded === []) {
            return $defaults;
        }

        // Once a super admin has saved a value it wins, *including* a value that
        // was deliberately blanked. Environment configuration only fills the
        // fields that have never been saved.
        return [
            'enabled' => array_key_exists('enabled', $decoded) ? (bool) $decoded['enabled'] : $defaults['enabled'],
            'accounts' => self::resolveStoredAccounts($decoded, $defaults['accounts']),
            'instructions' => array_key_exists('instructions', $decoded) ? trim((string) $decoded['instructions']) : $defaults['instructions'],
            'support_email' => array_key_exists('support_email', $decoded)
                ? strtolower(trim((string) $decoded['support_email']))
                : $defaults['support_email'],
            'reference_hint' => array_key_exists('reference_hint', $decoded) ? trim((string) $decoded['reference_hint']) : $defaults['reference_hint'],
        ];
    }

    /**
     * Persist the fallback accounts.
     *
     * Only the keys present in $fallback are stored, so a partial update (the
     * admin form is also auto-saved) can never wipe the rest of the record.
     * Passing an explicit empty string blanks that field for good rather than
     * silently restoring the environment value, and passing an empty `accounts`
     * list removes every account rather than resurrecting the environment one.
     *
     * @param  array<string, mixed>  $fallback
     */
    public static function setPaymentFallback(array $fallback): void
    {
        $stored = self::storedPaymentFallback();

        if (array_key_exists('enabled', $fallback)) {
            $stored['enabled'] = (bool) $fallback['enabled'];
        }

        if (array_key_exists('accounts', $fallback)) {
            $stored['accounts'] = self::normalizeAccountList($fallback['accounts']);

            // Drop the pre-list fields so a migrated record cannot resurrect the
            // old single account on the next read.
            foreach (self::PAYMENT_FALLBACK_ACCOUNT_FIELDS as $field) {
                unset($stored[$field]);
            }
        }

        $stringFields = [
            'instructions' => 500,
            'support_email' => 255,
            'reference_hint' => 160,
        ];

        foreach ($stringFields as $field => $maxLength) {
            if (! array_key_exists($field, $fallback)) {
                continue;
            }

            $value = mb_substr(trim((string) $fallback[$field]), 0, $maxLength);
            $stored[$field] = $field === 'support_email' ? strtolower($value) : $value;
        }

        AppSetting::setValue(self::PAYMENT_FALLBACK_KEY, json_encode($stored, JSON_UNESCAPED_SLASHES));
    }

    /**
     * The raw saved record, or an empty array when nothing has been saved yet.
     *
     * @return array<string, mixed>
     */
    private static function storedPaymentFallback(): array
    {
        $raw = AppSetting::getValue(self::PAYMENT_FALLBACK_KEY);

        if (! is_string($raw) || trim($raw) === '') {
            return [];
        }

        $decoded = json_decode($raw, true);

        return is_array($decoded) ? $decoded : [];
    }

    /**
     * Read the account list out of a stored record, accepting both the current
     * `accounts` list and the legacy flat single-account shape.
     *
     * @param  array<string, mixed>  $decoded
     * @param  array<int, array{bank_name: string, account_name: string, account_number: string}>  $defaultAccounts
     * @return array<int, array{bank_name: string, account_name: string, account_number: string}>
     */
    private static function resolveStoredAccounts(array $decoded, array $defaultAccounts): array
    {
        if (array_key_exists('accounts', $decoded)) {
            $raw = is_array($decoded['accounts']) ? $decoded['accounts'] : [];

            // An explicitly saved (even empty) list is authoritative. Returning
            // the environment default here would make deleting every account
            // silently impossible.
            return self::normalizeAccountList($raw);
        }

        $legacyAccount = self::legacyAccountFromRecord($decoded);

        if ($legacyAccount === null) {
            return $defaultAccounts;
        }

        return [$legacyAccount];
    }

    /**
     * Build a single account from the pre-list record shape, or null when the
     * record never stored any of those fields.
     *
     * @param  array<string, mixed>  $decoded
     * @return array{bank_name: string, account_name: string, account_number: string}|null
     */
    private static function legacyAccountFromRecord(array $decoded): ?array
    {
        $hasLegacyField = false;

        foreach (self::PAYMENT_FALLBACK_ACCOUNT_FIELDS as $field) {
            if (array_key_exists($field, $decoded)) {
                $hasLegacyField = true;
                break;
            }
        }

        if (! $hasLegacyField) {
            return null;
        }

        // Unset fields in a legacy record used to be filled from the environment.
        $defaults = self::defaultPaymentFallback()['accounts'][0] ?? self::blankAccount();

        return [
            'bank_name' => self::cleanAccountField($decoded['bank_name'] ?? $defaults['bank_name'], 120),
            'bank_code' => '',
            'account_name' => self::cleanAccountField($decoded['account_name'] ?? $defaults['account_name'], 120),
            'account_number' => mb_substr(
                self::sanitizeAccountNumber((string) ($decoded['account_number'] ?? $defaults['account_number'])),
                0,
                34,
            ),
        ];
    }

    /**
     * Normalise an arbitrary account list: coerce each entry to the known
     * fields, strip anything unsafe, and drop rows that are entirely blank so an
     * untouched "add another account" row never persists.
     *
     * @param  mixed  $raw
     * @return array<int, array{bank_name: string, account_name: string, account_number: string}>
     */
    private static function normalizeAccountList(mixed $raw): array
    {
        if (! is_array($raw)) {
            return [];
        }

        $accounts = [];

        foreach ($raw as $entry) {
            if (! is_array($entry)) {
                continue;
            }

            $account = [
                'bank_name' => self::cleanAccountField($entry['bank_name'] ?? '', 120),
                // The Paystack bank code, kept alongside the display name so the
                // account name can be re-resolved without asking the operator to
                // pick the bank again.
                'bank_code' => self::cleanAccountField($entry['bank_code'] ?? '', 20),
                'account_name' => self::cleanAccountField($entry['account_name'] ?? '', 120),
                'account_number' => mb_substr(
                    self::sanitizeAccountNumber((string) ($entry['account_number'] ?? '')),
                    0,
                    34,
                ),
            ];

            if ($account['bank_name'] === '' && $account['account_name'] === '' && $account['account_number'] === '') {
                continue;
            }

            $accounts[] = $account;
        }

        return $accounts;
    }

    /**
     * Whether an account has every field a customer needs to make a transfer.
     *
     * @param  array{bank_name: string, account_name: string, account_number: string}  $account
     */
    private static function accountIsComplete(array $account): bool
    {
        return $account['bank_name'] !== ''
            && $account['account_name'] !== ''
            && $account['account_number'] !== '';
    }

    /**
     * @return array{bank_name: string, bank_code: string, account_name: string, account_number: string}
     */
    private static function blankAccount(): array
    {
        return ['bank_name' => '', 'bank_code' => '', 'account_name' => '', 'account_number' => ''];
    }

    private static function cleanAccountField(mixed $value, int $maxLength): string
    {
        return mb_substr(trim((string) $value), 0, $maxLength);
    }

    /**
     * Whether the bank-transfer fallback can actually be offered to a customer,
     * and which accounts are safe to show.
     *
     * Incomplete accounts are filtered out here rather than at each call site, so
     * no consumer can accidentally render a half-configured bank account.
     *
     * @return array{enabled: bool, accounts: array<int, array{bank_name: string, account_name: string, account_number: string}>, instructions: string, support_email: string, reference_hint: string}
     */
    public static function usablePaymentFallback(): array
    {
        $fallback = self::paymentFallback();

        $usableAccounts = array_values(array_filter(
            $fallback['accounts'],
            static fn (array $account): bool => self::accountIsComplete($account),
        ));

        // array_merge (not +): the computed value must win over the stored
        // "enabled" flag, otherwise an incomplete account would still be offered.
        return array_merge($fallback, [
            'enabled' => $fallback['enabled'] && $usableAccounts !== [],
            'accounts' => $usableAccounts,
        ]);
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
                'seo_modules_functions' => [
                    'path' => '/seo-modules-and-functions',
                    'meta_title' => 'SEO Modules and Functions | Bellah Options',
                    'meta_description' => 'Explore Bellah Options SEO modules and core functions for technical health, content visibility, and search growth.',
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
            'invoice_deleted' => [
                'name' => 'Invoice Deleted (Apology)',
                'subject_template' => 'Regarding invoice {{invoice_number}}',
                'from_email' => '',
                'html_template' => '',
                'builder_layout' => [],
            ],
            'invoice_commission_invalidated' => [
                'name' => 'Invoice Commission Invalidated',
                'subject_template' => 'Commission voided: invoice {{invoice_number}} was deleted',
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
            'questionnaire_request' => [
                'name' => 'Questionnaire Request',
                'subject_template' => 'Tell us about your {{service_name}} experience',
                'from_email' => '',
                'html_template' => '',
                'builder_layout' => [],
            ],
            'service_brief_received' => [
                'name' => 'Service Brief Received',
                'subject_template' => "We've received your brief — {{reference_number}}",
                'from_email' => '',
                'html_template' => '',
                'builder_layout' => [],
            ],
            'service_brief_admin_alert' => [
                'name' => 'Service Brief Admin Alert',
                'subject_template' => 'New brief: {{reference_number}} ({{service_name}})',
                'from_email' => '',
                'html_template' => '',
                'builder_layout' => [],
            ],
            'service_brief_request' => [
                'name' => 'Service Brief Request',
                'subject_template' => 'Tell us more about your {{service_name}} project',
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
     * Environment-provided defaults, so existing installs keep working until a
     * super admin saves the settings screen.
     *
     * The environment can only ever describe one account, so it seeds a
     * single-entry list. When it carries no bank details at all the list is left
     * empty rather than seeded with a blank account.
     *
     * @return array{enabled: bool, accounts: array<int, array{bank_name: string, account_name: string, account_number: string}>, instructions: string, support_email: string, reference_hint: string}
     */
    private static function defaultPaymentFallback(): array
    {
        $account = [
            'bank_name' => trim((string) config('bellah.payment.transfer.bank_name', '')),
            // The environment has no bank code, so name resolution stays
            // unavailable until an operator picks the bank in the settings screen.
            'bank_code' => '',
            'account_name' => trim((string) config('bellah.payment.transfer.account_name', '')),
            'account_number' => self::sanitizeAccountNumber((string) config('bellah.payment.transfer.account_number', '')),
        ];

        return [
            'enabled' => (bool) config('bellah.payment.transfer.enabled', true),
            'accounts' => self::accountIsComplete($account) ? [$account] : [],
            'instructions' => trim((string) config('bellah.payment.transfer.instructions', '')),
            'support_email' => strtolower(trim((string) config('bellah.invoice.company_email', 'support@bellahoptions.com'))),
            'reference_hint' => trim((string) config('bellah.payment.transfer.reference_hint', 'Use your order code or invoice number as the transfer reference.')),
        ];
    }

    /**
     * Strip everything a customer must never be shown in a bank account field.
     */
    private static function sanitizeAccountNumber(string $accountNumber): string
    {
        $digits = preg_replace('/[^0-9]/', '', $accountNumber) ?? '';

        return $digits;
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
