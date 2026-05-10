<?php

namespace Tests\Feature;

use App\Mail\AbandonedOrderProspectAdminAlertMail;
use App\Mail\AbandonedOrderProspectReminderMail;
use App\Mail\ServiceOrderSubmittedAdminAlertMail;
use App\Models\DiscountCode;
use App\Models\Invoice;
use App\Models\OrderProspect;
use App\Models\ServiceOrder;
use App\Models\User;
use App\Support\PlatformSettings;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ServiceOrderFlowTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Mail::fake();
    }

    public function test_order_root_route_redirects_to_services_page(): void
    {
        $this->get('/order')->assertRedirect(route('services'));
    }

    public function test_guest_can_create_social_media_order_and_get_payment_redirect(): void
    {
        config()->set('bellah.orders.admin_notification_emails', ['ops@bellahoptions.com']);

        $this->get(route('orders.create', 'social-media-design'));

        $guard = session('service_order_human_check');
        $guard['issued_at'] = now()->subSeconds(8)->timestamp;
        session(['service_order_human_check' => $guard]);

        $response = $this->post(route('orders.store', 'social-media-design'), [
            'service_package' => 'starter',
            'full_name' => 'Ada Lovelace',
            'email' => 'ada@example.com',
            'phone' => '+2348108671804',
            'business_name' => 'Ada Labs',
            'position' => 'Founder',
            'business_website' => 'https://adalabs.test',
            'has_logo' => 'yes',
            'has_content' => 'yes',
            'primary_platforms' => 'Instagram, LinkedIn',
            'timeline_preference' => 'Start next week',
            'project_summary' => 'We need monthly social media design support for product campaigns and launch storytelling.',
            'project_goals' => 'Increase consistency and conversion from social channels.',
            'target_audience' => 'Startup founders and SME operators in Nigeria.',
            'preferred_style' => 'Modern and clean style with strong brand colors.',
            'deliverables' => 'Carousel sets, promo graphics, and ad visuals.',
            'additional_details' => 'Please include design source files in final delivery.',
            'human_check_answer' => $guard['answer'],
            'human_check_nonce' => $guard['nonce'],
            'form_rendered_at' => $guard['issued_at'],
            'website' => '',
            'company_name' => '',
        ]);

        $order = ServiceOrder::query()->first();

        $this->assertNotNull($order);
        $response->assertRedirect(route('orders.payment.show', $order));

        $this->assertDatabaseHas('service_orders', [
            'service_slug' => 'social-media-design',
            'email' => 'ada@example.com',
            'package_code' => 'starter',
            'payment_status' => 'pending',
        ]);

        $this->assertDatabaseHas('invoices', [
            'id' => $order->invoice_id,
            'customer_email' => 'ada@example.com',
            'status' => 'sent',
        ]);

        Mail::assertSent(ServiceOrderSubmittedAdminAlertMail::class, function (ServiceOrderSubmittedAdminAlertMail $mail) use ($order): bool {
            return $mail->order->id === $order->id
                && $mail->hasTo('ops@bellahoptions.com');
        });
    }

    public function test_discount_link_auto_applies_on_service_order_checkout(): void
    {
        DiscountCode::create([
            'name' => 'Starter Promo',
            'code' => 'START20',
            'discount_type' => 'percentage',
            'discount_value' => 20,
            'currency' => null,
            'is_active' => true,
            'service_slug' => 'social-media-design',
            'package_code' => 'starter',
            'total_redemptions' => 0,
        ]);

        $this->get(route('orders.create', ['serviceSlug' => 'social-media-design', 'discount' => 'START20']));

        $guard = session('service_order_human_check');
        $guard['issued_at'] = now()->subSeconds(8)->timestamp;
        session(['service_order_human_check' => $guard]);

        $response = $this->post(route('orders.store', 'social-media-design'), [
            'service_package' => 'starter',
            'full_name' => 'Promo User',
            'email' => 'promo@example.com',
            'phone' => '+2348108671804',
            'business_name' => 'Promo Labs',
            'position' => 'Founder',
            'has_logo' => 'yes',
            'has_content' => 'yes',
            'project_summary' => 'Need monthly social media design support for launch and promotional campaign visuals.',
            'discount_code' => 'START20',
            'primary_platforms' => 'Instagram, LinkedIn',
            'human_check_answer' => $guard['answer'],
            'human_check_nonce' => $guard['nonce'],
            'form_rendered_at' => $guard['issued_at'],
            'website' => '',
            'company_name' => '',
        ]);

        $order = ServiceOrder::query()->first();

        $this->assertNotNull($order);
        $response->assertRedirect(route('orders.payment.show', $order));

        $this->assertDatabaseHas('service_orders', [
            'id' => $order->id,
            'discount_code' => 'START20',
            'base_amount' => 50000.00,
            'discount_amount' => 10000.00,
            'amount' => 40000.00,
        ]);

        $this->assertDatabaseHas('discount_codes', [
            'code' => 'START20',
            'total_redemptions' => 1,
        ]);
    }

    public function test_guest_can_create_order_and_register_account_in_same_flow(): void
    {
        $this->get(route('orders.create', 'social-media-design'));

        $guard = session('service_order_human_check');
        $guard['issued_at'] = now()->subSeconds(8)->timestamp;
        session(['service_order_human_check' => $guard]);

        $response = $this->post(route('orders.store', 'social-media-design'), [
            'service_package' => 'starter',
            'full_name' => 'Grace Hopper',
            'email' => 'grace@example.com',
            'phone' => '+2348108671804',
            'business_name' => 'Grace Studios',
            'position' => 'Creative Director',
            'has_logo' => 'yes',
            'has_content' => 'yes',
            'primary_platforms' => 'Instagram, LinkedIn',
            'project_summary' => 'We need design assets for product posters and launch communication campaigns.',
            'human_check_answer' => $guard['answer'],
            'human_check_nonce' => $guard['nonce'],
            'form_rendered_at' => $guard['issued_at'],
            'create_account' => '1',
            'password' => 'Pass1234!Pass1234!',
            'password_confirmation' => 'Pass1234!Pass1234!',
            'website' => '',
            'company_name' => '',
        ]);

        $order = ServiceOrder::query()->first();
        $this->assertNotNull($order);

        $response->assertRedirect(route('orders.payment.show', $order));

        $this->assertDatabaseHas('users', [
            'email' => 'grace@example.com',
            'role' => 'user',
        ]);

        $this->assertDatabaseHas('service_orders', [
            'id' => $order->id,
            'user_id' => User::query()->where('email', 'grace@example.com')->value('id'),
            'wants_account' => 1,
        ]);
    }

    public function test_order_form_renders_service_specific_fields_per_service_type(): void
    {
        $this->get(route('orders.create', 'social-media-design'))
            ->assertOk()
            ->assertSee('name="posting_frequency"', false)
            ->assertDontSee('name="app_platforms"', false);

        $this->get(route('orders.create', 'web-design'))
            ->assertOk()
            ->assertSee('name="key_features"', false)
            ->assertDontSee('name="posting_frequency"', false);

        $this->get(route('orders.create', 'mobile-app-development'))
            ->assertOk()
            ->assertSee('name="app_platforms"', false)
            ->assertDontSee('name="design_system_need"', false);
    }

    public function test_order_form_shows_company_account_details_when_paystack_is_unavailable(): void
    {
        config()->set('services.paystack.public_key', '');
        config()->set('services.paystack.secret_key', '');
        config()->set('bellah.payment.transfer.account_number', '4210082961');
        config()->set('bellah.payment.transfer.account_name', 'Bellah Options');
        config()->set('bellah.payment.transfer.bank_name', 'Fidelity Bank');

        $this->get(route('orders.create', 'social-media-design'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Orders/Create')
                ->where('paymentReadiness.paystack.available', false)
                ->where('paymentReadiness.fallback_account.account_number', '4210082961')
                ->where('paymentReadiness.fallback_account.account_name', 'Bellah Options')
                ->where('paymentReadiness.fallback_account.bank_name', 'Fidelity Bank')
            );
    }

    public function test_web_design_order_requires_web_specific_brief_fields(): void
    {
        $this->get(route('orders.create', 'web-design'));

        $guard = session('service_order_human_check');
        $guard['issued_at'] = now()->subSeconds(8)->timestamp;
        session(['service_order_human_check' => $guard]);

        $response = $this->post(route('orders.store', 'web-design'), [
            'service_package' => 'starter',
            'full_name' => 'Maya Operator',
            'email' => 'maya@example.com',
            'phone' => '+2348108671804',
            'business_name' => 'Maya Ventures',
            'has_logo' => 'yes',
            'has_content' => 'yes',
            'project_summary' => 'We need a conversion-first website to position our offer and support online sales.',
            'website_type' => 'business-site',
            'required_pages' => 'Home, About, Services, Contact',
            'content_ready' => 'partial',
            'domain_hosting_status' => 'domain-only',
            'human_check_answer' => $guard['answer'],
            'human_check_nonce' => $guard['nonce'],
            'form_rendered_at' => $guard['issued_at'],
            'website' => '',
            'company_name' => '',
        ]);

        $response->assertSessionHasErrors('key_features');
    }

    public function test_order_invoice_amount_uses_super_admin_service_price_override(): void
    {
        PlatformSettings::setServicePriceOverrides([
            'social-media-design' => [
                'starter' => 45555,
            ],
        ]);

        $this->get(route('orders.create', 'social-media-design'));

        $guard = session('service_order_human_check');
        $guard['issued_at'] = now()->subSeconds(8)->timestamp;
        session(['service_order_human_check' => $guard]);

        $response = $this->post(route('orders.store', 'social-media-design'), [
            'service_package' => 'starter',
            'full_name' => 'Override Tester',
            'email' => 'override@example.com',
            'phone' => '+2348108671804',
            'business_name' => 'Override Studio',
            'has_logo' => 'yes',
            'has_content' => 'yes',
            'project_summary' => 'Need social media design support and we want current admin-updated package pricing applied.',
            'primary_platforms' => 'Instagram',
            'human_check_answer' => $guard['answer'],
            'human_check_nonce' => $guard['nonce'],
            'form_rendered_at' => $guard['issued_at'],
            'website' => '',
            'company_name' => '',
        ]);

        $order = ServiceOrder::query()->latest('id')->first();
        $this->assertNotNull($order);
        $response->assertRedirect(route('orders.payment.show', $order));

        $this->assertDatabaseHas('service_orders', [
            'id' => $order->id,
            'base_amount' => 45555.00,
            'amount' => 45555.00,
        ]);

        $this->assertDatabaseHas('invoices', [
            'id' => $order->invoice_id,
            'amount' => 45555.00,
        ]);
    }

    public function test_social_media_trial_request_uses_configured_trial_fee(): void
    {
        PlatformSettings::setSocialGraphicTrialFeeNgn(21500);

        $this->get(route('orders.create', 'social-media-design'));

        $guard = session('service_order_human_check');
        $guard['issued_at'] = now()->subSeconds(8)->timestamp;
        session(['service_order_human_check' => $guard]);

        $response = $this->post(route('orders.store', 'social-media-design'), [
            'service_package' => 'trial-request',
            'full_name' => 'Trial Client',
            'email' => 'trial@example.com',
            'phone' => '+2348108671804',
            'business_name' => 'Trial Studio',
            'position' => 'Founder',
            'has_logo' => 'yes',
            'has_content' => 'yes',
            'primary_platforms' => 'Instagram, LinkedIn',
            'project_summary' => 'Need a one-off social media design trial request outside the regular monthly plans.',
            'discount_code' => 'START20',
            'human_check_answer' => $guard['answer'],
            'human_check_nonce' => $guard['nonce'],
            'form_rendered_at' => $guard['issued_at'],
            'website' => '',
            'company_name' => '',
        ]);

        $order = ServiceOrder::query()->latest('id')->first();

        $this->assertNotNull($order);
        $response->assertRedirect(route('orders.payment.show', $order));

        $this->assertDatabaseHas('service_orders', [
            'id' => $order->id,
            'service_slug' => 'social-media-design',
            'package_code' => 'trial-request',
            'package_name' => 'Trial Design Request',
            'base_amount' => 21500.00,
            'amount' => 21500.00,
            'discount_code' => null,
            'discount_amount' => 0.00,
            'payment_status' => 'pending',
        ]);
    }

    public function test_trial_request_package_is_rejected_when_trial_fee_is_not_enabled(): void
    {
        PlatformSettings::setSocialGraphicTrialFeeNgn(0);

        $this->get(route('orders.create', 'social-media-design'));

        $guard = session('service_order_human_check');
        $guard['issued_at'] = now()->subSeconds(8)->timestamp;
        session(['service_order_human_check' => $guard]);

        $response = $this->post(route('orders.store', 'social-media-design'), [
            'service_package' => 'trial-request',
            'full_name' => 'Trial Disabled',
            'email' => 'trial-disabled@example.com',
            'phone' => '+2348108671804',
            'business_name' => 'Trial Studio',
            'position' => 'Founder',
            'has_logo' => 'yes',
            'has_content' => 'yes',
            'primary_platforms' => 'Instagram, LinkedIn',
            'project_summary' => 'Need a one-off social media design trial request outside the regular monthly plans.',
            'human_check_answer' => $guard['answer'],
            'human_check_nonce' => $guard['nonce'],
            'form_rendered_at' => $guard['issued_at'],
            'website' => '',
            'company_name' => '',
        ]);

        $response->assertSessionHasErrors('service_package');
        $this->assertDatabaseCount('service_orders', 0);
    }

    public function test_payment_initialization_redirects_to_paystack_authorization_url(): void
    {
        $user = User::factory()->create();

        $invoice = Invoice::create([
            'invoice_number' => '250',
            'customer_name' => $user->name,
            'customer_email' => $user->email,
            'title' => 'Test Invoice',
            'amount' => 30000,
            'currency' => 'NGN',
            'status' => 'sent',
            'issued_at' => now(),
            'created_by' => $user->id,
        ]);

        $order = ServiceOrder::create([
            'uuid' => (string) \Illuminate\Support\Str::uuid(),
            'order_code' => 'BO-ORDER-300',
            'user_id' => $user->id,
            'service_slug' => 'social-media-design',
            'service_name' => 'Social Media Design Subscription',
            'package_code' => 'starter',
            'package_name' => 'Starter Pack',
            'currency' => 'NGN',
            'amount' => 30000,
            'payment_status' => 'pending',
            'order_status' => 'awaiting_payment',
            'progress_percent' => 5,
            'full_name' => $user->name,
            'email' => $user->email,
            'phone' => '+2348108671804',
            'business_name' => 'Test Co',
            'project_summary' => 'Need a recurring design subscription for social campaign content planning.',
            'wants_account' => false,
            'invoice_id' => $invoice->id,
        ]);

        config()->set('services.paystack.secret_key', 'sk_test_123');

        Http::fake([
            'https://api.paystack.co/transaction/initialize' => Http::response([
                'status' => true,
                'data' => [
                    'authorization_url' => 'https://checkout.paystack.test/authorize',
                    'access_code' => 'AC_TEST',
                    'reference' => 'BO-TEST-REF',
                ],
            ], 200),
        ]);

        $response = $this->actingAs($user)->post(route('orders.payment.initialize', $order));

        $response->assertRedirect('https://checkout.paystack.test/authorize');

        $this->assertDatabaseHas('service_orders', [
            'id' => $order->id,
            'paystack_reference' => 'BO-TEST-REF',
            'payment_status' => 'processing',
        ]);
    }

    public function test_payment_callback_marks_order_and_invoice_paid(): void
    {
        $user = User::factory()->create();

        $invoice = Invoice::create([
            'invoice_number' => '251',
            'customer_name' => $user->name,
            'customer_email' => $user->email,
            'title' => 'Test Invoice',
            'amount' => 30000,
            'currency' => 'NGN',
            'status' => 'sent',
            'issued_at' => now(),
            'created_by' => $user->id,
        ]);

        $order = ServiceOrder::create([
            'uuid' => (string) \Illuminate\Support\Str::uuid(),
            'order_code' => 'BO-ORDER-301',
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
            'paystack_reference' => 'BO-CALLBACK-REF',
            'full_name' => $user->name,
            'email' => $user->email,
            'phone' => '+2348108671804',
            'business_name' => 'Test Co',
            'project_summary' => 'Need recurring design subscription for social media campaigns.',
            'wants_account' => false,
            'invoice_id' => $invoice->id,
        ]);

        config()->set('services.paystack.secret_key', 'sk_test_123');

        Http::fake([
            'https://api.paystack.co/transaction/verify/*' => Http::response([
                'status' => true,
                'data' => [
                    'status' => 'success',
                    'amount' => 3000000,
                    'currency' => 'NGN',
                    'reference' => 'BO-CALLBACK-REF',
                ],
            ], 200),
        ]);

        $response = $this->get(route('orders.payment.callback', ['reference' => 'BO-CALLBACK-REF']));

        $response->assertRedirect(route('orders.show', $order));

        $this->assertDatabaseHas('service_orders', [
            'id' => $order->id,
            'payment_status' => 'paid',
            'order_status' => 'queued',
            'paystack_reference' => 'BO-CALLBACK-REF',
        ]);

        $this->assertDatabaseHas('invoices', [
            'id' => $invoice->id,
            'status' => 'paid',
            'payment_reference' => 'BO-CALLBACK-REF',
        ]);
    }

    public function test_payment_callback_failure_does_not_expose_order_for_unauthorized_session(): void
    {
        $user = User::factory()->create();

        $invoice = Invoice::create([
            'invoice_number' => '251A',
            'customer_name' => $user->name,
            'customer_email' => $user->email,
            'title' => 'Test Invoice',
            'amount' => 30000,
            'currency' => 'NGN',
            'status' => 'sent',
            'issued_at' => now(),
            'created_by' => $user->id,
        ]);

        ServiceOrder::create([
            'uuid' => (string) \Illuminate\Support\Str::uuid(),
            'order_code' => 'BO-ORDER-301A',
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
            'paystack_reference' => 'BO-CALLBACK-FAIL-REF',
            'full_name' => $user->name,
            'email' => $user->email,
            'phone' => '+2348108671804',
            'business_name' => 'Test Co',
            'project_summary' => 'Need recurring design subscription for social media campaigns.',
            'wants_account' => false,
            'invoice_id' => $invoice->id,
        ]);

        config()->set('services.paystack.secret_key', 'sk_test_123');

        Http::fake([
            'https://api.paystack.co/transaction/verify/*' => Http::response([
                'status' => true,
                'data' => [
                    'status' => 'failed',
                    'amount' => 3000000,
                    'currency' => 'NGN',
                    'reference' => 'BO-CALLBACK-FAIL-REF',
                ],
            ], 200),
        ]);

        $response = $this->get(route('orders.payment.callback', ['reference' => 'BO-CALLBACK-FAIL-REF']));

        $response->assertRedirect(route('home'));
    }

    public function test_customer_can_submit_transfer_payment_confirmation(): void
    {
        $user = User::factory()->create();

        $invoice = Invoice::create([
            'invoice_number' => '252',
            'customer_name' => $user->name,
            'customer_email' => $user->email,
            'title' => 'Transfer Invoice',
            'amount' => 30000,
            'currency' => 'NGN',
            'status' => 'sent',
            'issued_at' => now(),
            'created_by' => $user->id,
        ]);

        $order = ServiceOrder::create([
            'uuid' => (string) \Illuminate\Support\Str::uuid(),
            'order_code' => 'BO-ORDER-302',
            'user_id' => $user->id,
            'service_slug' => 'social-media-design',
            'service_name' => 'Social Media Design Subscription',
            'package_code' => 'starter',
            'package_name' => 'Starter Pack',
            'currency' => 'NGN',
            'amount' => 30000,
            'payment_status' => 'pending',
            'order_status' => 'awaiting_payment',
            'progress_percent' => 5,
            'full_name' => $user->name,
            'email' => $user->email,
            'phone' => '+2348108671804',
            'business_name' => 'Test Co',
            'project_summary' => 'Need recurring design subscription for social media campaigns.',
            'wants_account' => false,
            'invoice_id' => $invoice->id,
        ]);

        config()->set('bellah.payment.transfer.enabled', true);
        config()->set('bellah.payment.transfer.account_number', '4210082961');
        config()->set('bellah.payment.transfer.account_name', 'Bellah Options');
        config()->set('bellah.payment.transfer.bank_name', 'Fidelity Bank');

        $response = $this->actingAs($user)->post(route('orders.payment.transfer', $order), [
            'transfer_reference' => 'TRF-1001',
        ]);

        $response->assertRedirect(route('orders.show', $order));

        $this->assertDatabaseHas('service_orders', [
            'id' => $order->id,
            'payment_status' => 'processing',
        ]);

        $this->assertDatabaseHas('service_order_updates', [
            'service_order_id' => $order->id,
            'status' => 'payment_pending_confirmation',
            'is_public' => 1,
        ]);
    }

    public function test_guest_order_prospect_draft_is_saved_for_follow_up(): void
    {
        $response = $this->postJson(route('orders.prospect-draft.store', ['serviceSlug' => 'social-media-design']), [
            'current_step' => 3,
            'service_package' => 'starter',
            'full_name' => 'Prospect User',
            'email' => 'prospect@example.com',
            'phone' => '+2348100000000',
            'business_name' => 'Prospect Studio',
            'draft_payload' => [
                'project_summary' => 'Need design support for weekly campaign visuals.',
            ],
        ]);

        $response
            ->assertOk()
            ->assertJson([
                'saved' => true,
            ]);

        $token = (string) $response->json('draft_token');
        $this->assertNotSame('', trim($token));

        $this->assertDatabaseHas('order_prospects', [
            'uuid' => $token,
            'service_slug' => 'social-media-design',
            'service_package' => 'starter',
            'email' => 'prospect@example.com',
            'status' => OrderProspect::STATUS_ACTIVE,
        ]);
    }

    public function test_order_submission_marks_matching_prospect_as_converted(): void
    {
        $this->get(route('orders.create', 'social-media-design'));
        $guard = session('service_order_human_check');
        $guard['issued_at'] = now()->subSeconds(8)->timestamp;
        session(['service_order_human_check' => $guard]);

        $prospect = OrderProspect::create([
            'uuid' => (string) \Illuminate\Support\Str::uuid(),
            'service_slug' => 'social-media-design',
            'service_name' => 'Social Media Design',
            'service_package' => 'starter',
            'status' => OrderProspect::STATUS_ACTIVE,
            'full_name' => 'Conversion Prospect',
            'email' => 'convert@example.com',
            'phone' => '+2348101234567',
            'business_name' => 'Convert Studio',
            'last_activity_at' => now()->subHours(2),
        ]);

        $response = $this->post(route('orders.store', 'social-media-design'), [
            'service_package' => 'starter',
            'full_name' => 'Conversion Prospect',
            'email' => 'convert@example.com',
            'phone' => '+2348101234567',
            'business_name' => 'Convert Studio',
            'position' => 'Founder',
            'has_logo' => 'yes',
            'has_content' => 'yes',
            'primary_platforms' => 'Instagram, LinkedIn',
            'project_summary' => 'Need monthly social media creatives with templates for campaigns.',
            'human_check_answer' => $guard['answer'],
            'human_check_nonce' => $guard['nonce'],
            'form_rendered_at' => $guard['issued_at'],
            'website' => '',
            'company_name' => '',
            'prospect_draft_token' => $prospect->uuid,
        ]);

        $order = ServiceOrder::query()->latest('id')->first();
        $this->assertNotNull($order);
        $response->assertRedirect(route('orders.payment.show', $order));

        $prospect->refresh();

        $this->assertSame(OrderProspect::STATUS_CONVERTED, (string) $prospect->status);
        $this->assertSame($order->id, $prospect->service_order_id);
        $this->assertNotNull($prospect->converted_at);
    }

    public function test_abandoned_order_prospect_command_sends_reminder_and_admin_alert(): void
    {
        Mail::fake();
        config()->set('bellah.prospects.abandon_after_hours', 24);
        config()->set('bellah.prospects.admin_notification_emails', ['ops@bellahoptions.com']);

        $prospect = OrderProspect::create([
            'uuid' => (string) \Illuminate\Support\Str::uuid(),
            'service_slug' => 'social-media-design',
            'service_name' => 'Social Media Design',
            'service_package' => 'starter',
            'status' => OrderProspect::STATUS_ACTIVE,
            'full_name' => 'Dormant Prospect',
            'email' => 'dormant@example.com',
            'phone' => '+2348103332211',
            'business_name' => 'Dormant Studio',
            'last_activity_at' => now()->subHours(26),
        ]);

        $this->artisan('prospects:send-abandoned-order-reminders')
            ->assertExitCode(0);

        Mail::assertSent(AbandonedOrderProspectReminderMail::class, function (AbandonedOrderProspectReminderMail $mail) use ($prospect): bool {
            return $mail->prospect->id === $prospect->id && $mail->hasTo('dormant@example.com');
        });

        Mail::assertSent(AbandonedOrderProspectAdminAlertMail::class, function (AbandonedOrderProspectAdminAlertMail $mail) use ($prospect): bool {
            return $mail->prospect->id === $prospect->id && $mail->hasTo('ops@bellahoptions.com');
        });

        $prospect->refresh();

        $this->assertSame(OrderProspect::STATUS_ABANDONED, (string) $prospect->status);
        $this->assertNotNull($prospect->abandoned_at);
        $this->assertNotNull($prospect->reminder_sent_at);
        $this->assertNotNull($prospect->admin_notified_at);
    }
}
