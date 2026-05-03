<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('gallery_projects', function (Blueprint $table): void {
            $table->id();
            $table->string('title', 160);
            $table->string('category', 80)->nullable()->index();
            $table->text('description')->nullable();
            $table->string('image_path');
            $table->string('project_url')->nullable();
            $table->boolean('is_published')->default(true)->index();
            $table->unsignedInteger('position')->default(0)->index();
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('gallery_projects');
    }
};
