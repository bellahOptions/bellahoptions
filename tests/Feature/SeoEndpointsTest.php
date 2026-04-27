<?php

namespace Tests\Feature;

use App\Models\AppSetting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SeoEndpointsTest extends TestCase
{
    use RefreshDatabase;

    public function test_sitemap_uses_admin_defined_main_website_uri(): void
    {
        AppSetting::setValue('main_website_uri', 'https://bellahoptions.com');

        $this->get('/sitemap.xml')
            ->assertOk()
            ->assertHeader('Content-Type', 'application/xml; charset=UTF-8')
            ->assertSee('<?xml version="1.0" encoding="UTF-8"?>', false)
            ->assertSee('<loc>https://bellahoptions.com</loc>', false)
            ->assertSee('<loc>https://bellahoptions.com/services</loc>', false);
    }

    public function test_robots_and_llms_reference_configured_website_uri(): void
    {
        AppSetting::setValue('main_website_uri', 'https://bellahoptions.com');

        $this->get('/robots.txt')
            ->assertOk()
            ->assertHeader('Content-Type', 'text/plain; charset=UTF-8')
            ->assertSee('Sitemap: https://bellahoptions.com/sitemap.xml');

        $this->get('/llms.txt')
            ->assertOk()
            ->assertHeader('Content-Type', 'text/plain; charset=UTF-8')
            ->assertSee('Main URL: https://bellahoptions.com')
            ->assertSee('Sitemap: https://bellahoptions.com/sitemap.xml')
            ->assertSee('Primary Public Pages:');
    }
}

