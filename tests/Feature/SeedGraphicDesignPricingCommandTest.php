<?php

namespace Tests\Feature;

use App\Support\PlatformSettings;
use App\Support\ServiceOrderCatalog;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SeedGraphicDesignPricingCommandTest extends TestCase
{
    use RefreshDatabase;

    public function test_seeds_priced_items_replacing_the_flat_custom_quote_package(): void
    {
        $this->artisan('service-pricing:seed-graphic-design')->assertExitCode(0);

        $items = PlatformSettings::graphicDesignItems();
        $this->assertCount(7, $items);

        $titles = array_column($items, 'title');
        $this->assertContains('Printable Fliers/Posters', $titles);
        $this->assertContains('Banners', $titles);
        $this->assertContains('BRT/Vehicle Wrap', $titles);
        $this->assertContains('Multimedia', $titles);
        $this->assertContains('OOH Banner (5 Square Metres and Below)', $titles);
        $this->assertContains('OOH Banner (Above 5 Square Metres)', $titles);
        $this->assertContains('Brand Merchandise/Commercial Design', $titles);

        $prices = array_column($items, 'unit_price', 'title');
        $this->assertSame(15000.0, $prices['Printable Fliers/Posters']);
        $this->assertSame(15000.0, $prices['Banners']);
        $this->assertSame(30000.0, $prices['BRT/Vehicle Wrap']);
        $this->assertSame(120000.0, $prices['Multimedia']);
        $this->assertSame(40000.0, $prices['OOH Banner (5 Square Metres and Below)']);
        $this->assertSame(80000.0, $prices['OOH Banner (Above 5 Square Metres)']);
        $this->assertSame(50000.0, $prices['Brand Merchandise/Commercial Design']);

        $packages = app(ServiceOrderCatalog::class)->service('graphic-design')['packages'];
        $this->assertCount(7, $packages);
        $this->assertArrayNotHasKey('custom-quote', $packages);

        foreach ($packages as $package) {
            $this->assertGreaterThan(0, $package['price']);
            $this->assertTrue($package['is_quantity_priced'] ?? false);
        }
    }

    public function test_running_it_again_without_force_does_not_overwrite_existing_items(): void
    {
        PlatformSettings::setGraphicDesignItems([
            ['title' => 'Custom Admin Item', 'description' => '', 'unit_price' => 99999],
        ]);

        $this->artisan('service-pricing:seed-graphic-design')->assertExitCode(0);

        $items = PlatformSettings::graphicDesignItems();
        $this->assertCount(1, $items);
        $this->assertSame('Custom Admin Item', $items[0]['title']);
    }

    public function test_force_flag_overwrites_existing_items(): void
    {
        PlatformSettings::setGraphicDesignItems([
            ['title' => 'Custom Admin Item', 'description' => '', 'unit_price' => 99999],
        ]);

        $this->artisan('service-pricing:seed-graphic-design', ['--force' => true])->assertExitCode(0);

        $items = PlatformSettings::graphicDesignItems();
        $this->assertCount(7, $items);
        $this->assertNotContains('Custom Admin Item', array_column($items, 'title'));
    }
}
