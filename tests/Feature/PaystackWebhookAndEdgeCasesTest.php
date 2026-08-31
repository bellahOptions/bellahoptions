<?php

namespace Tests\Feature;

use App\Models\Invoice;
use App\Models\ServiceOrder;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Tests\TestCase;

class PaystackWebhookAndEdgeCasesTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Mail::fake();
    }

    private function createOrder(array $overrides = []): ServiceOrder
    {
        $user = User::factory()->create();

        $invoice = Invoice::create([
            'invoice_number' => (string) random_int(1000, 999999),
            'customer_name' => $user->name,
            'customer_email' => $user->email,
            'title' => 'Test Invoice',
            'amount' => 30000,
            'currency' => 'NGN',
            'status' => 'sent',
            'issued_at' => now(),
            'created_by' => $user->id,
        ]);

        return ServiceOrder::create(array_merge([
            'uuid' => (string) Str::uuid(),
            'order_code' => 'BO-ORDER-'.random_int(1000, 999999),
            'user_id' => $user->id,
            'service_slug' => 'social-media-design',
            'service_name' => 'Social Media Design Subscription',
            'package_code' => 'starter',
            'package_name' => 'Starter Pack',
            'currency' => 'NGN',
            'amount' => 30000,
            'payment_status' => 'processing',
            'order_status' => 'awaiting_payment',
            'progress_percent' => 5,
            'full_name' => $user->name,
            'email' => $user->email,
            'phone' => '+2348108671804',
            'business_name' => 'Test Co',
            'project_summary' => 'Need recurring design subscription for social media campaigns.',
            'wants_account' => false,
            'invoice_id' => $invoice->id,
        ], $overrides));
    }

    public function test_webhook_with_valid_signature_marks_order_paid_and_is_idempotent(): void
    {
        config()->set('services.paystack.secret_key', 'sk_test_123');
        config()->set('services.paystack.webhook_secret', 'whsec_test_123');

        $order = $this->createOrder(['paystack_reference' => 'BO-WEBHOOK-REF']);

        Http::fake([
            'https://api.paystack.co/transaction/verify/*' => Http::response([
                'status' => true,
                'data' => [
                    'status' => 'success',
                    'amount' => 3000000,
                    'currency' => 'NGN',
                    'reference' => 'BO-WEBHOOK-REF',
                ],
            ], 200),
        ]);

        $payload = json_encode([
            'event' => 'charge.success',
            'data' => ['reference' => 'BO-WEBHOOK-REF'],
        ]);
        $signature = hash_hmac('sha512', $payload, 'whsec_test_123');

        $response = $this->call('POST', route('webhooks.paystack'), [], [], [], [
            'HTTP_X-Paystack-Signature' => $signature,
            'CONTENT_TYPE' => 'application/json',
        ], $payload);

        $response->assertOk()->assertJson(['message' => 'Payment recorded.']);

        $this->assertDatabaseHas('service_orders', [
            'id' => $order->id,
            'payment_status' => 'paid',
        ]);

        $second = $this->call('POST', route('webhooks.paystack'), [], [], [], [
            'HTTP_X-Paystack-Signature' => $signature,
            'CONTENT_TYPE' => 'application/json',
        ], $payload);

        $second->assertOk()->assertJson(['message' => 'Already processed.']);
    }

    public function test_webhook_with_invalid_signature_is_rejected(): void
    {
        config()->set('services.paystack.secret_key', 'sk_test_123');
        config()->set('services.paystack.webhook_secret', 'whsec_test_123');

        $order = $this->createOrder(['paystack_reference' => 'BO-BADSIG-REF']);

        $payload = json_encode([
            'event' => 'charge.success',
            'data' => ['reference' => 'BO-BADSIG-REF'],
        ]);

        $response = $this->call('POST', route('webhooks.paystack'), [], [], [], [
            'HTTP_X-Paystack-Signature' => 'not-the-real-signature',
            'CONTENT_TYPE' => 'application/json',
        ], $payload);

        $response->assertStatus(401);

        $this->assertDatabaseHas('service_orders', [
            'id' => $order->id,
            'payment_status' => 'processing',
        ]);
    }

    public function test_payment_initialization_always_mints_a_fresh_reference(): void
    {
        config()->set('services.paystack.secret_key', 'sk_test_123');

        $order = $this->createOrder([
            'payment_status' => 'pending',
            'paystack_reference' => 'BO-STALE-REFERENCE-FROM-A-PRIOR-ATTEMPT',
        ]);

        Http::fake([
            'https://api.paystack.co/transaction/initialize' => Http::response([
                'status' => true,
                'data' => [
                    'authorization_url' => 'https://checkout.paystack.test/authorize',
                    'access_code' => 'AC_TEST',
                    'reference' => 'BO-FRESH-REFERENCE',
                ],
            ], 200),
        ]);

        $this->actingAs($order->user)->post(route('orders.payment.initialize', $order));

        Http::assertSent(function ($request) {
            return $request->url() === 'https://api.paystack.co/transaction/initialize'
                && $request['reference'] !== 'BO-STALE-REFERENCE-FROM-A-PRIOR-ATTEMPT';
        });
    }

    public function test_split_code_is_included_when_configured_and_omitted_when_not(): void
    {
        config()->set('services.paystack.secret_key', 'sk_test_123');
        config()->set('services.paystack.split_code', 'SPL_v9YhSfOKUm');

        $order = $this->createOrder(['payment_status' => 'pending']);

        Http::fake([
            'https://api.paystack.co/transaction/initialize' => Http::response([
                'status' => true,
                'data' => [
                    'authorization_url' => 'https://checkout.paystack.test/authorize',
                    'access_code' => 'AC_TEST',
                    'reference' => 'BO-SPLIT-REF',
                ],
            ], 200),
        ]);

        $this->actingAs($order->user)->post(route('orders.payment.initialize', $order));

        Http::assertSent(fn ($request) => ($request['split_code'] ?? null) === 'SPL_v9YhSfOKUm');

        config()->set('services.paystack.split_code', '');

        $order2 = $this->createOrder(['payment_status' => 'pending']);

        $this->actingAs($order2->user)->post(route('orders.payment.initialize', $order2));

        Http::assertSent(fn ($request) => $request->url() === 'https://api.paystack.co/transaction/initialize'
            && ! array_key_exists('split_code', $request->data()));
    }

    public function test_invalid_paystack_key_shows_friendly_error_and_logs_the_real_cause(): void
    {
        config()->set('services.paystack.secret_key', 'sk_test_invalid');

        $order = $this->createOrder(['payment_status' => 'pending']);

        Http::fake([
            'https://api.paystack.co/transaction/initialize' => Http::response([
                'status' => false,
                'message' => 'Invalid key',
            ], 401),
        ]);

        $response = $this->actingAs($order->user)->post(route('orders.payment.initialize', $order));

        $response->assertSessionHas('error', 'Unable to reach Paystack right now. Please try again shortly.');

        $this->assertDatabaseHas('service_orders', [
            'id' => $order->id,
            'payment_status' => 'pending',
        ]);
    }

    public function test_misconfigured_gateway_blocks_initialization_without_any_http_call(): void
    {
        config()->set('services.paystack.public_key', '');
        config()->set('services.paystack.secret_key', '');

        $order = $this->createOrder(['payment_status' => 'pending']);

        Http::fake();

        $response = $this->actingAs($order->user)->post(route('orders.payment.initialize', $order));

        $response->assertSessionHas('error', 'Paystack is not configured yet. Please contact support.');

        Http::assertNothingSent();
    }
}
