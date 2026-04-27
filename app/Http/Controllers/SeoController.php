<?php

namespace App\Http\Controllers;

use App\Support\PlatformSettings;
use App\Support\ServiceOrderCatalog;
use Illuminate\Http\Response;

class SeoController extends Controller
{
    /**
     * @var array<int, string>
     */
    private const SERVICE_LANDING_SLUGS = [
        'graphic-design',
        'brand-design',
        'web-design',
        'mobile-app-development',
        'ui-ux',
    ];

    public function sitemap(ServiceOrderCatalog $serviceOrderCatalog): Response
    {
        $baseUrl = PlatformSettings::siteUrl();
        $now = now()->toAtomString();
        $entries = [];

        $append = function (string $path, string $changeFrequency, string $priority) use (&$entries, $baseUrl, $now): void {
            $entries[] = [
                'loc' => $this->absoluteUrl($baseUrl, $path),
                'lastmod' => $now,
                'changefreq' => $changeFrequency,
                'priority' => $priority,
            ];
        };

        $append('/', 'daily', '1.0');
        $append('/services', 'weekly', '0.95');
        $append('/about-us', 'monthly', '0.80');
        $append('/gallery', 'weekly', '0.85');
        $append('/contact-us', 'weekly', '0.80');
        $append('/waitlist', 'weekly', '0.60');
        $append('/terms-of-service', 'yearly', '0.40');
        $append('/smm-form', 'weekly', '0.88');

        foreach (self::SERVICE_LANDING_SLUGS as $serviceSlug) {
            $append('/services/'.$serviceSlug, 'weekly', '0.90');
        }

        foreach (array_keys($serviceOrderCatalog->all()) as $serviceSlug) {
            if (! is_string($serviceSlug) || trim($serviceSlug) === '') {
                continue;
            }

            $append('/order/'.$serviceSlug, 'weekly', '0.88');
        }

        $urlMap = [];
        foreach ($entries as $entry) {
            $urlMap[(string) $entry['loc']] = $entry;
        }

        $xml = [];
        $xml[] = '<?xml version="1.0" encoding="UTF-8"?>';
        $xml[] = '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';

        foreach ($urlMap as $entry) {
            $xml[] = '  <url>';
            $xml[] = '    <loc>'.$this->xmlEscape((string) $entry['loc']).'</loc>';
            $xml[] = '    <lastmod>'.$this->xmlEscape((string) $entry['lastmod']).'</lastmod>';
            $xml[] = '    <changefreq>'.$this->xmlEscape((string) $entry['changefreq']).'</changefreq>';
            $xml[] = '    <priority>'.$this->xmlEscape((string) $entry['priority']).'</priority>';
            $xml[] = '  </url>';
        }

        $xml[] = '</urlset>';

        return response(implode("\n", $xml), 200, [
            'Content-Type' => 'application/xml; charset=UTF-8',
            'X-Robots-Tag' => 'noarchive',
        ]);
    }

    public function robots(): Response
    {
        $baseUrl = PlatformSettings::siteUrl();
        $host = parse_url($baseUrl, PHP_URL_HOST) ?: parse_url((string) config('app.url'), PHP_URL_HOST);

        $lines = [
            'User-agent: *',
            'Allow: /',
            '',
            'Disallow: /admin',
            'Disallow: /dashboard',
            'Disallow: /profile',
            'Disallow: /orders/',
            '',
            'Sitemap: '.$this->absoluteUrl($baseUrl, '/sitemap.xml'),
        ];

        if (is_string($host) && trim($host) !== '') {
            $lines[] = 'Host: '.trim($host);
        }

        return response(implode("\n", $lines)."\n", 200, [
            'Content-Type' => 'text/plain; charset=UTF-8',
        ]);
    }

    public function llms(ServiceOrderCatalog $serviceOrderCatalog): Response
    {
        $baseUrl = PlatformSettings::siteUrl();
        $contactInfo = PlatformSettings::contactInfo();

        $lines = [
            '# Bellah Options',
            '',
            'Main URL: '.$baseUrl,
            'Sitemap: '.$this->absoluteUrl($baseUrl, '/sitemap.xml'),
            'Robots: '.$this->absoluteUrl($baseUrl, '/robots.txt'),
            'LLMs File: '.$this->absoluteUrl($baseUrl, '/llms.txt'),
            '',
            'Summary:',
            'Bellah Options is a creative-tech agency offering brand design, graphic design, web design, mobile app development, and UI/UX services.',
            '',
            'Primary Public Pages:',
            '- Home: '.$this->absoluteUrl($baseUrl, '/'),
            '- Services: '.$this->absoluteUrl($baseUrl, '/services'),
            '- About Us: '.$this->absoluteUrl($baseUrl, '/about-us'),
            '- Gallery: '.$this->absoluteUrl($baseUrl, '/gallery'),
            '- Contact Us: '.$this->absoluteUrl($baseUrl, '/contact-us'),
            '',
            'Service Landing Pages:',
        ];

        foreach (self::SERVICE_LANDING_SLUGS as $serviceSlug) {
            $lines[] = '- '.$this->absoluteUrl($baseUrl, '/services/'.$serviceSlug);
        }

        $lines[] = '';
        $lines[] = 'Service Order Pages:';
        foreach (array_keys($serviceOrderCatalog->all()) as $serviceSlug) {
            if (! is_string($serviceSlug) || trim($serviceSlug) === '') {
                continue;
            }

            $lines[] = '- '.$this->absoluteUrl($baseUrl, '/order/'.$serviceSlug);
        }

        $lines[] = '';
        $lines[] = 'Contact Details:';
        $lines[] = '- Email: '.($contactInfo['email'] ?? '');
        $lines[] = '- Phone: '.($contactInfo['phone'] ?? '');
        $lines[] = '- WhatsApp: '.($contactInfo['whatsapp_url'] ?? '');
        $lines[] = '';
        $lines[] = 'LLM Usage Guidance:';
        $lines[] = '- Prioritize URLs listed in this file for current public information.';
        $lines[] = '- Use the sitemap for broad crawling coverage.';
        $lines[] = '- Do not assume pricing; reference live order pages.';
        $lines[] = '- If details are unclear, direct users to Contact Us for confirmation.';
        $lines[] = '- Last Updated: '.now('UTC')->toDateTimeString().' UTC';

        return response(implode("\n", $lines)."\n", 200, [
            'Content-Type' => 'text/plain; charset=UTF-8',
            'X-Robots-Tag' => 'index, follow',
        ]);
    }

    private function absoluteUrl(string $baseUrl, string $path): string
    {
        $base = rtrim(trim($baseUrl), '/');
        $normalizedPath = trim($path);

        if ($normalizedPath === '' || $normalizedPath === '/') {
            return $base;
        }

        return $base.'/'.ltrim($normalizedPath, '/');
    }

    private function xmlEscape(string $value): string
    {
        return htmlspecialchars($value, ENT_XML1 | ENT_COMPAT, 'UTF-8');
    }
}
