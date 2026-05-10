<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('order_prospects', function (Blueprint $table): void {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('service_order_id')->nullable()->constrained('service_orders')->nullOnDelete();
            $table->string('service_slug', 80)->index();
            $table->string('service_name', 180)->nullable();
            $table->string('service_package', 80)->nullable();
            $table->unsignedTinyInteger('current_step')->default(1);
            $table->string('status', 24)->default('active')->index();
            $table->string('full_name', 120)->nullable();
            $table->string('email', 255)->nullable()->index();
            $table->string('phone', 40)->nullable()->index();
            $table->string('business_name', 180)->nullable();
            $table->json('draft_payload')->nullable();
            $table->string('source_url', 255)->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->string('user_agent', 1000)->nullable();
            $table->timestamp('last_activity_at')->nullable()->index();
            $table->timestamp('abandoned_at')->nullable()->index();
            $table->timestamp('reminder_sent_at')->nullable();
            $table->timestamp('admin_notified_at')->nullable();
            $table->timestamp('converted_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_prospects');
    }
};
