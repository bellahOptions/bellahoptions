<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'live_chat_message_id',
    'reactor_user_id',
    'reactor_token',
    'emoji',
])]
class LiveChatMessageReaction extends Model
{
    use HasFactory;

    public function message(): BelongsTo
    {
        return $this->belongsTo(LiveChatMessage::class, 'live_chat_message_id');
    }

    public function reactorUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reactor_user_id');
    }
}
