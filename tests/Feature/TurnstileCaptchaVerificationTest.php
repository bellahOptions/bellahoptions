<?php

namespace Tests\Feature;

use App\Support\PlatformSettings;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class TurnstileCaptchaVerificationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Mail::fake();
        Config::set('services.turnstile.site_key', 'test-site-key');
        Config::set('services.turnstile.secret_key', 'test-secret-key');

        PlatformSettings::setGraphicDesignItems([
            ['id' => 'banners', 'title' => 'Banners', 'description' => 'Banner design.', 'unit_price' => 15000],
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function basePayload(): array
    {
        $this->get(route('orders.create', 'graphic-design'));

        return [
            'service_package' => 'graphic-item-banners',
            'package_quantity' => 1,
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
            'form_rendered_at' => now()->timestamp,
            'website' => '',
            'company_name' => '',
        ];
    }

    public function test_successful_turnstile_verification_allows_order_creation(): void
    {
        Http::fake([
            'https://challenges.cloudflare.com/turnstile/v0/siteverify' => Http::response(['success' => true]),
        ]);

        $payload = $this->basePayload();
        $payload['turnstile_token'] = 'valid-token';

        $response = $this->post(route('orders.store', 'graphic-design'), $payload);

        $response->assertSessionDoesntHaveErrors(['turnstile_token']);
        $this->assertDatabaseCount('service_orders', 1);
    }

    public function test_failed_turnstile_verification_is_logged_with_error_codes_and_blocks_order(): void
    {
        Log::spy();

        Http::fake([
            'https://challenges.cloudflare.com/turnstile/v0/siteverify' => Http::response([
                'success' => false,
                'error-codes' => ['invalid-input-secret'],
            ]),
        ]);

        $payload = $this->basePayload();
        $payload['turnstile_token'] = 'some-token';

        $this->post(route('orders.store', 'graphic-design'), $payload)
            ->assertSessionHasErrors(['turnstile_token']);

        $this->assertDatabaseCount('service_orders', 0);

        Log::shouldHaveReceived('warning')
            ->once()
            ->withArgs(function (string $message, array $context) {
                return $message === 'Turnstile siteverify reported failure.'
                    && in_array('invalid-input-secret', $context['error-codes'], true);
            });
    }

    public function test_timeout_or_duplicate_error_surfaces_an_expired_captcha_message(): void
    {
        Http::fake([
            'https://challenges.cloudflare.com/turnstile/v0/siteverify' => Http::response([
                'success' => false,
                'error-codes' => ['timeout-or-duplicate'],
            ]),
        ]);

        $payload = $this->basePayload();
        $payload['turnstile_token'] = 'reused-token';

        $this->post(route('orders.store', 'graphic-design'), $payload)
            ->assertSessionHasErrors([
                'turnstile_token' => 'Captcha expired. Please complete the verification again.',
            ]);
    }

    public function test_unreachable_cloudflare_endpoint_is_logged_and_blocks_order(): void
    {
        Log::spy();

        Http::fake([
            'https://challenges.cloudflare.com/turnstile/v0/siteverify' => fn () => throw new \Illuminate\Http\Client\ConnectionException('Could not resolve host'),
        ]);

        $payload = $this->basePayload();
        $payload['turnstile_token'] = 'some-token';

        $this->post(route('orders.store', 'graphic-design'), $payload)
            ->assertSessionHasErrors(['turnstile_token']);

        $this->assertDatabaseCount('service_orders', 0);

        Log::shouldHaveReceived('error')
            ->once()
            ->withArgs(fn (string $message) => $message === 'Turnstile siteverify request threw an exception.');
    }
}
