<?php

namespace Tests\Feature;

use App\Models\AppSetting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Crawler-facing behaviour: structured data, robots policy and noindex headers.
 *
 * Header assertions use lowercase names because TestResponse::assertHeader()
 * looks the header up in the raw (case-preserving) header bag.
 */
class PublicSeoHeadTagsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        AppSetting::setValue('main_website_uri', 'https://bellahoptions.com');
    }

    public function test_home_emits_organization_and_website_structured_data(): void
    {
        $this->withoutVite();

        $html = $this->get('/')->assertOk()->getContent();

        $decoded = json_decode($this->extractJsonLd($html), true);

        $this->assertIsArray($decoded, 'JSON-LD payload should decode: '.json_last_error_msg());
        $this->assertSame('https://schema.org', $decoded['@context']);

        $types = array_column($decoded['@graph'] ?? [], '@type');
        $this->assertContains('Organization', $types);
        $this->assertContains('WebSite', $types);

        $organization = collect($decoded['@graph'])->firstWhere('@type', 'Organization');
        $this->assertSame('https://bellahoptions.com/#organization', $organization['@id']);
        $this->assertSame('https://bellahoptions.com', $organization['url']);
    }

    public function test_inner_pages_emit_a_breadcrumb_list(): void
    {
        $this->withoutVite();

        $html = $this->get('/faqs')->assertOk()->getContent();

        $decoded = json_decode($this->extractJsonLd($html), true);

        $breadcrumbs = collect($decoded['@graph'] ?? [])->firstWhere('@type', 'BreadcrumbList');
        $this->assertIsArray($breadcrumbs);
        $this->assertSame('Home', $breadcrumbs['itemListElement'][0]['name']);
        $this->assertSame('https://bellahoptions.com', $breadcrumbs['itemListElement'][0]['item']);

        // The requested page is the final crumb.
        $last = end($breadcrumbs['itemListElement']);
        $this->assertSame('https://bellahoptions.com/faqs', $last['item']);
    }

    public function test_public_pages_are_indexable_and_do_not_send_a_noindex_header(): void
    {
        $this->withoutVite();

        $this->get('/')
            ->assertOk()
            ->assertHeaderMissing('x-robots-tag');
    }

    public function test_private_screens_are_marked_noindex_by_header(): void
    {
        $this->withoutVite();

        $this->get(route('login'))
            ->assertOk()
            ->assertHeader('x-robots-tag', 'noindex, nofollow');

        // Even the redirect a guest gets away from /dashboard stays noindex.
        $this->get('/dashboard')
            ->assertRedirect()
            ->assertHeader('x-robots-tag', 'noindex, nofollow');
    }

    public function test_error_responses_are_marked_noindex(): void
    {
        $this->withoutVite();

        $this->get('/this-page-does-not-exist')
            ->assertNotFound()
            ->assertHeader('x-robots-tag', 'noindex, nofollow');
    }

    public function test_robots_route_and_static_copy_agree_on_the_sitemap(): void
    {
        $routeRobots = $this->get('/robots.txt')->assertOk()->getContent();
        $staticRobots = (string) file_get_contents(public_path('robots.txt'));

        $this->assertStringContainsString('Sitemap: https://bellahoptions.com/sitemap.xml', $routeRobots);
        $this->assertStringContainsString('Sitemap: https://bellahoptions.com/sitemap.xml', $staticRobots);
        $this->assertStringContainsString('Disallow: /admin', $routeRobots);
        $this->assertStringContainsString('Disallow: /admin', $staticRobots);

        // The deprecated Host: directive must not come back.
        $this->assertStringNotContainsString('Host:', $routeRobots);
    }

    public function test_fallback_challenge_endpoint_is_not_indexable(): void
    {
        $this->withoutVite();

        $this->get(route('human-verification.fallback'))
            ->assertHeader('x-robots-tag', 'noindex, nofollow');
    }

    private function extractJsonLd(string $html): string
    {
        $matched = preg_match(
            '/<script type="application\/ld\+json">(.*?)<\/script>/s',
            $html,
            $matches,
        );

        $this->assertSame(1, $matched, 'Expected a JSON-LD script tag in the response.');

        return trim($matches[1]);
    }
}
