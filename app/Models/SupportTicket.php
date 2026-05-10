<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SupportTicket extends Model
{
    public const STATUS_OPEN = 'open';

    public const STATUS_AWAITING_CUSTOMER = 'awaiting_customer';

    public const STATUS_CLOSED = 'closed';

    public const PRIORITY_LOW = 'low';

    public const PRIORITY_MEDIUM = 'medium';

    public const PRIORITY_HIGH = 'high';

    public const PRIORITY_URGENT = 'urgent';

    protected $fillable = [
        'user_id',
        'ticket_number',
        'subject',
        'priority',
        'status',
        'last_customer_reply_at',
        'last_staff_reply_at',
        'reminder_count',
        'last_reminder_sent_at',
        'closed_at',
    ];

    protected function casts(): array
    {
        return [
            'last_customer_reply_at' => 'datetime',
            'last_staff_reply_at' => 'datetime',
            'last_reminder_sent_at' => 'datetime',
            'closed_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (self $ticket): void {
            if (! is_string($ticket->ticket_number) || trim($ticket->ticket_number) === '') {
                $ticket->ticket_number = self::generateTicketNumber();
            }
        });
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function messages(): HasMany
    {
        return $this->hasMany(SupportTicketMessage::class);
    }

    public function scopeOpen(Builder $query): Builder
    {
        return $query->where('status', self::STATUS_OPEN);
    }

    /**
     * @return array<int, string>
     */
    public static function statuses(): array
    {
        return [self::STATUS_OPEN, self::STATUS_AWAITING_CUSTOMER, self::STATUS_CLOSED];
    }

    /**
     * @return array<int, string>
     */
    public static function priorities(): array
    {
        return [self::PRIORITY_LOW, self::PRIORITY_MEDIUM, self::PRIORITY_HIGH, self::PRIORITY_URGENT];
    }

    public function waitingForStaffReply(): bool
    {
        return $this->status === self::STATUS_OPEN;
    }

    public static function generateTicketNumber(): string
    {
        $attempts = 0;

        do {
            $candidate = sprintf('TKT-%s-%04d', now()->format('Ymd'), random_int(1000, 9999));
            $attempts++;
        } while (self::query()->where('ticket_number', $candidate)->exists() && $attempts < 6);

        return $candidate;
    }
}
