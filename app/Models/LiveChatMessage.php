<?php

namespace App\Models;

use Illuminate\Contracts\Encryption\DecryptException;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Crypt;

#[Fillable([
    'live_chat_thread_id',
    'sender_type',
    'sender_user_id',
    'sender_name',
    'client_message_id',
    'body',
    'read_at',
])]
class LiveChatMessage extends Model
{
    use HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'read_at' => 'datetime',
        ];
    }

    public function thread(): BelongsTo
    {
        return $this->belongsTo(LiveChatThread::class, 'live_chat_thread_id');
    }

    public function senderUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_user_id');
    }

    public function reactions(): HasMany
    {
        return $this->hasMany(LiveChatMessageReaction::class, 'live_chat_message_id');
    }

    public function setBodyAttribute(mixed $value): void
    {
        $plainText = trim((string) $value);
        $this->attributes['body'] = $plainText === '' ? '' : Crypt::encryptString($plainText);
    }

    public function getBodyAttribute(mixed $value): string
    {
        $rawValue = trim((string) $value);
        if ($rawValue === '') {
            return '';
        }

        try {
            return Crypt::decryptString($rawValue);
        } catch (DecryptException) {
            // Supports pre-encryption legacy rows.
            return $rawValue;
        }
    }
}
