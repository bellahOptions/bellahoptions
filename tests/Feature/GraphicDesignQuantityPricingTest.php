<?php

namespace Tests\Feature;

use App\Models\Invoice;
use App\Models\ServiceOrder;
use App\Support\PlatformSettings;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class GraphicDesignQuantityPricingTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Mail::fake();

        PlatformSettings::setGraphicDesignItems([
            [
                'id' => 'banners',
                'title' => 'Banners',
                'description' => 'Roll-up or wall banner design.',
                'unit_price' => 15000,
            ],
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function basePayload(): array
    {
        $this->get(route('orders.create', 'graphic-design'));

        $guard = session('service_order_human_check');
        $guard['issued_at'] = now()->subSeconds(8)->timestamp;
        session(['service_order_human_check' => $guard]);

        return [
            'service_package' => 'graphic-item-banners',
            'full_name' => 'Chidinma Okeke',
            'email' => 'chidinma@example.com',
            'phone' => '+2348108671804',
            'business_name' => 'Okeke Ventures',
            'position' => 'Founder',
            'has_logo' => 'yes',
            'has_content' => 'yes',
            'design_asset_types' => 'Banners for a product launch event.',
            'usage_channels' => 'Print, outdoor',
            'existing_brand_assets' => 'yes',
            'print_required' => 'yes',
            'project_summary' => 'We need banner designs for our upcoming product launch across three locations.',
            'human_check_answer' => $guard['answer'],
            'human_check_nonce' => $guard['nonce'],
            'form_rendered_at' => $guard['issued_at'],
            'website' => '',
            'company_name' => '',
        ];
    }

    public function test_order_amount_is_multiplied_by_the_submitted_quantity(): void
    {
        $payload = $this->basePayload();
        $payload['package_quantity'] = 3;

        $response = $this->post(route('orders.store', 'graphic-design'), $payload);

        $order = ServiceOrder::query()->first();
        $this->assertNotNull($order);
        $response->assertRedirect(route('orders.payment.show', $order));

        $this->assertSame(45000.0, (float) $order->amount);
        $this->assertSame(45000.0, (float) $order->base_amount);
        $this->assertStringContainsString('× 3', $order->package_name);
        $this->assertSame(3, data_get($order->brief_payload, 'package_quantity'));

        $invoice = Invoice::query()->findOrFail($order->invoice_id);
        $this->assertSame(45000.0, (float) $invoice->amount);
        $this->assertStringContainsString('× 3', $invoice->title);
    }

    public function test_quantity_defaults_to_one_when_not_submitted(): void
    {
        $payload = $this->basePayload();

        $response = $this->post(route('orders.store', 'graphic-design'), $payload);

        $order = ServiceOrder::query()->first();
        $this->assertNotNull($order);
        $response->assertRedirect(route('orders.payment.show', $order));

        $this->assertSame(15000.0, (float) $order->amount);
        $this->assertStringNotContainsString('×', $order->package_name);
    }

    public function test_zero_quantity_is_rejected(): void
    {
        $payload = $this->basePayload();
        $payload['package_quantity'] = 0;

        $this->post(route('orders.store', 'graphic-design'), $payload)
            ->assertSessionHasErrors(['package_quantity']);

        $this->assertDatabaseCount('service_orders', 0);
    }

    public function test_quantity_above_the_maximum_is_rejected(): void
    {
        $payload = $this->basePayload();
        $payload['package_quantity'] = 1001;

        $this->post(route('orders.store', 'graphic-design'), $payload)
            ->assertSessionHasErrors(['package_quantity']);

        $this->assertDatabaseCount('service_orders', 0);
    }
}
