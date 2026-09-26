<?php

namespace Tests\Feature;

use App\Models\User;
use App\Support\PlatformSettings;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * Paystack-backed bank account name resolution.
 *
 * The settings screen uses these endpoints to turn an operator's bank choice
 * into a Paystack bank code and then to resolve the registered account name, so
 * a mistyped account number cannot reach customers.
 */
class PaystackAccountResolutionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // The bank list is cached; the array store persists for the life of the
        // application, so each test starts from a clean slate.
        Cache::flush();

        Config::set('services.paystack.secret_key', 'sk_test_example');
        Config::set('services.paystack.public_key', 'pk_test_example');
    }

    private function superAdmin(): User
    {
        return User::factory()->create(['role' => User::ROLE_SUPER_ADMIN]);
    }

    private function customerRep(): User
    {
        return User::factory()->create(['role' => User::ROLE_CUSTOMER_REP]);
    }

    /**
     * @param  array<int, array<string, mixed>>  $banks
     */
    private function fakeBankList(array $banks, int $pageCount = 1): void
    {
        Http::fake([
            'api.paystack.co/bank/resolve*' => Http::response([
                'status' => true,
                'data' => ['account_number' => '0123456789', 'account_name' => 'BELLAH OPTIONS LTD'],
            ]),
            'api.paystack.co/bank*' => Http::response([
                'status' => true,
                'data' => $banks,
                'meta' => ['page' => 1, 'pageCount' => $pageCount, 'total' => count($banks)],
            ]),
        ]);
    }

    public function test_bank_list_is_super_admin_only(): void
    {
        $this->actingAs($this->customerRep())
            ->getJson(route('admin.paystack.banks'))
            ->assertForbidden();
    }

    public function test_account_resolution_is_super_admin_only(): void
    {
        $this->actingAs($this->customerRep())
            ->postJson(route('admin.paystack.resolve-account'), [
                'account_number' => '0123456789',
                'bank_code' => '058',
            ])
            ->assertForbidden();
    }

    public function test_bank_list_returns_paystack_banks_sorted_by_name(): void
    {
        $this->fakeBankList([
            ['name' => 'Zenith Bank', 'code' => '057', 'active' => true],
            ['name' => 'Access Bank', 'code' => '044', 'active' => true],
        ]);

        $response = $this->actingAs($this->superAdmin())
            ->getJson(route('admin.paystack.banks'))
            ->assertOk()
            ->assertJsonPath('available', true);

        $this->assertSame(
            ['Access Bank', 'Zenith Bank'],
            array_column($response->json('banks'), 'name'),
        );
    }

    public function test_bank_list_skips_inactive_banks(): void
    {
        $this->fakeBankList([
            ['name' => 'Active Bank', 'code' => '001', 'active' => true],
            // An inactive entry cannot resolve an account number, so offering it
            // in the picker would only produce confusing failures.
            ['name' => 'Retired Bank', 'code' => '002', 'active' => false],
        ]);

        $response = $this->actingAs($this->superAdmin())
            ->getJson(route('admin.paystack.banks'))
            ->assertOk();

        $this->assertSame(['Active Bank'], array_column($response->json('banks'), 'name'));
    }

    public function test_bank_list_walks_every_page(): void
    {
        // Paystack caps a page at 100 entries and Nigeria has more than one page,
        // so stopping at the first would silently hide most banks.
        Http::fake([
            'api.paystack.co/bank?*page=1*' => Http::response([
                'status' => true,
                'data' => [['name' => 'First Page Bank', 'code' => '001', 'active' => true]],
                'meta' => ['page' => 1, 'pageCount' => 2],
            ]),
            'api.paystack.co/bank?*page=2*' => Http::response([
                'status' => true,
                'data' => [['name' => 'Second Page Bank', 'code' => '002', 'active' => true]],
                'meta' => ['page' => 2, 'pageCount' => 2],
            ]),
        ]);

        $response = $this->actingAs($this->superAdmin())
            ->getJson(route('admin.paystack.banks'))
            ->assertOk();

        $this->assertSame(
            ['First Page Bank', 'Second Page Bank'],
            array_column($response->json('banks'), 'name'),
        );
    }

    public function test_bank_list_degrades_when_paystack_fails(): void
    {
        Http::fake([
            'api.paystack.co/*' => Http::response(['status' => false, 'message' => 'Server error'], 500),
        ]);

        // A failure is a 200 with available=false: the settings screen must still
        // render so the operator can type the bank name by hand.
        $this->actingAs($this->superAdmin())
            ->getJson(route('admin.paystack.banks'))
            ->assertOk()
            ->assertJsonPath('available', false)
            ->assertJsonPath('banks', []);
    }

    public function test_bank_list_degrades_when_paystack_is_not_configured(): void
    {
        Config::set('services.paystack.secret_key', '');
        Http::fake();

        $this->actingAs($this->superAdmin())
            ->getJson(route('admin.paystack.banks'))
            ->assertOk()
            ->assertJsonPath('available', false)
            ->assertJsonPath('banks', []);

        Http::assertNothingSent();
    }

    public function test_resolution_returns_the_registered_account_name(): void
    {
        Http::fake([
            'api.paystack.co/bank/resolve*' => Http::response([
                'status' => true,
                'data' => [
                    'account_number' => '0123456789',
                    'account_name' => 'BELLAH OPTIONS LTD',
                ],
            ]),
        ]);

        $this->actingAs($this->superAdmin())
            ->postJson(route('admin.paystack.resolve-account'), [
                'account_number' => '0123456789',
                'bank_code' => '057',
            ])
            ->assertOk()
            ->assertJsonPath('account_name', 'BELLAH OPTIONS LTD')
            ->assertJsonPath('account_number', '0123456789');

        Http::assertSent(fn ($request) => str_contains($request->url(), 'account_number=0123456789')
            && str_contains($request->url(), 'bank_code=057'));
    }

    public function test_resolution_surfaces_the_paystack_message(): void
    {
        Http::fake([
            'api.paystack.co/bank/resolve*' => Http::response([
                'status' => false,
                'message' => 'Could not resolve account name. Check parameters',
            ], 422),
        ]);

        // The operator needs to know it was the bank/number that was wrong, not
        // that the API was unreachable.
        $this->actingAs($this->superAdmin())
            ->postJson(route('admin.paystack.resolve-account'), [
                'account_number' => '0000000000',
                'bank_code' => '057',
            ])
            ->assertStatus(422)
            ->assertJsonPath('message', 'Could not resolve account name. Check parameters');
    }

    public function test_resolution_rejects_non_numeric_input(): void
    {
        Http::fake();

        $this->actingAs($this->superAdmin())
            ->postJson(route('admin.paystack.resolve-account'), [
                'account_number' => 'not-a-number',
                'bank_code' => '057',
            ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['account_number']);

        // Arbitrary text must never be forwarded to the upstream API.
        Http::assertNothingSent();
    }

    public function test_resolution_requires_both_fields(): void
    {
        Http::fake();

        $this->actingAs($this->superAdmin())
            ->postJson(route('admin.paystack.resolve-account'), ['account_number' => '0123456789'])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['bank_code']);

        Http::assertNothingSent();
    }

    public function test_resolved_bank_code_is_stored_with_the_account(): void
    {
        $this->actingAs($this->superAdmin())
            ->patch(route('admin.settings.update'), [
                'payment_fallback' => [
                    'enabled' => true,
                    'accounts' => [
                        [
                            'bank_name' => 'Zenith Bank',
                            'bank_code' => '057',
                            'account_name' => 'BELLAH OPTIONS LTD',
                            'account_number' => '0123456789',
                        ],
                    ],
                ],
            ])
            ->assertRedirect()
            ->assertSessionDoesntHaveErrors();

        $account = PlatformSettings::paymentFallback()['accounts'][0];

        // The code is kept so the name can be re-resolved without re-picking the bank.
        $this->assertSame('057', $account['bank_code']);
        $this->assertSame('Zenith Bank', $account['bank_name']);
        $this->assertSame('BELLAH OPTIONS LTD', $account['account_name']);
    }

    public function test_accounts_saved_before_bank_codes_existed_still_load(): void
    {
        $this->actingAs($this->superAdmin())
            ->patch(route('admin.settings.update'), [
                'payment_fallback' => [
                    'enabled' => true,
                    'accounts' => [
                        ['bank_name' => 'Fidelity Bank', 'account_name' => 'Bellah Options', 'account_number' => '4210082961'],
                    ],
                ],
            ])
            ->assertRedirect();

        $account = PlatformSettings::paymentFallback()['accounts'][0];

        // No code supplied: the row is stored with an empty code rather than
        // being rejected, and stays usable for customers.
        $this->assertSame('', $account['bank_code']);
        $this->assertTrue(PlatformSettings::usablePaymentFallback()['enabled']);
    }

    public function test_settings_screen_exposes_the_stored_bank_code(): void
    {
        PlatformSettings::setPaymentFallback([
            'enabled' => true,
            'accounts' => [
                [
                    'bank_name' => 'Zenith Bank',
                    'bank_code' => '057',
                    'account_name' => 'BELLAH OPTIONS LTD',
                    'account_number' => '0123456789',
                ],
            ],
        ]);

        $this->actingAs($this->superAdmin())
            ->get(route('admin.settings.edit'))
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->where('settings.payment_fallback.accounts.0.bank_code', '057')
            );
    }

    public function test_resolution_never_writes_to_the_saved_settings(): void
    {
        $this->fakeBankList([['name' => 'Zenith Bank', 'code' => '057', 'active' => true]]);

        PlatformSettings::setPaymentFallback([
            'enabled' => true,
            'accounts' => [
                [
                    'bank_name' => 'Zenith Bank',
                    'bank_code' => '057',
                    'account_name' => 'NAME THE OPERATOR TYPED',
                    'account_number' => '0123456789',
                ],
            ],
        ]);

        $this->actingAs($this->superAdmin())
            ->postJson(route('admin.paystack.resolve-account'), [
                'account_number' => '0123456789',
                'bank_code' => '057',
            ])
            ->assertOk()
            ->assertJsonPath('account_name', 'BELLAH OPTIONS LTD');

        // Resolving is a read-only lookup: it must not silently persist the name
        // it found. The editor decides what to save, which is what lets an
        // operator keep their own wording.
        $this->assertSame(
            'NAME THE OPERATOR TYPED',
            PlatformSettings::paymentFallback()['accounts'][0]['account_name'],
        );
    }

    public function test_a_manually_typed_account_name_is_stored_verbatim(): void
    {
        // The account name field is always editable, so a name that did not come
        // from Paystack must survive exactly as typed — even alongside a bank
        // code that Paystack could resolve.
        $this->actingAs($this->superAdmin())
            ->patch(route('admin.settings.update'), [
                'payment_fallback' => [
                    'enabled' => true,
                    'accounts' => [
                        [
                            'bank_name' => 'Zenith Bank',
                            'bank_code' => '057',
                            'account_name' => 'Trading As Something Else',
                            'account_number' => '0123456789',
                        ],
                    ],
                ],
            ])
            ->assertRedirect()
            ->assertSessionDoesntHaveErrors();

        $account = PlatformSettings::paymentFallback()['accounts'][0];

        $this->assertSame('Trading As Something Else', $account['account_name']);
        $this->assertSame('057', $account['bank_code']);
        $this->assertTrue(PlatformSettings::usablePaymentFallback()['enabled']);
    }
}
