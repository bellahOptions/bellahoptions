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
    public function edit(ServiceOrderCatalog $catalog): Response
    {
        $services = $catalog->all();
        $packageOverrides = PlatformSettings::servicePackageOverrides();

        return Inertia::render('Admin/ServicePricing/Index', [
            'services' => collect($services)
                ->map(function (array $service, string $slug): array {
                    return [
                        'slug' => $slug,
                        'name' => (string) ($service['name'] ?? ucfirst($slug)),
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
                    ];
                })
                ->values(),
            'packageOverrides' => $packageOverrides,
            'graphicDesignItems' => PlatformSettings::graphicDesignItems(),
        ]);
    }

    public function update(UpdateServicePricingRequest $request): RedirectResponse
    {
        $payload = $request->validated();

        PlatformSettings::setServicePackageOverrides((array) ($payload['package_overrides'] ?? []));
        PlatformSettings::setGraphicDesignItems((array) ($payload['graphic_design_items'] ?? []));

        return back()->with('success', 'Service pricing updated successfully.');
    }
}
