<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('subscription_plans', function (Blueprint $table): void {
            if (! Schema::hasColumn('subscription_plans', 'image_path')) {
                $table->string('image_path', 255)->nullable()->after('package_code');
            }

            if (! Schema::hasColumn('subscription_plans', 'long_description')) {
                $table->text('long_description')->nullable()->after('short_description');
            }
        });
    }

    public function down(): void
    {
        Schema::table('subscription_plans', function (Blueprint $table): void {
            if (Schema::hasColumn('subscription_plans', 'image_path')) {
                $table->dropColumn('image_path');
            }

            if (Schema::hasColumn('subscription_plans', 'long_description')) {
                $table->dropColumn('long_description');
            }
        });
    }
};
