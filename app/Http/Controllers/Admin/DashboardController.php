<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AppSetting;
use App\Models\Customer;
use App\Models\Invoice;
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

        $settings = [
            'maintenance_mode' => AppSetting::getBool('maintenance_mode'),
            'coming_soon_mode' => AppSetting::getBool('coming_soon_mode'),
        ];

        if (! $user->isStaff()) {
            return Inertia::render('Dashboard', [
                'isStaff' => false,
                'permissions' => [
                    'can_manage_invoices' => false,
                    'can_manage_settings' => false,
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

        return Inertia::render('Dashboard', [
            'isStaff' => true,
            'permissions' => [
                'can_manage_invoices' => $canManageInvoices,
                'can_manage_settings' => $canManageSettings,
            ],
            'platformSettings' => $settings,
            'invoices' => $invoices,
            'invoiceStats' => $stats,
            'occupations' => config('occupations.list', []),
            'customers' => $customers,
            'supportedCurrencies' => ['NGN', 'USD', 'EUR', 'GBP'],
            'defaultCurrency' => config('bellah.invoice.currency', 'NGN'),
        ]);
    }
}
