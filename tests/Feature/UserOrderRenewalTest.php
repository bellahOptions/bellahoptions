<?php

namespace Tests\Feature;

use App\Mail\InvoiceIssuedMail;
use App\Models\Invoice;
use App\Models\ServiceOrder;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Tests\TestCase;

class UserOrderRenewalTest extends TestCase
{
    use RefreshDatabase;

    private function makePaidOrder(User $user, array $overrides = []): ServiceOrder
    {
        $invoice = Invoice::create([
            'invoice_number' => 'BO-RENEW-'.Str::random(6),
            'customer_name' => $user->name,
            'customer_email' => $user->email,
            'title' => 'Social Media Design - Starter Pack',
            'amount' => 30000,
            'currency' => 'NGN',
            'status' => 'paid',
            'issued_at' => now()->subMonth(),
            'paid_at' => now()->subMonth(),
            'created_by' => $user->id,
        ]);

        return ServiceOrder::create(array_merge([
            'uuid' => (string) Str::uuid(),
            'order_code' => 'BO-'.Str::random(6),
            'user_id' => $user->id,
            'service_slug' => 'social-media-design',
            'service_name' => 'Social Media Design',
            'package_code' => 'starter',
            'package_name' => 'Starter Pack',
            'currency' => 'NGN',
            'base_amount' => 30000,
            'amount' => 30000,
            'payment_provider' => 'paystack',
            'payment_status' => 'paid',
            'order_status' => 'completed',
            'progress_percent' => 100,
            'full_name' => $user->name,
            'email' => $user->email,
            'phone' => '+2348108671804',
            'business_name' => 'Test Co',
            'project_summary' => 'Ongoing monthly content creation for social campaigns.',
            'wants_account' => false,
            'invoice_id' => $invoice->id,
            'paid_at' => now()->subMonth(),
        ], $overrides));
    }

    public function test_user_can_renew_a_paid_order_creating_a_new_order_and_invoice(): void
    {
        Mail::fake();

        $user = User::factory()->create(['role' => 'user']);
        $order = $this->makePaidOrder($user);

        $response = $this->actingAs($user)->post(route('dashboard.orders.renew', $order));

        $newOrder = ServiceOrder::query()->where('id', '!=', $order->id)->firstOrFail();

        $response->assertRedirect(route('orders.show', $newOrder));
        $response->assertSessionHas('success');

        $this->assertSame($user->id, $newOrder->user_id);
        $this->assertSame('social-media-design', $newOrder->service_slug);
        $this->assertSame('starter', $newOrder->package_code);
        $this->assertEquals(30000, (float) $newOrder->amount);
        $this->assertSame('pending', $newOrder->payment_status);
        $this->assertSame('awaiting_payment', $newOrder->order_status);
        $this->assertNotNull($newOrder->invoice_id);

        $newInvoice = Invoice::findOrFail($newOrder->invoice_id);
        $this->assertSame('sent', $newInvoice->status);
        $this->assertEquals(30000, (float) $newInvoice->amount);
        $this->assertStringContainsString('Renewal', $newInvoice->title);

        Mail::assertSent(InvoiceIssuedMail::class, function (InvoiceIssuedMail $mail) use ($newInvoice): bool {
            return $mail->hasTo($newInvoice->customer_email) && $mail->invoice->is($newInvoice);
        });
    }

    public function test_cannot_renew_an_unpaid_order(): void
    {
        Mail::fake();

        $user = User::factory()->create(['role' => 'user']);
        $order = $this->makePaidOrder($user, ['payment_status' => 'pending', 'order_status' => 'awaiting_payment']);

        $this->actingAs($user)->post(route('dashboard.orders.renew', $order))
            ->assertSessionHas('error');

        $this->assertDatabaseCount('service_orders', 1);
        Mail::assertNothingSent();
    }

    public function test_user_cannot_renew_another_users_order(): void
    {
        $owner = User::factory()->create(['role' => 'user']);
        $intruder = User::factory()->create(['role' => 'user']);
        $order = $this->makePaidOrder($owner);

        $this->actingAs($intruder)->post(route('dashboard.orders.renew', $order))
            ->assertForbidden();

        $this->assertDatabaseCount('service_orders', 1);
    }

    public function test_staff_cannot_use_the_self_service_renew_action(): void
    {
        $staff = User::factory()->create(['role' => 'customer_rep']);
        $order = $this->makePaidOrder($staff);

        $this->actingAs($staff)->post(route('dashboard.orders.renew', $order))
            ->assertForbidden();
    }

    public function test_rapid_repeat_renewal_trigger_is_blocked_temporarily(): void
    {
        Mail::fake();

        $user = User::factory()->create(['role' => 'user']);
        $order = $this->makePaidOrder($user);

        $this->actingAs($user)->post(route('dashboard.orders.renew', $order))
            ->assertSessionHas('success');

        $this->actingAs($user)->post(route('dashboard.orders.renew', $order))
            ->assertSessionHas('error');

        $this->assertDatabaseCount('service_orders', 2);
    }

    public function test_orders_dashboard_marks_paid_orders_as_renewable(): void
    {
        $user = User::factory()->create(['role' => 'user']);
        $paidOrder = $this->makePaidOrder($user);
        $unpaidOrder = $this->makePaidOrder($user, [
            'uuid' => (string) Str::uuid(),
            'order_code' => 'BO-UNPAID99',
            'payment_status' => 'pending',
            'order_status' => 'awaiting_payment',
            'invoice_id' => null,
        ]);

        $response = $this->actingAs($user)->get(route('dashboard.orders'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->where('orders.0.id', $unpaidOrder->id)
            ->where('orders.0.can_renew', false)
            ->where('orders.1.id', $paidOrder->id)
            ->where('orders.1.can_renew', true)
        );
    }
}
