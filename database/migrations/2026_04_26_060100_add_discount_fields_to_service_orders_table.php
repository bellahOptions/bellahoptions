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
        Schema::table('service_orders', function (Blueprint $table): void {
            $table->decimal('base_amount', 12, 2)->nullable()->after('currency');
            $table->foreignId('discount_code_id')->nullable()->after('base_amount')->constrained('discount_codes')->nullOnDelete();
            $table->string('discount_code', 80)->nullable()->after('discount_code_id');
            $table->string('discount_name', 120)->nullable()->after('discount_code');
            $table->string('discount_type', 20)->nullable()->after('discount_name');
            $table->decimal('discount_value', 10, 2)->nullable()->after('discount_type');
            $table->decimal('discount_amount', 12, 2)->default(0)->after('discount_value');

            $table->index('discount_code');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('service_orders', function (Blueprint $table): void {
            $table->dropIndex(['discount_code']);
            $table->dropConstrainedForeignId('discount_code_id');
            $table->dropColumn([
                'base_amount',
                'discount_code',
                'discount_name',
                'discount_type',
                'discount_value',
                'discount_amount',
            ]);
        });
    }
};
