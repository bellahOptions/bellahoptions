<?php

namespace Tests\Feature;

use App\Mail\InvoiceIssuedAdminAlertMail;
use App\Mail\InvoiceIssuedMail;
use App\Mail\InvoicePaidReceiptMail;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class AdminInvoiceDashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_non_staff_user_cannot_access_invoice_management_actions(): void
    {
        $user = User::factory()->create([
            'role' => 'user',
        ]);

        $this->actingAs($user)
            ->get(route('dashboard'))
            ->assertOk();

        $this->actingAs($user)
            ->post(route('admin.invoices.store'), [
                'customer_name' => 'User Test',
                'customer_email' => 'user@example.com',
                'title' => 'Blocked Invoice',
                'amount' => '100.00',
                'currency' => 'NGN',
            ])
            ->assertForbidden();

        $this->actingAs($user)
            ->post(route('admin.customers.store'), [
                'first_name' => 'Blocked',
                'last_name' => 'Customer',
                'email' => 'blocked@example.com',
            ])
            ->assertForbidden();
    }

    public function test_staff_user_can_create_customer_record_for_future_invoices(): void
    {
        $staff = User::factory()->create([
            'role' => 'admin',
        ]);

        $response = $this->actingAs($staff)->from(route('dashboard'))->post(route('admin.customers.store'), [
            'first_name' => 'Mary',
            'last_name' => 'Johnson',
            'email' => 'mary@example.com',
            'occupation' => 'Data Analyst',
            'phone' => '+2348012345678',
            'company' => 'Acme Ventures',
            'address' => '12 Admiralty Way, Lekki',
            'notes' => 'Prefers email billing',
        ]);

        $response->assertRedirect(route('dashboard'));

        $this->assertDatabaseHas('customers', [
            'name' => 'Mary Johnson',
            'first_name' => 'Mary',
            'last_name' => 'Johnson',
            'email' => 'mary@example.com',
            'occupation' => 'Data Analyst',
            'created_by' => $staff->id,
        ]);
    }

    public function test_staff_user_can_create_invoice_and_email_customer(): void
    {
        config()->set('bellah.invoice.admin_notification_emails', ['ops@bellahoptions.com']);

        Mail::fake();

        $staff = User::factory()->create([
            'role' => 'admin',
        ]);

        $response = $this->actingAs($staff)->from(route('dashboard'))->post(route('admin.invoices.store'), [
            'customer_name' => 'Mary Johnson',
            'customer_email' => 'mary@example.com',
            'customer_occupation' => 'Data Analyst',
            'title' => 'Premium Strategy Session',
            'description' => 'One-on-one options advisory session.',
            'amount' => '25000.00',
            'currency' => 'NGN',
            'due_date' => now()->addDays(7)->toDateString(),
        ]);

        $response->assertRedirect(route('dashboard'));

        $this->assertDatabaseHas('invoices', [
            'customer_email' => 'mary@example.com',
            'status' => 'sent',
        ]);

        Mail::assertSent(InvoiceIssuedMail::class, function (InvoiceIssuedMail $mail): bool {
            return $mail->hasTo('mary@example.com')
                && $mail->hasFrom('billing@bellahoptions.com')
                && count($mail->attachments()) > 0;
        });

        Mail::assertSent(InvoiceIssuedAdminAlertMail::class, function (InvoiceIssuedAdminAlertMail $mail): bool {
            return $mail->hasTo('ops@bellahoptions.com')
                && $mail->invoice->customer_email === 'mary@example.com';
        });
    }

    public function test_first_generated_invoice_number_starts_at_200(): void
    {
        Mail::fake();

        $staff = User::factory()->create([
            'role' => 'admin',
        ]);

        $response = $this->actingAs($staff)->from(route('dashboard'))->post(route('admin.invoices.store'), [
            'customer_name' => 'Invoice Start',
            'customer_email' => 'invoice.start@example.com',
            'title' => 'Invoice Number Check',
            'amount' => '1200.00',
            'currency' => 'NGN',
        ]);

        $response->assertRedirect(route('dashboard'));

        $invoice = Invoice::query()
            ->where('customer_email', 'invoice.start@example.com')
            ->first();

        $this->assertNotNull($invoice);
        $this->assertSame('200', $invoice->invoice_number);
    }

    public function test_staff_can_mark_invoice_as_paid_and_customer_gets_receipt_email(): void
    {
        Mail::fake();

        $staff = User::factory()->create([
            'role' => 'staff',
        ]);

        $invoice = Invoice::create([
            'invoice_number' => 'BO-20260423-ABC123',
            'customer_name' => 'John Doe',
            'customer_email' => 'john@example.com',
            'customer_occupation' => 'Product Manager',
            'title' => 'Consulting Package',
            'description' => 'Consulting and strategy engagement',
            'amount' => 1200,
            'currency' => 'USD',
            'status' => 'sent',
            'issued_at' => now(),
            'created_by' => $staff->id,
        ]);

        $response = $this->actingAs($staff)->from(route('dashboard'))->patch(route('admin.invoices.mark-paid', $invoice), [
            'payment_reference' => 'PAY-REF-001',
        ]);

        $response->assertRedirect(route('dashboard'));

        $invoice->refresh();

        $this->assertSame('paid', $invoice->status);
        $this->assertSame('PAY-REF-001', $invoice->payment_reference);
        $this->assertNotNull($invoice->paid_at);

        Mail::assertSent(InvoicePaidReceiptMail::class, function (InvoicePaidReceiptMail $mail): bool {
            return $mail->hasTo('john@example.com')
                && $mail->hasFrom('billing@bellahoptions.com')
                && count($mail->attachments()) > 0;
        });
    }

    public function test_staff_can_create_invoice_from_saved_customer_record(): void
    {
        Mail::fake();

        $staff = User::factory()->create([
            'role' => 'staff',
        ]);

        $customer = Customer::create([
            'name' => 'Saved Customer',
            'first_name' => 'Saved',
            'last_name' => 'Customer',
            'email' => 'saved@example.com',
            'occupation' => 'Product Manager',
            'created_by' => $staff->id,
        ]);

        $response = $this->actingAs($staff)->from(route('dashboard'))->post(route('admin.invoices.store'), [
            'customer_id' => $customer->id,
            'title' => 'Retainer Package',
            'description' => 'Monthly support',
            'amount' => '5000.00',
            'currency' => 'NGN',
            'due_date' => now()->addDays(10)->toDateString(),
        ]);

        $response->assertRedirect(route('dashboard'));

        $this->assertDatabaseHas('invoices', [
            'customer_id' => $customer->id,
            'customer_name' => 'Saved Customer',
            'customer_email' => 'saved@example.com',
            'status' => 'sent',
        ]);

        Mail::assertSent(InvoiceIssuedMail::class, function (InvoiceIssuedMail $mail): bool {
            return $mail->hasTo('saved@example.com')
                && count($mail->attachments()) > 0;
        });
    }

    public function test_staff_invoice_creation_auto_saves_customer_if_not_found(): void
    {
        Mail::fake();

        $staff = User::factory()->create([
            'role' => 'staff',
        ]);

        $response = $this->actingAs($staff)->from(route('dashboard'))->post(route('admin.invoices.store'), [
            'customer_name' => 'Auto Save Person',
            'customer_email' => 'autosave@example.com',
            'customer_occupation' => 'Software Engineer',
            'title' => 'Auto Save Invoice',
            'amount' => '3500.00',
            'currency' => 'NGN',
        ]);

        $response->assertRedirect(route('dashboard'));

        $savedCustomer = Customer::query()->where('email', 'autosave@example.com')->first();

        $this->assertNotNull($savedCustomer);
        $this->assertDatabaseHas('invoices', [
            'customer_id' => $savedCustomer?->id,
            'customer_email' => 'autosave@example.com',
            'customer_name' => 'Auto Save Person',
        ]);
    }

    public function test_duplicate_invoice_trigger_with_same_payload_is_blocked_temporarily(): void
    {
        Mail::fake();

        $staff = User::factory()->create([
            'role' => 'admin',
        ]);

        $payload = [
            'customer_name' => 'Rapid Trigger',
            'customer_email' => 'rapid-trigger@example.com',
            'customer_occupation' => 'Data Analyst',
            'title' => 'Rapid Submission Test',
            'description' => 'Checks duplicate-trigger protection for invoice sending.',
            'amount' => '18000.00',
            'currency' => 'NGN',
            'due_date' => now()->addDays(5)->toDateString(),
        ];

        $this->actingAs($staff)->from(route('dashboard'))->post(route('admin.invoices.store'), $payload)
            ->assertRedirect(route('dashboard'));

        $this->actingAs($staff)->from(route('dashboard'))->post(route('admin.invoices.store'), $payload)
            ->assertRedirect(route('dashboard'))
            ->assertSessionHas('error');

        $this->assertDatabaseCount('invoices', 1);
        Mail::assertSent(InvoiceIssuedMail::class, 1);
    }

    public function test_staff_customer_search_scans_customers_and_non_staff_users(): void
    {
        $staff = User::factory()->create([
            'role' => 'admin',
        ]);

        Customer::create([
            'name' => 'Customer Match',
            'first_name' => 'Customer',
            'last_name' => 'Match',
            'email' => 'customer.match@example.com',
            'occupation' => 'Data Analyst',
            'created_by' => $staff->id,
        ]);

        $publicUser = User::factory()->create([
            'name' => 'Public Match',
            'first_name' => 'Public',
            'last_name' => 'Match',
            'email' => 'public.match@example.com',
            'role' => 'user',
        ]);

        $staffUser = User::factory()->create([
            'name' => 'Staff Match',
            'first_name' => 'Staff',
            'last_name' => 'Match',
            'email' => 'staff.match@example.com',
            'role' => 'staff',
        ]);

        $response = $this->actingAs($staff)->getJson(route('admin.customers.search', [
            'query' => 'match',
        ]));

        $response->assertOk();
        $response->assertJsonFragment([
            'email' => 'customer.match@example.com',
            'source' => 'customer',
        ]);
        $response->assertJsonFragment([
            'email' => $publicUser->email,
            'source' => 'user',
        ]);
        $response->assertJsonMissing([
            'email' => $staffUser->email,
        ]);
    }
}
