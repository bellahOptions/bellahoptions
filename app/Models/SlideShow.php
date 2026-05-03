<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SlideShow extends Model
{
    protected $fillable = [
        'slide_title',
        'text',
        'slide_image',
        'slide_link',
        'slide_link_text',
    ];
}
