<?php

namespace Tests\Feature;

use App\Models\Invoice;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Mail;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class MyEarningsPageTest extends TestCase
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

    private function payInvoice(float $amount, User $creator): Invoice
    {
        $invoice = Invoice::create([
            'invoice_number' => 'BO-MINE-'.uniqid(),
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

    public function test_non_staff_user_cannot_view_my_earnings_page(): void
    {
        $user = User::factory()->create(['role' => 'user']);

        $this->actingAs($user)->get(route('admin.my-earnings'))->assertForbidden();
    }

    public function test_partner_sees_only_their_own_cut(): void
    {
        $partner = User::factory()->create(['role' => 'customer_rep', 'email' => 'peacefrancis851@gmail.com']);
        $owner = User::factory()->create(['role' => 'super_admin', 'email' => 'ahmed@bellahoptions.com']);

        $this->payInvoice(100000, $owner);

        $this->actingAs($partner)->get(route('admin.my-earnings'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/MyEarnings')
                ->has('splits.data', 1)
                ->where('splits.data.0.role', 'partner')
                ->where('splits.data.0.your_amount', '20000.00')
                ->where('stats.total_earned', '20000')
                ->where('stats.invoice_count', 1)
            );
    }

    public function test_owner_sees_only_their_own_cut(): void
    {
        User::factory()->create(['role' => 'customer_rep', 'email' => 'peacefrancis851@gmail.com']);
        $owner = User::factory()->create(['role' => 'super_admin', 'email' => 'ahmed@bellahoptions.com']);

        $this->payInvoice(100000, $owner);

        $this->actingAs($owner)->get(route('admin.my-earnings'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/MyEarnings')
                ->has('splits.data', 1)
                ->where('splits.data.0.role', 'owner')
                ->where('splits.data.0.your_amount', '35000.00')
                ->where('stats.total_earned', '35000')
            );
    }

    public function test_this_month_total_excludes_splits_from_a_previous_month(): void
    {
        $partner = User::factory()->create(['role' => 'customer_rep', 'email' => 'peacefrancis851@gmail.com']);
        $owner = User::factory()->create(['role' => 'super_admin', 'email' => 'ahmed@bellahoptions.com']);

        $invoice = $this->payInvoice(100000, $owner);
        $invoice->incomeSplit()->update(['created_at' => now()->subMonths(2)]);

        $this->actingAs($partner)->get(route('admin.my-earnings'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('stats.total_earned', '20000')
                ->where('stats.this_month', '0')
            );
    }

    public function test_staff_with_no_income_splits_sees_empty_state(): void
    {
        $staff = User::factory()->create(['role' => 'customer_rep', 'email' => 'someone-else@example.com']);

        $this->actingAs($staff)->get(route('admin.my-earnings'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/MyEarnings')
                ->has('splits.data', 0)
                ->where('stats.total_earned', '0')
                ->where('stats.invoice_count', 0)
            );
    }
}
