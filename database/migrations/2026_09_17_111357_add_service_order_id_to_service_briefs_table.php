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
        Schema::table('service_briefs', function (Blueprint $table): void {
            $table->foreignId('service_order_id')->nullable()->after('quoted_invoice_id')
                ->constrained('service_orders')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('service_briefs', function (Blueprint $table): void {
            $table->dropConstrainedForeignId('service_order_id');
        });
    }
};
