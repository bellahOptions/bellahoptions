<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateServicePricingRequest;
use App\Support\PlatformSettings;
use App\Support\ServiceOrderCatalog;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class ServicePricingController extends Controller
{
    public function edit(string $serviceSlug, ServiceOrderCatalog $catalog): Response
    {
        $allServices = $catalog->all();
        $service = $allServices[$serviceSlug] ?? null;
        abort_unless(is_array($service), 404);

        $packageOverrides = PlatformSettings::servicePackageOverrides();

        return Inertia::render('Admin/ServicePricing/Show', [
            'serviceSlug' => $serviceSlug,
            'services' => collect($allServices)
                ->map(fn (array $entry, string $slug): array => [
                    'slug' => $slug,
                    'name' => (string) ($entry['name'] ?? ucfirst($slug)),
                ])
                ->values(),
            'service' => [
                'slug' => $serviceSlug,
                'name' => (string) ($service['name'] ?? ucfirst($serviceSlug)),
                'description' => (string) ($service['description'] ?? ''),
                'packages' => collect((array) ($service['packages'] ?? []))
                    ->map(function (array $package, string $code): array {
                        return [
                            'code' => $code,
                            'name' => (string) ($package['name'] ?? ucfirst($code)),
                            'price' => round((float) ($package['original_price'] ?? $package['price'] ?? 0), 2),
                            'description' => (string) ($package['description'] ?? ''),
                            'discount_price' => isset($package['discount_price']) && is_numeric($package['discount_price'])
                                ? round((float) $package['discount_price'], 2)
                                : null,
                            'is_recommended' => (bool) ($package['is_recommended'] ?? false),
                            'features' => is_array($package['features'] ?? null) ? array_values($package['features']) : [],
                            'sample_image' => $package['sample_image'] ?? null,
                        ];
                    })
                    ->values(),
            ],
            'packageOverrides' => $packageOverrides[$serviceSlug] ?? [],
            'graphicDesignItems' => $serviceSlug === 'graphic-design' ? PlatformSettings::graphicDesignItems() : null,
            'socialGraphicTrialFeeNgn' => in_array($serviceSlug, ['social-media-design', 'graphic-design'], true)
                ? PlatformSettings::socialGraphicTrialFeeNgn()
                : null,
        ]);
    }

    public function update(UpdateServicePricingRequest $request, string $serviceSlug, ServiceOrderCatalog $catalog): RedirectResponse
    {
        abort_unless(is_array($catalog->service($serviceSlug)), 404);

        $payload = $request->validated();

        if ($serviceSlug !== 'graphic-design') {
            $existingOverrides = PlatformSettings::servicePackageOverrides();
            $existingOverrides[$serviceSlug] = (array) ($payload['package_overrides'] ?? []);
            PlatformSettings::setServicePackageOverrides($existingOverrides);
        }

        if ($serviceSlug === 'graphic-design') {
            PlatformSettings::setGraphicDesignItems((array) ($payload['graphic_design_items'] ?? []));
        }

        if (in_array($serviceSlug, ['social-media-design', 'graphic-design'], true) && array_key_exists('social_graphic_trial_fee_ngn', $payload)) {
            PlatformSettings::setSocialGraphicTrialFeeNgn((float) $payload['social_graphic_trial_fee_ngn']);
        }

        return back()->with('success', 'Service pricing updated successfully.');
    }
}
