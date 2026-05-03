<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('blog_posts', function (Blueprint $table): void {
            $table->id();
            $table->string('title', 180);
            $table->string('slug', 200)->unique();
            $table->string('excerpt', 260)->nullable();
            $table->longText('body')->nullable();
            $table->string('cover_image')->nullable();
            $table->string('category', 80)->nullable()->index();
            $table->string('author_name', 120)->nullable();
            $table->boolean('is_published')->default(true)->index();
            $table->dateTime('published_at')->nullable()->index();
            $table->unsignedInteger('position')->default(0)->index();
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('blog_posts');
    }
};
