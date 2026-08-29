import { MobileCard, MobileCardActions, MobileCardHeader, MobileCardList, MobileCardRow } from '@/Components/ui/mobile-cards';
import { StatCard, StatGrid } from '@/Components/ui/stat-card';
import FinanceTabs from '@/Components/finance/FinanceTabs';
import { useDebouncedFilterSync } from '@/hooks/use-debounced-filter-sync';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { CalendarDays, Hash, Loader2, Plus, RotateCcw, Search, Trash2, Wallet } from 'lucide-react';
import { useState } from 'react';

export default function FinanceExpenses({ expenses, stats = {}, filters = {}, categories = [], currencies = [], permissions = {} }) {
    const { flash } = usePage().props;
    const [search, setSearch] = useState(filters.search || '');
    const [category, setCategory] = useState(filters.category || '');
    const [showForm, setShowForm] = useState(false);
    const canDelete = Boolean(permissions?.can_delete);

    const isSyncing = useDebouncedFilterSync('admin.finance.expenses.index', { search, category });
    const hasActiveFilters = Boolean(search || category);

    const resetFilters = () => {
        setSearch('');
        setCategory('');
    };

    const form = useForm({
        category: categories[0] || '',
        vendor: '',
        description: '',
        amount: '',
        currency: 'NGN',
        expense_date: new Date().toISOString().slice(0, 10),
        payment_method: '',
    });

    const submitExpense = (event) => {
        event.preventDefault();

        form.post(route('admin.finance.expenses.store'), {
            preserveScroll: true,
            onSuccess: () => {
                form.reset('vendor', 'description', 'amount', 'payment_method');
                setShowForm(false);
            },
        });
    };

    const deleteExpense = (expenseId, label) => {
        if (!window.confirm(`Delete expense "${label}"? This cannot be undone.`)) {
            return;
        }

        router.delete(route('admin.finance.expenses.destroy', expenseId), { preserveScroll: true });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">Expenses</h2>
                    <button
                        type="button"
                        onClick={() => setShowForm((previous) => !previous)}
                        className="inline-flex items-center gap-1.5 rounded-md bg-brand px-3 py-2 text-xs font-semibold text-white hover:bg-brand-dark"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        {showForm ? 'Close' : 'Record Expense'}
                    </button>
                </div>
            }
        >
            <Head title="Expenses" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
                    {flash?.success && (
                        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                            {flash.success}
                        </div>
                    )}
                    {flash?.error && (
                        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {flash.error}
                        </div>
                    )}

                    <FinanceTabs active="expenses" />

                    <StatGrid>
                        <StatCard icon={Wallet} label="Total (All Time)" value={formatMoney(stats.total_all_time)} tone="red" />
                        <StatCard icon={CalendarDays} label="This Month" value={formatMoney(stats.total_this_month)} tone="amber" />
                        <StatCard icon={Hash} label="Entries This Month" value={stats.count_this_month ?? 0} tone="slate" />
                    </StatGrid>

                    {showForm && (
                        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                            <h3 className="text-lg font-semibold text-gray-900">Record Expense</h3>
                            <form onSubmit={submitExpense} className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">Category</label>
                                    <select
                                        value={form.data.category}
                                        onChange={(event) => form.setData('category', event.target.value)}
                                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
                                    >
                                        {categories.map((option) => (
                                            <option key={option} value={option}>
                                                {option}
                                            </option>
                                        ))}
                                    </select>
                                    {form.errors.category && <p className="mt-1 text-xs text-red-600">{form.errors.category}</p>}
                                </div>

                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">Vendor (optional)</label>
                                    <input
                                        value={form.data.vendor}
                                        onChange={(event) => form.setData('vendor', event.target.value)}
                                        placeholder="e.g. Adobe, AWS, Freelancer name"
                                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">Payment Method (optional)</label>
                                    <input
                                        value={form.data.payment_method}
                                        onChange={(event) => form.setData('payment_method', event.target.value)}
                                        placeholder="Bank transfer, Card, Cash…"
                                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">Amount</label>
                                    <input
                                        type="number"
                                        min="0.01"
                                        step="0.01"
                                        value={form.data.amount}
                                        onChange={(event) => form.setData('amount', event.target.value)}
                                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
                                    />
                                    {form.errors.amount && <p className="mt-1 text-xs text-red-600">{form.errors.amount}</p>}
                                </div>

                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">Currency</label>
                                    <select
                                        value={form.data.currency}
                                        onChange={(event) => form.setData('currency', event.target.value)}
                                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
                                    >
                                        {currencies.map((currency) => (
                                            <option key={currency} value={currency}>
                                                {currency}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">Expense Date</label>
                                    <input
                                        type="date"
                                        value={form.data.expense_date}
                                        onChange={(event) => form.setData('expense_date', event.target.value)}
                                        max={new Date().toISOString().slice(0, 10)}
                                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
                                    />
                                    {form.errors.expense_date && <p className="mt-1 text-xs text-red-600">{form.errors.expense_date}</p>}
                                </div>

                                <div className="sm:col-span-2 lg:col-span-3">
                                    <label className="mb-1 block text-sm font-medium text-gray-700">Description (optional)</label>
                                    <textarea
                                        value={form.data.description}
                                        onChange={(event) => form.setData('description', event.target.value)}
                                        rows={2}
                                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
                                    />
                                </div>

                                <div className="sm:col-span-2 lg:col-span-3 flex justify-end gap-3 border-t border-gray-100 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowForm(false)}
                                        className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={form.processing}
                                        className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {form.processing ? 'Saving...' : 'Save Expense'}
                                    </button>
                                </div>
                            </form>
                        </section>
                    )}

                    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
                        <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
                            <div className="relative flex-1 lg:min-w-[220px]">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <input
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder="Search vendor, category, description…"
                                    className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-9 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
                                />
                                {isSyncing && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-brand" />}
                            </div>

                            <select
                                value={category}
                                onChange={(event) => setCategory(event.target.value)}
                                aria-label="Category"
                                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30 lg:w-auto"
                            >
                                <option value="">All categories</option>
                                {categories.map((option) => (
                                    <option key={option} value={option}>
                                        {option}
                                    </option>
                                ))}
                            </select>

                            <button
                                type="button"
                                onClick={resetFilters}
                                disabled={!hasActiveFilters}
                                className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 lg:w-auto"
                            >
                                <RotateCcw className="h-3.5 w-3.5" />
                                Reset
                            </button>
                        </div>
                    </section>

                    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                        <div className="hidden overflow-x-auto md:block">
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-3 py-2 text-left font-semibold text-gray-600">Date</th>
                                        <th className="px-3 py-2 text-left font-semibold text-gray-600">Category</th>
                                        <th className="px-3 py-2 text-left font-semibold text-gray-600">Vendor / Description</th>
                                        <th className="px-3 py-2 text-left font-semibold text-gray-600">Method</th>
                                        <th className="px-3 py-2 text-right font-semibold text-gray-600">Amount</th>
                                        <th className="px-3 py-2 text-left font-semibold text-gray-600">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {(expenses?.data || []).length === 0 && (
                                        <tr>
                                            <td className="px-3 py-4 text-gray-500" colSpan={6}>
                                                No expenses recorded yet.
                                            </td>
                                        </tr>
                                    )}

                                    {(expenses?.data || []).map((expense) => (
                                        <tr key={expense.id}>
                                            <td className="px-3 py-3 align-top text-gray-700">{expense.expense_date}</td>
                                            <td className="px-3 py-3 align-top">
                                                <span className="inline-flex rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                                                    {expense.category}
                                                </span>
                                            </td>
                                            <td className="px-3 py-3 align-top text-gray-900">
                                                <p className="font-medium">{expense.vendor || 'N/A'}</p>
                                                {expense.description && <p className="text-xs text-gray-500">{expense.description}</p>}
                                            </td>
                                            <td className="px-3 py-3 align-top text-gray-700">{expense.payment_method || 'N/A'}</td>
                                            <td className="px-3 py-3 align-top text-right font-semibold text-red-700">
                                                -{formatMoney(expense.amount, expense.currency)}
                                            </td>
                                            <td className="px-3 py-3 align-top">
                                                {canDelete && (
                                                    <button
                                                        type="button"
                                                        onClick={() => deleteExpense(expense.id, expense.category)}
                                                        className="rounded-md border border-red-200 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-50"
                                                    >
                                                        Delete
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {(expenses?.data || []).length === 0 ? (
                            <p className="text-sm text-gray-500 md:hidden">No expenses recorded yet.</p>
                        ) : (
                            <MobileCardList>
                                {(expenses?.data || []).map((expense, index) => (
                                    <MobileCard key={expense.id} index={index}>
                                        <MobileCardHeader
                                            title={expense.vendor || expense.category}
                                            subtitle={expense.expense_date}
                                            badge={
                                                <span className="inline-flex rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                                                    {expense.category}
                                                </span>
                                            }
                                        />
                                        <div className="mt-3 space-y-0.5 divide-y divide-gray-50">
                                            {expense.description && <MobileCardRow label="Notes" value={expense.description} />}
                                            <MobileCardRow label="Method" value={expense.payment_method || 'N/A'} />
                                            <MobileCardRow
                                                label="Amount"
                                                value={<span className="text-red-700">-{formatMoney(expense.amount, expense.currency)}</span>}
                                            />
                                        </div>
                                        {canDelete && (
                                            <MobileCardActions>
                                                <button
                                                    type="button"
                                                    onClick={() => deleteExpense(expense.id, expense.category)}
                                                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                    Delete
                                                </button>
                                            </MobileCardActions>
                                        )}
                                    </MobileCard>
                                ))}
                            </MobileCardList>
                        )}

                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-gray-600">
                            <p>
                                Page {expenses?.current_page || 1} of {expenses?.last_page || 1}
                            </p>
                            <div className="flex items-center gap-2">
                                {expenses?.prev_page_url ? (
                                    <Link href={expenses.prev_page_url} className="rounded-md border border-gray-300 px-3 py-1.5 text-gray-700 hover:bg-gray-50" preserveScroll>
                                        Previous
                                    </Link>
                                ) : (
                                    <span className="cursor-not-allowed rounded-md border border-gray-200 px-3 py-1.5 text-gray-400">Previous</span>
                                )}
                                {expenses?.next_page_url ? (
                                    <Link href={expenses.next_page_url} className="rounded-md border border-gray-300 px-3 py-1.5 text-gray-700 hover:bg-gray-50" preserveScroll>
                                        Next
                                    </Link>
                                ) : (
                                    <span className="cursor-not-allowed rounded-md border border-gray-200 px-3 py-1.5 text-gray-400">Next</span>
                                )}
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function formatMoney(amount, currency = 'NGN') {
    const formattedAmount = Number(amount || 0).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
    const normalizedCurrency = String(currency || '').toUpperCase();

    if (normalizedCurrency === 'NGN' || normalizedCurrency === '') {
        return `₦${formattedAmount}`;
    }

    return `${normalizedCurrency} ${formattedAmount}`;
}
