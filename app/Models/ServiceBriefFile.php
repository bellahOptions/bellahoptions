<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'upload_session_token',
    'service_brief_id',
    'field_key',
    'original_filename',
    'disk_path',
    'mime_type',
    'size_bytes',
])]
class ServiceBriefFile extends Model
{
    use HasFactory;

    public function brief(): BelongsTo
    {
        return $this->belongsTo(ServiceBrief::class, 'service_brief_id');
    }
}
