<?php

namespace Tests\Feature;

use App\Models\Invoice;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminManagementAccessTest extends TestCase
{
    use RefreshDatabase;

    public function test_staff_can_view_invoice_pages_but_cannot_delete_invoices(): void
    {
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
            ->assertForbidden();
    }

    public function test_super_admin_can_delete_invoice(): void
    {
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

    private function createInvoice(User $staff): Invoice
    {
        return Invoice::create([
            'invoice_number' => '200',
            'customer_name' => 'Invoice Access',
            'customer_email' => 'invoice-access@example.com',
            'customer_occupation' => 'Engineer',
            'title' => 'Access Test',
            'description' => 'Access control test invoice',
            'amount' => 2500,
            'currency' => 'NGN',
            'status' => 'sent',
            'issued_at' => now(),
            'created_by' => $staff->id,
        ]);
    }
}
