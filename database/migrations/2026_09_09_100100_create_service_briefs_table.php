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
        Schema::create('service_briefs', function (Blueprint $table): void {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('reference_number', 40)->unique();
            $table->foreignId('service_brief_template_id')->nullable()->constrained('service_brief_templates')->nullOnDelete();
            $table->string('service_slug', 60)->index();
            $table->foreignId('customer_id')->nullable()->constrained('customers')->nullOnDelete();
            $table->string('status', 20)->default('new')->index();
            $table->json('answers');
            $table->boolean('is_rush')->default(false);
            $table->boolean('nda_required')->default(false);
            $table->boolean('has_unsure_answers')->default(false);
            $table->timestamp('consent_ndpa_at')->nullable();
            $table->string('consent_ndpa_ip', 45)->nullable();
            $table->boolean('consent_marketing')->default(false);
            $table->string('customer_name', 160)->nullable();
            $table->string('customer_email', 190)->nullable()->index();
            $table->string('customer_phone', 40)->nullable();
            $table->timestamp('response_due_at')->nullable();
            $table->foreignId('quoted_invoice_id')->nullable()->constrained('invoices')->nullOnDelete();
            $table->timestamps();

            $table->index(['service_slug', 'status']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('service_briefs');
    }
};
