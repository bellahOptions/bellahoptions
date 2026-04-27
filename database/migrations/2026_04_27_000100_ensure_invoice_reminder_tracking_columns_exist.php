<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('invoices')) {
            return;
        }

        Schema::table('invoices', function (Blueprint $table): void {
            if (! Schema::hasColumn('invoices', 'automatic_reminders_sent')) {
                $table->unsignedTinyInteger('automatic_reminders_sent')->default(0);
            }

            if (! Schema::hasColumn('invoices', 'last_automatic_reminder_sent_at')) {
                $table->timestamp('last_automatic_reminder_sent_at')->nullable();
            }

            if (! Schema::hasColumn('invoices', 'last_manual_reminder_sent_at')) {
                $table->timestamp('last_manual_reminder_sent_at')->nullable();
            }
        });
    }

    public function down(): void
    {
        if (! Schema::hasTable('invoices')) {
            return;
        }

        Schema::table('invoices', function (Blueprint $table): void {
            if (Schema::hasColumn('invoices', 'last_manual_reminder_sent_at')) {
                $table->dropColumn('last_manual_reminder_sent_at');
            }

            if (Schema::hasColumn('invoices', 'last_automatic_reminder_sent_at')) {
                $table->dropColumn('last_automatic_reminder_sent_at');
            }

            if (Schema::hasColumn('invoices', 'automatic_reminders_sent')) {
                $table->dropColumn('automatic_reminders_sent');
            }
        });
    }
};
