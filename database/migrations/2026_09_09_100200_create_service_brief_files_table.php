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
        Schema::create('service_brief_files', function (Blueprint $table): void {
            $table->id();
            $table->string('upload_session_token', 64)->index();
            $table->foreignId('service_brief_id')->nullable()->constrained('service_briefs')->nullOnDelete();
            $table->string('field_key', 100);
            $table->string('original_filename', 255);
            $table->string('disk_path', 500);
            $table->string('mime_type', 120)->nullable();
            $table->unsignedBigInteger('size_bytes')->default(0);
            $table->timestamps();

            $table->index(['service_brief_id', 'field_key']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('service_brief_files');
    }
};
