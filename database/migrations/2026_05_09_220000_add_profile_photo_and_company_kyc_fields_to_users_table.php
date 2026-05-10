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
        Schema::table('users', function (Blueprint $table): void {
            $table->string('profile_photo_path')->nullable()->after('address');
            $table->string('company_name', 180)->nullable()->after('profile_photo_path');
            $table->string('company_registration_number', 120)->nullable()->after('company_name');
            $table->string('company_tax_id', 120)->nullable()->after('company_registration_number');
            $table->text('company_address')->nullable()->after('company_tax_id');
            $table->string('company_website', 255)->nullable()->after('company_address');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->dropColumn([
                'profile_photo_path',
                'company_name',
                'company_registration_number',
                'company_tax_id',
                'company_address',
                'company_website',
            ]);
        });
    }
};
