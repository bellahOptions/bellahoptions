<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('subscriptions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('subscription_plan_id')->constrained('subscription_plans')->cascadeOnDelete();
            $table->foreignId('service_order_id')->nullable()->constrained('service_orders')->nullOnDelete();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('customer_email', 255)->index();
            $table->string('customer_name', 180)->nullable();
            $table->string('paystack_plan_code', 60)->index();
            $table->string('paystack_customer_code', 60)->index();
            $table->string('paystack_subscription_code', 60)->nullable()->index();
            $table->string('paystack_email_token', 120)->nullable();
            $table->string('status', 30)->default('pending_activation')->index();
            $table->decimal('amount', 14, 2);
            $table->string('currency', 10)->default('NGN');
            $table->date('next_payment_date')->nullable();
            $table->timestamps();

            $table->unique(['paystack_plan_code', 'paystack_customer_code']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('subscriptions');
    }
};
