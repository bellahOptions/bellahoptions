<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::dropIfExists('slide_shows');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // The Slides feature has been removed from the application; this drop is not reversible.
    }
};
