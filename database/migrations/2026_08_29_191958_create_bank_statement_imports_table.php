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
        Schema::create('bank_statement_imports', function (Blueprint $table): void {
            $table->id();
            $table->string('original_filename');
            $table->string('account_number', 40)->nullable();
            $table->string('account_name', 160)->nullable();
            $table->string('currency', 3)->default('NGN');
            $table->date('period_start')->nullable();
            $table->date('period_end')->nullable();
            $table->decimal('opening_balance', 14, 2)->nullable();
            $table->decimal('closing_balance', 14, 2)->nullable();
            $table->unsignedInteger('total_rows')->default(0);
            $table->unsignedInteger('flagged_rows')->default(0);
            $table->foreignId('imported_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bank_statement_imports');
    }
};
