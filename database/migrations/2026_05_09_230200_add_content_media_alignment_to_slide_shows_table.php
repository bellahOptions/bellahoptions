<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (! Schema::hasTable('slide_shows')) {
            return;
        }

        Schema::table('slide_shows', function (Blueprint $table): void {
            if (! Schema::hasColumn('slide_shows', 'content_media_alignment')) {
                $table->string('content_media_alignment', 20)->default('center')->after('content_media_position');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (! Schema::hasTable('slide_shows') || ! Schema::hasColumn('slide_shows', 'content_media_alignment')) {
            return;
        }

        Schema::table('slide_shows', function (Blueprint $table): void {
            $table->dropColumn('content_media_alignment');
        });
    }
};
