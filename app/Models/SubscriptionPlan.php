<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'name',
    'service_slug',
    'package_code',
    'image_path',
    'short_description',
    'long_description',
    'billing_cycle',
    'position',
    'is_active',
    'show_on_homepage',
    'is_homepage_featured',
    'is_recommended',
    'created_by',
    'paystack_plan_code',
    'paystack_synced_at',
    'paystack_sync_error',
])]
class SubscriptionPlan extends Model
{
    use HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'position' => 'integer',
            'is_active' => 'boolean',
            'show_on_homepage' => 'boolean',
            'is_homepage_featured' => 'boolean',
            'is_recommended' => 'boolean',
            'paystack_synced_at' => 'datetime',
        ];
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }
}
