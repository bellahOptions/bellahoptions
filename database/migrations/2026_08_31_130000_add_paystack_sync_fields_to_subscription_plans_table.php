<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('subscription_plans', function (Blueprint $table): void {
            $table->string('paystack_plan_code', 60)->nullable()->after('billing_cycle')->index();
            $table->timestamp('paystack_synced_at')->nullable()->after('paystack_plan_code');
            $table->string('paystack_sync_error', 500)->nullable()->after('paystack_synced_at');
        });
    }

    public function down(): void
    {
        Schema::table('subscription_plans', function (Blueprint $table): void {
            $table->dropColumn(['paystack_plan_code', 'paystack_synced_at', 'paystack_sync_error']);
        });
    }
};
