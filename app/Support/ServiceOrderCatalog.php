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
        $overrides = PlatformSettings::servicePriceOverrides();

        foreach ($overrides as $serviceSlug => $packagePrices) {
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
}
