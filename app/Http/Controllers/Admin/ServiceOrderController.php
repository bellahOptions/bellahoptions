<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ServiceOrder;
use App\Models\ServiceOrderUpdate;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ServiceOrderController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless((bool) $request->user()?->canManageInvoices(), 403);

        $search = trim((string) $request->query('search', ''));
        $orderStatus = trim((string) $request->query('order_status', ''));
        $paymentStatus = trim((string) $request->query('payment_status', ''));
        $serviceSlug = trim((string) $request->query('service_slug', ''));

        $query = ServiceOrder::query()
            ->with('customer:id,name,email')
            ->latest('id');

        if ($search !== '') {
            $query->where(function ($searchQuery) use ($search): void {
                $like = '%'.$search.'%';

                $searchQuery
                    ->where('order_code', 'like', $like)
                    ->orWhere('full_name', 'like', $like)
                    ->orWhere('email', 'like', $like)
                    ->orWhere('business_name', 'like', $like)
                    ->orWhere('service_name', 'like', $like);
            });
        }

        if ($orderStatus !== '') {
            $query->where('order_status', $orderStatus);
        }

        if ($paymentStatus !== '') {
            $query->where('payment_status', $paymentStatus);
        }

        if ($serviceSlug !== '') {
            $query->where('service_slug', $serviceSlug);
        }

        $orders = $query
            ->paginate(20)
            ->through(fn (ServiceOrder $order): array => $this->mapOrder($order))
            ->withQueryString();

        return Inertia::render('Admin/ServiceOrders/Index', [
            'filters' => [
                'search' => $search,
                'order_status' => $orderStatus,
                'payment_status' => $paymentStatus,
                'service_slug' => $serviceSlug,
            ],
            'serviceSlugs' => array_values(array_keys(config('service_orders.services', []))),
            'stats' => [
                'total_orders' => ServiceOrder::count(),
                'awaiting_payment' => ServiceOrder::where('payment_status', 'pending')->count(),
                'in_progress' => ServiceOrder::whereIn('order_status', ['queued', 'in_progress', 'in_review'])->count(),
                'completed' => ServiceOrder::where('order_status', 'completed')->count(),
                'paid_total' => ServiceOrder::where('payment_status', 'paid')->sum('amount'),
            ],
            'orders' => $orders,
        ]);
    }

    public function show(Request $request, ServiceOrder $serviceOrder): Response
    {
        abort_unless((bool) $request->user()?->canManageInvoices(), 403);

        $serviceOrder->load([
            'invoice',
            'customer',
            'user:id,name,email',
            'discountCode:id,code',
            'updates.creator:id,name',
        ]);

        return Inertia::render('Admin/ServiceOrders/Show', [
            'order' => $this->mapOrder($serviceOrder, true),
        ]);
    }

    private function mapOrder(ServiceOrder $order, bool $withRelations = false): array
    {
        return [
            'id' => $order->id,
            'order_code' => $order->order_code,
            'service_slug' => $order->service_slug,
            'service_name' => $order->service_name,
            'package_code' => $order->package_code,
            'package_name' => $order->package_name,
            'currency' => strtoupper((string) $order->currency),
            'base_amount' => (string) ($order->base_amount ?? $order->amount),
            'discount_code' => $order->discount_code,
            'discount_amount' => (string) ($order->discount_amount ?? 0),
            'amount' => (string) $order->amount,
            'payment_provider' => $order->payment_provider,
            'payment_status' => (string) $order->payment_status,
            'order_status' => (string) $order->order_status,
            'progress_percent' => (int) $order->progress_percent,
            'paystack_reference' => $order->paystack_reference,
            'paid_at' => $order->paid_at?->toDateTimeString(),
            'full_name' => $order->full_name,
            'email' => $order->email,
            'phone' => $order->phone,
            'business_name' => $order->business_name,
            'position' => $order->position,
            'business_website' => $order->business_website,
            'project_summary' => $order->project_summary,
            'project_goals' => $order->project_goals,
            'target_audience' => $order->target_audience,
            'preferred_style' => $order->preferred_style,
            'deliverables' => $order->deliverables,
            'additional_details' => $order->additional_details,
            'created_at' => $order->created_at?->toDateTimeString(),
            'updated_at' => $order->updated_at?->toDateTimeString(),
            'customer' => $order->relationLoaded('customer') && $order->customer ? [
                'id' => $order->customer->id,
                'name' => $order->customer->name,
                'email' => $order->customer->email,
            ] : null,
            'user' => $withRelations && $order->relationLoaded('user') && $order->user ? [
                'id' => $order->user->id,
                'name' => $order->user->name,
                'email' => $order->user->email,
            ] : null,
            'invoice' => $withRelations && $order->relationLoaded('invoice') && $order->invoice ? [
                'id' => $order->invoice->id,
                'invoice_number' => $order->invoice->invoice_number,
                'amount' => (string) $order->invoice->amount,
                'currency' => strtoupper((string) $order->invoice->currency),
                'status' => (string) $order->invoice->status,
                'payment_reference' => $order->invoice->payment_reference,
            ] : null,
            'discount_code_details' => $withRelations && $order->relationLoaded('discountCode') && $order->discountCode ? [
                'code' => $order->discountCode->code,
            ] : null,
            'brief_payload' => $withRelations ? (array) $order->brief_payload : null,
            'updates' => $withRelations && $order->relationLoaded('updates')
                ? $order->updates->map(fn (ServiceOrderUpdate $update): array => [
                    'id' => $update->id,
                    'status' => (string) $update->status,
                    'progress_percent' => (int) $update->progress_percent,
                    'note' => $update->note,
                    'is_public' => (bool) $update->is_public,
                    'creator' => $update->creator?->name,
                    'created_at' => $update->created_at?->toDateTimeString(),
                ])->values()
                : [],
        ];
    }
}
