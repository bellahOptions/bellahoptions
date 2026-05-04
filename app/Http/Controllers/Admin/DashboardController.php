<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AppSetting;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\ServiceOrder;
use App\Models\User;
use App\Models\Waitlist;
use App\Support\ServiceOrderCatalog;
use App\Support\VisitorLocalization;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request, ServiceOrderCatalog $catalog, VisitorLocalization $visitorLocalization): Response
    {
        $user = $request->user();

        if (! $user) {
            abort(403);
        }

        $canManageInvoices = $user->canManageInvoices();
        $canManageSettings = $user->canManageSettings();
        $canManageUsers = $user->canManageUsers();
        $canManageWaitlist = $user->canManageWaitlist();

        $settings = [
            'maintenance_mode' => AppSetting::getBool('maintenance_mode'),
        ];

        $waitlistStats = [
            'total_waitlists' => 0,
            'joined_today' => 0,
            'joined_last_7_days' => 0,
        ];

        $userStats = [
            'total_users' => 0,
            'staff_users' => 0,
            'customer_users' => 0,
            'verified_users' => 0,
        ];

        if (! $user->isStaff()) {
            $localization = $visitorLocalization->resolve($request);
            $currency = (string) ($localization['currency'] ?? 'NGN');

            $clientOrders = ServiceOrder::query()
                ->with([
                    'invoice:id,invoice_number,amount,currency,status,payment_reference,due_date,paid_at',
                    'updates' => static fn ($query) => $query->where('is_public', true)->latest('id'),
                ])
                ->where('user_id', $user->id)
                ->latest('id')
                ->limit(25)
                ->get();

            $clientInvoices = $clientOrders
                ->filter(fn (ServiceOrder $order): bool => $order->invoice !== null)
                ->map(fn (ServiceOrder $order): array => [
                    'id' => $order->invoice?->id,
                    'invoice_number' => $order->invoice?->invoice_number,
                    'title' => $order->service_name.' - '.$order->package_name,
                    'amount' => (string) ($order->invoice?->amount ?? 0),
                    'currency' => $order->invoice?->currency,
                    'status' => $order->invoice?->status,
                    'due_date' => $order->invoice?->due_date?->toDateString(),
                    'paid_at' => $order->invoice?->paid_at?->toDateTimeString(),
                    'payment_reference' => $order->invoice?->payment_reference,
                    'service_order_uuid' => $order->uuid,
                ])
                ->values();

            $clientOrderStats = [
                'total_orders' => $clientOrders->count(),
                'active_orders' => $clientOrders->whereNotIn('order_status', ['completed', 'cancelled'])->count(),
                'completed_orders' => $clientOrders->where('order_status', 'completed')->count(),
                'pending_payments' => $clientOrders->where('payment_status', '!=', 'paid')->count(),
                'paid_orders' => $clientOrders->where('payment_status', 'paid')->count(),
            ];

            return Inertia::render('Dashboard', [
                'isStaff' => false,
                'permissions' => [
                    'can_manage_invoices' => false,
                    'can_manage_settings' => false,
                    'can_manage_users' => false,
                    'can_manage_waitlist' => false,
                ],
                'platformSettings' => $settings,
                'invoices' => [],
                'invoiceStats' => [
                    'total_invoices' => 0,
                    'sent_invoices' => 0,
                    'paid_invoices' => 0,
                    'sent_total' => 0,
                    'paid_total' => 0,
                    'currency_breakdown' => [],
                ],
                'occupations' => [],
                'customers' => [],
                'supportedCurrencies' => ['NGN', 'USD', 'EUR', 'GBP'],
                'defaultCurrency' => config('bellah.invoice.currency', 'NGN'),
                'waitlistStats' => $waitlistStats,
                'userStats' => $userStats,
                'clientOrders' => $clientOrders->map(fn (ServiceOrder $order): array => [
                    'uuid' => $order->uuid,
                    'service_name' => $order->service_name,
                    'package_name' => $order->package_name,
                    'amount' => (string) $order->amount,
                    'currency' => $order->currency,
                    'payment_status' => $order->payment_status,
                    'order_status' => $order->order_status,
                    'progress_percent' => (int) $order->progress_percent,
                    'project_summary' => $order->project_summary,
                    'created_at' => $order->created_at?->toDateTimeString(),
                    'paid_at' => $order->paid_at?->toDateTimeString(),
                    'invoice_number' => $order->invoice?->invoice_number,
                    'updates' => $order->updates->take(5)->map(fn ($update): array => [
                        'status' => $update->status,
                        'progress_percent' => (int) $update->progress_percent,
                        'note' => $update->note,
                        'created_at' => $update->created_at?->toDateTimeString(),
                    ])->values(),
                ])->values(),
                'clientOrderStats' => $clientOrderStats,
                'clientInvoices' => $clientInvoices,
                'orderServices' => $this->localizedDashboardOrderServices($catalog, $currency),
                'orderCurrency' => $currency,
                'orderLocale' => (string) ($localization['locale'] ?? 'en_NG'),
            ]);
        }

        $customers = collect();
        $invoices = collect();
        $stats = [
            'total_invoices' => 0,
            'sent_invoices' => 0,
            'paid_invoices' => 0,
            'sent_total' => 0,
            'paid_total' => 0,
            'currency_breakdown' => [],
        ];

        if ($canManageInvoices) {
            $customers = Customer::query()
                ->latest('id')
                ->limit(300)
                ->get()
                ->map(fn (Customer $customer): array => [
                    'id' => $customer->id,
                    'name' => $customer->name,
                    'first_name' => $customer->first_name,
                    'last_name' => $customer->last_name,
                    'email' => $customer->email,
                    'occupation' => $customer->occupation,
                    'phone' => $customer->phone,
                    'company' => $customer->company,
                    'address' => $customer->address,
                    'notes' => $customer->notes,
                    'created_at' => $customer->created_at?->toDateTimeString(),
                ]);

            $invoices = Invoice::query()
                ->with('creator:id,name')
                ->latest('id')
                ->limit(100)
                ->get()
                ->map(fn (Invoice $invoice): array => [
                    'id' => $invoice->id,
                    'invoice_number' => $invoice->invoice_number,
                    'customer_name' => $invoice->customer_name,
                    'customer_email' => $invoice->customer_email,
                    'customer_occupation' => $invoice->customer_occupation,
                    'title' => $invoice->title,
                    'description' => $invoice->description,
                    'amount' => (string) $invoice->amount,
                    'currency' => $invoice->currency,
                    'status' => $invoice->status,
                    'due_date' => $invoice->due_date?->toDateString(),
                    'issued_at' => $invoice->issued_at?->toDateTimeString(),
                    'paid_at' => $invoice->paid_at?->toDateTimeString(),
                    'payment_reference' => $invoice->payment_reference,
                    'automatic_reminders_sent' => (int) $invoice->automatic_reminders_sent,
                    'last_automatic_reminder_sent_at' => $invoice->last_automatic_reminder_sent_at?->toDateTimeString(),
                    'last_manual_reminder_sent_at' => $invoice->last_manual_reminder_sent_at?->toDateTimeString(),
                    'creator' => $invoice->creator?->name,
                    'created_at' => $invoice->created_at?->toDateTimeString(),
                ]);

            $stats = [
                'total_invoices' => Invoice::count(),
                'sent_invoices' => Invoice::where('status', 'sent')->count(),
                'paid_invoices' => Invoice::where('status', 'paid')->count(),
                'sent_total' => Invoice::where('status', 'sent')->sum('amount'),
                'paid_total' => Invoice::where('status', 'paid')->sum('amount'),
                'currency_breakdown' => Invoice::query()
                    ->select('currency', DB::raw('COUNT(*) as count'))
                    ->groupBy('currency')
                    ->pluck('count', 'currency')
                    ->all(),
            ];
        }

        if ($canManageUsers) {
            $userStats = [
                'total_users' => User::count(),
                'staff_users' => User::query()
                    ->whereIn('role', [User::ROLE_SUPER_ADMIN, User::ROLE_CUSTOMER_REP, 'admin', 'staff'])
                    ->count(),
                'customer_users' => User::query()
                    ->where(function ($query): void {
                        $query->whereNull('role')->orWhere('role', 'user');
                    })
                    ->count(),
                'verified_users' => User::whereNotNull('email_verified_at')->count(),
            ];
        }

        if ($canManageWaitlist) {
            $waitlistStats = [
                'total_waitlists' => Waitlist::count(),
                'joined_today' => Waitlist::whereDate('created_at', now()->toDateString())->count(),
                'joined_last_7_days' => Waitlist::where('created_at', '>=', now()->subDays(7)->startOfDay())->count(),
            ];
        }

        return Inertia::render('Dashboard', [
            'isStaff' => true,
            'permissions' => [
                'can_manage_invoices' => $canManageInvoices,
                'can_manage_settings' => $canManageSettings,
                'can_manage_users' => $canManageUsers,
                'can_manage_waitlist' => $canManageWaitlist,
            ],
            'platformSettings' => $settings,
            'invoices' => $invoices,
            'invoiceStats' => $stats,
            'occupations' => config('occupations.list', []),
            'customers' => $customers,
            'supportedCurrencies' => ['NGN', 'USD', 'EUR', 'GBP'],
            'defaultCurrency' => config('bellah.invoice.currency', 'NGN'),
            'waitlistStats' => $waitlistStats,
            'userStats' => $userStats,
        ]);
    }

    /**
     * @return array<string, array<string, mixed>>
     */
    private function localizedDashboardOrderServices(ServiceOrderCatalog $catalog, string $currency): array
    {
        $serviceSlugs = [
            'social-media-design',
            'web-design',
            'graphic-design',
            'special-service',
        ];

        $services = [];
        foreach ($serviceSlugs as $slug) {
            $service = $catalog->service($slug);
            if (! is_array($service)) {
                continue;
            }

            $packages = [];
            foreach ((array) ($service['packages'] ?? []) as $packageCode => $package) {
                if (! is_string($packageCode) || ! is_array($package)) {
                    continue;
                }

                $basePriceNgn = round((float) ($package['price'] ?? 0), 2);
                $localizedPrice = app(VisitorLocalization::class)->convertFromNgn($basePriceNgn, $currency);

                $packages[$packageCode] = [
                    ...$package,
                    'price' => $localizedPrice,
                    'base_price_ngn' => $basePriceNgn,
                ];
            }

            $services[$slug] = [
                'name' => (string) ($service['name'] ?? ucfirst(str_replace('-', ' ', $slug))),
                'description' => (string) ($service['description'] ?? ''),
                'packages' => $packages,
            ];
        }

        return $services;
    }
}
