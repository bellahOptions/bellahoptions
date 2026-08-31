<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MediaUpload extends Model
{
    use HasFactory;

    protected $fillable = [
        'public_id',
        'secure_url',
        'folder',
        'format',
        'bytes',
        'width',
        'height',
        'uploaded_by',
    ];

    protected $casts = [
        'bytes' => 'integer',
        'width' => 'integer',
        'height' => 'integer',
    ];

    public function uploader()
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}
