<?php

namespace Tests\Feature;

use App\Models\IncomeSplit;
use App\Models\Invoice;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class InvoiceIncomeSplitObserverTest extends TestCase
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

    private function makeInvoice(string $status = 'unpaid'): Invoice
    {
        $creator = User::factory()->create(['role' => 'super_admin']);

        return Invoice::create([
            'invoice_number' => 'BO-OBS-'.uniqid(),
            'customer_name' => 'Test Client',
            'customer_email' => 'client@example.com',
            'title' => 'Test Invoice',
            'amount' => 20000,
            'currency' => 'NGN',
            'status' => $status,
            'issued_at' => now(),
            'created_by' => $creator->id,
        ]);
    }

    public function test_marking_an_invoice_paid_automatically_creates_an_income_split(): void
    {
        User::factory()->create(['role' => 'customer_rep', 'email' => 'peacefrancis851@gmail.com']);
        User::factory()->create(['role' => 'super_admin', 'email' => 'ahmed@bellahoptions.com']);

        $invoice = $this->makeInvoice('unpaid');

        $invoice->update(['status' => 'paid', 'paid_at' => now()]);

        $this->assertDatabaseHas('income_splits', ['invoice_id' => $invoice->id]);
    }

    public function test_updating_an_invoice_without_changing_status_does_not_create_a_split(): void
    {
        $invoice = $this->makeInvoice('unpaid');

        $invoice->update(['title' => 'Renamed Invoice']);

        $this->assertDatabaseMissing('income_splits', ['invoice_id' => $invoice->id]);
    }

    public function test_changing_status_to_something_other_than_paid_does_not_create_a_split(): void
    {
        $invoice = $this->makeInvoice('unpaid');

        $invoice->update(['status' => 'cancelled']);

        $this->assertDatabaseMissing('income_splits', ['invoice_id' => $invoice->id]);
    }

    public function test_saving_an_already_paid_invoice_again_does_not_duplicate_the_split(): void
    {
        User::factory()->create(['role' => 'customer_rep', 'email' => 'peacefrancis851@gmail.com']);
        User::factory()->create(['role' => 'super_admin', 'email' => 'ahmed@bellahoptions.com']);

        $invoice = $this->makeInvoice('unpaid');
        $invoice->update(['status' => 'paid', 'paid_at' => now()]);

        $invoice->update(['status' => 'paid']);
        $invoice->update(['title' => 'Touched again while still paid']);

        $this->assertSame(1, IncomeSplit::query()->where('invoice_id', $invoice->id)->count());
    }
}
