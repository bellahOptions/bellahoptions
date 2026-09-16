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
        Schema::create('service_brief_templates', function (Blueprint $table): void {
            $table->id();
            $table->string('service_slug', 60)->index();
            $table->unsignedInteger('version')->default(1);
            $table->string('name', 160);
            $table->text('intro_copy')->nullable();
            $table->unsignedSmallInteger('estimated_minutes')->default(5);
            $table->json('steps');
            $table->boolean('is_active')->default(true)->index();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['service_slug', 'version']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('service_brief_templates');
    }
};
