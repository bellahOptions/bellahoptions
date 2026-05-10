<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (! Schema::hasTable('users')) {
            return;
        }

        if (! Schema::hasColumn('users', 'uuid')) {
            Schema::table('users', function (Blueprint $table): void {
                $table->uuid('uuid')->nullable()->after('id');
            });
        }

        DB::table('users')
            ->whereNull('uuid')
            ->orderBy('id')
            ->chunkById(100, function ($users): void {
                foreach ($users as $user) {
                    DB::table('users')
                        ->where('id', $user->id)
                        ->update(['uuid' => (string) Str::uuid()]);
                }
            });

        if (! Schema::hasIndex('users', 'users_uuid_unique')) {
            Schema::table('users', function (Blueprint $table): void {
                $table->unique('uuid', 'users_uuid_unique');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (! Schema::hasTable('users') || ! Schema::hasColumn('users', 'uuid')) {
            return;
        }

        Schema::table('users', function (Blueprint $table): void {
            if (Schema::hasIndex('users', 'users_uuid_unique')) {
                $table->dropUnique('users_uuid_unique');
            }

            $table->dropColumn('uuid');
        });
    }
};
