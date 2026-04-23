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
        Schema::table('invoices', function (Blueprint $table): void {
            $table->unsignedTinyInteger('automatic_reminders_sent')
                ->default(0)
                ->after('payment_reference');
            $table->timestamp('last_automatic_reminder_sent_at')
                ->nullable()
                ->after('automatic_reminders_sent');
            $table->timestamp('last_manual_reminder_sent_at')
                ->nullable()
                ->after('last_automatic_reminder_sent_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('invoices', function (Blueprint $table): void {
            $table->dropColumn([
                'automatic_reminders_sent',
                'last_automatic_reminder_sent_at',
                'last_manual_reminder_sent_at',
            ]);
        });
    }
};
