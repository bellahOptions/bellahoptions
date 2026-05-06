<?php

namespace App\Support;

class ServiceOrderCatalog
{
    /**
     * @return array<string, mixed>
     */
    public function all(): array
    {
        /** @var array<string, array<string, mixed>> $services */
        $services = (array) config('service_orders.services', []);
        $legacyPriceOverrides = PlatformSettings::servicePriceOverrides();
        $packageOverrides = PlatformSettings::servicePackageOverrides();

        foreach ($legacyPriceOverrides as $serviceSlug => $packagePrices) {
            if (! isset($services[$serviceSlug]) || ! is_array($packagePrices)) {
                continue;
            }

            foreach ($packagePrices as $packageCode => $overridePrice) {
                if (! isset($services[$serviceSlug]['packages'][$packageCode]) || ! is_numeric($overridePrice)) {
                    continue;
                }

                $resolvedPrice = round((float) $overridePrice, 2);

                if ($resolvedPrice <= 0) {
                    continue;
                }

                $services[$serviceSlug]['packages'][$packageCode]['price'] = $resolvedPrice;
            }
        }

        foreach ($packageOverrides as $serviceSlug => $packages) {
            if (! isset($services[$serviceSlug]) || ! is_array($packages)) {
                continue;
            }

            foreach ($packages as $packageCode => $payload) {
                if (
                    ! isset($services[$serviceSlug]['packages'][$packageCode])
                    || ! is_array($services[$serviceSlug]['packages'][$packageCode])
                    || ! is_array($payload)
                ) {
                    continue;
                }

                $price = is_numeric($payload['price'] ?? null) ? round((float) $payload['price'], 2) : null;
                $discountPrice = is_numeric($payload['discount_price'] ?? null) ? round((float) $payload['discount_price'], 2) : null;
                $features = is_array($payload['features'] ?? null) ? array_values($payload['features']) : [];

                if ($price !== null && $price > 0) {
                    $services[$serviceSlug]['packages'][$packageCode]['price'] = $price;
                }

                if (
                    $discountPrice !== null
                    && $discountPrice > 0
                    && $discountPrice < (float) ($services[$serviceSlug]['packages'][$packageCode]['price'] ?? 0)
                ) {
                    $services[$serviceSlug]['packages'][$packageCode]['original_price'] = (float) ($services[$serviceSlug]['packages'][$packageCode]['price'] ?? 0);
                    $services[$serviceSlug]['packages'][$packageCode]['price'] = $discountPrice;
                    $services[$serviceSlug]['packages'][$packageCode]['discount_price'] = $discountPrice;
                } else {
                    $services[$serviceSlug]['packages'][$packageCode]['discount_price'] = null;
                }

                $services[$serviceSlug]['packages'][$packageCode]['is_recommended'] = (bool) ($payload['is_recommended'] ?? false);
                $services[$serviceSlug]['packages'][$packageCode]['features'] = $features;

                if (is_string($payload['description'] ?? null) && trim((string) $payload['description']) !== '') {
                    $services[$serviceSlug]['packages'][$packageCode]['description'] = trim((string) $payload['description']);
                }
            }
        }

        $graphicItems = PlatformSettings::graphicDesignItems();
        if ($graphicItems !== [] && isset($services['graphic-design']) && is_array($services['graphic-design'])) {
            $packages = [];

            foreach ($graphicItems as $item) {
                $itemId = trim((string) ($item['id'] ?? ''));
                $title = trim((string) ($item['title'] ?? ''));
                $price = round((float) ($item['unit_price'] ?? 0), 2);

                if ($itemId === '' || $title === '' || $price <= 0) {
                    continue;
                }

                $packageCode = 'graphic-item-'.$itemId;
                $packages[$packageCode] = [
                    'name' => $title,
                    'price' => $price,
                    'description' => trim((string) ($item['description'] ?? '')),
                    'sample_image' => $item['image_path'] ?? null,
                    'is_recommended' => false,
                    'features' => [],
                ];
            }

            if ($packages !== []) {
                $services['graphic-design']['packages'] = $packages;
            }
        }

        return $services;
    }

    /**
     * @return array<string, mixed>|null
     */
    public function service(string $serviceSlug): ?array
    {
        $services = $this->all();

        return isset($services[$serviceSlug]) && is_array($services[$serviceSlug])
            ? $services[$serviceSlug]
            : null;
    }

    /**
     * @return array<string, mixed>|null
     */
    public function package(string $serviceSlug, string $packageCode): ?array
    {
        $service = $this->service($serviceSlug);

        if (! is_array($service)) {
            return null;
        }

        $packages = (array) ($service['packages'] ?? []);

        return isset($packages[$packageCode]) && is_array($packages[$packageCode])
            ? $packages[$packageCode]
            : null;
    }

    /**
     * @return array<int, string>
     */
    public function packageCodes(string $serviceSlug): array
    {
        $service = $this->service($serviceSlug);

        if (! is_array($service)) {
            return [];
        }

        return array_values(array_keys((array) ($service['packages'] ?? [])));
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function intakeFields(string $serviceSlug): array
    {
        $service = $this->service($serviceSlug);

        if (! is_array($service)) {
            return [];
        }

        $fields = $service['intake'] ?? [];

        if (! is_array($fields)) {
            return [];
        }

        return array_values(array_filter($fields, static fn (mixed $field): bool => is_array($field) && isset($field['name'])));
    }

    /**
     * @return array<string, string>
     */
    public function intakeFieldLabels(string $serviceSlug): array
    {
        $labels = [];

        foreach ($this->intakeFields($serviceSlug) as $field) {
            $name = (string) ($field['name'] ?? '');

            if ($name === '') {
                continue;
            }

            $labels[$name] = (string) ($field['label'] ?? ucfirst(str_replace('_', ' ', $name)));
        }

        return $labels;
    }

    /**
     * @return array<string, array<string, mixed>>
     */
    public function logoAddons(): array
    {
        /** @var array<string, array<string, mixed>> $addons */
        $addons = (array) config('service_orders.logo_addons', []);

        return $addons;
    }

    /**
     * @return array<string, mixed>|null
     */
    public function logoAddon(string $packageCode): ?array
    {
        $addons = $this->logoAddons();

        return isset($addons[$packageCode]) && is_array($addons[$packageCode])
            ? $addons[$packageCode]
            : null;
    }
}
