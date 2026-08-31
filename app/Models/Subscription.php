<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'subscription_plan_id',
    'service_order_id',
    'user_id',
    'customer_email',
    'customer_name',
    'paystack_plan_code',
    'paystack_customer_code',
    'paystack_subscription_code',
    'paystack_email_token',
    'status',
    'amount',
    'currency',
    'next_payment_date',
])]
class Subscription extends Model
{
    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'next_payment_date' => 'date',
        ];
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(SubscriptionPlan::class, 'subscription_plan_id');
    }

    public function latestOrder(): BelongsTo
    {
        return $this->belongsTo(ServiceOrder::class, 'service_order_id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
