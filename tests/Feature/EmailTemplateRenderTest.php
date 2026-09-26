<?php

namespace Tests\Feature;

use App\Models\ClientReview;
use App\Models\IncomeSplit;
use App\Models\Invoice;
use App\Models\InvoiceStaffCommission;
use App\Models\OrderProspect;
use App\Models\Questionnaire;
use App\Models\ServiceBrief;
use App\Models\ServiceOrder;
use App\Models\SupportTicket;
use App\Models\SupportTicketMessage;
use App\Models\ServiceOrderUpdate;
use App\Models\User;
use App\Models\Waitlist;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\View;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * Every transactional email template renders, and none of them reintroduces the
 * two defects the redesign removed: an SVG logo (Gmail and Outlook refuse SVG in
 * mail) and flexbox layout (Outlook's Word renderer ignores flex, which is why
 * the header logo used to collapse to the left edge).
 *
 * This is deliberately a render test, not a snapshot test: a Blade compile error
 * in an email template otherwise only surfaces when that email is next sent,
 * which for a reminder template can be weeks later.
 */
class EmailTemplateRenderTest extends TestCase
{
    use RefreshDatabase;

    private ?User $admin = null;

    private ?User $customer = null;

    private function admin(): User
    {
        return $this->admin ??= User::factory()->create([
            'role' => User::ROLE_SUPER_ADMIN,
            'name' => 'Ahmed Bello',
        ]);
    }

    private function customer(): User
    {
        return $this->customer ??= User::factory()->create([
            'role' => 'user',
            'name' => 'Ada Lovelace',
            'email' => 'ada@example.com',
        ]);
    }

    private function invoice(array $overrides = []): Invoice
    {
        return Invoice::query()->create(array_merge([
            'invoice_number' => 'BO-INV-0001',
            'customer_name' => 'Ada Lovelace',
            'customer_email' => 'ada@example.com',
            'title' => 'Brand Identity Package',
            'description' => 'Full identity system.',
            'amount' => 250000,
            'currency' => 'NGN',
            'status' => 'paid',
            'payment_reference' => 'PSK-REF-123',
            'paid_at' => now(),
            'issued_at' => now(),
            'created_by' => $this->admin()->id,
        ], $overrides));
    }

    private function order(array $overrides = []): ServiceOrder
    {
        return ServiceOrder::query()->create(array_merge([
            'uuid' => (string) Str::uuid(),
            'order_code' => 'BO-ORD-0001',
            'user_id' => $this->customer()->id,
            'service_slug' => 'social-media-design',
            'service_name' => 'Social Media Design',
            'package_code' => 'starter',
            'package_name' => 'Starter Plan',
            'full_name' => 'Ada Lovelace',
            'business_name' => 'Ada Labs',
            'email' => 'ada@example.com',
            'phone' => '+2348108671804',
            'project_summary' => 'Monthly social design support for a product launch.',
            'amount' => 50000,
            'currency' => 'NGN',
            'order_status' => 'in_progress',
            'payment_status' => 'paid',
            'payment_provider' => 'paystack',
            'progress_percent' => 40,
        ], $overrides));
    }

    private function ticket(): SupportTicket
    {
        return SupportTicket::query()->create([
            'ticket_number' => 'BO-TKT-0001',
            'user_id' => $this->customer()->id,
            'subject' => 'Files not downloading',
            'message' => 'The shared drive link returns an error.',
            'priority' => 'high',
            'status' => SupportTicket::STATUS_OPEN,
        ]);
    }

    /**
     * The variables each template needs, gleaned from the mailable's own view
     * scope. Rendering with these proves the template compiles and produces HTML.
     *
     * @return array<string, array<string, mixed>>
     */
    private function templateData(): array
    {
        $invoice = $this->invoice();
        $order = $this->order();
        $ticket = $this->ticket();
        $customer = $this->customer();

        $prospect = OrderProspect::query()->create([
            'uuid' => (string) Str::uuid(),
            'email' => 'prospect@example.com',
            'full_name' => 'Grace Hopper',
            'service_slug' => 'web-design',
            'payload' => ['service_package' => 'landing-page'],
            'last_activity_at' => now()->subDay(),
        ]);

        $waitlist = Waitlist::query()->create([
            'name' => 'Alan Turing',
            'email' => 'alan@example.com',
            'occupation' => 'Founder',
        ]);

        $review = ClientReview::query()->create([
            'service_order_id' => $order->id,
            'reviewer_name' => 'Ada Lovelace',
            'reviewer_email' => 'ada@example.com',
            'rating' => 5,
            'comment' => 'Excellent work, delivered ahead of schedule.',
            'source' => 'service_order',
            'is_public' => true,
        ]);

        $brief = ServiceBrief::query()->create([
            'uuid' => (string) Str::uuid(),
            'service_slug' => 'web-design',
            'reference_number' => 'BO-BRF-0001',
            'status' => 'submitted',
            'answers' => ['client_name' => 'Ada Lovelace', 'email' => 'ada@example.com'],
            'payload' => [],
        ]);

        $questionnaire = Questionnaire::query()->create([
            'uuid' => (string) Str::uuid(),
            'token' => (string) Str::uuid(),
            'recipient_name' => 'Ada Lovelace',
            'recipient_email' => 'ada@example.com',
            'status' => 'pending',
        ]);

        $incomeSplit = IncomeSplit::query()->create([
            'invoice_id' => $invoice->id,
            'currency' => 'NGN',
            'total_amount' => 250000,
            'ads_savings_percent' => 5,
            'ads_savings_amount' => 12500,
            'data_savings_percent' => 5,
            'data_savings_amount' => 12500,
            'ai_savings_percent' => 5,
            'ai_savings_amount' => 12500,
            'partner_user_id' => $this->admin()->id,
            'partner_percent' => 20,
            'partner_amount' => 50000,
            'owner_user_id' => $this->customer()->id,
            'owner_percent' => 80,
            'owner_amount' => 200000,
        ]);

        $commission = InvoiceStaffCommission::query()->create([
            'invoice_id' => $invoice->id,
            'user_id' => $this->admin()->id,
            'commission_percent' => 5,
            'commission_amount' => 12500,
        ]);

        return [
            'emails.abandoned-order-prospect-admin-alert' => ['prospect' => $prospect, 'resumeUrl' => 'https://example.com/resume'],
            'emails.abandoned-order-prospect-reminder' => ['prospect' => $prospect, 'resumeUrl' => 'https://example.com/resume'],
            'emails.client-review-request' => ['review' => $review, 'reviewLink' => 'https://example.com/review'],
            'emails.contact-submission-admin-alert' => ['submission' => [
                'name' => 'Ada Lovelace',
                'email' => 'ada@example.com',
                'phone' => '+2348108671804',
                'project_type' => 'Brand Design',
                'message' => 'We need a rebrand for our fintech product.',
                'submitted_at' => now(),
                'ip_address' => '102.89.34.12',
                'user_agent' => 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
            ]],
            'emails.income-split-partner-notification' => [
                'invoice' => $invoice,
                'split' => $incomeSplit,
                'partnerPercent' => 20,
            ],
            'emails.invoice-commission-invalidated' => [
                'invoice' => $invoice,
                'commission' => $commission,
                'commissionPercent' => 5,
            ],
            'emails.invoice-deleted' => [
                'invoice' => $invoice,
                'reason' => 'Duplicate invoice raised in error.',
                'staffName' => 'Ahmed Bello',
                'staffPosition' => 'Creative Director',
            ],
            'emails.invoice-issued-admin-alert' => [
                'invoice' => $invoice,
                'actionLabel' => 'View invoice',
                'action' => 'https://example.com/admin/invoices',
            ],
            'emails.invoice-issued' => ['invoice' => $invoice],
            'emails.invoice-paid-receipt' => ['invoice' => $invoice],
            'emails.invoice-reminder' => ['invoice' => $invoice->setAttribute('status', 'sent')],
            'emails.questionnaire-request' => [
                'questionnaire' => $questionnaire,
                'serviceName' => 'Web Design',
                'questionnaireLink' => 'https://example.com/questionnaire',
            ],
            'emails.service-brief-admin-alert' => ['brief' => $brief],
            'emails.service-brief-received' => ['brief' => $brief, 'answers' => [], 'answer' => null],
            'emails.service-brief-request' => [
                'order' => $order,
                'serviceName' => 'Web Design',
                'estimatedMinutes' => 10,
                'briefLink' => 'https://example.com/brief',
            ],
            'emails.service-order-client-summary' => ['order' => $order],
            'emails.service-order-content-asset-request' => [
                'order' => $order,
                'hasContentReady' => false,
                'hasBrandAssetsReady' => true,
            ],
            'emails.service-order-payment-thank-you' => [
                'order' => $order,
                'estimatedTimeline' => '2 weeks (batch delivery in sets of 5 designs every 3 working days)',
            ],
            'emails.service-order-submitted-admin-alert' => ['order' => $order],
            'emails.staff-login-otp' => [
                'user' => $this->admin(),
                'otpCode' => '482913',
                'expiresInMinutes' => 10,
            ],
            'emails.support-ticket-created-admin-alert' => ['ticket' => $ticket],
            'emails.support-ticket-created-customer' => ['ticket' => $ticket],
            'emails.support-ticket-customer-reply-admin-alert' => [
                'ticket' => $ticket,
                'message' => SupportTicketMessage::query()->create([
                    'support_ticket_id' => $ticket->id,
                    'user_id' => $this->customer()->id,
                    'sender_type' => 'customer',
                    'message' => 'Any update on this?',
                ]),
            ],
            'emails.support-ticket-staff-reply' => [
                'ticket' => $ticket,
                'message' => SupportTicketMessage::query()->create([
                    'support_ticket_id' => $ticket->id,
                    'user_id' => $this->admin()->id,
                    'sender_type' => 'staff',
                    'message' => 'We have re-shared the folder.',
                ]),
            ],
            'emails.support-ticket-unanswered-reminder' => ['ticket' => $ticket],
            'emails.waitlist-admin-alert' => ['waitlist' => $waitlist],
            'emails.waitlist-welcome' => ['waitlist' => $waitlist],
        ];
    }

    public function test_every_transactional_email_template_renders(): void
    {
        $rendered = 0;

        foreach ($this->templateData() as $view => $data) {
            $html = View::make($view, $data)->render();

            $this->assertIsString($html, "{$view} did not render a string.");
            $this->assertGreaterThan(200, strlen($html), "{$view} rendered suspiciously little HTML.");
            $this->assertStringContainsString('<html', $html, "{$view} is missing a document root.");

            $rendered++;
        }

        $this->assertGreaterThanOrEqual(25, $rendered, 'Expected every transactional template to be covered.');
    }

    public function test_no_transactional_email_references_an_svg_logo(): void
    {
        foreach ($this->templateData() as $view => $data) {
            $html = View::make($view, $data)->render();

            // `logo-06.svg` was the previous header asset. Gmail and Outlook
            // refuse SVG in mail, so it rendered as a broken image for most
            // recipients.
            $this->assertStringNotContainsString('.svg', $html, "{$view} still references an SVG asset.");
        }
    }

    public function test_no_transactional_email_uses_flexbox_layout(): void
    {
        foreach ($this->templateData() as $view => $data) {
            $html = View::make($view, $data)->render();

            $this->assertStringNotContainsString('display:flex', $html, "{$view} uses flexbox.");
            $this->assertStringNotContainsString('display: flex', $html, "{$view} uses flexbox.");
            $this->assertStringNotContainsString('justify-content', $html, "{$view} uses flex alignment.");
        }
    }

    public function test_no_transactional_email_contains_aside_dividers(): void
    {
        foreach ($this->templateData() as $view => $data) {
            $html = View::make($view, $data)->render();

            // The invoice template shipped a row of literal hyphens as a rule.
            $this->assertStringNotContainsString('-----', $html, "{$view} uses an ASCII divider.");
        }
    }

    public function test_refactored_emails_use_the_shared_layout(): void
    {
        $refactored = [
            'emails.invoice-issued',
            'emails.invoice-paid-receipt',
            'emails.staff-login-otp',
            'emails.support-ticket-created-customer',
        ];

        $data = $this->templateData();

        foreach ($refactored as $view) {
            $html = View::make($view, $data[$view])->render();

            // Layout markers: the responsive wrapper, the rasterised brand mark
            // and the shared legal footer.
            $this->assertStringContainsString('jv-wrap', $html, "{$view} is not using the shared layout.");
            $this->assertStringContainsString('/images/email/logo-mark.png', $html, "{$view} is missing the email logo.");
            $this->assertStringContainsString('/terms-of-service', $html, "{$view} is missing the legal footer.");
        }
    }
}
