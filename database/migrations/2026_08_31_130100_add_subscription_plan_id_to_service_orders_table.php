<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('service_orders', function (Blueprint $table): void {
            $table->foreignId('subscription_plan_id')
                ->nullable()
                ->after('payment_provider')
                ->constrained('subscription_plans')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('service_orders', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('subscription_plan_id');
        });
    }
};
