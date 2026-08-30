<?php

namespace Tests\Feature;

use App\Models\Invoice;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Mail;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AdminIncomeSplitsPageTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Config::set('finance.income_split', [
            'ads_savings_percent' => 15,
            'data_savings_percent' => 15,
            'ai_savings_percent' => 15,
            'partner_percent' => 20,
            'partner_email' => 'peacefrancis851@gmail.com',
            'owner_email' => 'ahmed@bellahoptions.com',
        ]);

        Mail::fake();
    }

    private function payInvoice(float $amount): Invoice
    {
        $creator = User::query()->where('email', 'ahmed@bellahoptions.com')->first()
            ?? User::factory()->create(['role' => 'super_admin']);

        $invoice = Invoice::create([
            'invoice_number' => 'BO-PAGE-'.uniqid(),
            'customer_name' => 'Test Client',
            'customer_email' => 'client@example.com',
            'title' => 'Test Invoice',
            'amount' => $amount,
            'currency' => 'NGN',
            'status' => 'unpaid',
            'issued_at' => now(),
            'created_by' => $creator->id,
        ]);

        $invoice->update(['status' => 'paid', 'paid_at' => now()]);

        return $invoice->fresh();
    }

    public function test_non_super_admin_cannot_view_income_splits_page(): void
    {
        $staff = User::factory()->create(['role' => 'customer_rep']);

        $this->actingAs($staff)->get(route('admin.finance.income-splits'))->assertForbidden();
    }

    public function test_guest_and_regular_user_cannot_view_income_splits_page(): void
    {
        $user = User::factory()->create(['role' => 'user']);

        $this->actingAs($user)->get(route('admin.finance.income-splits'))->assertForbidden();
    }

    public function test_super_admin_sees_correct_totals_and_split_rows(): void
    {
        User::factory()->create(['role' => 'customer_rep', 'email' => 'peacefrancis851@gmail.com']);
        $superAdmin = User::factory()->create(['role' => 'super_admin', 'email' => 'ahmed@bellahoptions.com']);

        $this->payInvoice(100000);
        $this->payInvoice(50000);

        $this->actingAs($superAdmin)->get(route('admin.finance.income-splits'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Finance/IncomeSplits')
                ->has('splits.data', 2)
                ->where('totals.grand_total', '150000')
                ->where('totals.ads_savings', '22500')
                ->where('totals.data_savings', '22500')
                ->where('totals.ai_savings', '22500')
                ->where('totals.partner_total', '30000')
                ->where('totals.owner_total', '52500')
                ->where('totals.invoice_count', 2)
                ->where('formula.partner_percent', 20)
            );
    }
}
