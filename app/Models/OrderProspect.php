<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'uuid',
    'user_id',
    'service_order_id',
    'service_slug',
    'service_name',
    'service_package',
    'current_step',
    'status',
    'full_name',
    'email',
    'phone',
    'business_name',
    'draft_payload',
    'source_url',
    'ip_address',
    'user_agent',
    'last_activity_at',
    'abandoned_at',
    'reminder_sent_at',
    'admin_notified_at',
    'converted_at',
])]
class OrderProspect extends Model
{
    use HasFactory;

    public const STATUS_ACTIVE = 'active';

    public const STATUS_ABANDONED = 'abandoned';

    public const STATUS_CONVERTED = 'converted';

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'draft_payload' => 'array',
            'current_step' => 'integer',
            'last_activity_at' => 'datetime',
            'abandoned_at' => 'datetime',
            'reminder_sent_at' => 'datetime',
            'admin_notified_at' => 'datetime',
            'converted_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function serviceOrder(): BelongsTo
    {
        return $this->belongsTo(ServiceOrder::class);
    }
}
