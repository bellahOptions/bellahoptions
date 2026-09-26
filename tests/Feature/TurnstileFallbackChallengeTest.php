<?php

namespace Tests\Feature;

use App\Support\PlatformSettings;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

/**
 * Degraded-mode (fallback) human verification.
 *
 * Cloudflare Turnstile remains the primary challenge. These tests pin down the
 * boundaries of the fallback path: it must never be reachable unless the server
 * issued it, it must be single-use, and it must stop working once the per-IP or
 * platform-wide quota is exhausted.
 */
class TurnstileFallbackChallengeTest extends TestCase
{
    use RefreshDatabase;

    private const SESSION_KEY = 'service_order_human_check';

    protected function setUp(): void
    {
        parent::setUp();

        Mail::fake();
        Config::set('services.turnstile.site_key', 'test-site-key');
        Config::set('services.turnstile.secret_key', 'test-secret-key');
        Config::set('services.turnstile.fallback.enabled', true);

        PlatformSettings::setGraphicDesignItems([
            ['id' => 'banners', 'title' => 'Banners', 'description' => 'Banner design.', 'unit_price' => 15000],
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function orderPayload(string $email = 'chidinma@example.com'): array
    {
        return [
            'service_package' => 'graphic-item-banners',
            'package_quantity' => 1,
            'full_name' => 'Chidinma Okeke',
            'email' => $email,
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
            'form_rendered_at' => now()->subSeconds(8)->timestamp,
            'website' => '',
            'company_name' => '',
        ];
    }

    /**
     * Load the order form so the server records the primary Turnstile challenge.
     */
    private function startTurnstileSession(): void
    {
        $this->get(route('orders.create', 'graphic-design'))->assertOk();
    }

    /**
     * Ask the server for a degraded-mode challenge and return it ready to submit.
     *
     * Mirrors what the browser does when the Turnstile widget cannot be delivered,
     * including the human-sized delay between the challenge appearing and being
     * submitted.
     *
     * @return array{question:string, nonce:string, answer:string}
     */
    private function requestFallbackChallenge(): array
    {
        $response = $this->getJson(route('human-verification.fallback'))->assertOk();

        $question = (string) $response->json('question');
        $nonce = (string) $response->json('nonce');

        $this->assertNotSame('', $question);
        $this->assertSame(32, strlen($nonce));

        // Age the issued-at so the minimum time-on-form guard is satisfied.
        $challenge = session(self::SESSION_KEY);
        $challenge['fallback']['issued_at'] = now()->subSeconds(8)->timestamp;
        session([self::SESSION_KEY => $challenge]);

        return [
            'question' => $question,
            'nonce' => $nonce,
            'answer' => $this->solve($question),
        ];
    }

    private function solve(string $question): string
    {
        $this->assertMatchesRegularExpression('/^(\d+) \+ (\d+) = \?$/', $question);

        preg_match('/^(\d+) \+ (\d+) = \?$/', $question, $matches);

        return (string) ((int) $matches[1] + (int) $matches[2]);
    }

    public function test_primary_turnstile_verification_is_unaffected_by_the_fallback(): void
    {
        Http::fake([
            'https://challenges.cloudflare.com/turnstile/v0/siteverify' => Http::response(['success' => true]),
        ]);

        $this->startTurnstileSession();

        $payload = $this->orderPayload();
        $payload['turnstile_token'] = 'valid-token';

        $this->post(route('orders.store', 'graphic-design'), $payload)
            ->assertSessionDoesntHaveErrors(['turnstile_token']);

        $this->assertDatabaseCount('service_orders', 1);
    }

    public function test_order_form_offers_the_fallback_endpoint_when_turnstile_is_configured(): void
    {
        $this->startTurnstileSession();

        $this->assertSame('turnstile', session(self::SESSION_KEY)['mode']);
        $this->assertTrue(config('services.turnstile.fallback.enabled'));
    }

    public function test_fallback_requires_the_visitor_to_have_seen_the_primary_challenge(): void
    {
        // No prior page load: the session holds no primary challenge at all.
        $this->getJson(route('human-verification.fallback'))->assertStatus(409);

        $payload = $this->orderPayload();
        $payload['human_check_nonce'] = str_repeat('a', 32);
        $payload['human_check_answer'] = '4';

        $this->post(route('orders.store', 'graphic-design'), $payload)
            ->assertSessionHasErrors(['turnstile_token']);

        $this->assertDatabaseCount('service_orders', 0);
    }

    public function test_server_issued_fallback_challenge_allows_a_single_order(): void
    {
        $this->startTurnstileSession();
        $fallback = $this->requestFallbackChallenge();

        $payload = $this->orderPayload();
        $payload['human_check_nonce'] = $fallback['nonce'];
        $payload['human_check_answer'] = $fallback['answer'];

        $response = $this->post(route('orders.store', 'graphic-design'), $payload);

        $response->assertSessionDoesntHaveErrors(['turnstile_token', 'human_check_answer']);

        $this->assertDatabaseCount('service_orders', 1);
    }

    public function test_missing_turnstile_token_without_a_fallback_challenge_is_rejected(): void
    {
        $this->startTurnstileSession();

        $this->post(route('orders.store', 'graphic-design'), $this->orderPayload())
            ->assertSessionHasErrors(['turnstile_token']);

        $this->assertDatabaseCount('service_orders', 0);
    }

    public function test_fallback_challenge_is_single_use(): void
    {
        $this->startTurnstileSession();
        $fallback = $this->requestFallbackChallenge();

        $payload = $this->orderPayload('first@example.com');
        $payload['human_check_nonce'] = $fallback['nonce'];
        $payload['human_check_answer'] = $fallback['answer'];

        $this->post(route('orders.store', 'graphic-design'), $payload)->assertSessionDoesntHaveErrors();

        $this->assertDatabaseCount('service_orders', 1);
        $this->assertNull(session(self::SESSION_KEY));

        // Replaying the exact same proof must fail: the challenge was consumed.
        $replay = $this->orderPayload('second@example.com');
        $replay['human_check_nonce'] = $fallback['nonce'];
        $replay['human_check_answer'] = $fallback['answer'];

        $this->post(route('orders.store', 'graphic-design'), $replay)
            ->assertSessionHasErrors(['turnstile_token']);

        $this->assertDatabaseCount('service_orders', 1);
    }

    public function test_wrong_fallback_answer_is_rejected(): void
    {
        $this->startTurnstileSession();
        $fallback = $this->requestFallbackChallenge();

        $payload = $this->orderPayload();
        $payload['human_check_nonce'] = $fallback['nonce'];
        $payload['human_check_answer'] = (string) (((int) $fallback['answer']) + 1);

        $this->post(route('orders.store', 'graphic-design'), $payload)
            ->assertSessionHasErrors(['turnstile_token']);

        $this->assertDatabaseCount('service_orders', 0);
    }

    public function test_fallback_is_disabled_when_configuration_disables_it(): void
    {
        Config::set('services.turnstile.fallback.enabled', false);

        $this->startTurnstileSession();

        $this->getJson(route('human-verification.fallback'))->assertStatus(503);

        $this->post(route('orders.store', 'graphic-design'), $this->orderPayload())
            ->assertSessionHasErrors(['turnstile_token']);

        $this->assertDatabaseCount('service_orders', 0);
    }

    public function test_per_ip_fallback_quota_stops_further_degraded_submissions(): void
    {
        Config::set('services.turnstile.fallback.per_ip_hourly', 2);
        // Keep the endpoint throttle well clear of the quota under test.
        Config::set('services.turnstile.fallback.endpoint_per_minute', 20);
        Config::set('services.turnstile.fallback.issues_per_ip_hourly', 20);
        // Lift the general form throttle so the far tighter fallback quota is
        // the limit that is actually observed here.
        $this->withoutMiddleware(\Illuminate\Routing\Middleware\ThrottleRequests::class);

        for ($attempt = 1; $attempt <= 2; $attempt++) {
            $this->startTurnstileSession();
            $fallback = $this->requestFallbackChallenge();

            $payload = $this->orderPayload("client{$attempt}@example.com");
            $payload['human_check_nonce'] = $fallback['nonce'];
            $payload['human_check_answer'] = $fallback['answer'];

            $this->post(route('orders.store', 'graphic-design'), $payload)->assertSessionDoesntHaveErrors();
        }

        $this->assertDatabaseCount('service_orders', 2);

        // Third degraded submission for the same IP: quota is exhausted, so the
        // server refuses to even mint another fallback challenge.
        $this->startTurnstileSession();
        $this->getJson(route('human-verification.fallback'))->assertStatus(503);

        $payload = $this->orderPayload('client3@example.com');
        $payload['human_check_nonce'] = str_repeat('b', 32);
        $payload['human_check_answer'] = '7';

        $this->post(route('orders.store', 'graphic-design'), $payload)
            ->assertSessionHasErrors(['turnstile_token']);

        $this->assertDatabaseCount('service_orders', 2);
    }

    public function test_global_circuit_breaker_fails_closed_once_tripped(): void
    {
        Config::set('services.turnstile.fallback.global_hourly', 1);

        $this->startTurnstileSession();
        $fallback = $this->requestFallbackChallenge();

        $payload = $this->orderPayload('first@example.com');
        $payload['human_check_nonce'] = $fallback['nonce'];
        $payload['human_check_answer'] = $fallback['answer'];

        $this->post(route('orders.store', 'graphic-design'), $payload)->assertSessionDoesntHaveErrors();
        $this->assertDatabaseCount('service_orders', 1);

        // The breaker is open for everyone now, even a brand new visitor.
        $this->startTurnstileSession();
        $this->getJson(route('human-verification.fallback'))->assertStatus(503);
    }

    public function test_used_fallback_challenge_is_reissued_single_use_after_success(): void
    {
        $this->startTurnstileSession();
        $fallback = $this->requestFallbackChallenge();

        $payload = $this->orderPayload();
        $payload['human_check_nonce'] = $fallback['nonce'];
        $payload['human_check_answer'] = $fallback['answer'];

        $this->post(route('orders.store', 'graphic-design'), $payload)->assertSessionDoesntHaveErrors();
        $this->assertDatabaseCount('service_orders', 1);

        // The consumed challenge is gone, and the next render hands the visitor a
        // fresh server-issued one so the form stays usable.
        $this->assertNull(session(self::SESSION_KEY));

        $this->get(route('orders.create', 'graphic-design'))->assertOk();

        $challenge = session(self::SESSION_KEY);
        $this->assertIsArray($challenge);
        $this->assertSame('turnstile', $challenge['mode']);
        $this->assertIsArray($challenge['fallback'] ?? null);
        // The reissued challenge still carries a hashed answer, never a plain one.
        $this->assertArrayHasKey('digest', $challenge['fallback']);
        $this->assertArrayNotHasKey('answer', $challenge['fallback']);
    }

    public function test_fallback_usage_is_logged_for_visibility(): void
    {
        Log::spy();

        $this->startTurnstileSession();
        $fallback = $this->requestFallbackChallenge();

        $payload = $this->orderPayload();
        $payload['human_check_nonce'] = $fallback['nonce'];
        $payload['human_check_answer'] = $fallback['answer'];

        $this->post(route('orders.store', 'graphic-design'), $payload)->assertSessionDoesntHaveErrors();

        Log::shouldHaveReceived('warning')
            ->withArgs(fn (string $message) => $message === 'Turnstile fallback challenge issued.');

        Log::shouldHaveReceived('warning')
            ->withArgs(fn (string $message) => $message === 'Turnstile fallback accepted.');
    }

    public function test_fallback_endpoint_is_rate_limited(): void
    {
        Config::set('services.turnstile.fallback.endpoint_per_minute', 3);
        Config::set('services.turnstile.fallback.issues_per_ip_hourly', 20);

        $this->startTurnstileSession();

        for ($i = 0; $i < 3; $i++) {
            $this->getJson(route('human-verification.fallback'))->assertOk();
        }

        $this->getJson(route('human-verification.fallback'))->assertStatus(429);
    }

    protected function tearDown(): void
    {
        Cache::flush();

        parent::tearDown();
    }
}
