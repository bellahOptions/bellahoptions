<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreDiscountCodeRequest;
use App\Http\Requests\Admin\StoreSubscriptionPlanRequest;
use App\Http\Requests\Admin\ToggleDiscountCodeStatusRequest;
use App\Http\Requests\Admin\UpdatePlatformSettingsRequest;
use App\Http\Requests\Admin\UpdateSubscriptionPlanRequest;
use App\Models\AppSetting;
use App\Models\DiscountCode;
use App\Models\ServiceOrder;
use App\Models\SubscriptionPlan;
use App\Support\PlatformSettings;
use App\Support\ServiceOrderCatalog;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class SettingController extends Controller
{
    public function edit(ServiceOrderCatalog $catalog): Response
    {
        $contactInfo = PlatformSettings::contactInfo();
        $serviceCatalog = $catalog->all();
        $activeDiscountCodes = $this->activeDiscountCodes();
        $paidSubscriptionCounts = $this->paidSubscriptionCounts();

        return Inertia::render('Admin/Settings', [
            'settings' => [
                'maintenance_mode' => AppSetting::getBool('maintenance_mode'),
                'coming_soon_mode' => AppSetting::getBool('coming_soon_mode'),
                'website_uri' => PlatformSettings::siteUrl(),
                'contact_phone' => $contactInfo['phone'],
                'contact_email' => $contactInfo['email'],
                'contact_location' => $contactInfo['location'],
                'contact_whatsapp_url' => $contactInfo['whatsapp_url'],
                'contact_behance_url' => $contactInfo['behance_url'],
                'contact_map_embed_url' => $contactInfo['map_embed_url'],
                'home_slides' => PlatformSettings::homeSlides(),
            ],
            'serviceCatalog' => $this->serviceCatalogMeta($serviceCatalog),
            'servicePrices' => $this->servicePricingValues($serviceCatalog),
            'discountCodes' => DiscountCode::query()
                ->latest('id')
                ->get()
                ->map(fn (DiscountCode $discount): array => [
                    'id' => $discount->id,
                    'name' => $discount->name,
                    'code' => $discount->code,
                    'discount_type' => $discount->discount_type,
                    'discount_value' => (string) $discount->discount_value,
                    'currency' => $discount->currency,
                    'is_active' => (bool) $discount->is_active,
                    'service_slug' => $discount->service_slug,
                    'package_code' => $discount->package_code,
                    'max_redemptions' => $discount->max_redemptions,
                    'total_redemptions' => (int) $discount->total_redemptions,
                    'starts_at' => $discount->starts_at?->toDateString(),
                    'ends_at' => $discount->ends_at?->toDateString(),
                    'discount_link' => $this->discountLink($discount),
                ])
                ->values(),
            'subscriptionPlans' => SubscriptionPlan::query()
                ->orderByDesc('is_homepage_featured')
                ->orderByDesc('is_recommended')
                ->orderBy('position')
                ->orderBy('id')
                ->get()
                ->map(function (SubscriptionPlan $plan) use ($activeDiscountCodes, $paidSubscriptionCounts, $serviceCatalog): array {
                    $serviceName = (string) data_get($serviceCatalog, $plan->service_slug.'.name', ucfirst((string) $plan->service_slug));
                    $packageName = (string) data_get($serviceCatalog, $plan->service_slug.'.packages.'.$plan->package_code.'.name', ucfirst((string) $plan->package_code));
                    $basePrice = round((float) data_get($serviceCatalog, $plan->service_slug.'.packages.'.$plan->package_code.'.price', 0), 2);

                    $bestDiscount = null;
                    if ($basePrice > 0) {
                        $bestDiscount = $this->bestDiscountForPlan(
                            $activeDiscountCodes,
                            (string) $plan->service_slug,
                            (string) $plan->package_code,
                            $basePrice,
                            strtoupper((string) config('bellah.invoice.currency', 'NGN')),
                        );
                    }

                    return [
                        'id' => $plan->id,
                        'name' => $plan->name,
                        'service_slug' => $plan->service_slug,
                        'service_name' => $serviceName,
                        'package_code' => $plan->package_code,
                        'package_name' => $packageName,
                        'short_description' => $plan->short_description,
                        'billing_cycle' => $plan->billing_cycle,
                        'position' => (int) $plan->position,
                        'is_active' => (bool) $plan->is_active,
                        'show_on_homepage' => (bool) $plan->show_on_homepage,
                        'is_homepage_featured' => (bool) $plan->is_homepage_featured,
                        'is_recommended' => (bool) $plan->is_recommended,
                        'paid_subscriptions' => (int) ($paidSubscriptionCounts[$this->pairKey((string) $plan->service_slug, (string) $plan->package_code)] ?? 0),
                        'active_discount_code' => $bestDiscount?->code,
                        'active_discount_summary' => $bestDiscount ? $this->discountSummary($bestDiscount) : null,
                        'checkout_link' => $this->planCheckoutLink($plan, $bestDiscount?->code),
                    ];
                })
                ->values(),
        ]);
    }

    public function update(UpdatePlatformSettingsRequest $request): RedirectResponse
    {
        $payload = $request->validated();

        AppSetting::setBool('maintenance_mode', (bool) $payload['maintenance_mode']);
        AppSetting::setBool('coming_soon_mode', (bool) $payload['coming_soon_mode']);
        PlatformSettings::setSiteUrl((string) $payload['website_uri']);

        PlatformSettings::setContactInfo([
            'phone' => $payload['contact_phone'],
            'email' => $payload['contact_email'],
            'location' => $payload['contact_location'],
            'whatsapp_url' => $payload['contact_whatsapp_url'],
            'behance_url' => $payload['contact_behance_url'],
            'map_embed_url' => $payload['contact_map_embed_url'],
        ]);

        PlatformSettings::setHomeSlides((array) ($payload['home_slides'] ?? []));
        PlatformSettings::setServicePriceOverrides((array) ($payload['service_prices'] ?? []));

        return back()->with('success', 'Platform settings updated successfully.');
    }

    public function storeDiscount(StoreDiscountCodeRequest $request): RedirectResponse
    {
        $payload = $request->validated();

        DiscountCode::create([
            'name' => $payload['name'] ?: null,
            'code' => strtoupper((string) $payload['code']),
            'discount_type' => $payload['discount_type'],
            'discount_value' => $payload['discount_value'],
            'currency' => $payload['discount_type'] === 'fixed'
                ? strtoupper((string) ($payload['currency'] ?: config('bellah.invoice.currency', 'NGN')))
                : null,
            'is_active' => (bool) ($payload['is_active'] ?? true),
            'service_slug' => $payload['service_slug'],
            'package_code' => ($payload['package_code'] ?? '') !== '' ? $payload['package_code'] : null,
            'starts_at' => $payload['starts_at'] ?? null,
            'ends_at' => $payload['ends_at'] ?? null,
            'max_redemptions' => $payload['max_redemptions'] ?? null,
            'created_by' => $request->user()?->id,
        ]);

        return back()->with('success', 'Discount code created successfully.');
    }

    public function toggleDiscountStatus(ToggleDiscountCodeStatusRequest $request, DiscountCode $discountCode): RedirectResponse
    {
        $discountCode->update([
            'is_active' => $request->boolean('is_active'),
        ]);

        return back()->with('success', 'Discount code status updated.');
    }

    public function destroyDiscount(Request $request, DiscountCode $discountCode): RedirectResponse
    {
        abort_unless((bool) $request->user()?->canManageSettings(), 403);

        $discountCode->delete();

        return back()->with('success', 'Discount code deleted successfully.');
    }

    public function storeSubscriptionPlan(StoreSubscriptionPlanRequest $request): RedirectResponse
    {
        $payload = $request->validated();

        $plan = SubscriptionPlan::create([
            'name' => $payload['name'],
            'service_slug' => $payload['service_slug'],
            'package_code' => $payload['package_code'],
            'short_description' => $payload['short_description'] ?: null,
            'billing_cycle' => $payload['billing_cycle'],
            'position' => (int) ($payload['position'] ?? 0),
            'is_active' => (bool) ($payload['is_active'] ?? true),
            'show_on_homepage' => (bool) ($payload['show_on_homepage'] ?? true),
            'is_homepage_featured' => (bool) ($payload['is_homepage_featured'] ?? false),
            'is_recommended' => (bool) ($payload['is_recommended'] ?? false),
            'created_by' => $request->user()?->id,
        ]);

        $this->normalizeSubscriptionPlanFlags($plan);
        $plan->save();
        $this->synchronizeExclusivePlanFlags($plan);

        return back()->with('success', 'Subscription plan created successfully.');
    }

    public function updateSubscriptionPlan(UpdateSubscriptionPlanRequest $request, SubscriptionPlan $subscriptionPlan): RedirectResponse
    {
        $payload = $request->validated();

        $fields = [
            'name',
            'short_description',
            'billing_cycle',
            'position',
            'is_active',
            'show_on_homepage',
            'is_homepage_featured',
            'is_recommended',
        ];

        $updates = [];
        foreach ($fields as $field) {
            if (array_key_exists($field, $payload)) {
                $updates[$field] = $payload[$field];
            }
        }

        if ($updates === []) {
            return back()->with('error', 'No subscription plan changes were submitted.');
        }

        $subscriptionPlan->fill($updates);
        $this->normalizeSubscriptionPlanFlags($subscriptionPlan);
        $subscriptionPlan->save();

        $this->synchronizeExclusivePlanFlags($subscriptionPlan);

        return back()->with('success', 'Subscription plan updated successfully.');
    }

    public function destroySubscriptionPlan(Request $request, SubscriptionPlan $subscriptionPlan): RedirectResponse
    {
        abort_unless((bool) $request->user()?->canManageSettings(), 403);

        $subscriptionPlan->delete();

        return back()->with('success', 'Subscription plan deleted successfully.');
    }

    /**
     * @param  array<string, array<string, mixed>>  $serviceCatalog
     * @return array<string, array<string, mixed>>
     */
    private function serviceCatalogMeta(array $serviceCatalog): array
    {
        $mapped = [];

        foreach ($serviceCatalog as $serviceSlug => $service) {
            if (! is_array($service)) {
                continue;
            }

            $packages = [];
            foreach ((array) ($service['packages'] ?? []) as $packageCode => $package) {
                if (! is_array($package)) {
                    continue;
                }

                $packages[$packageCode] = [
                    'name' => (string) ($package['name'] ?? ucfirst((string) $packageCode)),
                    'description' => (string) ($package['description'] ?? ''),
                ];
            }

            $mapped[$serviceSlug] = [
                'name' => (string) ($service['name'] ?? ucfirst((string) $serviceSlug)),
                'description' => (string) ($service['description'] ?? ''),
                'packages' => $packages,
            ];
        }

        return $mapped;
    }

    /**
     * @param  array<string, array<string, mixed>>  $serviceCatalog
     * @return array<string, array<string, float>>
     */
    private function servicePricingValues(array $serviceCatalog): array
    {
        $matrix = [];

        foreach ($serviceCatalog as $serviceSlug => $service) {
            if (! is_array($service)) {
                continue;
            }

            foreach ((array) ($service['packages'] ?? []) as $packageCode => $package) {
                if (! is_array($package)) {
                    continue;
                }

                $matrix[$serviceSlug][$packageCode] = round((float) ($package['price'] ?? 0), 2);
            }
        }

        return $matrix;
    }

    private function discountLink(DiscountCode $discount): string
    {
        $serviceSlug = $discount->service_slug ?: 'social-media-design';

        $params = [
            'serviceSlug' => $serviceSlug,
            'discount' => $discount->code,
        ];

        if (is_string($discount->package_code) && trim($discount->package_code) !== '') {
            $params['package'] = $discount->package_code;
        }

        return route('orders.create', $params);
    }

    /**
     * @return Collection<int, DiscountCode>
     */
    private function activeDiscountCodes(): Collection
    {
        return DiscountCode::query()
            ->where('is_active', true)
            ->where(function ($query): void {
                $query->whereNull('starts_at')
                    ->orWhere('starts_at', '<=', now());
            })
            ->where(function ($query): void {
                $query->whereNull('ends_at')
                    ->orWhere('ends_at', '>=', now());
            })
            ->get();
    }

    /**
     * @param  Collection<int, DiscountCode>  $discountCodes
     */
    private function bestDiscountForPlan(
        Collection $discountCodes,
        string $serviceSlug,
        string $packageCode,
        float $basePrice,
        string $currency,
    ): ?DiscountCode {
        $best = null;
        $bestDiscountAmount = 0.0;

        foreach ($discountCodes as $discountCode) {
            if (! $discountCode->isApplicableTo($serviceSlug, $packageCode)) {
                continue;
            }

            $discountAmount = $discountCode->discountAmountFor($basePrice, $currency);

            if ($discountAmount > $bestDiscountAmount) {
                $best = $discountCode;
                $bestDiscountAmount = $discountAmount;
            }
        }

        return $best;
    }

    /**
     * @return array<string, int>
     */
    private function paidSubscriptionCounts(): array
    {
        return ServiceOrder::query()
            ->where('payment_status', 'paid')
            ->selectRaw('service_slug, package_code, COUNT(*) as aggregate_count')
            ->groupBy('service_slug', 'package_code')
            ->get()
            ->mapWithKeys(fn (ServiceOrder $order): array => [
                $this->pairKey((string) $order->service_slug, (string) $order->package_code) => (int) ($order->aggregate_count ?? 0),
            ])
            ->all();
    }

    private function pairKey(string $serviceSlug, string $packageCode): string
    {
        return $serviceSlug.'::'.$packageCode;
    }

    private function discountSummary(DiscountCode $discount): string
    {
        if (strtolower((string) $discount->discount_type) === 'percentage') {
            return rtrim(rtrim((string) $discount->discount_value, '0'), '.').'% off';
        }

        $currency = strtoupper((string) ($discount->currency ?: config('bellah.invoice.currency', 'NGN')));
        $prefix = $currency === 'NGN' ? 'N' : $currency.' ';

        return $prefix.number_format((float) $discount->discount_value, 2).' off';
    }

    private function planCheckoutLink(SubscriptionPlan $plan, ?string $discountCode = null): string
    {
        $params = [
            'serviceSlug' => $plan->service_slug,
            'package' => $plan->package_code,
        ];

        if (is_string($discountCode) && trim($discountCode) !== '') {
            $params['discount'] = strtoupper(trim($discountCode));
        }

        return route('orders.create', $params);
    }

    private function normalizeSubscriptionPlanFlags(SubscriptionPlan $plan): void
    {
        if (! $plan->show_on_homepage) {
            $plan->is_homepage_featured = false;
        }

        if ($plan->is_homepage_featured) {
            $plan->show_on_homepage = true;
        }
    }

    private function synchronizeExclusivePlanFlags(SubscriptionPlan $plan): void
    {
        if ($plan->is_recommended) {
            SubscriptionPlan::query()
                ->whereKeyNot($plan->id)
                ->where('is_recommended', true)
                ->update(['is_recommended' => false]);
        }
    }
}
