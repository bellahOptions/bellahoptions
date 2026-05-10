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
        if (! Schema::hasTable('users')) {
            return;
        }

        Schema::table('users', function (Blueprint $table): void {
            if (! Schema::hasColumn('users', 'company_logo_path')) {
                $table->string('company_logo_path')->nullable()->after('company_name');
            }

            if (! Schema::hasColumn('users', 'social_media_info')) {
                $table->text('social_media_info')->nullable()->after('company_tax_id');
            }

            if (! Schema::hasColumn('users', 'business_number')) {
                $table->string('business_number', 80)->nullable()->after('social_media_info');
            }

            if (! Schema::hasColumn('users', 'business_official_email')) {
                $table->string('business_official_email', 255)->nullable()->after('business_number');
            }

            if (! Schema::hasColumn('users', 'business_address')) {
                $table->text('business_address')->nullable()->after('business_official_email');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (! Schema::hasTable('users')) {
            return;
        }

        Schema::table('users', function (Blueprint $table): void {
            $drop = array_values(array_filter([
                Schema::hasColumn('users', 'company_logo_path') ? 'company_logo_path' : null,
                Schema::hasColumn('users', 'social_media_info') ? 'social_media_info' : null,
                Schema::hasColumn('users', 'business_number') ? 'business_number' : null,
                Schema::hasColumn('users', 'business_official_email') ? 'business_official_email' : null,
                Schema::hasColumn('users', 'business_address') ? 'business_address' : null,
            ]));

            if ($drop !== []) {
                $table->dropColumn($drop);
            }
        });
    }
};
