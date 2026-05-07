<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;

#[Fillable([
    'service_order_id',
    'invoice_id',
    'created_by',
    'source',
    'review_token',
    'reviewer_name',
    'reviewer_email',
    'rating',
    'comment',
    'is_public',
    'is_featured',
    'review_requested_at',
    'review_submitted_at',
    'published_at',
])]
class ClientReview extends Model
{
    use HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'rating' => 'decimal:1',
            'is_public' => 'boolean',
            'is_featured' => 'boolean',
            'review_requested_at' => 'datetime',
            'review_submitted_at' => 'datetime',
            'published_at' => 'datetime',
        ];
    }

    public function serviceOrder(): BelongsTo
    {
        return $this->belongsTo(ServiceOrder::class);
    }

    public function invoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * @param  Builder<ClientReview>  $query
     * @return Builder<ClientReview>
     */
    public function scopePubliclyVisible(Builder $query): Builder
    {
        return $query
            ->where('is_public', true)
            ->whereNotNull('review_submitted_at')
            ->where('rating', '>=', 4.0);
    }
}
