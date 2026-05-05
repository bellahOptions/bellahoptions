<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'uuid',
    'order_code',
    'user_id',
    'customer_id',
    'service_slug',
    'service_name',
    'package_code',
    'package_name',
    'currency',
    'base_amount',
    'discount_code_id',
    'discount_code',
    'discount_name',
    'discount_type',
    'discount_value',
    'discount_amount',
    'payment_provider',
    'amount',
    'payment_status',
    'order_status',
    'progress_percent',
    'paystack_reference',
    'paystack_access_code',
    'paid_at',
    'full_name',
    'email',
    'phone',
    'business_name',
    'position',
    'business_website',
    'project_summary',
    'project_goals',
    'target_audience',
    'preferred_style',
    'deliverables',
    'additional_details',
    'brief_payload',
    'wants_account',
    'invoice_id',
    'created_by_ip',
    'user_agent',
])]
class ServiceOrder extends Model
{
    use HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'base_amount' => 'decimal:2',
            'amount' => 'decimal:2',
            'discount_value' => 'decimal:2',
            'discount_amount' => 'decimal:2',
            'payment_provider' => 'string',
            'progress_percent' => 'integer',
            'paid_at' => 'datetime',
            'brief_payload' => 'array',
            'wants_account' => 'boolean',
        ];
    }

    public function getRouteKeyName(): string
    {
        return 'order_code';
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    public function discountCode(): BelongsTo
    {
        return $this->belongsTo(DiscountCode::class, 'discount_code_id');
    }

    public function updates(): HasMany
    {
        return $this->hasMany(ServiceOrderUpdate::class)->latest('id');
    }
}
