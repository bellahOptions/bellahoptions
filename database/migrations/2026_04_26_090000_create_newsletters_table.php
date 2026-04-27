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
        Schema::create('newsletters', function (Blueprint $table): void {
            $table->id();
            $table->string('name', 160);
            $table->string('audience', 30)->index();
            $table->string('subject_template', 255);
            $table->longText('html_template');
            $table->json('dynamic_fields')->nullable();
            $table->boolean('is_active')->default(true)->index();
            $table->timestamp('last_sent_at')->nullable();
            $table->unsignedInteger('last_sent_count')->default(0);
            $table->foreignId('last_sent_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('newsletters');
    }
};

