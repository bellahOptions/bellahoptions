<?php

namespace App\Console\Commands;

use App\Support\PlatformSettings;
use Illuminate\Console\Command;

class SeedGraphicDesignPricing extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'service-pricing:seed-graphic-design {--force : Overwrite existing graphic design items instead of skipping}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'One-time seed: replace the flat ₦0 "Custom Quote" placeholder on the Graphic Design service with priced, selectable design-type packages.';

    /**
     * @var array<int, array{title: string, description: string, unit_price: float}>
     */
    private const DEFAULT_ITEMS = [
        [
            'title' => 'Printable Fliers/Posters',
            'description' => 'Print-ready flier or poster design for promotions, events, or campaigns.',
            'unit_price' => 15000,
        ],
        [
            'title' => 'Banners',
            'description' => 'Roll-up, pull-up, or wall banner design sized to your specification.',
            'unit_price' => 15000,
        ],
        [
            'title' => 'BRT/Vehicle Wrap',
            'description' => 'Design for BRT bus or vehicle wrap advertising.',
            'unit_price' => 30000,
        ],
        [
            'title' => 'Multimedia',
            'description' => 'Design for digital/multimedia outdoor advertisement screens.',
            'unit_price' => 120000,
        ],
        [
            'title' => 'OOH Banner (5 Square Metres and Below)',
            'description' => 'Out-of-home banner design, 5 square metres or smaller.',
            'unit_price' => 40000,
        ],
        [
            'title' => 'OOH Banner (Above 5 Square Metres)',
            'description' => 'Out-of-home banner design, larger than 5 square metres.',
            'unit_price' => 80000,
        ],
        [
            'title' => 'Brand Merchandise/Commercial Design',
            'description' => 'Design for branded merchandise and commercial print items (apparel, packaging, promotional items).',
            'unit_price' => 50000,
        ],
    ];

    public function handle(): int
    {
        $existing = PlatformSettings::graphicDesignItems();
        $force = (bool) $this->option('force');

        if ($existing !== [] && ! $force) {
            $this->info('Graphic design items are already configured ('.count($existing).' item(s)). Nothing to do.');
            $this->comment('Re-run with --force to replace them, or manage items directly under Admin > Service Pricing.');

            return self::SUCCESS;
        }

        PlatformSettings::setGraphicDesignItems(self::DEFAULT_ITEMS);

        $this->info('Seeded '.count(self::DEFAULT_ITEMS).' graphic design item(s):');

        foreach (self::DEFAULT_ITEMS as $item) {
            $this->line(sprintf('  - %s — ₦%s', $item['title'], number_format($item['unit_price'], 2)));
        }

        $this->newLine();
        $this->comment('Add, edit, or remove items any time under Admin > Service Pricing.');

        return self::SUCCESS;
    }
}
