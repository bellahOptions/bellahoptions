<?php

namespace Tests\Feature;

use App\Mail\ServiceBriefRequestMail;
use App\Models\ServiceBrief;
use App\Models\ServiceOrder;
use Database\Seeders\ServiceBriefTemplateSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

/**
 * Covers the automatic post-order handoff: placing a web-design order
 * should not block on the full project brief, but it should immediately
 * email the client a signed link into the same detailed brief flow used
 * for pre-order quote requests, and a submission through that link should
 * be traceable back to the order that requested it.
 */
class ServiceBriefRequestFlowTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Mail::fake();
        $this->seed(ServiceBriefTemplateSeeder::class);
    }

    private function submitWebDesignOrder(): ServiceOrder
    {
        $this->get(route('orders.create', 'web-design'));

        $guard = session('service_order_human_check');
        $guard['issued_at'] = now()->subSeconds(8)->timestamp;
        session(['service_order_human_check' => $guard]);

        $response = $this->post(route('orders.store', 'web-design'), [
            'service_package' => 'landing-page',
            'full_name' => 'Maya Operator',
            'email' => 'maya@example.com',
            'phone' => '+2348108671804',
            'business_name' => 'Maya Ventures',
            'has_logo' => 'yes',
            'has_content' => 'yes',
            'project_summary' => 'We need a conversion-first website to position our offer and support online sales.',
            'website_type' => 'landing-page',
            'required_pages' => 'Home, About, Services, Contact',
            'key_features' => 'Contact form, booking module',
            'content_ready' => 'partial',
            'domain_hosting_status' => 'domain-only',
            'human_check_answer' => $guard['answer'],
            'human_check_nonce' => $guard['nonce'],
            'form_rendered_at' => $guard['issued_at'],
            'website' => '',
            'company_name' => '',
        ]);

        $order = ServiceOrder::query()->latest('id')->firstOrFail();

        $response->assertRedirect(route('orders.payment.show', $order));

        return $order;
    }

    public function test_web_design_order_automatically_sends_a_brief_request_email(): void
    {
        $order = $this->submitWebDesignOrder();

        Mail::assertSent(ServiceBriefRequestMail::class, function (ServiceBriefRequestMail $mail) use ($order): bool {
            return $mail->order->id === $order->id && $mail->hasTo($order->email);
        });
    }

    public function test_other_services_do_not_send_a_brief_request_email(): void
    {
        $this->get(route('orders.create', 'social-media-design'));

        $guard = session('service_order_human_check');
        $guard['issued_at'] = now()->subSeconds(8)->timestamp;
        session(['service_order_human_check' => $guard]);

        $this->post(route('orders.store', 'social-media-design'), [
            'service_package' => 'starter',
            'full_name' => 'Ada Lovelace',
            'email' => 'ada@example.com',
            'phone' => '+2348108671804',
            'business_name' => 'Ada Labs',
            'has_logo' => 'yes',
            'has_content' => 'yes',
            'primary_platforms' => 'Instagram, LinkedIn',
            'project_summary' => 'We need monthly social media design support for product campaigns and launch storytelling.',
            'human_check_answer' => $guard['answer'],
            'human_check_nonce' => $guard['nonce'],
            'form_rendered_at' => $guard['issued_at'],
            'website' => '',
            'company_name' => '',
        ]);

        Mail::assertNotSent(ServiceBriefRequestMail::class);
    }

    public function test_visiting_the_linked_brief_form_and_submitting_it_attaches_it_to_the_order(): void
    {
        $order = $this->submitWebDesignOrder();

        $sentLink = null;
        Mail::assertSent(ServiceBriefRequestMail::class, function (ServiceBriefRequestMail $mail) use (&$sentLink): bool {
            $sentLink = $mail->briefLink;

            return true;
        });

        $this->assertNotNull($sentLink);

        $this->get($sentLink)->assertOk();

        $guard = session('brief_human_check');
        $guard['issued_at'] = now()->subSeconds(8)->timestamp;
        session(['brief_human_check' => $guard]);

        $answers = [
            'client_name' => 'Maya Operator',
            'email' => 'maya@example.com',
            'phone' => '+2348108671804',
            'contact_pref' => 'WhatsApp',
            'location' => 'Lagos',
            'industry' => 'Technology / Software',
            'brand_stage' => 'Existing, staying as it is',
            'timeline' => 'Within 1 week',
            'budget_range' => 'Not sure – advise me',
            'consent_ndpa' => true,
            'wd_type' => 'Business / corporate website',
            'wd_page_count' => '2-5 pages',
            'wd_build_type' => 'Custom-coded (Laravel + React)',
            'wd_primary_goal' => 'Contact / enquire',
            'wd_features' => ['Contact form'],
            'wd_legal_pages' => 'Not sure',
            'wd_content_source' => "I'll supply everything",
            'wd_image_source' => "I'll supply my own",
            'wd_has_brand' => 'Nothing yet',
            'wd_references' => 'I like the layout of stripe.com and linear.app for their clarity.',
            'wd_domain_status' => "I'm not sure",
            'wd_hosting_status' => 'Not sure what that means',
            'wd_seo' => 'Explain this to me first',
            'wd_maintenance' => 'Not decided yet',
        ];

        $payload = [
            'human_check_answer' => $guard['answer'],
            'human_check_nonce' => $guard['nonce'],
            'form_rendered_at' => $guard['issued_at'],
            'website_confirm' => '',
            'answers' => $answers,
        ];

        $this->post(route('brief.store', 'web-design'), $payload)
            ->assertRedirect();

        $brief = ServiceBrief::query()->first();

        $this->assertNotNull($brief);
        $this->assertSame($order->id, $brief->service_order_id);
    }

    public function test_tampering_with_the_linked_order_id_is_ignored(): void
    {
        $order = $this->submitWebDesignOrder();
        $otherOrder = $this->submitWebDesignOrder();

        $sentLink = null;
        Mail::assertSent(ServiceBriefRequestMail::class, function (ServiceBriefRequestMail $mail) use ($order, &$sentLink): bool {
            if ($mail->order->id !== $order->id) {
                return false;
            }

            $sentLink = $mail->briefLink;

            return true;
        });

        $this->assertNotNull($sentLink);

        // Swap the signed link's service_order_id for a different order's id;
        // this invalidates the signature, so the tampered id must be ignored.
        $tamperedLink = preg_replace('/service_order_id=\d+/', 'service_order_id='.$otherOrder->id, $sentLink);

        $this->get($tamperedLink)->assertOk();

        $this->assertNull(session('service_brief_link.web-design'));
    }
}
