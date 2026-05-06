<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('slide_shows')) {
            return;
        }

        Schema::table('slide_shows', function (Blueprint $table): void {
            if (! Schema::hasColumn('slide_shows', 'content_media_type')) {
                $table->string('content_media_type', 20)->nullable()->after('slide_background');
            }

            if (! Schema::hasColumn('slide_shows', 'content_media_path')) {
                $table->string('content_media_path', 255)->nullable()->after('content_media_type');
            }

            if (! Schema::hasColumn('slide_shows', 'layout_style')) {
                $table->string('layout_style', 30)->default('center')->after('content_media_path');
            }

            if (! Schema::hasColumn('slide_shows', 'content_alignment')) {
                $table->string('content_alignment', 20)->default('center')->after('layout_style');
            }

            if (! Schema::hasColumn('slide_shows', 'title_animation')) {
                $table->string('title_animation', 40)->default('fade-up')->after('content_alignment');
            }

            if (! Schema::hasColumn('slide_shows', 'text_animation')) {
                $table->string('text_animation', 40)->default('fade-up')->after('title_animation');
            }

            if (! Schema::hasColumn('slide_shows', 'media_animation')) {
                $table->string('media_animation', 40)->default('zoom-in')->after('text_animation');
            }

            if (! Schema::hasColumn('slide_shows', 'button_animation')) {
                $table->string('button_animation', 40)->default('fade-up')->after('media_animation');
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('slide_shows')) {
            return;
        }

        Schema::table('slide_shows', function (Blueprint $table): void {
            $columns = [
                'content_media_type',
                'content_media_path',
                'layout_style',
                'content_alignment',
                'title_animation',
                'text_animation',
                'media_animation',
                'button_animation',
            ];

            $existing = array_values(array_filter($columns, fn (string $column): bool => Schema::hasColumn('slide_shows', $column)));
            if ($existing !== []) {
                $table->dropColumn($existing);
            }
        });
    }
};
