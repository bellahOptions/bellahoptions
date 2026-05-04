<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('service_orders', function (Blueprint $table): void {
            $table->string('payment_provider', 30)->default('paystack')->after('discount_amount')->index();
        });
    }

    public function down(): void
    {
        Schema::table('service_orders', function (Blueprint $table): void {
            $table->dropIndex(['payment_provider']);
            $table->dropColumn('payment_provider');
        });
    }
};
