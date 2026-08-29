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
        Schema::create('bank_statement_transactions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('bank_statement_import_id')->constrained()->cascadeOnDelete();
            $table->date('transaction_date')->index();
            $table->date('value_date')->nullable();
            $table->string('channel', 60);
            $table->text('description');
            $table->decimal('amount', 12, 2);
            $table->string('type', 10)->index();
            $table->decimal('running_balance', 14, 2);
            $table->boolean('needs_review')->default(false);
            $table->string('suggested_category', 80)->nullable();
            $table->string('status', 20)->default('pending')->index();
            $table->foreignId('expense_id')->nullable()->constrained('expenses')->nullOnDelete();
            $table->foreignId('other_income_id')->nullable()->constrained('other_incomes')->nullOnDelete();
            $table->text('raw_text')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bank_statement_transactions');
    }
};
