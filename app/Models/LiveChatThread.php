<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

#[Fillable([
    'customer_user_id',
    'visitor_token',
    'guest_name',
    'guest_email',
    'status',
    'assigned_staff_id',
    'customer_is_online',
    'customer_last_seen_at',
    'customer_last_read_message_id',
    'staff_last_read_message_id',
    'last_message_at',
    'last_customer_message_at',
    'last_staff_message_at',
    'customer_typing_at',
    'staff_typing_at',
    'closed_at',
    'closed_by_type',
    'closed_by_user_id',
    'transcript_sent_at',
])]
class LiveChatThread extends Model
{
    use HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'last_message_at' => 'datetime',
            'last_customer_message_at' => 'datetime',
            'last_staff_message_at' => 'datetime',
            'customer_is_online' => 'boolean',
            'customer_last_seen_at' => 'datetime',
            'customer_typing_at' => 'datetime',
            'staff_typing_at' => 'datetime',
            'closed_at' => 'datetime',
            'transcript_sent_at' => 'datetime',
        ];
    }

    public function customerUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'customer_user_id');
    }

    public function assignedStaff(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_staff_id');
    }

    public function messages(): HasMany
    {
        return $this->hasMany(LiveChatMessage::class)->orderBy('id');
    }

    public function latestMessage(): HasOne
    {
        return $this->hasOne(LiveChatMessage::class)->latestOfMany('id');
    }

    public function closedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'closed_by_user_id');
    }
}
