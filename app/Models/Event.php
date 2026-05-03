<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'title',
    'description',
    'event_date',
    'location',
    'image_path',
    'registration_url',
    'is_published',
    'position',
    'uploaded_by',
])]
class Event extends Model
{
    protected function casts(): array
    {
        return [
            'event_date' => 'datetime',
            'is_published' => 'boolean',
            'position' => 'integer',
        ];
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}
