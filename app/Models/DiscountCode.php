<?php

namespace App\Models;

use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'name',
    'code',
    'discount_type',
    'discount_value',
    'currency',
    'is_active',
    'service_slug',
    'package_code',
    'max_redemptions',
    'total_redemptions',
    'starts_at',
    'ends_at',
    'created_by',
])]
class DiscountCode extends Model
{
    use HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'discount_value' => 'decimal:2',
            'is_active' => 'boolean',
            'max_redemptions' => 'integer',
            'total_redemptions' => 'integer',
            'starts_at' => 'datetime',
            'ends_at' => 'datetime',
        ];
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function isApplicableTo(string $serviceSlug, ?string $packageCode = null, ?CarbonInterface $at = null): bool
    {
        $now = $at ?? now();

        if (! $this->is_active) {
            return false;
        }

        if ($this->starts_at && $this->starts_at->gt($now)) {
            return false;
        }

        if ($this->ends_at && $this->ends_at->lt($now)) {
            return false;
        }

        if ($this->service_slug && $this->service_slug !== $serviceSlug) {
            return false;
        }

        if ($packageCode !== null && $this->package_code && $this->package_code !== $packageCode) {
            return false;
        }

        if ($this->max_redemptions !== null && $this->total_redemptions >= $this->max_redemptions) {
            return false;
        }

        return true;
    }

    public function discountAmountFor(float $baseAmount, string $currency): float
    {
        $base = max(0, round($baseAmount, 2));
        if ($base <= 0) {
            return 0.0;
        }

        $type = strtolower(trim((string) $this->discount_type));
        $value = (float) $this->discount_value;

        if ($value <= 0) {
            return 0.0;
        }

        if ($type === 'percentage') {
            $resolved = round(($base * $value) / 100, 2);

            return min($base, max(0.0, $resolved));
        }

        if ($type === 'fixed') {
            $discountCurrency = strtoupper(trim((string) ($this->currency ?: $currency)));
            $orderCurrency = strtoupper(trim((string) $currency));

            if ($discountCurrency !== $orderCurrency) {
                return 0.0;
            }

            return min($base, round($value, 2));
        }

        return 0.0;
    }

    public function incrementRedemptions(): void
    {
        $this->increment('total_redemptions');
        $this->refresh();
    }
}
