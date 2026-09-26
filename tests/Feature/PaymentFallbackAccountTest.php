<?php

namespace Tests\Feature;

use App\Models\AppSetting;
use App\Models\User;
use App\Support\PlatformSettings;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/**
 * The bank-transfer fallback accounts shown when an online gateway is down.
 *
 * A business can hold several accounts, so the fallback is a list. It is managed
 * by a super admin from Admin -> Settings, and an account must only reach a
 * customer when it is complete.
 */
class PaymentFallbackAccountTest extends TestCase
{
    use RefreshDatabase;

    /** Raw storage key for the fallback record. */
    private const FALLBACK_KEY = 'payment_fallback_json';

    private function superAdmin(): User
    {
        return User::factory()->create([
            'role' => User::ROLE_SUPER_ADMIN,
        ]);
    }

    /**
     * Force every online gateway to look unconfigured.
     */
    private function disableOnlineGateways(): void
    {
        Config::set('services.paystack.public_key', '');
        Config::set('services.paystack.secret_key', '');
        Config::set('app.url', 'http://localhost');
    }

    /**
     * Write a raw record, bypassing setPaymentFallback() so legacy shapes can be
     * simulated exactly as an older release would have stored them.
     *
     * @param  array<string, mixed>  $record
     */
    private function storeRawFallback(array $record): void
    {
        AppSetting::setValue(self::FALLBACK_KEY, json_encode($record, JSON_UNESCAPED_SLASHES));
    }

    /**
     * @return array<int, string>
     */
    private function accountNumbers(): array
    {
        return array_column(PlatformSettings::paymentFallback()['accounts'], 'account_number');
    }

    public function test_fallback_defaults_come_from_environment_configuration(): void
    {
        Config::set('bellah.payment.transfer.enabled', true);
        Config::set('bellah.payment.transfer.account_number', '4210082961');
        Config::set('bellah.payment.transfer.account_name', 'Bellah Options');
        Config::set('bellah.payment.transfer.bank_name', 'Fidelity Bank');

        $fallback = PlatformSettings::usablePaymentFallback();

        $this->assertTrue($fallback['enabled']);
        $this->assertCount(1, $fallback['accounts']);
        $this->assertSame('4210082961', $fallback['accounts'][0]['account_number']);
        $this->assertSame('Bellah Options', $fallback['accounts'][0]['account_name']);
        $this->assertSame('Fidelity Bank', $fallback['accounts'][0]['bank_name']);
    }

    public function test_environment_without_bank_details_seeds_no_account(): void
    {
        Config::set('bellah.payment.transfer.account_number', '');
        Config::set('bellah.payment.transfer.account_name', '');
        Config::set('bellah.payment.transfer.bank_name', '');

        $fallback = PlatformSettings::paymentFallback();

        $this->assertSame([], $fallback['accounts']);
        $this->assertFalse(PlatformSettings::usablePaymentFallback()['enabled']);
    }

    public function test_super_admin_can_save_multiple_fallback_accounts(): void
    {
        $this->actingAs($this->superAdmin())
            ->patch(route('admin.settings.update'), [
                'payment_fallback' => [
                    'enabled' => true,
                    'accounts' => [
                        [
                            'account_number' => '0123 456 789',
                            'account_name' => 'Bellah Options Ltd',
                            'bank_name' => 'Zenith Bank',
                        ],
                        [
                            'account_number' => '9876543210',
                            'account_name' => 'Bellah Options USD',
                            'bank_name' => 'GTBank',
                        ],
                    ],
                    'instructions' => 'Send proof of payment to billing.',
                    'reference_hint' => 'Use your order code.',
                    'support_email' => 'BILLING@bellahoptions.com',
                ],
            ])
            ->assertRedirect()
            ->assertSessionDoesntHaveErrors();

        $fallback = PlatformSettings::paymentFallback();

        // Account numbers are stored as bare digits: no spaces or dashes ever
        // reach a customer-facing screen.
        $this->assertSame(['0123456789', '9876543210'], $this->accountNumbers());
        $this->assertSame('GTBank', $fallback['accounts'][1]['bank_name']);
        $this->assertSame('billing@bellahoptions.com', $fallback['support_email']);
        $this->assertTrue($fallback['enabled']);

        $usable = PlatformSettings::usablePaymentFallback();
        $this->assertTrue($usable['enabled']);
        $this->assertCount(2, $usable['accounts']);
    }

    public function test_legacy_single_account_record_is_migrated_into_the_list(): void
    {
        // The shape older releases wrote: the three account fields at the top
        // level, with no `accounts` list at all.
        $this->storeRawFallback([
            'enabled' => true,
            'account_number' => '4210082961',
            'account_name' => 'Bellah Options',
            'bank_name' => 'Fidelity Bank',
            'instructions' => 'Legacy instructions.',
            'reference_hint' => 'Legacy hint.',
            'support_email' => 'billing@bellahoptions.com',
        ]);

        $fallback = PlatformSettings::paymentFallback();

        $this->assertCount(1, $fallback['accounts']);
        $this->assertSame('4210082961', $fallback['accounts'][0]['account_number']);
        $this->assertSame('Bellah Options', $fallback['accounts'][0]['account_name']);
        $this->assertSame('Fidelity Bank', $fallback['accounts'][0]['bank_name']);
        $this->assertSame('Legacy instructions.', $fallback['instructions']);
        $this->assertTrue(PlatformSettings::usablePaymentFallback()['enabled']);
    }

    public function test_saving_after_a_legacy_read_moves_the_account_into_the_list(): void
    {
        $this->storeRawFallback([
            'enabled' => true,
            'account_number' => '4210082961',
            'account_name' => 'Bellah Options',
            'bank_name' => 'Fidelity Bank',
        ]);

        // Any unrelated save must carry the migrated account across rather than
        // losing it, and must drop the legacy top-level keys.
        PlatformSettings::setPaymentFallback([
            'accounts' => PlatformSettings::paymentFallback()['accounts'],
            'instructions' => 'Now with instructions.',
        ]);

        $raw = json_decode((string) AppSetting::getValue(self::FALLBACK_KEY), true);

        $this->assertArrayHasKey('accounts', $raw);
        $this->assertArrayNotHasKey('bank_name', $raw);
        $this->assertArrayNotHasKey('account_number', $raw);
        $this->assertSame('4210082961', $raw['accounts'][0]['account_number']);
        $this->assertSame('Now with instructions.', $raw['instructions']);
    }

    public function test_blank_account_rows_are_not_stored(): void
    {
        $this->actingAs($this->superAdmin())
            ->patch(route('admin.settings.update'), [
                'payment_fallback' => [
                    'enabled' => true,
                    'accounts' => [
                        ['bank_name' => 'Zenith Bank', 'account_name' => 'Bellah Options', 'account_number' => '0123456789'],
                        // An "add another account" row the operator never filled in.
                        ['bank_name' => '', 'account_name' => '', 'account_number' => ''],
                    ],
                ],
            ])
            ->assertRedirect()
            ->assertSessionDoesntHaveErrors();

        $this->assertCount(1, PlatformSettings::paymentFallback()['accounts']);
    }

    public function test_removing_every_account_does_not_resurrect_the_environment_account(): void
    {
        Config::set('bellah.payment.transfer.account_number', '4210082961');
        Config::set('bellah.payment.transfer.account_name', 'Bellah Options');
        Config::set('bellah.payment.transfer.bank_name', 'Fidelity Bank');

        $this->actingAs($this->superAdmin())
            ->patch(route('admin.settings.update'), [
                'payment_fallback' => ['enabled' => true, 'accounts' => []],
            ])
            ->assertRedirect()
            ->assertSessionDoesntHaveErrors();

        // An explicitly empty list is authoritative: the environment default must
        // not come back, otherwise deleting every account would be impossible.
        $this->assertSame([], PlatformSettings::paymentFallback()['accounts']);
        $this->assertFalse(PlatformSettings::usablePaymentFallback()['enabled']);
    }

    public function test_incomplete_accounts_are_filtered_out_of_the_usable_list(): void
    {
        PlatformSettings::setPaymentFallback([
            'enabled' => true,
            'accounts' => [
                ['bank_name' => 'Zenith Bank', 'account_name' => 'Bellah Options', 'account_number' => '0123456789'],
                ['bank_name' => 'GTBank', 'account_name' => '', 'account_number' => '1111111111'],
                ['bank_name' => '', 'account_name' => '', 'account_number' => '2222222222'],
            ],
        ]);

        // Saved as given, so the operator can keep editing a half-filled row...
        $this->assertCount(3, PlatformSettings::paymentFallback()['accounts']);

        // ...but only the complete one is ever offered.
        $usable = PlatformSettings::usablePaymentFallback();
        $this->assertTrue($usable['enabled']);
        $this->assertCount(1, $usable['accounts']);
        $this->assertSame('0123456789', $usable['accounts'][0]['account_number']);
    }

    public function test_a_single_incomplete_account_is_never_offered(): void
    {
        $this->disableOnlineGateways();

        // The admin form auto-saves field by field, so a half-filled account is
        // a legitimate intermediate state - it just must not reach a customer.
        $this->actingAs($this->superAdmin())
            ->patch(route('admin.settings.update'), [
                'payment_fallback' => [
                    'enabled' => true,
                    'accounts' => [
                        ['bank_name' => '', 'account_name' => '', 'account_number' => '4210082961'],
                    ],
                ],
            ])
            ->assertRedirect()
            ->assertSessionDoesntHaveErrors();

        $this->assertSame(['4210082961'], $this->accountNumbers());
        $this->assertFalse(PlatformSettings::usablePaymentFallback()['enabled']);

        $this->get(route('orders.create', 'social-media-design'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('paymentReadiness.paystack.available', false)
                ->where('paymentReadiness.bank_transfer.available', false)
                ->where('paymentReadiness.bank_transfer.accounts', [])
            );
    }

    public function test_non_numeric_account_number_is_rejected(): void
    {
        $this->actingAs($this->superAdmin())
            ->patch(route('admin.settings.update'), [
                'payment_fallback' => [
                    'enabled' => true,
                    'accounts' => [
                        [
                            'account_number' => 'not-an-account',
                            'account_name' => 'Bellah Options',
                            'bank_name' => 'Fidelity Bank',
                        ],
                    ],
                ],
            ])
            ->assertSessionHasErrors(['payment_fallback.accounts.0.account_number']);
    }

    public function test_clearing_an_account_number_is_accepted(): void
    {
        PlatformSettings::setPaymentFallback([
            'enabled' => true,
            'accounts' => [
                ['bank_name' => 'Zenith Bank', 'account_name' => 'Bellah Options', 'account_number' => '0123456789'],
            ],
        ]);

        // The autosave form posts an empty string when a field is cleared.
        // `nullable` alone only forgives null, so this must not fail validation.
        $this->actingAs($this->superAdmin())
            ->patch(route('admin.settings.update'), [
                'payment_fallback' => [
                    'accounts' => [
                        ['bank_name' => 'Zenith Bank', 'account_name' => 'Bellah Options', 'account_number' => ''],
                    ],
                ],
            ])
            ->assertRedirect()
            ->assertSessionDoesntHaveErrors();

        $this->assertSame([''], $this->accountNumbers());
        $this->assertFalse(PlatformSettings::usablePaymentFallback()['enabled']);
    }

    public function test_more_than_ten_accounts_is_rejected(): void
    {
        $accounts = [];

        for ($index = 0; $index < 11; $index++) {
            $accounts[] = [
                'bank_name' => 'Bank '.$index,
                'account_name' => 'Bellah Options',
                'account_number' => str_pad((string) $index, 10, '0', STR_PAD_LEFT),
            ];
        }

        $this->actingAs($this->superAdmin())
            ->patch(route('admin.settings.update'), [
                'payment_fallback' => ['enabled' => true, 'accounts' => $accounts],
            ])
            ->assertSessionHasErrors(['payment_fallback.accounts']);
    }

    public function test_disabled_fallback_is_never_offered_to_a_customer(): void
    {
        $this->disableOnlineGateways();

        PlatformSettings::setPaymentFallback([
            'enabled' => false,
            'accounts' => [
                ['bank_name' => 'Fidelity Bank', 'account_name' => 'Bellah Options', 'account_number' => '4210082961'],
            ],
        ]);

        $this->get(route('orders.create', 'social-media-design'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('paymentReadiness.bank_transfer.available', false)
                ->where('paymentReadiness.bank_transfer.accounts', [])
            );
    }

    public function test_every_saved_account_is_offered_when_the_gateway_is_unavailable(): void
    {
        $this->disableOnlineGateways();

        PlatformSettings::setPaymentFallback([
            'enabled' => true,
            'accounts' => [
                ['bank_name' => 'Zenith Bank', 'account_name' => 'Bellah Options Ltd', 'account_number' => '0123456789'],
                ['bank_name' => 'GTBank', 'account_name' => 'Bellah Options USD', 'account_number' => '9876543210'],
            ],
            'instructions' => 'Send proof of payment to billing.',
            'reference_hint' => 'Use your order code.',
            'support_email' => 'billing@bellahoptions.com',
        ]);

        $this->get(route('orders.create', 'social-media-design'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('paymentReadiness.paystack.available', false)
                ->where('paymentReadiness.bank_transfer.available', true)
                ->has('paymentReadiness.bank_transfer.accounts', 2)
                ->where('paymentReadiness.bank_transfer.accounts.0.account_number', '0123456789')
                ->where('paymentReadiness.bank_transfer.accounts.0.bank_name', 'Zenith Bank')
                ->where('paymentReadiness.bank_transfer.accounts.1.account_number', '9876543210')
                ->where('paymentReadiness.bank_transfer.accounts.1.bank_name', 'GTBank')
                ->where('paymentReadiness.bank_transfer.reference_hint', 'Use your order code.')
                ->where('paymentReadiness.bank_transfer.support_email', 'billing@bellahoptions.com')
            );
    }

    public function test_no_accounts_are_sent_while_the_gateway_is_healthy(): void
    {
        Config::set('services.paystack.public_key', 'pk_test_example');
        Config::set('services.paystack.secret_key', 'sk_test_example');
        Config::set('app.url', 'http://localhost');

        PlatformSettings::setPaymentFallback([
            'enabled' => true,
            'accounts' => [
                ['bank_name' => 'Zenith Bank', 'account_name' => 'Bellah Options Ltd', 'account_number' => '0123456789'],
            ],
        ]);

        $this->get(route('orders.create', 'social-media-design'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                // The bank details are withheld entirely, not merely flagged.
                ->where('paymentReadiness.bank_transfer.available', false)
                ->where('paymentReadiness.bank_transfer.accounts', [])
            );
    }

    public function test_settings_screen_exposes_the_fallback_accounts_to_super_admins(): void
    {
        PlatformSettings::setPaymentFallback([
            'enabled' => true,
            'accounts' => [
                ['bank_name' => 'Zenith Bank', 'account_name' => 'Bellah Options Ltd', 'account_number' => '0123456789'],
                ['bank_name' => 'GTBank', 'account_name' => 'Bellah Options USD', 'account_number' => '9876543210'],
            ],
        ]);

        $this->actingAs($this->superAdmin())
            ->get(route('admin.settings.edit'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin/Settings')
                ->has('settings.payment_fallback.accounts', 2)
                ->where('settings.payment_fallback.accounts.0.bank_name', 'Zenith Bank')
                ->where('settings.payment_fallback.accounts.1.account_number', '9876543210')
                ->where('settings.payment_fallback.enabled', true)
            );
    }

    public function test_partial_fallback_update_keeps_the_other_fields(): void
    {
        PlatformSettings::setPaymentFallback([
            'enabled' => true,
            'accounts' => [
                ['bank_name' => 'Fidelity Bank', 'account_name' => 'Bellah Options', 'account_number' => '4210082961'],
            ],
            'instructions' => 'Original instructions.',
        ]);

        // Saving only the instructions must not touch the account list.
        $this->actingAs($this->superAdmin())
            ->patch(route('admin.settings.update'), [
                'payment_fallback' => ['instructions' => 'Updated instructions.'],
            ])
            ->assertRedirect();

        $fallback = PlatformSettings::paymentFallback();

        $this->assertSame('Updated instructions.', $fallback['instructions']);
        $this->assertSame('4210082961', $fallback['accounts'][0]['account_number']);
        $this->assertSame('Fidelity Bank', $fallback['accounts'][0]['bank_name']);
    }

    public function test_payment_screen_offers_every_account(): void
    {
        $this->disableOnlineGateways();

        PlatformSettings::setPaymentFallback([
            'enabled' => true,
            'accounts' => [
                ['bank_name' => 'Zenith Bank', 'account_name' => 'Bellah Options Ltd', 'account_number' => '0123456789'],
                ['bank_name' => 'GTBank', 'account_name' => 'Bellah Options USD', 'account_number' => '9876543210'],
            ],
        ]);

        $user = User::factory()->create();
        $order = \App\Models\ServiceOrder::create([
            'uuid' => (string) \Illuminate\Support\Str::uuid(),
            'order_code' => 'ORD-'.strtoupper(\Illuminate\Support\Str::random(6)),
            'user_id' => $user->id,
            'service_slug' => 'social-media-design',
            'service_name' => 'Social Media Design',
            'package_code' => 'starter',
            'package_name' => 'Starter Plan',
            'business_name' => 'Acme Ltd',
            'full_name' => 'Test Client',
            'email' => $user->email,
            'phone' => '08000000000',
            'project_summary' => 'Test summary',
            'amount' => 50000,
            'currency' => 'NGN',
            'payment_status' => 'pending',
            'order_status' => 'pending',
            'payment_provider' => 'paystack',
        ]);

        $this->actingAs($user)
            ->get(route('orders.payment.show', $order))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Orders/Payment')
                ->where('transferPayment.available', true)
                ->has('transferPayment.accounts', 2)
                ->where('transferPayment.accounts.1.bank_name', 'GTBank')
            );
    }
}
