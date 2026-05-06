<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SlideShow extends Model
{
    protected $fillable = [
        'slide_title',
        'text',
        'slide_image',
        'slide_background',
        'content_media_type',
        'content_media_path',
        'content_media_position',
        'layout_style',
        'content_alignment',
        'title_animation',
        'text_animation',
        'media_animation',
        'button_animation',
        'slide_link',
        'slide_link_text',
    ];
}
