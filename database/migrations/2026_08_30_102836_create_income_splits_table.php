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
        Schema::create('income_splits', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('invoice_id')->unique()->constrained('invoices')->cascadeOnDelete();
            $table->string('currency', 3)->default('NGN');
            $table->decimal('total_amount', 14, 2);

            $table->decimal('ads_savings_percent', 5, 2);
            $table->decimal('ads_savings_amount', 14, 2);
            $table->decimal('data_savings_percent', 5, 2);
            $table->decimal('data_savings_amount', 14, 2);
            $table->decimal('ai_savings_percent', 5, 2);
            $table->decimal('ai_savings_amount', 14, 2);

            $table->foreignId('partner_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->decimal('partner_percent', 5, 2);
            $table->decimal('partner_amount', 14, 2);
            $table->timestamp('partner_notified_at')->nullable();

            $table->foreignId('owner_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->decimal('owner_percent', 5, 2);
            $table->decimal('owner_amount', 14, 2);

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('income_splits');
    }
};
