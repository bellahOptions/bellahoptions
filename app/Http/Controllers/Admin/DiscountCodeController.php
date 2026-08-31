<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreDiscountCodeRequest;
use App\Http\Requests\Admin\ToggleDiscountCodeStatusRequest;
use App\Models\DiscountCode;
use App\Support\DiscountCodeCatalog;
use App\Support\ServiceOrderCatalog;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DiscountCodeController extends Controller
{
    public function index(ServiceOrderCatalog $catalog): Response
    {
        return Inertia::render('Admin/DiscountCodes/Index', [
            'serviceCatalog' => $catalog->meta(),
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
                    'discount_link' => app(DiscountCodeCatalog::class)->link($discount),
                ])
                ->values(),
        ]);
    }

    public function store(StoreDiscountCodeRequest $request): RedirectResponse
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

    public function updateStatus(ToggleDiscountCodeStatusRequest $request, DiscountCode $discountCode): RedirectResponse
    {
        $discountCode->update([
            'is_active' => $request->boolean('is_active'),
        ]);

        return back()->with('success', 'Discount code status updated.');
    }

    public function destroy(Request $request, DiscountCode $discountCode): RedirectResponse
    {
        abort_unless((bool) $request->user()?->canManageSettings(), 403);

        $discountCode->delete();

        return back()->with('success', 'Discount code deleted successfully.');
    }
}
