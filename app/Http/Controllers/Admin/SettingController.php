<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreDiscountCodeRequest;
use App\Http\Requests\Admin\StoreSubscriptionPlanRequest;
use App\Http\Requests\Admin\ToggleDiscountCodeStatusRequest;
use App\Http\Requests\Admin\UpdatePlatformSettingsRequest;
use App\Http\Requests\Admin\UpdateSubscriptionPlanRequest;
use App\Models\AppSetting;
use App\Models\ClientReview;
use App\Models\DiscountCode;
use App\Models\ServiceOrder;
use App\Models\SubscriptionPlan;
use App\Models\Term;
use App\Services\PaystackService;
use App\Support\PlatformSettings;
use App\Support\ServiceOrderCatalog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class SettingController extends Controller
{
    public function edit(ServiceOrderCatalog $catalog): Response
    {
        $contactInfo = PlatformSettings::contactInfo();
        $serviceCatalog = $catalog->all();
        $activeDiscountCodes = $this->activeDiscountCodes();
        $paidSubscriptionCounts = $this->paidSubscriptionCounts();

        return Inertia::render('Admin/Settings', [
            'settings' => [
                'maintenance_mode' => AppSetting::getBool('maintenance_mode'),
                'website_uri' => PlatformSettings::siteUrl(),
                'contact_phone' => $contactInfo['phone'],
                'contact_email' => $contactInfo['email'],
                'contact_location' => $contactInfo['location'],
                'contact_whatsapp_url' => $contactInfo['whatsapp_url'],
                'contact_behance_url' => $contactInfo['behance_url'],
                'contact_map_embed_url' => $contactInfo['map_embed_url'],
                'logo_path' => PlatformSettings::brandAssets()['logo_path'],
                'favicon_path' => PlatformSettings::brandAssets()['favicon_path'],
                'public_seo' => PlatformSettings::publicSeoSettings(),
                'terms' => $this->policyTermsPayload(),
            ],
            'serviceCatalog' => $this->serviceCatalogMeta($serviceCatalog),
            'discountCodes' => DiscountCode::query()
                ->latest('id')
                ->get()
                ->map(fn (DiscountCode $discount): array => [
                    'id' => $discount->id,
                    'name' => $discount->name,
                    'code' => $discount->code,
                    'discount_type' => $discount->discount_type,
                    'discount_value' => (string) $discount->discount_value,
                    'currency' => $discount->currency,
                    'is_active' => (bool) $discount->is_active,
                    'service_slug' => $discount->service_slug,
                    'package_code' => $discount->package_code,
                    'max_redemptions' => $discount->max_redemptions,
                    'total_redemptions' => (int) $discount->total_redemptions,
                    'starts_at' => $discount->starts_at?->toDateString(),
                    'ends_at' => $discount->ends_at?->toDateString(),
                    'discount_link' => $this->discountLink($discount),
                ])
                ->values(),
            'subscriptionPlans' => SubscriptionPlan::query()
                ->orderByDesc('is_homepage_featured')
                ->orderByDesc('is_recommended')
                ->orderBy('position')
                ->orderBy('id')
                ->get()
                ->map(function (SubscriptionPlan $plan) use ($activeDiscountCodes, $paidSubscriptionCounts, $serviceCatalog): array {
                    $serviceName = (string) data_get($serviceCatalog, $plan->service_slug.'.name', ucfirst((string) $plan->service_slug));
                    $packageName = (string) data_get($serviceCatalog, $plan->service_slug.'.packages.'.$plan->package_code.'.name', ucfirst((string) $plan->package_code));
                    $basePrice = round((float) data_get($serviceCatalog, $plan->service_slug.'.packages.'.$plan->package_code.'.price', 0), 2);

                    $bestDiscount = null;
                    if ($basePrice > 0) {
                        $bestDiscount = $this->bestDiscountForPlan(
                            $activeDiscountCodes,
                            (string) $plan->service_slug,
                            (string) $plan->package_code,
                            $basePrice,
                            strtoupper((string) config('bellah.invoice.currency', 'NGN')),
                        );
                    }

                    return [
                        'id' => $plan->id,
                        'name' => $plan->name,
                        'service_slug' => $plan->service_slug,
                        'service_name' => $serviceName,
                        'package_code' => $plan->package_code,
                        'package_name' => $packageName,
                        'image_path' => $plan->image_path,
                        'short_description' => $plan->short_description,
                        'long_description' => $plan->long_description,
                        'billing_cycle' => $plan->billing_cycle,
                        'position' => (int) $plan->position,
                        'is_active' => (bool) $plan->is_active,
                        'show_on_homepage' => (bool) $plan->show_on_homepage,
                        'is_homepage_featured' => (bool) $plan->is_homepage_featured,
                        'is_recommended' => (bool) $plan->is_recommended,
                        'is_quantity_priced' => (bool) data_get($serviceCatalog, $plan->service_slug.'.packages.'.$plan->package_code.'.is_quantity_priced', false),
                        'paystack_plan_code' => $plan->paystack_plan_code,
                        'paystack_synced_at' => $plan->paystack_synced_at?->toIso8601String(),
                        'paystack_sync_error' => $plan->paystack_sync_error,
                        'paid_subscriptions' => (int) ($paidSubscriptionCounts[$this->pairKey((string) $plan->service_slug, (string) $plan->package_code)] ?? 0),
                        'active_discount_code' => $bestDiscount?->code,
                        'active_discount_summary' => $bestDiscount ? $this->discountSummary($bestDiscount) : null,
                        'checkout_link' => $this->planCheckoutLink($plan, $bestDiscount?->code),
                    ];
                })
                ->values(),
            'clientReviews' => $this->clientReviewsPayload(),
        ]);
    }

    public function update(UpdatePlatformSettingsRequest $request): RedirectResponse|JsonResponse
    {
        $payload = $request->validated();

        if (array_key_exists('maintenance_mode', $payload)) {
            AppSetting::setBool('maintenance_mode', (bool) $payload['maintenance_mode']);
        }

        if (array_key_exists('website_uri', $payload)) {
            PlatformSettings::setSiteUrl((string) $payload['website_uri']);
        }

        $contactKeys = [
            'contact_phone' => 'phone',
            'contact_email' => 'email',
            'contact_location' => 'location',
            'contact_whatsapp_url' => 'whatsapp_url',
            'contact_behance_url' => 'behance_url',
            'contact_map_embed_url' => 'map_embed_url',
        ];
        $hasContactUpdate = false;
        foreach (array_keys($contactKeys) as $key) {
            if (array_key_exists($key, $payload)) {
                $hasContactUpdate = true;
                break;
            }
        }
        if ($hasContactUpdate) {
            $contactInfo = PlatformSettings::contactInfo();
            foreach ($contactKeys as $requestKey => $settingKey) {
                if (array_key_exists($requestKey, $payload)) {
                    $contactInfo[$settingKey] = (string) $payload[$requestKey];
                }
            }
            PlatformSettings::setContactInfo($contactInfo);
        }

        if (array_key_exists('logo_path', $payload) || array_key_exists('favicon_path', $payload)) {
            $brandAssets = PlatformSettings::brandAssets();
            if (array_key_exists('logo_path', $payload)) {
                $brandAssets['logo_path'] = (string) $payload['logo_path'];
            }
            if (array_key_exists('favicon_path', $payload)) {
                $brandAssets['favicon_path'] = (string) $payload['favicon_path'];
            }
            PlatformSettings::setBrandAssets($brandAssets);
        }

        if (array_key_exists('public_seo', $payload) && is_array($payload['public_seo'])) {
            PlatformSettings::setPublicSeoSettings($payload['public_seo']);
        }

        if (is_array($payload['terms'] ?? null)) {
            $this->savePolicyTerms((array) $payload['terms']);
        }

        if ($request->expectsJson()) {
            return response()->json([
                'success' => true,
                'message' => 'Platform settings updated successfully.',
            ]);
        }

        return back()->with('success', 'Platform settings updated successfully.');
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function clientReviewsPayload(): array
    {
        if (! Schema::hasTable('client_reviews')) {
            return [];
        }

        return ClientReview::query()
            ->with(['serviceOrder:id,order_code', 'invoice:id,invoice_number'])
            ->latest('id')
            ->limit(120)
            ->get()
            ->map(fn (ClientReview $review): array => [
                'id' => $review->id,
                'source' => $review->source,
                'reviewer_name' => $review->reviewer_name,
                'reviewer_email' => $review->reviewer_email,
                'rating' => $review->rating !== null ? (float) $review->rating : null,
                'comment' => $review->comment,
                'screenshot_path' => $review->screenshot_path,
                'is_public' => (bool) $review->is_public,
                'is_featured' => (bool) $review->is_featured,
                'review_requested_at' => $review->review_requested_at?->toDateTimeString(),
                'review_submitted_at' => $review->review_submitted_at?->toDateTimeString(),
                'published_at' => $review->published_at?->toDateTimeString(),
                'service_order' => $review->serviceOrder ? [
                    'order_code' => $review->serviceOrder->order_code,
                ] : null,
                'invoice' => $review->invoice ? [
                    'invoice_number' => $review->invoice->invoice_number,
                ] : null,
            ])
            ->values()
            ->all();
    }

    public function storeDiscount(StoreDiscountCodeRequest $request): RedirectResponse
    {
        $payload = $request->validated();

        DiscountCode::create([
            'name' => $payload['name'] ?: null,
            'code' => strtoupper((string) $payload['code']),
            'discount_type' => $payload['discount_type'],
            'discount_value' => $payload['discount_value'],
            'currency' => $payload['discount_type'] === 'fixed'
                ? strtoupper((string) ($payload['currency'] ?: config('bellah.invoice.currency', 'NGN')))
                : null,
            'is_active' => (bool) ($payload['is_active'] ?? true),
            'service_slug' => $payload['service_slug'],
            'package_code' => ($payload['package_code'] ?? '') !== '' ? $payload['package_code'] : null,
            'starts_at' => $payload['starts_at'] ?? null,
            'ends_at' => $payload['ends_at'] ?? null,
            'max_redemptions' => $payload['max_redemptions'] ?? null,
            'created_by' => $request->user()?->id,
        ]);

        return back()->with('success', 'Discount code created successfully.');
    }

    public function toggleDiscountStatus(ToggleDiscountCodeStatusRequest $request, DiscountCode $discountCode): RedirectResponse
    {
        $discountCode->update([
            'is_active' => $request->boolean('is_active'),
        ]);

        return back()->with('success', 'Discount code status updated.');
    }

    public function destroyDiscount(Request $request, DiscountCode $discountCode): RedirectResponse
    {
        abort_unless((bool) $request->user()?->canManageSettings(), 403);

        $discountCode->delete();

        return back()->with('success', 'Discount code deleted successfully.');
    }

    public function storeSubscriptionPlan(StoreSubscriptionPlanRequest $request, ServiceOrderCatalog $catalog, PaystackService $paystackService): RedirectResponse
    {
        $payload = $request->validated();

        $plan = SubscriptionPlan::create([
            'name' => $payload['name'],
            'service_slug' => $payload['service_slug'],
            'package_code' => $payload['package_code'],
            'image_path' => $payload['image_path'] ?: null,
            'short_description' => $payload['short_description'] ?: null,
            'long_description' => $payload['long_description'] ?: null,
            'billing_cycle' => $payload['billing_cycle'],
            'position' => (int) ($payload['position'] ?? 0),
            'is_active' => (bool) ($payload['is_active'] ?? true),
            'show_on_homepage' => (bool) ($payload['show_on_homepage'] ?? true),
            'is_homepage_featured' => (bool) ($payload['is_homepage_featured'] ?? false),
            'is_recommended' => (bool) ($payload['is_recommended'] ?? false),
            'created_by' => $request->user()?->id,
        ]);

        $this->normalizeSubscriptionPlanFlags($plan);
        $plan->save();
        $this->synchronizeExclusivePlanFlags($plan);
        $this->syncSubscriptionPlanToPaystack($plan, $catalog, $paystackService);

        return back()->with('success', 'Subscription plan created successfully.');
    }

    public function updateSubscriptionPlan(UpdateSubscriptionPlanRequest $request, SubscriptionPlan $subscriptionPlan, ServiceOrderCatalog $catalog, PaystackService $paystackService): RedirectResponse
    {
        $payload = $request->validated();

        $fields = [
            'name',
            'image_path',
            'short_description',
            'long_description',
            'billing_cycle',
            'position',
            'is_active',
            'show_on_homepage',
            'is_homepage_featured',
            'is_recommended',
        ];

        $updates = [];
        foreach ($fields as $field) {
            if (array_key_exists($field, $payload)) {
                $updates[$field] = $payload[$field];
            }
        }

        if ($updates === []) {
            return back()->with('error', 'No subscription plan changes were submitted.');
        }

        $nameOrCycleChanged = (array_key_exists('name', $updates) && $updates['name'] !== $subscriptionPlan->name)
            || (array_key_exists('billing_cycle', $updates) && $updates['billing_cycle'] !== $subscriptionPlan->billing_cycle);

        $subscriptionPlan->fill($updates);
        $this->normalizeSubscriptionPlanFlags($subscriptionPlan);
        $subscriptionPlan->save();

        $this->synchronizeExclusivePlanFlags($subscriptionPlan);

        if ($nameOrCycleChanged || $subscriptionPlan->paystack_plan_code === null) {
            $this->syncSubscriptionPlanToPaystack($subscriptionPlan, $catalog, $paystackService);
        }

        return back()->with('success', 'Subscription plan updated successfully.');
    }

    public function syncSubscriptionPlanPaystack(Request $request, SubscriptionPlan $subscriptionPlan, ServiceOrderCatalog $catalog, PaystackService $paystackService): RedirectResponse
    {
        abort_unless((bool) $request->user()?->canManageSettings(), 403);

        $this->syncSubscriptionPlanToPaystack($subscriptionPlan, $catalog, $paystackService);
        $synced = $subscriptionPlan->fresh()?->paystack_plan_code !== null;

        return back()->with(
            $synced ? 'success' : 'error',
            $synced
                ? 'Subscription plan synced to Paystack.'
                : 'Unable to sync this subscription plan to Paystack. See the error shown for details.',
        );
    }

    /**
     * Create (or update, if already synced) the matching Paystack recurring
     * billing Plan for a subscription plan. Best-effort: failures are recorded
     * on the model rather than thrown, so they never block saving the local
     * marketing record. Quantity-priced packages are skipped entirely since a
     * fixed recurring amount can't represent a per-order quantity choice.
     */
    private function syncSubscriptionPlanToPaystack(SubscriptionPlan $plan, ServiceOrderCatalog $catalog, PaystackService $paystackService): void
    {
        $package = $catalog->package((string) $plan->service_slug, (string) $plan->package_code);

        if (! is_array($package) || (bool) ($package['is_quantity_priced'] ?? false)) {
            $plan->update(['paystack_plan_code' => null, 'paystack_synced_at' => null, 'paystack_sync_error' => null]);

            return;
        }

        $price = round((float) ($package['price'] ?? 0), 2);

        if ($price <= 0) {
            $plan->update(['paystack_sync_error' => 'This package has no price configured yet.']);

            return;
        }

        $interval = match (strtolower((string) $plan->billing_cycle)) {
            'yearly' => 'annually',
            default => strtolower((string) $plan->billing_cycle),
        };

        try {
            if ($plan->paystack_plan_code !== null) {
                $paystackService->updatePlan($plan->paystack_plan_code, [
                    'name' => $plan->name,
                    'interval' => $interval,
                ]);
            } else {
                $result = $paystackService->createPlan($plan->name, PaystackService::toKobo($price), $interval);
                $plan->paystack_plan_code = $result['plan_code'];
            }

            $plan->update([
                'paystack_plan_code' => $plan->paystack_plan_code,
                'paystack_synced_at' => now(),
                'paystack_sync_error' => null,
            ]);
        } catch (Throwable $exception) {
            Log::warning('Paystack subscription plan sync failed.', [
                'subscription_plan_id' => $plan->id,
                'error' => $exception->getMessage(),
            ]);

            $plan->update(['paystack_sync_error' => Str::limit($exception->getMessage(), 480)]);
        }
    }

    public function destroySubscriptionPlan(Request $request, SubscriptionPlan $subscriptionPlan): RedirectResponse
    {
        abort_unless((bool) $request->user()?->canManageSettings(), 403);

        $subscriptionPlan->delete();

        return back()->with('success', 'Subscription plan deleted successfully.');
    }

    /**
     * @param  array<string, array<string, mixed>>  $serviceCatalog
     * @return array<string, array<string, mixed>>
     */
    private function serviceCatalogMeta(array $serviceCatalog): array
    {
        $mapped = [];

        foreach ($serviceCatalog as $serviceSlug => $service) {
            if (! is_array($service)) {
                continue;
            }

            $packages = [];
            foreach ((array) ($service['packages'] ?? []) as $packageCode => $package) {
                if (! is_array($package)) {
                    continue;
                }

                $packages[$packageCode] = [
                    'name' => (string) ($package['name'] ?? ucfirst((string) $packageCode)),
                    'description' => (string) ($package['description'] ?? ''),
                ];
            }

            $mapped[$serviceSlug] = [
                'name' => (string) ($service['name'] ?? ucfirst((string) $serviceSlug)),
                'description' => (string) ($service['description'] ?? ''),
                'packages' => $packages,
            ];
        }

        return $mapped;
    }

    private function discountLink(DiscountCode $discount): string
    {
        $serviceSlug = $discount->service_slug ?: 'social-media-design';

        $params = [
            'serviceSlug' => $serviceSlug,
            'discount' => $discount->code,
        ];

        if (is_string($discount->package_code) && trim($discount->package_code) !== '') {
            $params['package'] = $discount->package_code;
        }

        return route('orders.create', $params);
    }

    /**
     * @return Collection<int, DiscountCode>
     */
    private function activeDiscountCodes(): Collection
    {
        return DiscountCode::query()
            ->where('is_active', true)
            ->where(function ($query): void {
                $query->whereNull('starts_at')
                    ->orWhere('starts_at', '<=', now());
            })
            ->where(function ($query): void {
                $query->whereNull('ends_at')
                    ->orWhere('ends_at', '>=', now());
            })
            ->get();
    }

    /**
     * @param  Collection<int, DiscountCode>  $discountCodes
     */
    private function bestDiscountForPlan(
        Collection $discountCodes,
        string $serviceSlug,
        string $packageCode,
        float $basePrice,
        string $currency,
    ): ?DiscountCode {
        $best = null;
        $bestDiscountAmount = 0.0;

        foreach ($discountCodes as $discountCode) {
            if (! $discountCode->isApplicableTo($serviceSlug, $packageCode)) {
                continue;
            }

            $discountAmount = $discountCode->discountAmountFor($basePrice, $currency);

            if ($discountAmount > $bestDiscountAmount) {
                $best = $discountCode;
                $bestDiscountAmount = $discountAmount;
            }
        }

        return $best;
    }

    /**
     * @return array<string, int>
     */
    private function paidSubscriptionCounts(): array
    {
        return ServiceOrder::query()
            ->where('payment_status', 'paid')
            ->selectRaw('service_slug, package_code, COUNT(*) as aggregate_count')
            ->groupBy('service_slug', 'package_code')
            ->get()
            ->mapWithKeys(fn (ServiceOrder $order): array => [
                $this->pairKey((string) $order->service_slug, (string) $order->package_code) => (int) ($order->aggregate_count ?? 0),
            ])
            ->all();
    }

    private function pairKey(string $serviceSlug, string $packageCode): string
    {
        return $serviceSlug.'::'.$packageCode;
    }

    private function discountSummary(DiscountCode $discount): string
    {
        if (strtolower((string) $discount->discount_type) === 'percentage') {
            return rtrim(rtrim((string) $discount->discount_value, '0'), '.').'% off';
        }

        $currency = strtoupper((string) ($discount->currency ?: config('bellah.invoice.currency', 'NGN')));
        $prefix = $currency === 'NGN' ? 'N' : $currency.' ';

        return $prefix.number_format((float) $discount->discount_value, 2).' off';
    }

    private function planCheckoutLink(SubscriptionPlan $plan, ?string $discountCode = null): string
    {
        $params = [
            'serviceSlug' => $plan->service_slug,
            'package' => $plan->package_code,
        ];

        if ($plan->paystack_plan_code !== null) {
            // Discount codes don't apply once recurring billing takes over Paystack's
            // fixed plan price, so a plan_code checkout intentionally omits `discount`.
            $params['plan'] = $plan->id;
        } elseif (is_string($discountCode) && trim($discountCode) !== '') {
            $params['discount'] = strtoupper(trim($discountCode));
        }

        return route('orders.create', $params);
    }

    private function normalizeSubscriptionPlanFlags(SubscriptionPlan $plan): void
    {
        if (! $plan->show_on_homepage) {
            $plan->is_homepage_featured = false;
        }

        if ($plan->is_homepage_featured) {
            $plan->show_on_homepage = true;
        }
    }

    private function synchronizeExclusivePlanFlags(SubscriptionPlan $plan): void
    {
        if ($plan->is_recommended) {
            SubscriptionPlan::query()
                ->whereKeyNot($plan->id)
                ->where('is_recommended', true)
                ->update(['is_recommended' => false]);
        }
    }

    /**
     * @return array{terms_of_service: string, privacy_policy: string, cookie_policy: string}
     */
    private function policyTermsPayload(): array
    {
        return [
            'terms_of_service' => $this->findPolicyContentByKeyword('terms'),
            'privacy_policy' => $this->findPolicyContentByKeyword('privacy'),
            'cookie_policy' => $this->findPolicyContentByKeyword('cookie'),
        ];
    }

    private function findPolicyContentByKeyword(string $keyword): string
    {
        if (! $this->termsTableExists()) {
            return '';
        }

        $term = Term::query()
            ->whereRaw('LOWER(title) LIKE ?', ['%'.strtolower($keyword).'%'])
            ->latest('updated_at')
            ->first();

        return $term instanceof Term ? (string) $term->content : '';
    }

    /**
     * @param  array<string, mixed>  $termsPayload
     */
    private function savePolicyTerms(array $termsPayload): void
    {
        if (! $this->termsTableExists()) {
            return;
        }

        $map = [
            'terms_of_service' => 'Terms of Service',
            'privacy_policy' => 'Privacy Policy',
            'cookie_policy' => 'Cookie Policy',
        ];

        foreach ($map as $field => $title) {
            $content = trim((string) ($termsPayload[$field] ?? ''));

            Term::query()->updateOrCreate(
                ['title' => $title],
                ['content' => $content],
            );
        }
    }

    private function termsTableExists(): bool
    {
        try {
            return Schema::hasTable('terms');
        } catch (Throwable $exception) {
            Log::warning('Unable to confirm terms table availability.', [
                'message' => $exception->getMessage(),
            ]);

            return false;
        }
    }

}
