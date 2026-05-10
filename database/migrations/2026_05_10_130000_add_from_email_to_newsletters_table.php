<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('newsletters')) {
            return;
        }

        Schema::table('newsletters', function (Blueprint $table): void {
            if (! Schema::hasColumn('newsletters', 'from_email')) {
                $table->string('from_email', 255)->nullable()->after('preview_text');
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('newsletters')) {
            return;
        }

        Schema::table('newsletters', function (Blueprint $table): void {
            if (Schema::hasColumn('newsletters', 'from_email')) {
                $table->dropColumn('from_email');
            }
        });
    }
};
