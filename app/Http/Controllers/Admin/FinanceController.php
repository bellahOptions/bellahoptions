<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\MarkPayoutPaidRequest;
use App\Http\Requests\Admin\StoreExpenseRequest;
use App\Http\Requests\Admin\StorePayoutRequest;
use App\Models\Expense;
use App\Models\IncomeSplit;
use App\Models\Invoice;
use App\Models\OtherIncome;
use App\Models\Payout;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class FinanceController extends Controller
{
    public const CURRENCIES = ['NGN', 'USD', 'EUR', 'GBP'];

    public const EXPENSE_CATEGORIES = [
        'Software & Tools',
        'Marketing & Ads',
        'Contractor Fees',
        'Office & Utilities',
        'Hosting & Domains',
        'Bank & Payment Fees',
        'Travel',
        'Equipment',
        'Other',
    ];

    public function overview(Request $request): Response
    {
        abort_unless((bool) $request->user()?->isSuperAdmin(), 403);

        $now = now();
        $monthStart = $now->copy()->startOfMonth();
        $lastMonthStart = $now->copy()->subMonthNoOverflow()->startOfMonth();
        $lastMonthEnd = $now->copy()->subMonthNoOverflow()->endOfMonth();

        $totalRevenue = (float) Invoice::query()->where('status', 'paid')->sum('amount')
            + (float) OtherIncome::query()->sum('amount');
        $totalExpenses = (float) Expense::query()->sum('amount');
        $totalPayouts = (float) Payout::query()->where('status', Payout::STATUS_PAID)->sum('amount');

        $monthRevenue = (float) Invoice::query()->where('status', 'paid')->where('paid_at', '>=', $monthStart)->sum('amount')
            + (float) OtherIncome::query()->where('received_date', '>=', $monthStart->toDateString())->sum('amount');
        $monthExpenses = (float) Expense::query()->where('expense_date', '>=', $monthStart->toDateString())->sum('amount');
        $monthPayouts = (float) Payout::query()->where('status', Payout::STATUS_PAID)->where('paid_at', '>=', $monthStart)->sum('amount');

        $lastMonthRevenue = (float) Invoice::query()->where('status', 'paid')->whereBetween('paid_at', [$lastMonthStart, $lastMonthEnd])->sum('amount')
            + (float) OtherIncome::query()->whereBetween('received_date', [$lastMonthStart->toDateString(), $lastMonthEnd->toDateString()])->sum('amount');
        $lastMonthExpenses = (float) Expense::query()->whereBetween('expense_date', [$lastMonthStart->toDateString(), $lastMonthEnd->toDateString()])->sum('amount');
        $lastMonthPayouts = (float) Payout::query()->where('status', Payout::STATUS_PAID)->whereBetween('paid_at', [$lastMonthStart, $lastMonthEnd])->sum('amount');

        $pendingPayouts = (float) Payout::query()->where('status', Payout::STATUS_PENDING)->sum('amount');
        $pendingPayoutsCount = Payout::query()->where('status', Payout::STATUS_PENDING)->count();

        $allRows = $this->mergedLedgerRows(null, null, null, null);
        $recentTransactions = $allRows->take(8)->map(fn (array $row): array => $this->formatLedgerRow($row))->values()->all();

        return Inertia::render('Admin/Finance/Overview', [
            'kpis' => [
                'total_revenue' => $totalRevenue,
                'total_expenses' => $totalExpenses,
                'total_payouts' => $totalPayouts,
                'net_profit' => $totalRevenue - $totalExpenses - $totalPayouts,
                'month_revenue' => $monthRevenue,
                'month_expenses' => $monthExpenses,
                'month_payouts' => $monthPayouts,
                'month_net_profit' => $monthRevenue - $monthExpenses - $monthPayouts,
                'revenue_change_percent' => $this->percentChange($monthRevenue, $lastMonthRevenue),
                'expenses_change_percent' => $this->percentChange($monthExpenses, $lastMonthExpenses),
                'payouts_change_percent' => $this->percentChange($monthPayouts, $lastMonthPayouts),
                'pending_payouts' => $pendingPayouts,
                'pending_payouts_count' => $pendingPayoutsCount,
            ],
            'monthlySeries' => $this->buildMonthlySeries(),
            'recentTransactions' => $recentTransactions,
        ]);
    }

    public function incomeSplits(Request $request): Response
    {
        abort_unless((bool) $request->user()?->isSuperAdmin(), 403);

        $splits = IncomeSplit::query()
            ->with(['invoice:id,invoice_number,title,paid_at', 'partner:id,name', 'owner:id,name'])
            ->latest('id')
            ->paginate(20)
            ->through(fn (IncomeSplit $split): array => [
                'id' => $split->id,
                'invoice_number' => $split->invoice?->invoice_number,
                'invoice_title' => $split->invoice?->title,
                'paid_at' => $split->invoice?->paid_at?->toDateString(),
                'currency' => $split->currency,
                'total_amount' => (string) $split->total_amount,
                'ads_savings_amount' => (string) $split->ads_savings_amount,
                'data_savings_amount' => (string) $split->data_savings_amount,
                'ai_savings_amount' => (string) $split->ai_savings_amount,
                'partner_name' => $split->partner?->name,
                'partner_amount' => (string) $split->partner_amount,
                'partner_percent' => (string) $split->partner_percent,
                'partner_notified' => $split->partner_notified_at !== null,
                'owner_name' => $split->owner?->name,
                'owner_amount' => (string) $split->owner_amount,
                'owner_percent' => (string) $split->owner_percent,
            ])
            ->withQueryString();

        return Inertia::render('Admin/Finance/IncomeSplits', [
            'totals' => [
                'grand_total' => (string) IncomeSplit::sum('total_amount'),
                'ads_savings' => (string) IncomeSplit::sum('ads_savings_amount'),
                'data_savings' => (string) IncomeSplit::sum('data_savings_amount'),
                'ai_savings' => (string) IncomeSplit::sum('ai_savings_amount'),
                'partner_total' => (string) IncomeSplit::sum('partner_amount'),
                'owner_total' => (string) IncomeSplit::sum('owner_amount'),
                'invoice_count' => IncomeSplit::count(),
            ],
            'formula' => config('finance.income_split'),
            'splits' => $splits,
        ]);
    }

    public function ledger(Request $request): Response
    {
        abort_unless((bool) $request->user()?->isSuperAdmin(), 403);

        $filters = $this->resolveLedgerFilters($request);

        $rows = $this->mergedLedgerRows($filters['type'], $filters['search'], $filters['date_from'], $filters['date_to']);

        $page = max(1, (int) $request->query('page', 1));
        $perPage = 20;
        $paginated = new LengthAwarePaginator(
            $rows->forPage($page, $perPage)->map(fn (array $row): array => $this->formatLedgerRow($row))->values(),
            $rows->count(),
            $perPage,
            $page,
            ['path' => $request->url(), 'query' => $request->query()],
        );

        return Inertia::render('Admin/Finance/Ledger', [
            'filters' => $filters,
            'transactions' => $paginated,
            'totals' => [
                'income' => $rows->where('type', 'income')->sum('amount'),
                'expense' => abs($rows->where('type', 'expense')->sum('amount')),
                'payout' => abs($rows->where('type', 'payout')->sum('amount')),
                'net' => $rows->sum('amount'),
            ],
        ]);
    }

    public function exportLedger(Request $request): StreamedResponse
    {
        abort_unless((bool) $request->user()?->isSuperAdmin(), 403);

        $filters = $this->resolveLedgerFilters($request);
        $rows = $this->mergedLedgerRows($filters['type'], $filters['search'], $filters['date_from'], $filters['date_to']);

        $filename = 'bellah-options-transactions-'.now()->format('Y-m-d-His').'.csv';

        return response()->streamDownload(function () use ($rows): void {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['Date', 'Type', 'Description', 'Reference', 'Currency', 'Amount']);

            foreach ($rows as $row) {
                fputcsv($handle, [
                    $row['date']->toDateString(),
                    ucfirst($row['type']),
                    $row['description'],
                    $row['reference'],
                    $row['currency'],
                    number_format((float) $row['amount'], 2, '.', ''),
                ]);
            }

            fclose($handle);
        }, $filename, ['Content-Type' => 'text/csv']);
    }

    public function expensesIndex(Request $request): Response
    {
        abort_unless((bool) $request->user()?->isSuperAdmin(), 403);

        $search = trim((string) $request->query('search', ''));
        $category = trim((string) $request->query('category', ''));

        $query = Expense::query()->with('creator:id,name')->latest('expense_date')->latest('id');

        if ($search !== '') {
            $query->where(function ($searchQuery) use ($search): void {
                $like = '%'.$search.'%';
                $searchQuery->where('vendor', 'like', $like)
                    ->orWhere('description', 'like', $like)
                    ->orWhere('category', 'like', $like);
            });
        }

        if ($category !== '') {
            $query->where('category', $category);
        }

        $monthStart = now()->startOfMonth();

        $expenses = $query->paginate(20)
            ->through(fn (Expense $expense): array => $this->mapExpense($expense))
            ->withQueryString();

        return Inertia::render('Admin/Finance/Expenses', [
            'filters' => [
                'search' => $search,
                'category' => $category,
            ],
            'categories' => self::EXPENSE_CATEGORIES,
            'currencies' => self::CURRENCIES,
            'permissions' => [
                'can_delete' => (bool) $request->user()?->isSuperAdmin(),
            ],
            'stats' => [
                'total_all_time' => (float) Expense::query()->sum('amount'),
                'total_this_month' => (float) Expense::query()->where('expense_date', '>=', $monthStart->toDateString())->sum('amount'),
                'count_this_month' => Expense::query()->where('expense_date', '>=', $monthStart->toDateString())->count(),
            ],
            'expenses' => $expenses,
        ]);
    }

    public function storeExpense(StoreExpenseRequest $request): RedirectResponse
    {
        $data = $request->validated();

        Expense::create([
            ...$data,
            'currency' => strtoupper($data['currency']),
            'created_by' => $request->user()->id,
        ]);

        return back()->with('success', 'Expense recorded.');
    }

    public function destroyExpense(Request $request, Expense $expense): RedirectResponse
    {
        abort_unless((bool) $request->user()?->isSuperAdmin(), 403);

        $expense->delete();

        return back()->with('success', 'Expense deleted.');
    }

    public function payoutsIndex(Request $request): Response
    {
        abort_unless((bool) $request->user()?->isSuperAdmin(), 403);

        $search = trim((string) $request->query('search', ''));
        $status = trim((string) $request->query('status', ''));

        $query = Payout::query()->with(['payeeUser:id,name,email', 'serviceOrder:id,order_code'])->latest('id');

        if ($search !== '') {
            $query->where(function ($searchQuery) use ($search): void {
                $like = '%'.$search.'%';
                $searchQuery->where('payee_name', 'like', $like)
                    ->orWhere('payee_email', 'like', $like)
                    ->orWhere('purpose', 'like', $like);
            });
        }

        if (in_array($status, [Payout::STATUS_PENDING, Payout::STATUS_PAID, Payout::STATUS_CANCELLED], true)) {
            $query->where('status', $status);
        }

        $payouts = $query->paginate(20)
            ->through(fn (Payout $payout): array => $this->mapPayout($payout))
            ->withQueryString();

        return Inertia::render('Admin/Finance/Payouts', [
            'filters' => [
                'search' => $search,
                'status' => $status,
            ],
            'currencies' => self::CURRENCIES,
            'permissions' => [
                'can_delete' => (bool) $request->user()?->isSuperAdmin(),
            ],
            'stats' => [
                'total_paid' => (float) Payout::query()->where('status', Payout::STATUS_PAID)->sum('amount'),
                'total_pending' => (float) Payout::query()->where('status', Payout::STATUS_PENDING)->sum('amount'),
                'pending_count' => Payout::query()->where('status', Payout::STATUS_PENDING)->count(),
            ],
            'payouts' => $payouts,
        ]);
    }

    public function storePayout(StorePayoutRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $payeeName = trim((string) ($data['payee_name'] ?? ''));

        if ($payeeName === '' && ! empty($data['payee_user_id'])) {
            $payeeUser = User::query()->find($data['payee_user_id']);
            $payeeName = (string) ($payeeUser?->name ?? 'Team member');
        }

        Payout::create([
            ...$data,
            'payee_name' => $payeeName,
            'currency' => strtoupper($data['currency']),
            'status' => Payout::STATUS_PENDING,
            'created_by' => $request->user()->id,
        ]);

        return back()->with('success', 'Payout created.');
    }

    public function markPayoutPaid(MarkPayoutPaidRequest $request, Payout $payout): RedirectResponse
    {
        if ($payout->status === Payout::STATUS_PAID) {
            return back()->with('success', 'Payout is already marked as paid.');
        }

        $payout->update([
            'status' => Payout::STATUS_PAID,
            'paid_at' => now(),
            'payment_reference' => $request->validated('payment_reference'),
        ]);

        return back()->with('success', "Payout to {$payout->payee_name} marked as paid.");
    }

    public function destroyPayout(Request $request, Payout $payout): RedirectResponse
    {
        abort_unless((bool) $request->user()?->isSuperAdmin(), 403);

        $payout->delete();

        return back()->with('success', 'Payout deleted.');
    }

    /**
     * @return array{type: string, search: string, date_from: string, date_to: string}
     */
    private function resolveLedgerFilters(Request $request): array
    {
        return [
            'type' => trim((string) $request->query('type', '')),
            'search' => trim((string) $request->query('search', '')),
            'date_from' => trim((string) $request->query('date_from', '')),
            'date_to' => trim((string) $request->query('date_to', '')),
        ];
    }

    /**
     * Build the unified income/expense/payout feed sorted by date (most recent first).
     */
    private function mergedLedgerRows(?string $type, ?string $search, ?string $dateFrom, ?string $dateTo): Collection
    {
        $search = trim((string) $search) !== '' ? trim((string) $search) : null;
        $from = $dateFrom !== null && $dateFrom !== '' ? Carbon::parse($dateFrom)->startOfDay() : null;
        $to = $dateTo !== null && $dateTo !== '' ? Carbon::parse($dateTo)->endOfDay() : null;

        $rows = collect();

        if ($type === null || $type === '' || $type === 'income') {
            $invoiceQuery = Invoice::query()->where('status', 'paid');

            if ($from) {
                $invoiceQuery->where('paid_at', '>=', $from);
            }
            if ($to) {
                $invoiceQuery->where('paid_at', '<=', $to);
            }
            if ($search) {
                $like = '%'.$search.'%';
                $invoiceQuery->where(function ($query) use ($like): void {
                    $query->where('invoice_number', 'like', $like)
                        ->orWhere('customer_name', 'like', $like)
                        ->orWhere('title', 'like', $like);
                });
            }

            $rows = $rows->concat($invoiceQuery->get()->map(fn (Invoice $invoice): array => [
                'type' => 'income',
                'date' => $invoice->paid_at ?? $invoice->created_at,
                'description' => trim($invoice->title !== '' ? $invoice->title : 'Invoice payment')." — {$invoice->customer_name}",
                'reference' => $invoice->invoice_number,
                'currency' => strtoupper((string) $invoice->currency),
                'amount' => (float) $invoice->amount,
            ]));

            $otherIncomeQuery = OtherIncome::query();

            if ($from) {
                $otherIncomeQuery->where('received_date', '>=', $from->toDateString());
            }
            if ($to) {
                $otherIncomeQuery->where('received_date', '<=', $to->toDateString());
            }
            if ($search) {
                $like = '%'.$search.'%';
                $otherIncomeQuery->where(function ($query) use ($like): void {
                    $query->where('source_name', 'like', $like)
                        ->orWhere('description', 'like', $like)
                        ->orWhere('reference', 'like', $like);
                });
            }

            $rows = $rows->concat($otherIncomeQuery->get()->map(fn (OtherIncome $income): array => [
                'type' => 'income',
                'date' => $income->received_date,
                'description' => $income->source_name.($income->description ? " — {$income->description}" : ''),
                'reference' => $income->reference ?: 'INC-'.$income->id,
                'currency' => strtoupper((string) $income->currency),
                'amount' => (float) $income->amount,
            ]));
        }

        if ($type === null || $type === '' || $type === 'expense') {
            $expenseQuery = Expense::query();

            if ($from) {
                $expenseQuery->where('expense_date', '>=', $from->toDateString());
            }
            if ($to) {
                $expenseQuery->where('expense_date', '<=', $to->toDateString());
            }
            if ($search) {
                $like = '%'.$search.'%';
                $expenseQuery->where(function ($query) use ($like): void {
                    $query->where('vendor', 'like', $like)
                        ->orWhere('description', 'like', $like)
                        ->orWhere('category', 'like', $like);
                });
            }

            $rows = $rows->concat($expenseQuery->get()->map(fn (Expense $expense): array => [
                'type' => 'expense',
                'date' => $expense->expense_date,
                'description' => $expense->category.($expense->vendor ? " — {$expense->vendor}" : ''),
                'reference' => 'EXP-'.$expense->id,
                'currency' => strtoupper((string) $expense->currency),
                'amount' => -1 * (float) $expense->amount,
            ]));
        }

        if ($type === null || $type === '' || $type === 'payout') {
            $payoutQuery = Payout::query()->where('status', Payout::STATUS_PAID);

            if ($from) {
                $payoutQuery->where('paid_at', '>=', $from);
            }
            if ($to) {
                $payoutQuery->where('paid_at', '<=', $to);
            }
            if ($search) {
                $like = '%'.$search.'%';
                $payoutQuery->where(function ($query) use ($like): void {
                    $query->where('payee_name', 'like', $like)
                        ->orWhere('purpose', 'like', $like);
                });
            }

            $rows = $rows->concat($payoutQuery->get()->map(fn (Payout $payout): array => [
                'type' => 'payout',
                'date' => $payout->paid_at ?? $payout->created_at,
                'description' => $payout->purpose." — {$payout->payee_name}",
                'reference' => 'PYT-'.$payout->id,
                'currency' => strtoupper((string) $payout->currency),
                'amount' => -1 * (float) $payout->amount,
            ]));
        }

        return $rows->sortByDesc(fn (array $row) => $row['date']?->timestamp ?? 0)->values();
    }

    /**
     * @param  array{type: string, date: \Illuminate\Support\Carbon|null, description: string, reference: string, currency: string, amount: float}  $row
     * @return array<string, mixed>
     */
    private function formatLedgerRow(array $row): array
    {
        return [
            'type' => $row['type'],
            'date' => $row['date']?->toDateString(),
            'description' => $row['description'],
            'reference' => $row['reference'],
            'currency' => $row['currency'],
            'amount' => (float) $row['amount'],
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function buildMonthlySeries(): array
    {
        $series = [];

        for ($offset = 11; $offset >= 0; $offset--) {
            $pointMonth = now()->subMonthsNoOverflow($offset);
            $start = $pointMonth->copy()->startOfMonth();
            $end = $pointMonth->copy()->endOfMonth();

            $revenue = (float) Invoice::query()->where('status', 'paid')->whereBetween('paid_at', [$start, $end])->sum('amount');
            $expenses = (float) Expense::query()->whereBetween('expense_date', [$start->toDateString(), $end->toDateString()])->sum('amount');
            $payouts = (float) Payout::query()->where('status', Payout::STATUS_PAID)->whereBetween('paid_at', [$start, $end])->sum('amount');

            $series[] = [
                'month' => $pointMonth->format('M Y'),
                'revenue' => $revenue,
                'expenses' => $expenses,
                'payouts' => $payouts,
                'net' => $revenue - $expenses - $payouts,
            ];
        }

        return $series;
    }

    private function percentChange(float $current, float $previous): float
    {
        if ($previous > 0) {
            return round((($current - $previous) / $previous) * 100, 2);
        }

        return $current > 0 ? 100.0 : 0.0;
    }

    /**
     * @return array<string, mixed>
     */
    private function mapExpense(Expense $expense): array
    {
        return [
            'id' => $expense->id,
            'category' => $expense->category,
            'vendor' => $expense->vendor,
            'description' => $expense->description,
            'amount' => (string) $expense->amount,
            'currency' => $expense->currency,
            'expense_date' => $expense->expense_date?->toDateString(),
            'payment_method' => $expense->payment_method,
            'creator' => $expense->creator?->name,
            'created_at' => $expense->created_at?->toDateTimeString(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function mapPayout(Payout $payout): array
    {
        return [
            'id' => $payout->id,
            'payee_name' => $payout->payee_name,
            'payee_email' => $payout->payee_email,
            'payee_user' => $payout->payeeUser?->name,
            'amount' => (string) $payout->amount,
            'currency' => $payout->currency,
            'purpose' => $payout->purpose,
            'service_order_code' => $payout->serviceOrder?->order_code,
            'status' => $payout->status,
            'payment_reference' => $payout->payment_reference,
            'paid_at' => $payout->paid_at?->toDateTimeString(),
            'created_at' => $payout->created_at?->toDateTimeString(),
        ];
    }
}
