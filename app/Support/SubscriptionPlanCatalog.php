<?php

namespace App\Support;

use App\Models\DiscountCode;
use App\Models\ServiceOrder;
use App\Models\SubscriptionPlan;
use Illuminate\Support\Collection;

class SubscriptionPlanCatalog
{
    /**
     * @return array<int, array<string, mixed>>
     */
    public function homepagePlans(int $limit = 6): array
    {
        $plans = SubscriptionPlan::query()
            ->where('is_active', true)
            ->where('show_on_homepage', true)
            ->where('is_homepage_featured', true)
            ->orderByDesc('is_homepage_featured')
            ->orderBy('position')
            ->orderBy('id')
            ->get();

        if ($plans->isEmpty()) {
            return [];
        }

        $serviceCatalog = app(ServiceOrderCatalog::class);
        $currency = strtoupper((string) config('bellah.invoice.currency', 'NGN'));
        $discountCodes = $this->activeDiscountCodes();
        $paidCounts = $this->paidSubscriptionCounts();

        $items = [];

        foreach ($plans as $plan) {
            $service = $serviceCatalog->service((string) $plan->service_slug);
            $package = $serviceCatalog->package((string) $plan->service_slug, (string) $plan->package_code);

            if (! is_array($service) || ! is_array($package)) {
                continue;
            }

            $basePrice = round((float) ($package['price'] ?? 0), 2);

            if ($basePrice <= 0) {
                continue;
            }

            $bestDiscount = $this->bestDiscountForPlan(
                $discountCodes,
                (string) $plan->service_slug,
                (string) $plan->package_code,
                $basePrice,
                $currency,
            );

            $discountAmount = $bestDiscount?->discountAmountFor($basePrice, $currency) ?? 0.0;
            $discountAmount = round($discountAmount, 2);
            $finalPrice = max(round($basePrice - $discountAmount, 2), 0.01);

            $pairKey = $this->pairKey((string) $plan->service_slug, (string) $plan->package_code);
            $paidSubscriptions = (int) ($paidCounts[$pairKey] ?? 0);

            $items[] = [
                'id' => $plan->id,
                'name' => $plan->name,
                'service_slug' => $plan->service_slug,
                'service_name' => (string) ($service['name'] ?? ucfirst((string) $plan->service_slug)),
                'package_code' => $plan->package_code,
                'package_name' => (string) ($package['name'] ?? ucfirst((string) $plan->package_code)),
                'short_description' => $plan->short_description ?: (string) ($package['description'] ?? ''),
                'billing_cycle' => $plan->billing_cycle,
                'position' => (int) $plan->position,
                'currency' => $currency,
                'base_price' => $basePrice,
                'final_price' => $finalPrice,
                'discount_amount' => $discountAmount,
                'has_discount' => $discountAmount > 0,
                'discount_code' => $bestDiscount?->code,
                'discount_summary' => $bestDiscount ? $this->discountSummary($bestDiscount) : null,
                'is_recommended' => (bool) $plan->is_recommended,
                'is_homepage_featured' => (bool) $plan->is_homepage_featured,
                'paid_subscriptions' => $paidSubscriptions,
                'is_most_subscribed' => false,
                'checkout_url' => $this->checkoutLink(
                    (string) $plan->service_slug,
                    (string) $plan->package_code,
                    $bestDiscount?->code,
                ),
            ];
        }

        if ($items === []) {
            return [];
        }

        $maxPaidSubscriptions = max(array_map(
            static fn (array $item): int => (int) ($item['paid_subscriptions'] ?? 0),
            $items,
        ));

        foreach ($items as &$item) {
            $item['is_most_subscribed'] = $maxPaidSubscriptions > 0
                && (int) ($item['paid_subscriptions'] ?? 0) === $maxPaidSubscriptions;
        }
        unset($item);

        $hasRecommended = false;
        foreach ($items as $item) {
            if ((bool) ($item['is_recommended'] ?? false)) {
                $hasRecommended = true;
                break;
            }
        }

        if (! $hasRecommended) {
            usort($items, static function (array $left, array $right): int {
                $leftDiscount = (float) ($left['discount_amount'] ?? 0);
                $rightDiscount = (float) ($right['discount_amount'] ?? 0);

                if ($leftDiscount !== $rightDiscount) {
                    return $leftDiscount <=> $rightDiscount;
                }

                return ((int) ($left['paid_subscriptions'] ?? 0)) <=> ((int) ($right['paid_subscriptions'] ?? 0));
            });

            $fallback = array_pop($items);
            if (is_array($fallback)) {
                $fallback['is_recommended'] = true;
                $items[] = $fallback;
            }
        }

        usort($items, static function (array $left, array $right): int {
            $leftWeight =
                ((bool) ($left['is_homepage_featured'] ?? false) ? 1000 : 0)
                + ((bool) ($left['has_discount'] ?? false) ? 120 : 0)
                + ((bool) ($left['is_most_subscribed'] ?? false) ? 90 : 0)
                + ((bool) ($left['is_recommended'] ?? false) ? 70 : 0)
                + (int) ($left['paid_subscriptions'] ?? 0);

            $rightWeight =
                ((bool) ($right['is_homepage_featured'] ?? false) ? 1000 : 0)
                + ((bool) ($right['has_discount'] ?? false) ? 120 : 0)
                + ((bool) ($right['is_most_subscribed'] ?? false) ? 90 : 0)
                + ((bool) ($right['is_recommended'] ?? false) ? 70 : 0)
                + (int) ($right['paid_subscriptions'] ?? 0);

            if ($leftWeight !== $rightWeight) {
                return $rightWeight <=> $leftWeight;
            }

            if ((int) ($left['position'] ?? 0) !== (int) ($right['position'] ?? 0)) {
                return ((int) ($left['position'] ?? 0)) <=> ((int) ($right['position'] ?? 0));
            }

            return (int) ($left['id'] ?? 0) <=> (int) ($right['id'] ?? 0);
        });

        return array_slice($items, 0, max(1, $limit));
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

    private function discountSummary(DiscountCode $discount): string
    {
        if (strtolower((string) $discount->discount_type) === 'percentage') {
            return rtrim(rtrim((string) $discount->discount_value, '0'), '.').'% off';
        }

        $currency = strtoupper((string) ($discount->currency ?: config('bellah.invoice.currency', 'NGN')));
        $prefix = $currency === 'NGN' ? 'N' : $currency.' ';

        return $prefix.number_format((float) $discount->discount_value, 2).' off';
    }

    private function pairKey(string $serviceSlug, string $packageCode): string
    {
        return $serviceSlug.'::'.$packageCode;
    }

    private function checkoutLink(string $serviceSlug, string $packageCode, ?string $discountCode = null): string
    {
        $params = [
            'serviceSlug' => $serviceSlug,
            'package' => $packageCode,
        ];

        if (is_string($discountCode) && trim($discountCode) !== '') {
            $params['discount'] = strtoupper(trim($discountCode));
        }

        return route('orders.create', $params);
    }
}
