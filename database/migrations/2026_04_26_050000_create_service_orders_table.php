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
        Schema::create('service_orders', function (Blueprint $table): void {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('customer_id')->nullable()->constrained('customers')->nullOnDelete();
            $table->string('service_slug', 80)->index();
            $table->string('service_name', 160);
            $table->string('package_code', 80);
            $table->string('package_name', 160);
            $table->string('currency', 3)->default('NGN');
            $table->decimal('amount', 12, 2);
            $table->string('payment_status', 40)->default('pending');
            $table->string('order_status', 60)->default('awaiting_payment')->index();
            $table->unsignedTinyInteger('progress_percent')->default(0);
            $table->string('paystack_reference', 120)->nullable()->unique();
            $table->string('paystack_access_code', 120)->nullable();
            $table->timestamp('paid_at')->nullable();

            $table->string('full_name', 120);
            $table->string('email')->index();
            $table->string('phone', 40)->nullable();
            $table->string('business_name', 180);
            $table->string('position', 120)->nullable();
            $table->string('business_website', 255)->nullable();
            $table->text('project_summary');
            $table->text('project_goals')->nullable();
            $table->text('target_audience')->nullable();
            $table->text('preferred_style')->nullable();
            $table->text('deliverables')->nullable();
            $table->text('additional_details')->nullable();
            $table->json('brief_payload')->nullable();
            $table->boolean('wants_account')->default(false);
            $table->foreignId('invoice_id')->nullable()->constrained('invoices')->nullOnDelete();
            $table->string('created_by_ip', 45)->nullable();
            $table->text('user_agent')->nullable();
            $table->timestamps();

            $table->index(['service_slug', 'payment_status']);
            $table->index(['user_id', 'created_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('service_orders');
    }
};
