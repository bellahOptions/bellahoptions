<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'name',
    'audience',
    'campaign_type',
    'preview_text',
    'from_email',
    'subject_template',
    'html_template',
    'dynamic_fields',
    'audience_filters',
    'builder_layout',
    'is_active',
    'last_sent_at',
    'last_sent_count',
    'last_sent_by',
    'created_by',
])]
class Newsletter extends Model
{
    use HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'dynamic_fields' => 'array',
            'audience_filters' => 'array',
            'builder_layout' => 'array',
            'is_active' => 'boolean',
            'last_sent_at' => 'datetime',
            'last_sent_count' => 'integer',
        ];
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function lastSender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'last_sent_by');
    }
}
