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
        Schema::create('media_uploads', function (Blueprint $table) {
            $table->id();
            $table->string('public_id')->unique();
            $table->string('secure_url');
            $table->string('folder')->nullable();
            $table->string('format', 20)->nullable();
            $table->unsignedBigInteger('bytes')->default(0);
            $table->unsignedInteger('width')->default(0);
            $table->unsignedInteger('height')->default(0);
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('media_uploads');
    }
};
