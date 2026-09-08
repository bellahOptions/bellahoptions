<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('invoice_staff_commissions', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('invoice_id')->constrained('invoices')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('currency', 3)->default('NGN');
            $table->decimal('commission_percent', 5, 2);
            $table->decimal('commission_amount', 14, 2);
            $table->timestamps();

            $table->unique(['invoice_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('invoice_staff_commissions');
    }
};
