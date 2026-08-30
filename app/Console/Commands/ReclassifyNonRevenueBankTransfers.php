<?php

namespace App\Console\Commands;

use App\Models\BankStatementTransaction;
use App\Models\OtherIncome;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ReclassifyNonRevenueBankTransfers extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'bank-imports:fix-non-revenue-transfers {--dry-run : Preview matches without making changes}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'One-time fix: reclassify existing bank-import income transactions from known non-revenue senders (owner/associate transfers, not customer revenue) as ignored, removing any linked OtherIncome record.';

    /**
     * Inbound transfers from these senders are personal/capital transfers
     * from the account owner or associates, not customer revenue. Kept in
     * sync with BankStatementController::NON_REVENUE_SENDER_KEYWORDS, which
     * applies the same rule to future imports at parse time.
     *
     * @var array<int, string>
     */
    private const NON_REVENUE_SENDER_KEYWORDS = [
        'AHMED OLUMUYIWA',
        'MOYOSOREOLUWA',
        'OGEDENGBE',
    ];

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');

        $matches = BankStatementTransaction::query()
            ->where('type', BankStatementTransaction::TYPE_INCOME)
            ->whereIn('status', [BankStatementTransaction::STATUS_PENDING, BankStatementTransaction::STATUS_CONVERTED])
            ->where(function ($query): void {
                foreach (self::NON_REVENUE_SENDER_KEYWORDS as $keyword) {
                    $query->orWhere('description', 'like', "%{$keyword}%");
                }
            })
            ->get();

        if ($matches->isEmpty()) {
            $this->info('No matching income transactions found. Nothing to do.');

            return self::SUCCESS;
        }

        $this->info("Found {$matches->count()} matching income transaction(s):");

        $totalAmount = 0.0;

        foreach ($matches as $transaction) {
            $totalAmount += (float) $transaction->amount;

            $this->line(sprintf(
                '  #%d [%s] %s — %s (status: %s)',
                $transaction->id,
                $transaction->transaction_date?->toDateString() ?? 'unknown date',
                number_format((float) $transaction->amount, 2),
                $transaction->description,
                $transaction->status,
            ));
        }

        $this->newLine();
        $this->info('Total amount affected: '.number_format($totalAmount, 2));

        if ($dryRun) {
            $this->comment('Dry run — no changes made. Re-run without --dry-run to apply.');

            return self::SUCCESS;
        }

        if (! $this->confirm('Mark these as ignored and delete any linked income records?', true)) {
            $this->comment('Cancelled — no changes made.');

            return self::SUCCESS;
        }

        DB::transaction(function () use ($matches): void {
            foreach ($matches as $transaction) {
                if ($transaction->other_income_id !== null) {
                    OtherIncome::query()->whereKey($transaction->other_income_id)->delete();
                }

                $transaction->update([
                    'status' => BankStatementTransaction::STATUS_IGNORED,
                    'other_income_id' => null,
                ]);
            }
        });

        $this->info('Done. All matching transactions are now marked ignored, and any linked income records were removed from the ledger.');

        return self::SUCCESS;
    }
}
