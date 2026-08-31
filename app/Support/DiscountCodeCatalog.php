<?php

namespace App\Support;

use App\Models\DiscountCode;
use Illuminate\Support\Collection;

class DiscountCodeCatalog
{
    /**
     * @return Collection<int, DiscountCode>
     */
    public function active(): Collection
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
    public function bestFor(
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

    public function summary(DiscountCode $discount): string
    {
        if (strtolower((string) $discount->discount_type) === 'percentage') {
            return rtrim(rtrim((string) $discount->discount_value, '0'), '.').'% off';
        }

        $currency = strtoupper((string) ($discount->currency ?: config('bellah.invoice.currency', 'NGN')));
        $prefix = $currency === 'NGN' ? 'N' : $currency.' ';

        return $prefix.number_format((float) $discount->discount_value, 2).' off';
    }

    public function link(DiscountCode $discount): string
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
}
