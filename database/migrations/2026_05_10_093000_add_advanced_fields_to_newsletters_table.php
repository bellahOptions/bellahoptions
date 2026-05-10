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
        if (! Schema::hasTable('newsletters')) {
            return;
        }

        Schema::table('newsletters', function (Blueprint $table): void {
            if (! Schema::hasColumn('newsletters', 'campaign_type')) {
                $table->string('campaign_type', 40)->default('newsletter')->after('audience');
            }

            if (! Schema::hasColumn('newsletters', 'preview_text')) {
                $table->string('preview_text', 255)->nullable()->after('subject_template');
            }

            if (! Schema::hasColumn('newsletters', 'audience_filters')) {
                $table->json('audience_filters')->nullable()->after('dynamic_fields');
            }

            if (! Schema::hasColumn('newsletters', 'builder_layout')) {
                $table->json('builder_layout')->nullable()->after('audience_filters');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (! Schema::hasTable('newsletters')) {
            return;
        }

        Schema::table('newsletters', function (Blueprint $table): void {
            if (Schema::hasColumn('newsletters', 'builder_layout')) {
                $table->dropColumn('builder_layout');
            }

            if (Schema::hasColumn('newsletters', 'audience_filters')) {
                $table->dropColumn('audience_filters');
            }

            if (Schema::hasColumn('newsletters', 'preview_text')) {
                $table->dropColumn('preview_text');
            }

            if (Schema::hasColumn('newsletters', 'campaign_type')) {
                $table->dropColumn('campaign_type');
            }
        });
    }
};
