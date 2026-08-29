<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::dropIfExists('live_chat_message_reactions');
        Schema::dropIfExists('live_chat_messages');
        Schema::dropIfExists('live_chat_staff_presences');
        Schema::dropIfExists('live_chat_threads');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Live chat has been removed from the application; this drop is not reversible.
    }
};
