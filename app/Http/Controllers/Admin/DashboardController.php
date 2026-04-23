<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AppSetting;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\User;
use App\Models\Waitlist;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request): Response
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
            'coming_soon_mode' => AppSetting::getBool('coming_soon_mode'),
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
}
