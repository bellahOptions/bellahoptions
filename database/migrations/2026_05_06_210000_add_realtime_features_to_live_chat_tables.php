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
        Schema::table('live_chat_threads', function (Blueprint $table): void {
            $table->boolean('customer_is_online')->default(false)->after('assigned_staff_id');
            $table->timestamp('customer_last_seen_at')->nullable()->after('customer_is_online');
            $table->timestamp('customer_typing_at')->nullable()->after('last_staff_message_at');
            $table->timestamp('staff_typing_at')->nullable()->after('customer_typing_at');
            $table->string('closed_by_type', 20)->nullable()->after('closed_at');
            $table->foreignId('closed_by_user_id')->nullable()->after('closed_by_type')->constrained('users')->nullOnDelete();
            $table->timestamp('transcript_sent_at')->nullable()->after('closed_by_user_id');

            $table->index(['customer_is_online', 'customer_last_seen_at']);
            $table->index(['customer_typing_at', 'staff_typing_at']);
        });

        Schema::table('live_chat_messages', function (Blueprint $table): void {
            $table->string('client_message_id', 80)->nullable()->after('sender_name');
            $table->unique(['live_chat_thread_id', 'sender_type', 'client_message_id'], 'live_chat_messages_client_unique');
        });

        Schema::create('live_chat_message_reactions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('live_chat_message_id')->constrained('live_chat_messages')->cascadeOnDelete();
            $table->foreignId('reactor_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('reactor_token', 64)->nullable();
            $table->string('emoji', 16);
            $table->timestamps();

            $table->index(['live_chat_message_id', 'emoji']);
            $table->index(['reactor_user_id', 'reactor_token']);
            $table->unique(
                ['live_chat_message_id', 'reactor_user_id', 'reactor_token', 'emoji'],
                'live_chat_message_reactions_unique'
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('live_chat_message_reactions');

        Schema::table('live_chat_messages', function (Blueprint $table): void {
            $table->dropUnique('live_chat_messages_client_unique');
            $table->dropColumn('client_message_id');
        });

        Schema::table('live_chat_threads', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('closed_by_user_id');
            $table->dropIndex(['customer_is_online', 'customer_last_seen_at']);
            $table->dropIndex(['customer_typing_at', 'staff_typing_at']);
            $table->dropColumn([
                'customer_is_online',
                'customer_last_seen_at',
                'customer_typing_at',
                'staff_typing_at',
                'closed_by_type',
                'transcript_sent_at',
            ]);
        });
    }
};
