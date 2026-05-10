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
        if (! Schema::hasTable('support_ticket_messages')) {
            return;
        }

        Schema::table('support_ticket_messages', function (Blueprint $table): void {
            if (! Schema::hasColumn('support_ticket_messages', 'attachment_path')) {
                $table->string('attachment_path', 255)->nullable()->after('message');
            }

            if (! Schema::hasColumn('support_ticket_messages', 'attachment_name')) {
                $table->string('attachment_name', 255)->nullable()->after('attachment_path');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (! Schema::hasTable('support_ticket_messages')) {
            return;
        }

        Schema::table('support_ticket_messages', function (Blueprint $table): void {
            if (Schema::hasColumn('support_ticket_messages', 'attachment_name')) {
                $table->dropColumn('attachment_name');
            }

            if (Schema::hasColumn('support_ticket_messages', 'attachment_path')) {
                $table->dropColumn('attachment_path');
            }
        });
    }
};
