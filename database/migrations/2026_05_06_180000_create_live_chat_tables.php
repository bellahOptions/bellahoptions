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
        Schema::create('live_chat_threads', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('customer_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('visitor_token', 64)->nullable()->unique();
            $table->string('guest_name')->nullable();
            $table->string('guest_email')->nullable();
            $table->string('status', 20)->default('open');
            $table->foreignId('assigned_staff_id')->nullable()->constrained('users')->nullOnDelete();
            $table->unsignedBigInteger('customer_last_read_message_id')->nullable();
            $table->unsignedBigInteger('staff_last_read_message_id')->nullable();
            $table->timestamp('last_message_at')->nullable();
            $table->timestamp('last_customer_message_at')->nullable();
            $table->timestamp('last_staff_message_at')->nullable();
            $table->timestamp('closed_at')->nullable();
            $table->timestamps();

            $table->index(['status', 'last_message_at']);
            $table->index('customer_user_id');
            $table->index('assigned_staff_id');
        });

        Schema::create('live_chat_messages', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('live_chat_thread_id')->constrained('live_chat_threads')->cascadeOnDelete();
            $table->string('sender_type', 20);
            $table->foreignId('sender_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('sender_name');
            $table->text('body');
            $table->timestamp('read_at')->nullable();
            $table->timestamps();

            $table->index(['live_chat_thread_id', 'id']);
            $table->index(['sender_type', 'id']);
        });

        Schema::create('live_chat_staff_presences', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained('users')->cascadeOnDelete();
            $table->boolean('is_online')->default(true);
            $table->timestamp('last_seen_at')->nullable();
            $table->timestamps();

            $table->index(['is_online', 'last_seen_at']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('live_chat_staff_presences');
        Schema::dropIfExists('live_chat_messages');
        Schema::dropIfExists('live_chat_threads');
    }
};
