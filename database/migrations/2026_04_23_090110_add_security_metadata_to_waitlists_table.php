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
        Schema::table('waitlists', function (Blueprint $table): void {
            $table->string('ip_address', 45)->nullable()->after('occupation');
            $table->text('user_agent')->nullable()->after('ip_address');
            $table->timestamp('submitted_at')->nullable()->after('user_agent');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('waitlists', function (Blueprint $table): void {
            $table->dropColumn(['ip_address', 'user_agent', 'submitted_at']);
        });
    }
};
