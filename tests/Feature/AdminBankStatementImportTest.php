<?php

namespace Tests\Feature;

use App\Models\BankStatementImport;
use App\Models\BankStatementTransaction;
use App\Models\Expense;
use App\Models\OtherIncome;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AdminBankStatementImportTest extends TestCase
{
    use RefreshDatabase;

    private function makeImport(array $overrides = []): BankStatementImport
    {
        return BankStatementImport::create(array_merge([
            'original_filename' => 'statement.pdf',
            'account_number' => '4210082961',
            'account_name' => 'BELLAH OPTIONS',
            'currency' => 'NGN',
            'period_start' => '2024-08-28',
            'period_end' => '2026-08-28',
            'opening_balance' => 0,
            'closing_balance' => 7280.38,
            'total_rows' => 0,
            'flagged_rows' => 0,
        ], $overrides));
    }

    private function makeTransaction(BankStatementImport $import, array $overrides = []): BankStatementTransaction
    {
        return BankStatementTransaction::create(array_merge([
            'bank_statement_import_id' => $import->id,
            'transaction_date' => now()->toDateString(),
            'value_date' => now()->toDateString(),
            'channel' => 'Transfer',
            'description' => 'SMS ALERT CHARGE',
            'amount' => 100,
            'type' => BankStatementTransaction::TYPE_EXPENSE,
            'running_balance' => 900,
            'needs_review' => false,
            'suggested_category' => 'Bank & Payment Fees',
            'status' => BankStatementTransaction::STATUS_PENDING,
        ], $overrides));
    }

    public function test_non_super_admin_cannot_access_bank_import_module(): void
    {
        $staff = User::factory()->create(['role' => 'customer_rep']);
        $import = $this->makeImport();
        $transaction = $this->makeTransaction($import);

        $this->actingAs($staff)->get(route('admin.finance.bank-imports.index'))->assertForbidden();
        $this->actingAs($staff)->get(route('admin.finance.bank-imports.show', $import))->assertForbidden();
        $this->actingAs($staff)->post(route('admin.finance.bank-imports.transactions.convert', $transaction), [
            'type' => 'expense',
            'category' => 'Software & Tools',
        ])->assertForbidden();
        $this->actingAs($staff)->patch(route('admin.finance.bank-imports.transactions.ignore', $transaction))->assertForbidden();
        $this->actingAs($staff)->post(route('admin.finance.bank-imports.bulk-convert', $import), [
            'ids' => [$transaction->id],
            'category' => 'Software & Tools',
        ])->assertForbidden();
        $this->actingAs($staff)->delete(route('admin.finance.bank-imports.destroy', $import))->assertForbidden();
    }

    public function test_super_admin_can_view_import_list_and_review_page(): void
    {
        $superAdmin = User::factory()->create(['role' => 'super_admin']);
        $import = $this->makeImport(['total_rows' => 1]);
        $this->makeTransaction($import);

        $this->actingAs($superAdmin)->get(route('admin.finance.bank-imports.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Finance/BankImports/Index')
                ->has('imports.data', 1)
            );

        $this->actingAs($superAdmin)->get(route('admin.finance.bank-imports.show', $import))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Finance/BankImports/Show')
                ->where('import.pending_count', 1)
                ->has('transactions.data', 1)
            );
    }

    public function test_super_admin_can_convert_transaction_to_expense(): void
    {
        $superAdmin = User::factory()->create(['role' => 'super_admin']);
        $import = $this->makeImport();
        $transaction = $this->makeTransaction($import, [
            'description' => 'SMS ALERT CHARGE',
            'amount' => 45.5,
        ]);

        $this->actingAs($superAdmin)->post(route('admin.finance.bank-imports.transactions.convert', $transaction), [
            'type' => 'expense',
            'category' => 'Bank & Payment Fees',
        ])->assertRedirect();

        $transaction->refresh();
        $this->assertSame(BankStatementTransaction::STATUS_CONVERTED, $transaction->status);
        $this->assertNotNull($transaction->expense_id);

        $expense = Expense::findOrFail($transaction->expense_id);
        $this->assertSame('Bank & Payment Fees', $expense->category);
        $this->assertEquals(45.5, (float) $expense->amount);
        $this->assertSame($superAdmin->id, $expense->created_by);
    }

    public function test_super_admin_can_convert_transaction_to_income(): void
    {
        $superAdmin = User::factory()->create(['role' => 'super_admin']);
        $import = $this->makeImport();
        $transaction = $this->makeTransaction($import, [
            'description' => 'TRANSFER FROM JOHN DOE',
            'amount' => 5000,
            'type' => BankStatementTransaction::TYPE_INCOME,
            'suggested_category' => null,
        ]);

        $this->actingAs($superAdmin)->post(route('admin.finance.bank-imports.transactions.convert', $transaction), [
            'type' => 'income',
            'source_name' => 'John Doe',
        ])->assertRedirect();

        $transaction->refresh();
        $this->assertSame(BankStatementTransaction::STATUS_CONVERTED, $transaction->status);
        $this->assertNotNull($transaction->other_income_id);

        $income = OtherIncome::findOrFail($transaction->other_income_id);
        $this->assertSame('John Doe', $income->source_name);
        $this->assertEquals(5000, (float) $income->amount);
    }

    public function test_cannot_convert_an_already_processed_transaction(): void
    {
        $superAdmin = User::factory()->create(['role' => 'super_admin']);
        $import = $this->makeImport();
        $transaction = $this->makeTransaction($import, ['status' => BankStatementTransaction::STATUS_CONVERTED]);

        $this->actingAs($superAdmin)->post(route('admin.finance.bank-imports.transactions.convert', $transaction), [
            'type' => 'expense',
            'category' => 'Software & Tools',
        ])->assertRedirect();

        $this->assertDatabaseCount('expenses', 0);
    }

    public function test_super_admin_can_bulk_convert_pending_expenses_without_choosing_a_category(): void
    {
        $superAdmin = User::factory()->create(['role' => 'super_admin']);
        $import = $this->makeImport();
        $withSuggestion = $this->makeTransaction($import, ['amount' => 20, 'suggested_category' => 'Bank & Payment Fees']);
        $withoutSuggestion = $this->makeTransaction($import, ['amount' => 30, 'suggested_category' => null]);

        $this->actingAs($superAdmin)->post(route('admin.finance.bank-imports.bulk-convert', $import), [
            'ids' => [$withSuggestion->id, $withoutSuggestion->id],
        ])->assertRedirect();

        $this->assertDatabaseCount('expenses', 2);
        $this->assertSame(BankStatementTransaction::STATUS_CONVERTED, $withSuggestion->refresh()->status);
        $this->assertSame(BankStatementTransaction::STATUS_CONVERTED, $withoutSuggestion->refresh()->status);

        $this->assertSame('Bank & Payment Fees', Expense::findOrFail($withSuggestion->refresh()->expense_id)->category);
        $this->assertSame('Other', Expense::findOrFail($withoutSuggestion->refresh()->expense_id)->category);
    }

    public function test_super_admin_can_bulk_convert_pending_income_without_a_category(): void
    {
        $superAdmin = User::factory()->create(['role' => 'super_admin']);
        $import = $this->makeImport();
        $one = $this->makeTransaction($import, ['type' => BankStatementTransaction::TYPE_INCOME, 'amount' => 40, 'description' => 'JOHN DOE TRANSFER']);
        $two = $this->makeTransaction($import, ['type' => BankStatementTransaction::TYPE_INCOME, 'amount' => 60, 'description' => 'JANE ROE TRANSFER']);

        $this->actingAs($superAdmin)->post(route('admin.finance.bank-imports.bulk-convert', $import), [
            'ids' => [$one->id, $two->id],
        ])->assertRedirect();

        $this->assertDatabaseCount('other_incomes', 2);
        $this->assertSame(BankStatementTransaction::STATUS_CONVERTED, $one->refresh()->status);
        $this->assertSame(BankStatementTransaction::STATUS_CONVERTED, $two->refresh()->status);

        $income = OtherIncome::findOrFail($one->other_income_id);
        $this->assertSame('JOHN DOE TRANSFER', $income->source_name);
        $this->assertEquals(40, (float) $income->amount);
    }

    public function test_bulk_convert_handles_mixed_expense_and_income_selection_together(): void
    {
        $superAdmin = User::factory()->create(['role' => 'super_admin']);
        $import = $this->makeImport();
        $expenseRow = $this->makeTransaction($import, ['amount' => 20]);
        $incomeRow = $this->makeTransaction($import, ['type' => BankStatementTransaction::TYPE_INCOME, 'amount' => 40]);

        $this->actingAs($superAdmin)->post(route('admin.finance.bank-imports.bulk-convert', $import), [
            'ids' => [$expenseRow->id, $incomeRow->id],
        ])->assertRedirect();

        $this->assertDatabaseCount('expenses', 1);
        $this->assertDatabaseCount('other_incomes', 1);
        $this->assertSame(BankStatementTransaction::STATUS_CONVERTED, $expenseRow->refresh()->status);
        $this->assertSame(BankStatementTransaction::STATUS_CONVERTED, $incomeRow->refresh()->status);
    }

    public function test_super_admin_can_convert_all_pending_transactions_without_selecting(): void
    {
        $superAdmin = User::factory()->create(['role' => 'super_admin']);
        $import = $this->makeImport();
        $expenseRow = $this->makeTransaction($import, ['amount' => 20, 'suggested_category' => null]);
        $incomeRow = $this->makeTransaction($import, ['type' => BankStatementTransaction::TYPE_INCOME, 'amount' => 40]);
        $alreadyIgnored = $this->makeTransaction($import, ['status' => BankStatementTransaction::STATUS_IGNORED]);

        $this->actingAs($superAdmin)->post(route('admin.finance.bank-imports.convert-all', $import))
            ->assertRedirect()
            ->assertSessionHas('success');

        $this->assertSame(BankStatementTransaction::STATUS_CONVERTED, $expenseRow->refresh()->status);
        $this->assertSame(BankStatementTransaction::STATUS_CONVERTED, $incomeRow->refresh()->status);
        $this->assertSame(BankStatementTransaction::STATUS_IGNORED, $alreadyIgnored->refresh()->status);
        $this->assertDatabaseCount('expenses', 1);
        $this->assertDatabaseCount('other_incomes', 1);
        $this->assertSame('Other', Expense::findOrFail($expenseRow->refresh()->expense_id)->category);
    }

    public function test_convert_all_returns_error_when_nothing_pending(): void
    {
        $superAdmin = User::factory()->create(['role' => 'super_admin']);
        $import = $this->makeImport();
        $this->makeTransaction($import, ['status' => BankStatementTransaction::STATUS_CONVERTED]);

        $this->actingAs($superAdmin)->post(route('admin.finance.bank-imports.convert-all', $import))
            ->assertSessionHas('error');

        $this->assertDatabaseCount('expenses', 0);
        $this->assertDatabaseCount('other_incomes', 0);
    }

    public function test_converted_transactions_never_appear_in_the_review_list(): void
    {
        $superAdmin = User::factory()->create(['role' => 'super_admin']);
        $import = $this->makeImport();
        $this->makeTransaction($import, ['status' => BankStatementTransaction::STATUS_PENDING]);
        $this->makeTransaction($import, ['status' => BankStatementTransaction::STATUS_IGNORED]);
        $this->makeTransaction($import, ['status' => BankStatementTransaction::STATUS_CONVERTED]);

        $this->actingAs($superAdmin)->get(route('admin.finance.bank-imports.show', $import))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('transactions.data', 2)
            );

        // Even explicitly requesting a converted-only filter must not surface converted rows.
        $this->actingAs($superAdmin)->get(route('admin.finance.bank-imports.show', $import).'?status=converted')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('transactions.data', 2)
            );
    }

    public function test_infinite_scroll_page_two_appends_via_partial_reload(): void
    {
        if (! file_exists(public_path('build/manifest.json'))) {
            $this->markTestSkipped('Requires built frontend assets (public/build/manifest.json) to compute the Inertia asset version.');
        }

        $superAdmin = User::factory()->create(['role' => 'super_admin']);
        $import = $this->makeImport();

        for ($i = 0; $i < 35; $i++) {
            $this->makeTransaction($import, ['amount' => $i + 1]);
        }

        $version = (string) hash_file('xxh128', public_path('build/manifest.json'));

        $this->actingAs($superAdmin)
            ->get(route('admin.finance.bank-imports.show', $import).'?page=2', [
                'X-Inertia' => 'true',
                'X-Inertia-Version' => $version,
                'X-Inertia-Partial-Component' => 'Admin/Finance/BankImports/Show',
                'X-Inertia-Partial-Data' => 'transactions',
            ])
            ->assertOk()
            ->assertJsonCount(5, 'props.transactions.data');
    }

    public function test_super_admin_can_ignore_a_transaction(): void
    {
        $superAdmin = User::factory()->create(['role' => 'super_admin']);
        $import = $this->makeImport();
        $transaction = $this->makeTransaction($import);

        $this->actingAs($superAdmin)->patch(route('admin.finance.bank-imports.transactions.ignore', $transaction))
            ->assertRedirect();

        $this->assertSame(BankStatementTransaction::STATUS_IGNORED, $transaction->refresh()->status);
    }

    public function test_super_admin_can_delete_import_without_touching_converted_records(): void
    {
        $superAdmin = User::factory()->create(['role' => 'super_admin']);
        $import = $this->makeImport();
        $transaction = $this->makeTransaction($import);

        $this->actingAs($superAdmin)->post(route('admin.finance.bank-imports.transactions.convert', $transaction), [
            'type' => 'expense',
            'category' => 'Bank & Payment Fees',
        ]);

        $expenseId = $transaction->refresh()->expense_id;

        $this->actingAs($superAdmin)->delete(route('admin.finance.bank-imports.destroy', $import))
            ->assertRedirect(route('admin.finance.bank-imports.index'));

        $this->assertDatabaseMissing('bank_statement_imports', ['id' => $import->id]);
        $this->assertDatabaseMissing('bank_statement_transactions', ['id' => $transaction->id]);
        $this->assertDatabaseHas('expenses', ['id' => $expenseId]);
    }

    public function test_confirmed_income_flows_into_ledger_and_overview_totals(): void
    {
        $superAdmin = User::factory()->create(['role' => 'super_admin']);

        OtherIncome::create([
            'source_name' => 'John Doe',
            'amount' => 5000,
            'currency' => 'NGN',
            'received_date' => now()->toDateString(),
            'created_by' => $superAdmin->id,
        ]);

        $this->actingAs($superAdmin)->get(route('admin.finance.ledger'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('transactions.data', 1)
                ->where('totals.income', 5000)
            );

        $this->actingAs($superAdmin)->get(route('admin.finance.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('kpis.total_revenue', 5000)
            );
    }
}
