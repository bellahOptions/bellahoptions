<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'invoice_id',
    'currency',
    'total_amount',
    'ads_savings_percent',
    'ads_savings_amount',
    'data_savings_percent',
    'data_savings_amount',
    'ai_savings_percent',
    'ai_savings_amount',
    'partner_user_id',
    'partner_percent',
    'partner_amount',
    'partner_notified_at',
    'owner_user_id',
    'owner_percent',
    'owner_amount',
])]
class IncomeSplit extends Model
{
    use HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'total_amount' => 'decimal:2',
            'ads_savings_percent' => 'decimal:2',
            'ads_savings_amount' => 'decimal:2',
            'data_savings_percent' => 'decimal:2',
            'data_savings_amount' => 'decimal:2',
            'ai_savings_percent' => 'decimal:2',
            'ai_savings_amount' => 'decimal:2',
            'partner_percent' => 'decimal:2',
            'partner_amount' => 'decimal:2',
            'partner_notified_at' => 'datetime',
            'owner_percent' => 'decimal:2',
            'owner_amount' => 'decimal:2',
        ];
    }

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    public function partner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'partner_user_id');
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_user_id');
    }
}
