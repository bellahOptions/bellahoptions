<?php

namespace Tests\Feature;

use App\Mail\InvoiceDeletedMail;
use App\Models\Invoice;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class AdminManagementAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_staff_can_view_invoice_pages_and_delete_an_unpaid_invoice_sent_in_error(): void
    {
        Mail::fake();

        $staff = User::factory()->create([
            'role' => 'staff',
        ]);

        $invoice = $this->createInvoice($staff);

        $this->actingAs($staff)
            ->get(route('admin.invoices.index'))
            ->assertOk();

        $this->actingAs($staff)
            ->get(route('admin.invoices.show', $invoice))
            ->assertOk();

        $this->actingAs($staff)
            ->delete(route('admin.invoices.destroy', $invoice))
            ->assertRedirect(route('admin.invoices.index'));

        $this->assertDatabaseMissing('invoices', [
            'id' => $invoice->id,
        ]);

        Mail::assertSent(InvoiceDeletedMail::class);
    }

    public function test_staff_cannot_delete_a_paid_invoice(): void
    {
        Mail::fake();

        $staff = User::factory()->create([
            'role' => 'staff',
        ]);

        $invoice = $this->createInvoice($staff, 'paid');

        $this->actingAs($staff)
            ->delete(route('admin.invoices.destroy', $invoice))
            ->assertForbidden();

        $this->assertDatabaseHas('invoices', [
            'id' => $invoice->id,
        ]);
    }

    public function test_super_admin_can_delete_invoice(): void
    {
        Mail::fake();

        $superAdmin = User::factory()->create([
            'role' => User::ROLE_SUPER_ADMIN,
        ]);

        $invoice = $this->createInvoice($superAdmin);

        $this->actingAs($superAdmin)
            ->delete(route('admin.invoices.destroy', $invoice))
            ->assertRedirect(route('admin.invoices.index'));

        $this->assertDatabaseMissing('invoices', [
            'id' => $invoice->id,
        ]);
    }

    public function test_super_admin_can_view_and_modify_user_management_records(): void
    {
        $superAdmin = User::factory()->create([
            'role' => User::ROLE_SUPER_ADMIN,
        ]);

        $targetUser = User::factory()->create([
            'role' => 'user',
            'email' => 'managed-user@example.com',
        ]);

        $this->actingAs($superAdmin)
            ->get(route('admin.users.index'))
            ->assertOk();

        $this->actingAs($superAdmin)
            ->get(route('admin.users.show', $targetUser))
            ->assertOk();

        $this->actingAs($superAdmin)
            ->patch(route('admin.users.update', $targetUser), [
                'name' => 'Managed User Updated',
                'first_name' => 'Managed',
                'last_name' => 'Updated',
                'email' => 'managed-user@example.com',
                'role' => User::ROLE_CUSTOMER_REP,
                'address' => '15 Updated Street',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('users', [
            'id' => $targetUser->id,
            'role' => User::ROLE_CUSTOMER_REP,
            'address' => '15 Updated Street',
        ]);

        $this->actingAs($superAdmin)
            ->delete(route('admin.users.destroy', $targetUser))
            ->assertRedirect(route('admin.users.index'));

        $this->assertDatabaseMissing('users', [
            'id' => $targetUser->id,
        ]);
    }

    public function test_super_admin_can_flag_a_staff_member_commission_eligible_with_a_percent(): void
    {
        $superAdmin = User::factory()->create(['role' => User::ROLE_SUPER_ADMIN]);

        $rep = User::factory()->create([
            'role' => User::ROLE_CUSTOMER_REP,
            'email' => 'commission-rep@example.com',
        ]);

        $this->actingAs($superAdmin)
            ->patch(route('admin.users.update', $rep), [
                'name' => 'Commission Rep',
                'first_name' => 'Commission',
                'last_name' => 'Rep',
                'email' => 'commission-rep@example.com',
                'role' => User::ROLE_CUSTOMER_REP,
                'commission_eligible' => true,
                'commission_percent' => '12.5',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('users', [
            'id' => $rep->id,
            'commission_eligible' => true,
            'commission_percent' => '12.50',
        ]);
    }

    public function test_commission_percent_is_required_when_flagging_a_staff_member_eligible(): void
    {
        $superAdmin = User::factory()->create(['role' => User::ROLE_SUPER_ADMIN]);

        $rep = User::factory()->create([
            'role' => User::ROLE_CUSTOMER_REP,
            'email' => 'no-percent-rep@example.com',
        ]);

        $this->actingAs($superAdmin)
            ->patch(route('admin.users.update', $rep), [
                'name' => 'No Percent Rep',
                'first_name' => 'No',
                'last_name' => 'Percent',
                'email' => 'no-percent-rep@example.com',
                'role' => User::ROLE_CUSTOMER_REP,
                'commission_eligible' => true,
            ])
            ->assertSessionHasErrors('commission_percent');
    }

    public function test_unflagging_commission_eligibility_clears_the_stored_percent(): void
    {
        $superAdmin = User::factory()->create(['role' => User::ROLE_SUPER_ADMIN]);

        $rep = User::factory()->create([
            'role' => User::ROLE_CUSTOMER_REP,
            'email' => 'was-eligible@example.com',
            'commission_eligible' => true,
            'commission_percent' => 20,
        ]);

        $this->actingAs($superAdmin)
            ->patch(route('admin.users.update', $rep), [
                'name' => 'Was Eligible',
                'first_name' => 'Was',
                'last_name' => 'Eligible',
                'email' => 'was-eligible@example.com',
                'role' => User::ROLE_CUSTOMER_REP,
                'commission_eligible' => false,
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('users', [
            'id' => $rep->id,
            'commission_eligible' => false,
            'commission_percent' => null,
        ]);
    }

    public function test_customer_rep_cannot_access_user_management_routes(): void
    {
        $customerRep = User::factory()->create([
            'role' => User::ROLE_CUSTOMER_REP,
        ]);

        $targetUser = User::factory()->create([
            'role' => 'user',
        ]);

        $this->actingAs($customerRep)
            ->get(route('admin.users.index'))
            ->assertForbidden();

        $this->actingAs($customerRep)
            ->get(route('admin.users.show', $targetUser))
            ->assertForbidden();

        $this->actingAs($customerRep)
            ->patch(route('admin.users.update', $targetUser), [
                'name' => 'Blocked',
                'first_name' => 'Blocked',
                'last_name' => 'Update',
                'email' => $targetUser->email,
                'role' => 'user',
            ])
            ->assertForbidden();

        $this->actingAs($customerRep)
            ->delete(route('admin.users.destroy', $targetUser))
            ->assertForbidden();
    }

    private function createInvoice(User $staff, string $status = 'sent'): Invoice
    {
        return Invoice::create([
            'invoice_number' => (string) random_int(1000, 999999),
            'customer_name' => 'Invoice Access',
            'customer_email' => 'invoice-access@example.com',
            'customer_occupation' => 'Engineer',
            'title' => 'Access Test',
            'description' => 'Access control test invoice',
            'amount' => 2500,
            'currency' => 'NGN',
            'status' => $status,
            'issued_at' => now(),
            'paid_at' => $status === 'paid' ? now() : null,
            'created_by' => $staff->id,
        ]);
    }
}
