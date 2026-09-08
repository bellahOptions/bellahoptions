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
        if (! Schema::hasTable('invoices')) {
            return;
        }

        if (! Schema::hasColumn('invoices', 'uuid')) {
            Schema::table('invoices', function (Blueprint $table): void {
                $table->uuid('uuid')->nullable()->after('id');
            });
        }

        DB::table('invoices')
            ->whereNull('uuid')
            ->orderBy('id')
            ->chunkById(100, function ($invoices): void {
                foreach ($invoices as $invoice) {
                    DB::table('invoices')
                        ->where('id', $invoice->id)
                        ->update(['uuid' => (string) Str::uuid()]);
                }
            });

        if (! Schema::hasIndex('invoices', 'invoices_uuid_unique')) {
            Schema::table('invoices', function (Blueprint $table): void {
                $table->unique('uuid', 'invoices_uuid_unique');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (! Schema::hasTable('invoices') || ! Schema::hasColumn('invoices', 'uuid')) {
            return;
        }

        Schema::table('invoices', function (Blueprint $table): void {
            if (Schema::hasIndex('invoices', 'invoices_uuid_unique')) {
                $table->dropUnique('invoices_uuid_unique');
            }

            $table->dropColumn('uuid');
        });
    }
};
