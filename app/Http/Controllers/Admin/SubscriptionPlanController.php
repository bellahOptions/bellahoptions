<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreSubscriptionPlanRequest;
use App\Http\Requests\Admin\UpdateSubscriptionPlanRequest;
use App\Models\ServiceOrder;
use App\Models\SubscriptionPlan;
use App\Services\PaystackService;
use App\Support\DiscountCodeCatalog;
use App\Support\ServiceOrderCatalog;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class SubscriptionPlanController extends Controller
{
    public function index(ServiceOrderCatalog $catalog, DiscountCodeCatalog $discountCodeCatalog): Response
    {
        $serviceCatalog = $catalog->all();
        $activeDiscountCodes = $discountCodeCatalog->active();
        $paidSubscriptionCounts = $this->paidSubscriptionCounts();

        return Inertia::render('Admin/SubscriptionPlans/Index', [
            'serviceCatalog' => $catalog->meta(),
            'subscriptionPlans' => SubscriptionPlan::query()
                ->orderByDesc('is_homepage_featured')
                ->orderByDesc('is_recommended')
                ->orderBy('position')
                ->orderBy('id')
                ->get()
                ->map(function (SubscriptionPlan $plan) use ($discountCodeCatalog, $activeDiscountCodes, $paidSubscriptionCounts, $serviceCatalog): array {
                    $serviceName = (string) data_get($serviceCatalog, $plan->service_slug.'.name', ucfirst((string) $plan->service_slug));
                    $packageName = (string) data_get($serviceCatalog, $plan->service_slug.'.packages.'.$plan->package_code.'.name', ucfirst((string) $plan->package_code));
                    $basePrice = round((float) data_get($serviceCatalog, $plan->service_slug.'.packages.'.$plan->package_code.'.price', 0), 2);

                    $bestDiscount = null;
                    if ($basePrice > 0) {
                        $bestDiscount = $discountCodeCatalog->bestFor(
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
                        'active_discount_summary' => $bestDiscount ? $discountCodeCatalog->summary($bestDiscount) : null,
                        'checkout_link' => $this->planCheckoutLink($plan, $bestDiscount?->code),
                    ];
                })
                ->values(),
        ]);
    }

    public function store(StoreSubscriptionPlanRequest $request, ServiceOrderCatalog $catalog, PaystackService $paystackService): RedirectResponse
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

    public function update(UpdateSubscriptionPlanRequest $request, SubscriptionPlan $subscriptionPlan, ServiceOrderCatalog $catalog, PaystackService $paystackService): RedirectResponse
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

    public function syncPaystack(Request $request, SubscriptionPlan $subscriptionPlan, ServiceOrderCatalog $catalog, PaystackService $paystackService): RedirectResponse
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

    public function destroy(Request $request, SubscriptionPlan $subscriptionPlan): RedirectResponse
    {
        abort_unless((bool) $request->user()?->canManageSettings(), 403);

        $subscriptionPlan->delete();

        return back()->with('success', 'Subscription plan deleted successfully.');
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
}
