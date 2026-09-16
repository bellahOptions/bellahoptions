<?php

namespace Tests\Feature;

use App\Mail\InvoiceCommissionInvalidatedMail;
use App\Mail\InvoiceDeletedMail;
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
                'items' => [['description' => 'Blocked service', 'quantity' => 1, 'unit_price' => '100.00']],
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
            'items' => [['description' => 'Strategy session', 'quantity' => 1, 'unit_price' => '25000.00']],
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
            'items' => [['description' => 'Number check service', 'quantity' => 1, 'unit_price' => '1200.00']],
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
            'payment_method' => 'bank_transfer',
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
            'items' => [['description' => 'Monthly retainer', 'quantity' => 1, 'unit_price' => '5000.00']],
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
            'items' => [['description' => 'Auto save service', 'quantity' => 1, 'unit_price' => '3500.00']],
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
            'items' => [['description' => 'Rapid submission service', 'quantity' => 1, 'unit_price' => '18000.00']],
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

    public function test_staff_can_fetch_a_paid_invoice_as_a_duplicate_template_without_sending_anything(): void
    {
        Mail::fake();

        $staff = User::factory()->create(['role' => 'admin']);

        $invoice = Invoice::create([
            'invoice_number' => 'BO-PAID-001',
            'customer_name' => 'Renewing Customer',
            'customer_email' => 'renewing@example.com',
            'customer_occupation' => 'Founder',
            'title' => 'Web Design - Standard Plan',
            'description' => 'Annual web design retainer',
            'amount' => 80000,
            'currency' => 'NGN',
            'status' => 'paid',
            'issued_at' => now()->subYear(),
            'paid_at' => now()->subYear(),
            'created_by' => $staff->id,
        ]);
        $invoice->items()->create([
            'description' => 'Annual retainer',
            'quantity' => 1,
            'unit_price' => 80000,
            'amount' => 80000,
            'sort_order' => 0,
        ]);

        $response = $this->actingAs($staff)->getJson(route('admin.invoices.duplicate', $invoice));

        $response->assertOk();
        $response->assertJsonPath('invoice.customer_email', 'renewing@example.com');
        $response->assertJsonPath('invoice.title', $invoice->title);
        $response->assertJsonCount(1, 'invoice.items');

        // Fetching a duplicate template must not create anything or email anyone —
        // the rep still has to review/edit and explicitly submit the "New Invoice" form.
        $this->assertDatabaseCount('invoices', 1);
        Mail::assertNothingSent();
    }

    public function test_cannot_duplicate_an_unpaid_invoice(): void
    {
        Mail::fake();

        $staff = User::factory()->create(['role' => 'admin']);

        $invoice = Invoice::create([
            'invoice_number' => 'BO-UNPAID-001',
            'customer_name' => 'Unpaid Customer',
            'customer_email' => 'unpaid@example.com',
            'title' => 'Graphic Design',
            'amount' => 20000,
            'currency' => 'NGN',
            'status' => 'sent',
            'issued_at' => now(),
            'created_by' => $staff->id,
        ]);

        $this->actingAs($staff)
            ->getJson(route('admin.invoices.duplicate', $invoice))
            ->assertStatus(422);

        $this->assertDatabaseCount('invoices', 1);
        Mail::assertNothingSent();
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

    public function test_customer_rep_can_delete_a_sent_invoice_and_customer_is_emailed_an_apology(): void
    {
        Mail::fake();

        $rep = User::factory()->create([
            'role' => 'customer_rep',
            'name' => 'Amaka Rep',
            'position' => 'Customer Success Lead',
        ]);

        $invoice = Invoice::create([
            'invoice_number' => 'BO-ERROR-001',
            'customer_name' => 'Mistaken Customer',
            'customer_email' => 'mistake@example.com',
            'title' => 'Sent By Mistake',
            'amount' => 15000,
            'currency' => 'NGN',
            'status' => 'sent',
            'issued_at' => now(),
            'created_by' => $rep->id,
        ]);

        $response = $this->actingAs($rep)->from(route('admin.invoices.index'))
            ->delete(route('admin.invoices.destroy', $invoice), [
                'reason' => 'This was created against the wrong customer record.',
            ]);

        $response->assertRedirect(route('admin.invoices.index'));
        $response->assertSessionHas('success');

        $this->assertDatabaseMissing('invoices', ['id' => $invoice->id]);

        Mail::assertSent(InvoiceDeletedMail::class, function (InvoiceDeletedMail $mail) use ($rep): bool {
            return $mail->hasTo('mistake@example.com')
                && $mail->deletedBy->is($rep)
                && $mail->reason === 'This was created against the wrong customer record.';
        });
    }

    public function test_customer_rep_cannot_delete_a_paid_invoice(): void
    {
        Mail::fake();

        $rep = User::factory()->create(['role' => 'customer_rep']);

        $invoice = Invoice::create([
            'invoice_number' => 'BO-PAID-003',
            'customer_name' => 'Already Paid',
            'customer_email' => 'paid@example.com',
            'title' => 'Paid Package',
            'amount' => 30000,
            'currency' => 'NGN',
            'status' => 'paid',
            'issued_at' => now(),
            'paid_at' => now(),
            'created_by' => $rep->id,
        ]);

        $this->actingAs($rep)
            ->delete(route('admin.invoices.destroy', $invoice))
            ->assertForbidden();

        $this->assertDatabaseHas('invoices', ['id' => $invoice->id]);
        Mail::assertNothingSent();
    }

    public function test_super_admin_can_delete_a_paid_invoice_and_customer_is_notified(): void
    {
        Mail::fake();

        $admin = User::factory()->create(['role' => 'super_admin', 'name' => 'Site Admin']);

        $invoice = Invoice::create([
            'invoice_number' => 'BO-PAID-004',
            'customer_name' => 'Refund Needed',
            'customer_email' => 'refund@example.com',
            'title' => 'Duplicate Charge',
            'amount' => 45000,
            'currency' => 'NGN',
            'status' => 'paid',
            'issued_at' => now(),
            'paid_at' => now(),
            'created_by' => $admin->id,
        ]);

        $this->actingAs($admin)
            ->delete(route('admin.invoices.destroy', $invoice))
            ->assertRedirect(route('admin.invoices.index'));

        $this->assertDatabaseMissing('invoices', ['id' => $invoice->id]);
        Mail::assertSent(InvoiceDeletedMail::class, fn (InvoiceDeletedMail $mail): bool => $mail->hasTo('refund@example.com'));
    }

    public function test_deleting_a_paid_invoice_notifies_commission_eligible_staff_that_their_earnings_are_void(): void
    {
        Mail::fake();

        $admin = User::factory()->create(['role' => 'super_admin', 'email' => 'ahmed@bellahoptions.com']);
        $rep = User::factory()->create([
            'role' => 'customer_rep',
            'name' => 'Commission Rep',
            'email' => 'commission-rep@example.com',
            'commission_eligible' => true,
            'commission_percent' => 10,
        ]);

        $invoice = Invoice::create([
            'invoice_number' => 'BO-PAID-COMMISSION-001',
            'customer_name' => 'Commission Test Customer',
            'customer_email' => 'commission-customer@example.com',
            'title' => 'Commissioned Work',
            'amount' => 100000,
            'currency' => 'NGN',
            'status' => 'unpaid',
            'issued_at' => now(),
            'created_by' => $admin->id,
        ]);

        // Transitioning to paid (not creating already-paid) is what fires the
        // observer that actually creates the income split + staff commissions.
        $invoice->update(['status' => 'paid', 'paid_at' => now()]);

        $this->assertDatabaseHas('invoice_staff_commissions', [
            'invoice_id' => $invoice->id,
            'user_id' => $rep->id,
        ]);

        $this->actingAs($admin)
            ->delete(route('admin.invoices.destroy', $invoice))
            ->assertRedirect(route('admin.invoices.index'));

        $this->assertDatabaseMissing('invoices', ['id' => $invoice->id]);
        $this->assertDatabaseMissing('invoice_staff_commissions', ['invoice_id' => $invoice->id]);

        Mail::assertSent(InvoiceCommissionInvalidatedMail::class, function (InvoiceCommissionInvalidatedMail $mail) use ($rep, $invoice): bool {
            return $mail->hasTo($rep->email)
                && $mail->invoice->is($invoice)
                && (float) $mail->commission->commission_amount === 10000.0;
        });
    }

    public function test_non_staff_user_cannot_delete_invoices(): void
    {
        Mail::fake();

        $user = User::factory()->create(['role' => 'user']);

        $invoice = Invoice::create([
            'invoice_number' => 'BO-BLOCKED-001',
            'customer_name' => 'Protected Customer',
            'customer_email' => 'protected@example.com',
            'title' => 'Protected Invoice',
            'amount' => 10000,
            'currency' => 'NGN',
            'status' => 'sent',
            'issued_at' => now(),
            'created_by' => $user->id,
        ]);

        $this->actingAs($user)
            ->delete(route('admin.invoices.destroy', $invoice))
            ->assertForbidden();

        $this->assertDatabaseHas('invoices', ['id' => $invoice->id]);
        Mail::assertNothingSent();
    }
}
