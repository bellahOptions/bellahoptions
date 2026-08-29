<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ConvertBankStatementTransactionRequest;
use App\Http\Requests\Admin\UploadBankStatementRequest;
use App\Models\BankStatementImport;
use App\Models\BankStatementTransaction;
use App\Models\Expense;
use App\Models\OtherIncome;
use App\Support\BankStatementParser;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

class BankStatementController extends Controller
{
    /**
     * Keyword => category map used to pre-fill (not auto-decide) the category
     * suggested for an expense row. The admin always confirms/edits it before
     * a row is converted, so a rough heuristic here is fine.
     *
     * @var array<string, string>
     */
    private const CATEGORY_KEYWORDS = [
        'SMS ALERT' => 'Bank & Payment Fees',
        'STAMP DUTY' => 'Bank & Payment Fees',
        'ACCT MAINT' => 'Bank & Payment Fees',
        'MNT CHARGE' => 'Bank & Payment Fees',
        'MNT VAT' => 'Bank & Payment Fees',
        'ELECTRONIC MONEY TRANSFER LEVY' => 'Bank & Payment Fees',
        'OVERDRAWN INTEREST' => 'Bank & Payment Fees',
        'VAT COLLECTION' => 'Bank & Payment Fees',
        'VAT ON' => 'Bank & Payment Fees',
        'SOFT TOKEN' => 'Bank & Payment Fees',
        'PAYSTACK' => 'Hosting & Domains',
        'HOSTING' => 'Hosting & Domains',
        'WHOGOHOST' => 'Hosting & Domains',
        'DOMAIN' => 'Hosting & Domains',
        'FACEBOOK' => 'Marketing & Ads',
        'META ' => 'Marketing & Ads',
        'INSTAGRAM' => 'Marketing & Ads',
        ' ADS' => 'Marketing & Ads',
        'BOOST' => 'Marketing & Ads',
        'CANVA' => 'Software & Tools',
        'SUBSCRIPTION' => 'Software & Tools',
        'FUEL' => 'Travel',
        'TRANSPORT' => 'Travel',
    ];

    public function index(Request $request): Response
    {
        abort_unless((bool) $request->user()?->isSuperAdmin(), 403);

        $imports = BankStatementImport::query()
            ->withCount([
                'transactions as pending_count' => fn ($query) => $query->where('status', BankStatementTransaction::STATUS_PENDING),
                'transactions as converted_count' => fn ($query) => $query->where('status', BankStatementTransaction::STATUS_CONVERTED),
            ])
            ->latest('id')
            ->paginate(15)
            ->through(fn (BankStatementImport $import): array => $this->mapImport($import))
            ->withQueryString();

        return Inertia::render('Admin/Finance/BankImports/Index', [
            'imports' => $imports,
        ]);
    }

    public function store(UploadBankStatementRequest $request): RedirectResponse
    {
        $file = $request->file('statement');

        try {
            $parsed = (new BankStatementParser())->parse($file->getRealPath());
        } catch (RuntimeException $exception) {
            return back()->with('error', $exception->getMessage());
        } catch (\Throwable $exception) {
            Log::error('Bank statement parsing failed unexpectedly.', ['error' => $exception->getMessage()]);

            return back()->with('error', 'Unable to parse this PDF. Please check the file and try again.');
        }

        $meta = $parsed['meta'];
        $rows = $parsed['transactions'];
        $flaggedCount = count(array_filter($rows, fn (array $row): bool => $row['needs_review']));

        $import = DB::transaction(function () use ($request, $file, $meta, $rows, $flaggedCount): BankStatementImport {
            $import = BankStatementImport::create([
                'original_filename' => $file->getClientOriginalName(),
                'account_number' => $meta['account_number'],
                'account_name' => $meta['account_name'],
                'currency' => $meta['currency'],
                'period_start' => $meta['period_start'],
                'period_end' => $meta['period_end'],
                'opening_balance' => $meta['opening_balance'],
                'closing_balance' => $meta['closing_balance'],
                'total_rows' => count($rows),
                'flagged_rows' => $flaggedCount,
                'imported_by' => $request->user()->id,
            ]);

            $now = now();

            foreach (array_chunk($rows, 200) as $chunk) {
                $insert = array_map(fn (array $row): array => [
                    'bank_statement_import_id' => $import->id,
                    'transaction_date' => $row['transaction_date'],
                    'value_date' => $row['value_date'],
                    'channel' => $row['channel'],
                    'description' => $row['description'],
                    'amount' => $row['amount'],
                    'type' => $row['type'],
                    'running_balance' => $row['running_balance'],
                    'needs_review' => $row['needs_review'],
                    'suggested_category' => $row['type'] === 'expense' ? $this->suggestCategory($row['description']) : null,
                    'status' => BankStatementTransaction::STATUS_PENDING,
                    'raw_text' => $row['raw_text'],
                    'created_at' => $now,
                    'updated_at' => $now,
                ], $chunk);

                BankStatementTransaction::query()->insert($insert);
            }

            return $import;
        });

        return redirect()
            ->route('admin.finance.bank-imports.show', $import)
            ->with('success', count($rows).' transactions imported'.($flaggedCount > 0 ? ", {$flaggedCount} flagged for review" : '').'.');
    }

    public function show(Request $request, BankStatementImport $bankStatementImport): Response
    {
        abort_unless((bool) $request->user()?->isSuperAdmin(), 403);

        $status = trim((string) $request->query('status', ''));
        $type = trim((string) $request->query('type', ''));

        $query = $bankStatementImport->transactions();

        if (in_array($status, [BankStatementTransaction::STATUS_PENDING, BankStatementTransaction::STATUS_CONVERTED, BankStatementTransaction::STATUS_IGNORED], true)) {
            $query->where('status', $status);
        }

        if (in_array($type, [BankStatementTransaction::TYPE_INCOME, BankStatementTransaction::TYPE_EXPENSE], true)) {
            $query->where('type', $type);
        }

        $transactions = $query->paginate(30)
            ->through(fn (BankStatementTransaction $transaction): array => $this->mapTransaction($transaction))
            ->withQueryString();

        return Inertia::render('Admin/Finance/BankImports/Show', [
            'import' => $this->mapImport($bankStatementImport->loadCount([
                'transactions as pending_count' => fn ($q) => $q->where('status', BankStatementTransaction::STATUS_PENDING),
                'transactions as converted_count' => fn ($q) => $q->where('status', BankStatementTransaction::STATUS_CONVERTED),
                'transactions as ignored_count' => fn ($q) => $q->where('status', BankStatementTransaction::STATUS_IGNORED),
            ])),
            'filters' => ['status' => $status, 'type' => $type],
            'categories' => FinanceController::EXPENSE_CATEGORIES,
            'transactions' => $transactions,
        ]);
    }

    public function convert(ConvertBankStatementTransactionRequest $request, BankStatementTransaction $bankStatementTransaction): RedirectResponse
    {
        if ($bankStatementTransaction->status !== BankStatementTransaction::STATUS_PENDING) {
            return back()->with('error', 'This transaction has already been processed.');
        }

        $data = $request->validated();
        $import = $bankStatementTransaction->import;
        $description = trim((string) ($data['description'] ?? '')) ?: $bankStatementTransaction->description;

        if ($data['type'] === BankStatementTransaction::TYPE_EXPENSE) {
            $expense = Expense::create([
                'category' => $data['category'],
                'vendor' => null,
                'description' => $description,
                'amount' => $bankStatementTransaction->amount,
                'currency' => $import->currency,
                'expense_date' => $bankStatementTransaction->transaction_date,
                'payment_method' => $bankStatementTransaction->channel,
                'created_by' => $request->user()->id,
            ]);

            $bankStatementTransaction->update([
                'status' => BankStatementTransaction::STATUS_CONVERTED,
                'expense_id' => $expense->id,
            ]);

            return back()->with('success', 'Converted to an expense.');
        }

        $income = OtherIncome::create([
            'source_name' => $data['source_name'],
            'description' => $description,
            'amount' => $bankStatementTransaction->amount,
            'currency' => $import->currency,
            'received_date' => $bankStatementTransaction->transaction_date,
            'reference' => null,
            'created_by' => $request->user()->id,
        ]);

        $bankStatementTransaction->update([
            'status' => BankStatementTransaction::STATUS_CONVERTED,
            'other_income_id' => $income->id,
        ]);

        return back()->with('success', 'Confirmed as income.');
    }

    public function bulkConvert(Request $request, BankStatementImport $bankStatementImport): RedirectResponse
    {
        abort_unless((bool) $request->user()?->isSuperAdmin(), 403);

        $data = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer'],
            'category' => ['nullable', 'string', 'max:80'],
        ]);

        $transactions = $bankStatementImport->transactions()
            ->whereIn('id', $data['ids'])
            ->where('status', BankStatementTransaction::STATUS_PENDING)
            ->get();

        if ($transactions->isEmpty()) {
            return back()->with('error', 'No eligible pending rows were selected.');
        }

        $expenseRows = $transactions->where('type', BankStatementTransaction::TYPE_EXPENSE);
        $incomeRows = $transactions->where('type', BankStatementTransaction::TYPE_INCOME);
        $category = trim((string) ($data['category'] ?? ''));

        if ($expenseRows->isNotEmpty() && $category === '') {
            return back()->with('error', 'Choose a category to convert the selected expense rows.');
        }

        DB::transaction(function () use ($expenseRows, $incomeRows, $category, $request, $bankStatementImport): void {
            foreach ($expenseRows as $transaction) {
                $expense = Expense::create([
                    'category' => $category,
                    'vendor' => null,
                    'description' => $transaction->description,
                    'amount' => $transaction->amount,
                    'currency' => $bankStatementImport->currency,
                    'expense_date' => $transaction->transaction_date,
                    'payment_method' => $transaction->channel,
                    'created_by' => $request->user()->id,
                ]);

                $transaction->update([
                    'status' => BankStatementTransaction::STATUS_CONVERTED,
                    'expense_id' => $expense->id,
                ]);
            }

            foreach ($incomeRows as $transaction) {
                $income = OtherIncome::create([
                    'source_name' => mb_substr($transaction->description, 0, 160),
                    'description' => $transaction->description,
                    'amount' => $transaction->amount,
                    'currency' => $bankStatementImport->currency,
                    'received_date' => $transaction->transaction_date,
                    'created_by' => $request->user()->id,
                ]);

                $transaction->update([
                    'status' => BankStatementTransaction::STATUS_CONVERTED,
                    'other_income_id' => $income->id,
                ]);
            }
        });

        return back()->with('success', $transactions->count().' transactions converted.');
    }

    public function ignore(Request $request, BankStatementTransaction $bankStatementTransaction): RedirectResponse
    {
        abort_unless((bool) $request->user()?->isSuperAdmin(), 403);

        if ($bankStatementTransaction->status !== BankStatementTransaction::STATUS_PENDING) {
            return back()->with('error', 'This transaction has already been processed.');
        }

        $bankStatementTransaction->update(['status' => BankStatementTransaction::STATUS_IGNORED]);

        return back()->with('success', 'Transaction ignored.');
    }

    public function destroy(Request $request, BankStatementImport $bankStatementImport): RedirectResponse
    {
        abort_unless((bool) $request->user()?->isSuperAdmin(), 403);

        $bankStatementImport->delete();

        return redirect()
            ->route('admin.finance.bank-imports.index')
            ->with('success', 'Import deleted. Any converted expenses/income records were kept.');
    }

    private function suggestCategory(string $description): ?string
    {
        $haystack = strtoupper($description);

        foreach (self::CATEGORY_KEYWORDS as $keyword => $category) {
            if (str_contains($haystack, $keyword)) {
                return $category;
            }
        }

        return null;
    }

    /**
     * @return array<string, mixed>
     */
    private function mapImport(BankStatementImport $import): array
    {
        return [
            'id' => $import->id,
            'original_filename' => $import->original_filename,
            'account_number' => $import->account_number,
            'account_name' => $import->account_name,
            'currency' => $import->currency,
            'period_start' => $import->period_start?->toDateString(),
            'period_end' => $import->period_end?->toDateString(),
            'opening_balance' => (string) $import->opening_balance,
            'closing_balance' => (string) $import->closing_balance,
            'total_rows' => $import->total_rows,
            'flagged_rows' => $import->flagged_rows,
            'pending_count' => (int) ($import->pending_count ?? 0),
            'converted_count' => (int) ($import->converted_count ?? 0),
            'ignored_count' => (int) ($import->ignored_count ?? 0),
            'created_at' => $import->created_at?->toDateTimeString(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function mapTransaction(BankStatementTransaction $transaction): array
    {
        return [
            'id' => $transaction->id,
            'transaction_date' => $transaction->transaction_date?->toDateString(),
            'channel' => $transaction->channel,
            'description' => $transaction->description,
            'amount' => (string) $transaction->amount,
            'type' => $transaction->type,
            'running_balance' => (string) $transaction->running_balance,
            'needs_review' => (bool) $transaction->needs_review,
            'suggested_category' => $transaction->suggested_category,
            'status' => $transaction->status,
        ];
    }
}
