<?php

namespace Tests\Feature;

use App\Models\BankStatementImport;
use App\Models\BankStatementTransaction;
use App\Models\OtherIncome;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReclassifyNonRevenueBankTransfersCommandTest extends TestCase
{
    use RefreshDatabase;

    private function makeImport(): BankStatementImport
    {
        return BankStatementImport::create([
            'original_filename' => 'statement.pdf',
            'currency' => 'NGN',
            'opening_balance' => 0,
            'closing_balance' => 0,
            'total_rows' => 0,
            'flagged_rows' => 0,
        ]);
    }

    public function test_dry_run_reports_matches_without_changing_anything(): void
    {
        $import = $this->makeImport();
        $transaction = BankStatementTransaction::create([
            'bank_statement_import_id' => $import->id,
            'transaction_date' => now()->toDateString(),
            'value_date' => now()->toDateString(),
            'channel' => 'NIP Transfer',
            'description' => 'AHMED OLUMUYIWA/Transfer from AHMED OLUMUYIWA BELL',
            'amount' => 10000,
            'type' => BankStatementTransaction::TYPE_INCOME,
            'running_balance' => 10000,
            'needs_review' => false,
            'status' => BankStatementTransaction::STATUS_PENDING,
        ]);

        $this->artisan('bank-imports:fix-non-revenue-transfers --dry-run')
            ->assertExitCode(0);

        $this->assertSame(BankStatementTransaction::STATUS_PENDING, $transaction->refresh()->status);
    }

    public function test_reclassifies_pending_matching_transaction_as_ignored(): void
    {
        $import = $this->makeImport();
        $transaction = BankStatementTransaction::create([
            'bank_statement_import_id' => $import->id,
            'transaction_date' => now()->toDateString(),
            'value_date' => now()->toDateString(),
            'channel' => 'NIP Transfer',
            'description' => 'MOYOSOREOLUWA P/Transfer from MOYOSOREOLUWA PEACE',
            'amount' => 3000,
            'type' => BankStatementTransaction::TYPE_INCOME,
            'running_balance' => 8352,
            'needs_review' => false,
            'status' => BankStatementTransaction::STATUS_PENDING,
        ]);

        $this->artisan('bank-imports:fix-non-revenue-transfers')
            ->expectsConfirmation('Mark these as ignored and delete any linked income records?', 'yes')
            ->assertExitCode(0);

        $this->assertSame(BankStatementTransaction::STATUS_IGNORED, $transaction->refresh()->status);
    }

    public function test_reclassifies_already_converted_transaction_and_deletes_linked_income_record(): void
    {
        $superAdmin = User::factory()->create(['role' => 'super_admin']);
        $import = $this->makeImport();

        $income = OtherIncome::create([
            'source_name' => 'Taiwo Ogedengbe',
            'amount' => 5000,
            'currency' => 'NGN',
            'received_date' => now()->toDateString(),
            'created_by' => $superAdmin->id,
        ]);

        $transaction = BankStatementTransaction::create([
            'bank_statement_import_id' => $import->id,
            'transaction_date' => now()->toDateString(),
            'value_date' => now()->toDateString(),
            'channel' => 'NIP Transfer',
            'description' => 'TRANSFER FROM TAIWO OGEDENGBE',
            'amount' => 5000,
            'type' => BankStatementTransaction::TYPE_INCOME,
            'running_balance' => 5000,
            'needs_review' => false,
            'status' => BankStatementTransaction::STATUS_CONVERTED,
            'other_income_id' => $income->id,
        ]);

        $this->artisan('bank-imports:fix-non-revenue-transfers')
            ->expectsConfirmation('Mark these as ignored and delete any linked income records?', 'yes')
            ->assertExitCode(0);

        $transaction->refresh();
        $this->assertSame(BankStatementTransaction::STATUS_IGNORED, $transaction->status);
        $this->assertNull($transaction->other_income_id);
        $this->assertDatabaseMissing('other_incomes', ['id' => $income->id]);
    }

    public function test_leaves_unrelated_income_transactions_untouched(): void
    {
        $import = $this->makeImport();
        $transaction = BankStatementTransaction::create([
            'bank_statement_import_id' => $import->id,
            'transaction_date' => now()->toDateString(),
            'value_date' => now()->toDateString(),
            'channel' => 'Others',
            'description' => 'TRANSFER FROM TOLUWALASE DEBORAH OLUJIMI',
            'amount' => 4000,
            'type' => BankStatementTransaction::TYPE_INCOME,
            'running_balance' => 10039.40,
            'needs_review' => false,
            'status' => BankStatementTransaction::STATUS_PENDING,
        ]);

        $this->artisan('bank-imports:fix-non-revenue-transfers')
            ->assertExitCode(0);

        $this->assertSame(BankStatementTransaction::STATUS_PENDING, $transaction->refresh()->status);
    }

    public function test_cancelling_the_confirmation_makes_no_changes(): void
    {
        $import = $this->makeImport();
        $transaction = BankStatementTransaction::create([
            'bank_statement_import_id' => $import->id,
            'transaction_date' => now()->toDateString(),
            'value_date' => now()->toDateString(),
            'channel' => 'NIP Transfer',
            'description' => 'AHMED OLUMUYIWA/Transfer from AHMED OLUMUYIWA BELL',
            'amount' => 10000,
            'type' => BankStatementTransaction::TYPE_INCOME,
            'running_balance' => 10000,
            'needs_review' => false,
            'status' => BankStatementTransaction::STATUS_PENDING,
        ]);

        $this->artisan('bank-imports:fix-non-revenue-transfers')
            ->expectsConfirmation('Mark these as ignored and delete any linked income records?', 'no')
            ->assertExitCode(0);

        $this->assertSame(BankStatementTransaction::STATUS_PENDING, $transaction->refresh()->status);
    }
}
