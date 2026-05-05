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
        Schema::table('service_orders', function (Blueprint $table): void {
            $table->string('order_code', 24)->nullable()->after('uuid');
        });

        $existingOrderIds = DB::table('service_orders')
            ->whereNotNull('order_code')
            ->pluck('order_code')
            ->map(static fn (mixed $value): string => strtoupper(trim((string) $value)))
            ->filter()
            ->all();

        $seenOrderIds = array_fill_keys($existingOrderIds, true);
        $orders = DB::table('service_orders')
            ->select('id')
            ->whereNull('order_code')
            ->orderBy('id')
            ->get();

        foreach ($orders as $order) {
            $orderCode = $this->generateServiceOrderCode($seenOrderIds);

            DB::table('service_orders')
                ->where('id', $order->id)
                ->update(['order_code' => $orderCode]);

            $seenOrderIds[$orderCode] = true;
        }

        Schema::table('service_orders', function (Blueprint $table): void {
            $table->unique('order_code');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('service_orders', function (Blueprint $table): void {
            $table->dropUnique(['order_code']);
            $table->dropColumn('order_code');
        });
    }
    
    /**
     * @param  array<string, bool>  $seenOrderIds
     */
    private function generateServiceOrderCode(array $seenOrderIds): string
    {
        do {
            $candidate = 'BO'.strtoupper(Str::random(6));
        } while (isset($seenOrderIds[$candidate]) || DB::table('service_orders')->where('order_code', $candidate)->exists());

        return $candidate;
    }
};
