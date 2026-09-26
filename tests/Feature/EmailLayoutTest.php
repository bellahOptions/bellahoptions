<?php

namespace Tests\Feature;

use App\Models\Invoice;
use App\Models\ServiceOrder;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\View;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * The shared transactional email layout.
 *
 * These assertions target the two failures the old templates actually had:
 * an SVG logo that Gmail and Outlook refuse to render, and flexbox centering
 * that Outlook ignores so the logo collapsed to the left edge.
 */
class EmailLayoutTest extends TestCase
{
    use RefreshDatabase;

    private function invoice(): Invoice
    {
        $admin = User::factory()->create(['role' => User::ROLE_SUPER_ADMIN]);

        return Invoice::query()->create([
            'invoice_number' => 'BO-EMAIL-0001',
            'customer_name' => 'Ada Lovelace',
            'customer_email' => 'ada@example.com',
            'title' => 'Brand Identity Package',
            'description' => 'Full identity system.',
            'amount' => 250000,
            'currency' => 'NGN',
            'status' => 'sent',
            'issued_at' => now(),
            'created_by' => $admin->id,
        ]);
    }

    private function renderInvoiceIssued(): string
    {
        return View::make('emails.invoice-issued', ['invoice' => $this->invoice()])->render();
    }

    public function test_invoice_email_renders_the_shared_layout(): void
    {
        $html = $this->renderInvoiceIssued();

        $this->assertStringContainsString('<!DOCTYPE html>', $html);
        $this->assertStringContainsString('jv-wrap', $html);
        $this->assertStringContainsString('Invoice #BO-EMAIL-0001', $html);
        // The amount is rendered from the model, not hardcoded.
        $this->assertStringContainsString('250,000.00', $html);
    }

    public function test_email_never_references_an_svg_logo(): void
    {
        $html = $this->renderInvoiceIssued();

        // SVG is the regression this test exists for: Gmail and Outlook drop it,
        // so the header showed a broken image in most inboxes.
        $this->assertStringNotContainsString('.svg', $html);
        $this->assertStringContainsString('/images/email/logo-mark.png', $html);
        // A 2x candidate for high-density screens.
        $this->assertStringContainsString('logo-mark-3x.png', $html);
    }

    public function test_email_does_not_rely_on_flexbox_for_layout(): void
    {
        $html = $this->renderInvoiceIssued();

        // Outlook renders mail with the Word engine, which ignores flex entirely.
        $this->assertStringNotContainsString('display:flex', $html);
        $this->assertStringNotContainsString('display: flex', $html);
        $this->assertStringNotContainsString('justify-content', $html);
    }

    public function test_email_ships_an_inbox_preheader(): void
    {
        $html = $this->renderInvoiceIssued();

        $this->assertStringContainsString('display:none', $html);
        $this->assertStringContainsString('Invoice #BO-EMAIL-0001', $html);
    }

    public function test_email_footer_carries_legal_and_contact_links(): void
    {
        $html = $this->renderInvoiceIssued();

        $this->assertStringContainsString('/terms-of-service', $html);
        $this->assertStringContainsString('/privacy-policy', $html);
        $this->assertStringContainsString('mailto:', $html);
        $this->assertStringContainsString((string) now()->format('Y'), $html);
    }

    public function test_invoice_email_uses_the_super_admin_managed_transfer_account(): void
    {
        \App\Support\PlatformSettings::setPaymentFallback([
            'enabled' => true,
            'accounts' => [
                ['bank_name' => 'Zenith Bank', 'account_name' => 'Bellah Options Ltd', 'account_number' => '0123456789'],
            ],
        ]);

        $html = $this->renderInvoiceIssued();

        $this->assertStringContainsString('0123456789', $html);
        $this->assertStringContainsString('Zenith Bank', $html);
        $this->assertStringContainsString('Bellah Options Ltd', $html);
    }

    public function test_invoice_email_degrades_when_no_transfer_account_is_configured(): void
    {
        \App\Support\PlatformSettings::setPaymentFallback([
            'enabled' => true,
            // A half-filled account is dropped on save, so this leaves the list
            // genuinely empty.
            'accounts' => [
                ['account_number' => '', 'account_name' => '', 'bank_name' => ''],
            ],
        ]);

        $html = $this->renderInvoiceIssued();

        // No half-typed account may reach a customer; the template asks them to
        // reply instead.
        $this->assertStringNotContainsString('Account number', $html);
        $this->assertStringContainsString('current bank transfer details', $html);
    }

    public function test_invoice_email_lists_every_configured_transfer_account(): void
    {
        \App\Support\PlatformSettings::setPaymentFallback([
            'enabled' => true,
            'accounts' => [
                ['bank_name' => 'Zenith Bank', 'account_name' => 'Bellah Options Ltd', 'account_number' => '0123456789'],
                ['bank_name' => 'GTBank', 'account_name' => 'Bellah Options USD', 'account_number' => '9876543210'],
            ],
        ]);

        $html = $this->renderInvoiceIssued();

        $this->assertStringContainsString('0123456789', $html);
        $this->assertStringContainsString('Zenith Bank', $html);
        $this->assertStringContainsString('9876543210', $html);
        $this->assertStringContainsString('GTBank', $html);
        // The second account is introduced so the two are not read as one.
        $this->assertStringContainsString('Bank transfer (2)', $html);
    }

    public function test_every_transactional_template_compiles(): void
    {
        // A blade compile error in an email template only surfaces when that
        // email is next sent, which can be weeks later. This renders each one.
        $templates = [
            'emails.layouts.base',
            'emails.partials.button',
            'emails.partials.panel',
            'emails.dynamic-template',
            'emails.newsletter-campaign',
        ];

        $sandbox = [
            'htmlBody' => '<p>Body</p>',
            'url' => '/x',
            'label' => 'Go',
            'rows' => [],
        ];

        foreach ($templates as $template) {
            $rendered = View::make($template, $sandbox)->render();

            $this->assertIsString($rendered, "{$template} did not render.");
        }
    }
}
