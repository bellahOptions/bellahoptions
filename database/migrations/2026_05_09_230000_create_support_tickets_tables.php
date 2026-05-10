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
        if (! Schema::hasTable('support_tickets')) {
            Schema::create('support_tickets', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('user_id')->constrained()->cascadeOnDelete();
                $table->string('ticket_number', 40)->unique();
                $table->string('subject', 180);
                $table->string('priority', 20)->default('medium');
                $table->string('status', 30)->default('open');
                $table->timestamp('last_customer_reply_at')->nullable();
                $table->timestamp('last_staff_reply_at')->nullable();
                $table->unsignedSmallInteger('reminder_count')->default(0);
                $table->timestamp('last_reminder_sent_at')->nullable();
                $table->timestamp('closed_at')->nullable();
                $table->timestamps();

                $table->index(['status', 'created_at']);
                $table->index(['last_customer_reply_at', 'last_staff_reply_at']);
            });
        }

        if (! Schema::hasTable('support_ticket_messages')) {
            Schema::create('support_ticket_messages', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('support_ticket_id')->constrained('support_tickets')->cascadeOnDelete();
                $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
                $table->string('sender_type', 20);
                $table->text('message');
                $table->timestamps();

                $table->index(['support_ticket_id', 'id']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('support_ticket_messages');
        Schema::dropIfExists('support_tickets');
    }
};
