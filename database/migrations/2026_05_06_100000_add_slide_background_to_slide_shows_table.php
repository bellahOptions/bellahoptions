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
            if (! Schema::hasColumn('slide_shows', 'slide_background')) {
                $table->string('slide_background', 80)->nullable()->after('slide_image');
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('slide_shows') || ! Schema::hasColumn('slide_shows', 'slide_background')) {
            return;
        }

        Schema::table('slide_shows', function (Blueprint $table): void {
            $table->dropColumn('slide_background');
        });
    }
};
