<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

#[Fillable([
    'uuid',
    'reference_number',
    'service_brief_template_id',
    'service_slug',
    'customer_id',
    'status',
    'answers',
    'is_rush',
    'nda_required',
    'has_unsure_answers',
    'consent_ndpa_at',
    'consent_ndpa_ip',
    'consent_marketing',
    'customer_name',
    'customer_email',
    'customer_phone',
    'response_due_at',
    'quoted_invoice_id',
])]
class ServiceBrief extends Model
{
    use HasFactory;

    public const STATUS_NEW = 'new';

    public const STATUS_REVIEWING = 'reviewing';

    public const STATUS_QUOTE_SENT = 'quote_sent';

    public const STATUS_WON = 'won';

    public const STATUS_LOST = 'lost';

    public const STATUS_DORMANT = 'dormant';

    protected static function booted(): void
    {
        static::creating(function (self $brief): void {
            if (! is_string($brief->uuid) || trim($brief->uuid) === '') {
                $brief->uuid = (string) Str::uuid();
            }
        });
    }

    /**
     * @return array<int, string>
     */
    public static function statuses(): array
    {
        return [
            self::STATUS_NEW,
            self::STATUS_REVIEWING,
            self::STATUS_QUOTE_SENT,
            self::STATUS_WON,
            self::STATUS_LOST,
            self::STATUS_DORMANT,
        ];
    }

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'answers' => 'array',
            'is_rush' => 'boolean',
            'nda_required' => 'boolean',
            'has_unsure_answers' => 'boolean',
            'consent_marketing' => 'boolean',
            'consent_ndpa_at' => 'datetime',
            'response_due_at' => 'datetime',
        ];
    }

    public function getRouteKeyName(): string
    {
        return 'uuid';
    }

    public function template(): BelongsTo
    {
        return $this->belongsTo(ServiceBriefTemplate::class, 'service_brief_template_id');
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function quotedInvoice(): BelongsTo
    {
        return $this->belongsTo(Invoice::class, 'quoted_invoice_id');
    }

    public function files(): HasMany
    {
        return $this->hasMany(ServiceBriefFile::class);
    }
}
