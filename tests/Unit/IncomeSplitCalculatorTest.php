<?php

namespace Tests\Unit;

use App\Mail\IncomeSplitPartnerNotificationMail;
use App\Models\IncomeSplit;
use App\Models\Invoice;
use App\Models\InvoiceStaffCommission;
use App\Models\User;
use App\Support\IncomeSplitCalculator;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class IncomeSplitCalculatorTest extends TestCase
{
    use RefreshDatabase;

    private function configureFormula(): void
    {
        Config::set('finance.income_split', [
            'ads_savings_percent' => 15,
            'data_savings_percent' => 15,
            'ai_savings_percent' => 15,
            'partner_percent' => 20,
            'partner_email' => 'peacefrancis851@gmail.com',
            'owner_email' => 'ahmed@bellahoptions.com',
        ]);
    }

    private function makeInvoice(float $amount = 100000): Invoice
    {
        $creator = User::factory()->create(['role' => 'super_admin']);

        return Invoice::create([
            'invoice_number' => 'BO-SPLIT-'.uniqid(),
            'customer_name' => 'Test Client',
            'customer_email' => 'client@example.com',
            'title' => 'Test Invoice',
            'amount' => $amount,
            'currency' => 'NGN',
            'status' => 'unpaid',
            'issued_at' => now(),
            'created_by' => $creator->id,
        ]);
    }

    public function test_split_reconciles_exactly_to_the_invoice_total_with_the_confirmed_formula(): void
    {
        $this->configureFormula();
        Mail::fake();

        $partner = User::factory()->create(['role' => 'customer_rep', 'email' => 'peacefrancis851@gmail.com']);
        $owner = User::factory()->create(['role' => 'super_admin', 'email' => 'ahmed@bellahoptions.com']);

        $invoice = $this->makeInvoice(100000);

        $split = app(IncomeSplitCalculator::class)->applyForInvoice($invoice);

        $this->assertNotNull($split);
        $this->assertSame(15000.0, (float) $split->ads_savings_amount);
        $this->assertSame(15000.0, (float) $split->data_savings_amount);
        $this->assertSame(15000.0, (float) $split->ai_savings_amount);
        $this->assertSame(20000.0, (float) $split->partner_amount);
        $this->assertSame(35000.0, (float) $split->owner_amount);
        $this->assertSame(35.0, (float) $split->owner_percent);

        $sum = (float) $split->ads_savings_amount
            + (float) $split->data_savings_amount
            + (float) $split->ai_savings_amount
            + (float) $split->partner_amount
            + (float) $split->owner_amount;

        $this->assertSame(100000.0, $sum);
        $this->assertSame($partner->id, $split->partner_user_id);
        $this->assertSame($owner->id, $split->owner_user_id);
    }

    public function test_split_reconciles_exactly_even_with_an_amount_prone_to_rounding_dust(): void
    {
        $this->configureFormula();
        Mail::fake();

        User::factory()->create(['role' => 'customer_rep', 'email' => 'peacefrancis851@gmail.com']);
        User::factory()->create(['role' => 'super_admin', 'email' => 'ahmed@bellahoptions.com']);

        $invoice = $this->makeInvoice(99.99);

        $split = app(IncomeSplitCalculator::class)->applyForInvoice($invoice);

        $sum = (float) $split->ads_savings_amount
            + (float) $split->data_savings_amount
            + (float) $split->ai_savings_amount
            + (float) $split->partner_amount
            + (float) $split->owner_amount;

        $this->assertEqualsWithDelta(99.99, $sum, 0.001);
    }

    public function test_applying_the_split_twice_for_the_same_invoice_is_idempotent(): void
    {
        $this->configureFormula();
        Mail::fake();

        User::factory()->create(['role' => 'customer_rep', 'email' => 'peacefrancis851@gmail.com']);
        User::factory()->create(['role' => 'super_admin', 'email' => 'ahmed@bellahoptions.com']);

        $invoice = $this->makeInvoice(50000);

        $calculator = app(IncomeSplitCalculator::class);
        $first = $calculator->applyForInvoice($invoice);
        $second = $calculator->applyForInvoice($invoice);

        $this->assertSame($first->id, $second->id);
        $this->assertSame(1, IncomeSplit::query()->where('invoice_id', $invoice->id)->count());
    }

    public function test_partner_is_notified_by_email_when_a_split_is_created(): void
    {
        $this->configureFormula();
        Mail::fake();

        $partner = User::factory()->create(['role' => 'customer_rep', 'email' => 'peacefrancis851@gmail.com']);
        User::factory()->create(['role' => 'super_admin', 'email' => 'ahmed@bellahoptions.com']);

        $invoice = $this->makeInvoice(40000);

        $split = app(IncomeSplitCalculator::class)->applyForInvoice($invoice);

        Mail::assertSent(IncomeSplitPartnerNotificationMail::class, function ($mail) use ($partner) {
            return $mail->hasTo($partner->email);
        });

        $this->assertNotNull($split->fresh()->partner_notified_at);
    }

    public function test_split_still_created_when_no_matching_partner_user_account_exists(): void
    {
        $this->configureFormula();
        Mail::fake();

        User::factory()->create(['role' => 'super_admin', 'email' => 'ahmed@bellahoptions.com']);

        $invoice = $this->makeInvoice(10000);

        $split = app(IncomeSplitCalculator::class)->applyForInvoice($invoice);

        $this->assertNotNull($split);
        $this->assertNull($split->partner_user_id);
        $this->assertNull($split->partner_notified_at);
        Mail::assertNothingSent();
    }

    public function test_commission_eligible_staff_earn_a_cut_and_owner_absorbs_the_rest(): void
    {
        $this->configureFormula();
        Mail::fake();

        User::factory()->create(['role' => 'customer_rep', 'email' => 'peacefrancis851@gmail.com']);
        User::factory()->create(['role' => 'super_admin', 'email' => 'ahmed@bellahoptions.com']);

        $repOne = User::factory()->create([
            'role' => 'customer_rep',
            'commission_eligible' => true,
            'commission_percent' => 10,
        ]);
        $repTwo = User::factory()->create([
            'role' => 'customer_rep',
            'commission_eligible' => true,
            'commission_percent' => 5,
        ]);
        // Flagged eligible but no percentage set — must be excluded entirely.
        User::factory()->create([
            'role' => 'customer_rep',
            'commission_eligible' => true,
            'commission_percent' => null,
        ]);
        // Has a percentage but not flagged eligible — must be excluded entirely.
        User::factory()->create([
            'role' => 'customer_rep',
            'commission_eligible' => false,
            'commission_percent' => 8,
        ]);

        $invoice = $this->makeInvoice(100000);

        $split = app(IncomeSplitCalculator::class)->applyForInvoice($invoice);

        // 15+15+15 savings + 20 partner + 10+5 staff = 80%, so owner absorbs the remaining 20%.
        $this->assertSame(20000.0, (float) $split->owner_amount);
        $this->assertSame(20.0, (float) $split->owner_percent);

        $this->assertSame(2, InvoiceStaffCommission::where('invoice_id', $invoice->id)->count());

        $repOneCommission = InvoiceStaffCommission::where('invoice_id', $invoice->id)->where('user_id', $repOne->id)->first();
        $repTwoCommission = InvoiceStaffCommission::where('invoice_id', $invoice->id)->where('user_id', $repTwo->id)->first();

        $this->assertSame(10000.0, (float) $repOneCommission->commission_amount);
        $this->assertSame(5000.0, (float) $repTwoCommission->commission_amount);

        $sum = (float) $split->ads_savings_amount
            + (float) $split->data_savings_amount
            + (float) $split->ai_savings_amount
            + (float) $split->partner_amount
            + (float) $repOneCommission->commission_amount
            + (float) $repTwoCommission->commission_amount
            + (float) $split->owner_amount;

        $this->assertSame(100000.0, $sum);
    }

    public function test_owner_share_is_floored_at_zero_when_commissions_exceed_available_remainder(): void
    {
        $this->configureFormula();
        Mail::fake();

        User::factory()->create(['role' => 'super_admin', 'email' => 'ahmed@bellahoptions.com']);

        User::factory()->create([
            'role' => 'customer_rep',
            'commission_eligible' => true,
            'commission_percent' => 90,
        ]);

        $invoice = $this->makeInvoice(10000);

        $split = app(IncomeSplitCalculator::class)->applyForInvoice($invoice);

        $this->assertSame(0.0, (float) $split->owner_amount);
        $this->assertSame(0.0, (float) $split->owner_percent);
    }
}
