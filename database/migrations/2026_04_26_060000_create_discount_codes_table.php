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
        Schema::create('discount_codes', function (Blueprint $table): void {
            $table->id();
            $table->string('name', 120)->nullable();
            $table->string('code', 80)->unique();
            $table->string('discount_type', 20);
            $table->decimal('discount_value', 10, 2);
            $table->string('currency', 3)->nullable();
            $table->boolean('is_active')->default(true)->index();
            $table->string('service_slug', 80)->nullable()->index();
            $table->string('package_code', 80)->nullable();
            $table->unsignedInteger('max_redemptions')->nullable();
            $table->unsignedInteger('total_redemptions')->default(0);
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['service_slug', 'package_code']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('discount_codes');
    }
};
