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
        Schema::create('subscription_plans', function (Blueprint $table): void {
            $table->id();
            $table->string('name', 160);
            $table->string('service_slug', 80)->index();
            $table->string('package_code', 80);
            $table->string('short_description', 280)->nullable();
            $table->string('billing_cycle', 40)->default('monthly');
            $table->unsignedInteger('position')->default(0)->index();
            $table->boolean('is_active')->default(true)->index();
            $table->boolean('show_on_homepage')->default(true)->index();
            $table->boolean('is_homepage_featured')->default(false)->index();
            $table->boolean('is_recommended')->default(false)->index();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['service_slug', 'package_code']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('subscription_plans');
    }
};
