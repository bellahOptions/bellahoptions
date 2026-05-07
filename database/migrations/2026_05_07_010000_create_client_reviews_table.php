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
        Schema::create('client_reviews', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('service_order_id')->nullable()->constrained('service_orders')->nullOnDelete();
            $table->foreignId('invoice_id')->nullable()->constrained('invoices')->nullOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('source', 20)->default('client');
            $table->string('review_token', 80)->nullable()->unique();
            $table->string('reviewer_name', 160)->nullable();
            $table->string('reviewer_email', 190)->nullable()->index();
            $table->decimal('rating', 2, 1)->nullable();
            $table->text('comment')->nullable();
            $table->boolean('is_public')->default(false)->index();
            $table->boolean('is_featured')->default(false)->index();
            $table->timestamp('review_requested_at')->nullable();
            $table->timestamp('review_submitted_at')->nullable();
            $table->timestamp('published_at')->nullable();
            $table->timestamps();

            $table->index(['service_order_id', 'review_requested_at']);
            $table->index(['invoice_id', 'review_requested_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('client_reviews');
    }
};
