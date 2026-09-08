<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->boolean('commission_eligible')->default(false)->after('position');
            $table->decimal('commission_percent', 5, 2)->nullable()->after('commission_eligible');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->dropColumn(['commission_eligible', 'commission_percent']);
        });
    }
};
