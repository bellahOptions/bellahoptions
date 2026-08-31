<?php

namespace Tests\Feature;

use App\Mail\ServiceOrderPaymentThankYouMail;
use App\Models\Invoice;
use App\Models\ServiceOrder;
use App\Models\Subscription;
use App\Models\SubscriptionPlan;
use App\Models\User;
use App\Support\PlatformSettings;
use App\Support\ServiceOrderCatalog;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Tests\TestCase;

class SubscriptionPlanPaystackSyncTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Mail::fake();
        config()->set('services.paystack.secret_key', 'sk_test_123');
        config()->set('services.paystack.webhook_secret', 'whsec_test_123');
    }

    public function test_creating_a_subscription_plan_syncs_it_to_paystack_and_stores_the_plan_code(): void
    {
        $superAdmin = User::factory()->create(['role' => User::ROLE_SUPER_ADMIN]);

        Http::fake([
            'https://api.paystack.co/plan' => Http::response([
                'status' => true,
                'data' => ['plan_code' => 'PLN_test123'],
            ], 200),
        ]);

        $this->actingAs($superAdmin)
            ->post(route('admin.subscription-plans.store'), [
                'name' => 'Growth Social Plan',
                'service_slug' => 'social-media-design',
                'package_code' => 'standard',
                'billing_cycle' => 'monthly',
                'position' => 1,
                'is_active' => true,
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('subscription_plans', [
            'service_slug' => 'social-media-design',
            'package_code' => 'standard',
            'paystack_plan_code' => 'PLN_test123',
            'paystack_sync_error' => null,
        ]);

        Http::assertSent(fn ($request) => $request->url() === 'https://api.paystack.co/plan'
            && $request['interval'] === 'monthly');
    }

    public function test_quantity_priced_packages_are_skipped_without_error(): void
    {
        PlatformSettings::setGraphicDesignItems([
            ['title' => 'Custom Admin Item', 'description' => '', 'unit_price' => 15000],
        ]);
        $packageCode = array_key_first(app(ServiceOrderCatalog::class)->service('graphic-design')['packages']);

        $superAdmin = User::factory()->create(['role' => User::ROLE_SUPER_ADMIN]);

        Http::fake();

        $this->actingAs($superAdmin)
            ->post(route('admin.subscription-plans.store'), [
                'name' => 'Graphic Item Plan',
                'service_slug' => 'graphic-design',
                'package_code' => $packageCode,
                'billing_cycle' => 'monthly',
                'position' => 1,
                'is_active' => true,
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('subscription_plans', [
            'service_slug' => 'graphic-design',
            'package_code' => $packageCode,
            'paystack_plan_code' => null,
            'paystack_sync_error' => null,
        ]);

        Http::assertNothingSent();
    }

    public function test_failed_paystack_sync_does_not_block_local_plan_creation(): void
    {
        $superAdmin = User::factory()->create(['role' => User::ROLE_SUPER_ADMIN]);

        Http::fake([
            'https://api.paystack.co/plan' => Http::response([
                'status' => false,
                'message' => 'Invalid key',
            ], 401),
        ]);

        $this->actingAs($superAdmin)
            ->post(route('admin.subscription-plans.store'), [
                'name' => 'Growth Social Plan',
                'service_slug' => 'social-media-design',
                'package_code' => 'standard',
                'billing_cycle' => 'monthly',
                'position' => 1,
                'is_active' => true,
            ])
            ->assertRedirect();

        $plan = SubscriptionPlan::query()->where('package_code', 'standard')->first();

        $this->assertNotNull($plan);
        $this->assertNull($plan->paystack_plan_code);
        $this->assertNotNull($plan->paystack_sync_error);
    }

    public function test_initialize_payment_includes_plan_code_when_order_has_a_subscription_plan(): void
    {
        $user = User::factory()->create();

        $plan = SubscriptionPlan::create([
            'name' => 'Growth Social Plan',
            'service_slug' => 'social-media-design',
            'package_code' => 'standard',
            'billing_cycle' => 'monthly',
            'paystack_plan_code' => 'PLN_test123',
            'paystack_synced_at' => now(),
        ]);

        $order = ServiceOrder::create([
            'uuid' => (string) Str::uuid(),
            'order_code' => 'BO-SUB-100',
            'user_id' => $user->id,
            'service_slug' => 'social-media-design',
            'service_name' => 'Social Media Design Subscription',
            'package_code' => 'standard',
            'package_name' => 'Standard Pack',
            'currency' => 'NGN',
            'amount' => 65000,
            'subscription_plan_id' => $plan->id,
            'payment_status' => 'pending',
            'order_status' => 'awaiting_payment',
            'progress_percent' => 5,
            'full_name' => $user->name,
            'email' => $user->email,
            'phone' => '+2348108671804',
            'business_name' => 'Test Co',
            'project_summary' => 'Need a recurring design subscription for social campaign content planning.',
            'wants_account' => false,
        ]);

        Http::fake([
            'https://api.paystack.co/transaction/initialize' => Http::response([
                'status' => true,
                'data' => [
                    'authorization_url' => 'https://checkout.paystack.test/authorize',
                    'access_code' => 'AC_TEST',
                    'reference' => 'BO-SUB-REF',
                ],
            ], 200),
        ]);

        $this->actingAs($user)->post(route('orders.payment.initialize', $order));

        Http::assertSent(fn ($request) => $request->url() === 'https://api.paystack.co/transaction/initialize'
            && ($request['plan'] ?? null) === 'PLN_test123');
    }

    public function test_initial_subscription_charge_activates_a_pending_subscription_record(): void
    {
        $user = User::factory()->create();

        $plan = SubscriptionPlan::create([
            'name' => 'Growth Social Plan',
            'service_slug' => 'social-media-design',
            'package_code' => 'standard',
            'billing_cycle' => 'monthly',
            'paystack_plan_code' => 'PLN_test123',
            'paystack_synced_at' => now(),
        ]);

        $invoice = Invoice::create([
            'invoice_number' => '900',
            'customer_name' => $user->name,
            'customer_email' => $user->email,
            'title' => 'Subscription Invoice',
            'amount' => 65000,
            'currency' => 'NGN',
            'status' => 'sent',
            'issued_at' => now(),
            'created_by' => $user->id,
        ]);

        $order = ServiceOrder::create([
            'uuid' => (string) Str::uuid(),
            'order_code' => 'BO-SUB-101',
            'user_id' => $user->id,
            'service_slug' => 'social-media-design',
            'service_name' => 'Social Media Design Subscription',
            'package_code' => 'standard',
            'package_name' => 'Standard Pack',
            'currency' => 'NGN',
            'amount' => 65000,
            'subscription_plan_id' => $plan->id,
            'payment_status' => 'processing',
            'order_status' => 'awaiting_payment',
            'progress_percent' => 5,
            'paystack_reference' => 'BO-SUB-INITIAL-REF',
            'full_name' => $user->name,
            'email' => $user->email,
            'phone' => '+2348108671804',
            'business_name' => 'Test Co',
            'project_summary' => 'Need a recurring design subscription for social campaign content planning.',
            'wants_account' => false,
            'invoice_id' => $invoice->id,
        ]);

        Http::fake([
            'https://api.paystack.co/transaction/verify/*' => Http::response([
                'status' => true,
                'data' => [
                    'status' => 'success',
                    'amount' => 6500000,
                    'currency' => 'NGN',
                    'reference' => 'BO-SUB-INITIAL-REF',
                    'plan' => ['plan_code' => 'PLN_test123'],
                    'customer' => ['customer_code' => 'CUS_test123'],
                ],
            ], 200),
        ]);

        $payload = json_encode(['event' => 'charge.success', 'data' => ['reference' => 'BO-SUB-INITIAL-REF']]);
        $signature = hash_hmac('sha512', $payload, 'whsec_test_123');

        $this->call('POST', route('webhooks.paystack'), [], [], [], [
            'HTTP_X-Paystack-Signature' => $signature,
            'CONTENT_TYPE' => 'application/json',
        ], $payload)->assertOk();

        $this->assertDatabaseHas('subscriptions', [
            'subscription_plan_id' => $plan->id,
            'service_order_id' => $order->id,
            'paystack_plan_code' => 'PLN_test123',
            'paystack_customer_code' => 'CUS_test123',
            'status' => 'pending_activation',
        ]);
    }

    public function test_subscription_renewal_charge_creates_a_new_paid_order_and_updates_the_subscription(): void
    {
        $user = User::factory()->create();

        $plan = SubscriptionPlan::create([
            'name' => 'Growth Social Plan',
            'service_slug' => 'social-media-design',
            'package_code' => 'standard',
            'billing_cycle' => 'monthly',
            'paystack_plan_code' => 'PLN_test123',
            'paystack_synced_at' => now(),
        ]);

        $invoice = Invoice::create([
            'invoice_number' => '901',
            'customer_name' => $user->name,
            'customer_email' => $user->email,
            'title' => 'Subscription Invoice',
            'amount' => 65000,
            'currency' => 'NGN',
            'status' => 'paid',
            'issued_at' => now(),
            'created_by' => $user->id,
        ]);

        $previousOrder = ServiceOrder::create([
            'uuid' => (string) Str::uuid(),
            'order_code' => 'BO-SUB-102',
            'user_id' => $user->id,
            'service_slug' => 'social-media-design',
            'service_name' => 'Social Media Design Subscription',
            'package_code' => 'standard',
            'package_name' => 'Standard Pack',
            'currency' => 'NGN',
            'amount' => 65000,
            'subscription_plan_id' => $plan->id,
            'payment_status' => 'paid',
            'order_status' => 'queued',
            'progress_percent' => 20,
            'paystack_reference' => 'BO-SUB-PREVIOUS-REF',
            'full_name' => $user->name,
            'email' => $user->email,
            'phone' => '+2348108671804',
            'business_name' => 'Test Co',
            'project_summary' => 'Need a recurring design subscription for social campaign content planning.',
            'wants_account' => false,
            'invoice_id' => $invoice->id,
        ]);

        $subscription = Subscription::create([
            'subscription_plan_id' => $plan->id,
            'service_order_id' => $previousOrder->id,
            'user_id' => $user->id,
            'customer_email' => $user->email,
            'customer_name' => $user->name,
            'paystack_plan_code' => 'PLN_test123',
            'paystack_customer_code' => 'CUS_test123',
            'paystack_subscription_code' => 'SUB_test123',
            'status' => 'active',
            'amount' => 65000,
            'currency' => 'NGN',
        ]);

        $payload = json_encode([
            'event' => 'charge.success',
            'data' => [
                'reference' => 'BO-SUB-RENEWAL-REF',
                'status' => 'success',
                'plan' => ['plan_code' => 'PLN_test123', 'next_payment_date' => '2026-10-01'],
                'customer' => ['customer_code' => 'CUS_test123'],
            ],
        ]);
        $signature = hash_hmac('sha512', $payload, 'whsec_test_123');

        $response = $this->call('POST', route('webhooks.paystack'), [], [], [], [
            'HTTP_X-Paystack-Signature' => $signature,
            'CONTENT_TYPE' => 'application/json',
        ], $payload);

        $response->assertOk()->assertJson(['message' => 'Renewal recorded.']);

        $this->assertDatabaseHas('service_orders', [
            'order_code' => $previousOrder->order_code,
        ]);

        $newOrder = ServiceOrder::query()
            ->where('paystack_reference', 'BO-SUB-RENEWAL-REF')
            ->first();

        $this->assertNotNull($newOrder);
        $this->assertSame('paid', $newOrder->payment_status);
        $this->assertSame($plan->id, $newOrder->subscription_plan_id);
        $this->assertNotSame($previousOrder->id, $newOrder->id);

        $subscription->refresh();
        $this->assertSame($newOrder->id, $subscription->service_order_id);
        $this->assertSame('2026-10-01', $subscription->next_payment_date->toDateString());

        Mail::assertSent(ServiceOrderPaymentThankYouMail::class, fn (ServiceOrderPaymentThankYouMail $mail): bool => $mail->hasTo($newOrder->email));
    }

    public function test_subscription_disable_webhook_marks_the_subscription_cancelled(): void
    {
        $plan = SubscriptionPlan::create([
            'name' => 'Growth Social Plan',
            'service_slug' => 'social-media-design',
            'package_code' => 'standard',
            'billing_cycle' => 'monthly',
            'paystack_plan_code' => 'PLN_test123',
        ]);

        $subscription = Subscription::create([
            'subscription_plan_id' => $plan->id,
            'customer_email' => 'client@example.com',
            'customer_name' => 'Client Example',
            'paystack_plan_code' => 'PLN_test123',
            'paystack_customer_code' => 'CUS_test123',
            'paystack_subscription_code' => 'SUB_test123',
            'status' => 'active',
            'amount' => 65000,
            'currency' => 'NGN',
        ]);

        $payload = json_encode([
            'event' => 'subscription.disable',
            'data' => ['subscription_code' => 'SUB_test123'],
        ]);
        $signature = hash_hmac('sha512', $payload, 'whsec_test_123');

        $this->call('POST', route('webhooks.paystack'), [], [], [], [
            'HTTP_X-Paystack-Signature' => $signature,
            'CONTENT_TYPE' => 'application/json',
        ], $payload)->assertOk();

        $subscription->refresh();
        $this->assertSame('cancelled', $subscription->status);
    }
}
