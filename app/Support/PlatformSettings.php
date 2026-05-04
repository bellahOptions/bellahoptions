<?php

namespace App\Support;

use App\Models\AppSetting;

class PlatformSettings
{
    private const CONTACT_INFO_KEY = 'default_contact_info_json';

    private const HOME_SLIDES_KEY = 'home_slides_json';

    private const SERVICE_PRICE_OVERRIDES_KEY = 'service_price_overrides_json';

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

    private static function defaultSiteUrl(): string
    {
        $configured = trim((string) config('app.url', 'http://localhost'));

        return self::normalizeHttpUrl($configured, 'http://localhost');
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
}
