<?php

namespace Tests\Feature;

use App\Models\Expense;
use App\Models\Invoice;
use App\Models\Payout;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AdminFinanceModuleTest extends TestCase
{
    use RefreshDatabase;

    public function test_non_staff_user_cannot_access_finance_module(): void
    {
        $user = User::factory()->create(['role' => 'user']);

        $this->actingAs($user)->get(route('admin.finance.index'))->assertForbidden();
        $this->actingAs($user)->get(route('admin.finance.ledger'))->assertForbidden();
        $this->actingAs($user)->get(route('admin.finance.expenses.index'))->assertForbidden();
        $this->actingAs($user)->get(route('admin.finance.payouts.index'))->assertForbidden();

        $this->actingAs($user)->post(route('admin.finance.expenses.store'), [
            'category' => 'Software & Tools',
            'amount' => '50.00',
            'currency' => 'NGN',
            'expense_date' => now()->toDateString(),
        ])->assertForbidden();
    }

    public function test_customer_rep_is_fully_blocked_from_finance_module(): void
    {
        $staff = User::factory()->create(['role' => 'customer_rep']);

        $this->actingAs($staff)->get(route('admin.finance.index'))->assertForbidden();
        $this->actingAs($staff)->get(route('admin.finance.ledger'))->assertForbidden();
        $this->actingAs($staff)->get(route('admin.finance.ledger.export'))->assertForbidden();
        $this->actingAs($staff)->get(route('admin.finance.expenses.index'))->assertForbidden();
        $this->actingAs($staff)->get(route('admin.finance.payouts.index'))->assertForbidden();

        $this->actingAs($staff)->post(route('admin.finance.expenses.store'), [
            'category' => 'Software & Tools',
            'amount' => '50.00',
            'currency' => 'NGN',
            'expense_date' => now()->toDateString(),
        ])->assertForbidden();

        $this->actingAs($staff)->post(route('admin.finance.payouts.store'), [
            'payee_name' => 'Jane Freelancer',
            'amount' => '200.00',
            'currency' => 'NGN',
            'purpose' => 'Logo design contract',
        ])->assertForbidden();

        $this->assertDatabaseCount('expenses', 0);
        $this->assertDatabaseCount('payouts', 0);
    }

    public function test_super_admin_has_full_access_to_finance_module(): void
    {
        $superAdmin = User::factory()->create(['role' => 'super_admin']);

        $this->actingAs($superAdmin)->get(route('admin.finance.index'))->assertOk();
        $this->actingAs($superAdmin)->get(route('admin.finance.ledger'))->assertOk();
        $this->actingAs($superAdmin)->get(route('admin.finance.expenses.index'))->assertOk();
        $this->actingAs($superAdmin)->get(route('admin.finance.payouts.index'))->assertOk();

        $this->actingAs($superAdmin)->from(route('admin.finance.expenses.index'))->post(route('admin.finance.expenses.store'), [
            'category' => 'Software & Tools',
            'vendor' => 'Adobe',
            'amount' => '75.50',
            'currency' => 'USD',
            'expense_date' => now()->toDateString(),
        ])->assertRedirect(route('admin.finance.expenses.index'));

        $expense = Expense::firstOrFail();
        $this->assertSame('Adobe', $expense->vendor);
        $this->assertSame($superAdmin->id, $expense->created_by);

        $this->actingAs($superAdmin)->from(route('admin.finance.payouts.index'))->post(route('admin.finance.payouts.store'), [
            'payee_name' => 'Jane Freelancer',
            'payee_email' => 'jane@example.com',
            'amount' => '200.00',
            'currency' => 'NGN',
            'purpose' => 'Logo design contract',
        ])->assertRedirect(route('admin.finance.payouts.index'));

        $payout = Payout::firstOrFail();
        $this->assertSame('pending', $payout->status);

        $this->actingAs($superAdmin)->from(route('admin.finance.payouts.index'))->patch(
            route('admin.finance.payouts.mark-paid', $payout),
            ['payment_reference' => 'REF-001'],
        )->assertRedirect(route('admin.finance.payouts.index'));

        $payout->refresh();
        $this->assertSame('paid', $payout->status);
        $this->assertSame('REF-001', $payout->payment_reference);
        $this->assertNotNull($payout->paid_at);

        $this->actingAs($superAdmin)->delete(route('admin.finance.expenses.destroy', $expense))->assertRedirect();
        $this->actingAs($superAdmin)->delete(route('admin.finance.payouts.destroy', $payout))->assertRedirect();

        $this->assertDatabaseMissing('expenses', ['id' => $expense->id]);
        $this->assertDatabaseMissing('payouts', ['id' => $payout->id]);
    }

    public function test_ledger_combines_income_expenses_and_payouts_with_correct_totals(): void
    {
        $superAdmin = User::factory()->create(['role' => 'super_admin']);

        Invoice::create([
            'invoice_number' => 'BO-TEST-0001',
            'customer_name' => 'Paid Client',
            'customer_email' => 'client@example.com',
            'title' => 'Brand Design Package',
            'amount' => 1000,
            'currency' => 'NGN',
            'status' => 'paid',
            'issued_at' => now(),
            'paid_at' => now(),
            'created_by' => $superAdmin->id,
        ]);

        Expense::create([
            'category' => 'Marketing & Ads',
            'vendor' => 'Meta Ads',
            'amount' => 150,
            'currency' => 'NGN',
            'expense_date' => now()->toDateString(),
            'created_by' => $superAdmin->id,
        ]);

        Payout::create([
            'payee_name' => 'Design Contractor',
            'amount' => 250,
            'currency' => 'NGN',
            'purpose' => 'Freelance illustration',
            'status' => Payout::STATUS_PAID,
            'paid_at' => now(),
            'created_by' => $superAdmin->id,
        ]);

        // A pending payout must NOT appear in the ledger (only settled money movements count).
        Payout::create([
            'payee_name' => 'Pending Contractor',
            'amount' => 999,
            'currency' => 'NGN',
            'purpose' => 'Not yet paid',
            'status' => Payout::STATUS_PENDING,
            'created_by' => $superAdmin->id,
        ]);

        $this->actingAs($superAdmin)->get(route('admin.finance.ledger'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Finance/Ledger')
                ->has('transactions.data', 3)
                ->where('totals.income', 1000)
                ->where('totals.expense', 150)
                ->where('totals.payout', 250)
                ->where('totals.net', 600)
            );

        $this->actingAs($superAdmin)->get(route('admin.finance.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Finance/Overview')
                ->where('kpis.total_revenue', 1000)
                ->where('kpis.total_expenses', 150)
                ->where('kpis.total_payouts', 250)
                ->where('kpis.net_profit', 600)
                ->where('kpis.pending_payouts_count', 1)
                ->where('kpis.pending_payouts', 999)
            );
    }

    public function test_ledger_export_returns_csv_with_expected_rows(): void
    {
        $superAdmin = User::factory()->create(['role' => 'super_admin']);

        Expense::create([
            'category' => 'Travel',
            'amount' => 80,
            'currency' => 'NGN',
            'expense_date' => now()->toDateString(),
            'created_by' => $superAdmin->id,
        ]);

        $response = $this->actingAs($superAdmin)->get(route('admin.finance.ledger.export'));

        $response->assertOk();
        $response->assertHeader('Content-Type', 'text/csv; charset=UTF-8');

        $csv = $response->streamedContent();
        $this->assertStringContainsString('Date,Type,Description,Reference,Currency,Amount', $csv);
        $this->assertStringContainsString('Travel', $csv);
    }
}
