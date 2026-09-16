import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Card } from '@/Components/ui/card';
import { MobileCard, MobileCardActions, MobileCardHeader, MobileCardList, MobileCardRow } from '@/Components/ui/mobile-cards';
import { StatCard, StatGrid } from '@/Components/ui/stat-card';
import FinanceTabs from '@/Components/finance/FinanceTabs';
import { useDebouncedFilterSync } from '@/hooks/use-debounced-filter-sync';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatMoney } from '@/lib/utils';
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
                    <h2 className="jv-display jv-display--sm">Expenses</h2>
                    <Button type="button" size="sm" onClick={() => setShowForm((previous) => !previous)}>
                        <Plus className="h-3.5 w-3.5" />
                        {showForm ? 'Close' : 'Record Expense'}
                    </Button>
                </div>
            }
        >
            <Head title="Expenses" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
                    {flash?.success && (
                        <div className="rounded-jv-sm border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                            {flash.success}
                        </div>
                    )}
                    {flash?.error && (
                        <div className="rounded-jv-sm border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
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
                        <Card className="p-5">
                            <h3 className="text-lg font-semibold text-white">Record Expense</h3>
                            <form onSubmit={submitExpense} className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-white/65">Category</label>
                                    <select
                                        value={form.data.category}
                                        onChange={(event) => form.setData('category', event.target.value)}
                                        className="jv-select"
                                    >
                                        {categories.map((option) => (
                                            <option key={option} value={option}>
                                                {option}
                                            </option>
                                        ))}
                                    </select>
                                    {form.errors.category && <p className="mt-1 text-xs text-red-300">{form.errors.category}</p>}
                                </div>

                                <div>
                                    <label className="mb-1 block text-sm font-medium text-white/65">Vendor (optional)</label>
                                    <input
                                        value={form.data.vendor}
                                        onChange={(event) => form.setData('vendor', event.target.value)}
                                        placeholder="e.g. Adobe, AWS, Freelancer name"
                                        className="jv-input"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1 block text-sm font-medium text-white/65">Payment Method (optional)</label>
                                    <input
                                        value={form.data.payment_method}
                                        onChange={(event) => form.setData('payment_method', event.target.value)}
                                        placeholder="Bank transfer, Card, Cash…"
                                        className="jv-input"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1 block text-sm font-medium text-white/65">Amount</label>
                                    <input
                                        type="number"
                                        min="0.01"
                                        step="0.01"
                                        value={form.data.amount}
                                        onChange={(event) => form.setData('amount', event.target.value)}
                                        className="jv-input"
                                    />
                                    {form.errors.amount && <p className="mt-1 text-xs text-red-300">{form.errors.amount}</p>}
                                </div>

                                <div>
                                    <label className="mb-1 block text-sm font-medium text-white/65">Currency</label>
                                    <select
                                        value={form.data.currency}
                                        onChange={(event) => form.setData('currency', event.target.value)}
                                        className="jv-select"
                                    >
                                        {currencies.map((currency) => (
                                            <option key={currency} value={currency}>
                                                {currency}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-1 block text-sm font-medium text-white/65">Expense Date</label>
                                    <input
                                        type="date"
                                        value={form.data.expense_date}
                                        onChange={(event) => form.setData('expense_date', event.target.value)}
                                        max={new Date().toISOString().slice(0, 10)}
                                        className="jv-input [color-scheme:dark]"
                                    />
                                    {form.errors.expense_date && <p className="mt-1 text-xs text-red-300">{form.errors.expense_date}</p>}
                                </div>

                                <div className="sm:col-span-2 lg:col-span-3">
                                    <label className="mb-1 block text-sm font-medium text-white/65">Description (optional)</label>
                                    <textarea
                                        value={form.data.description}
                                        onChange={(event) => form.setData('description', event.target.value)}
                                        rows={2}
                                        className="jv-textarea"
                                    />
                                </div>

                                <div className="flex justify-end gap-3 border-t border-jv-line pt-4 sm:col-span-2 lg:col-span-3">
                                    <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={form.processing}>
                                        {form.processing ? 'Saving...' : 'Save Expense'}
                                    </Button>
                                </div>
                            </form>
                        </Card>
                    )}

                    <Card className="p-4 sm:p-5">
                        <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
                            <div className="relative flex-1 lg:min-w-[220px]">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                                <input
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder="Search vendor, category, description…"
                                    className="jv-input py-2.5 pl-9 pr-9"
                                />
                                {isSyncing && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-jv-accent" />}
                            </div>

                            <select
                                value={category}
                                onChange={(event) => setCategory(event.target.value)}
                                aria-label="Category"
                                className="jv-select py-2.5 lg:w-auto"
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
                                className="jv-btn jv-btn--ghost jv-btn--sm w-full lg:w-auto"
                            >
                                <RotateCcw className="h-3.5 w-3.5" />
                                Reset
                            </button>
                        </div>
                    </Card>

                    <Card className="overflow-hidden">
                        <div className="hidden overflow-x-auto md:block">
                            <table className="min-w-full text-sm">
                                <thead className="border-b border-jv-line">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-white/45">Date</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-white/45">Category</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-white/45">Vendor / Description</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-white/45">Method</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-white/45">Amount</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-white/45">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(expenses?.data || []).length === 0 && (
                                        <tr className="border-b border-jv-line/70">
                                            <td className="px-4 py-4 text-white/45" colSpan={6}>
                                                No expenses recorded yet.
                                            </td>
                                        </tr>
                                    )}

                                    {(expenses?.data || []).map((expense) => (
                                        <tr key={expense.id} className="border-b border-jv-line/70 transition hover:bg-white/[0.04]">
                                            <td className="px-4 py-3 align-top text-white/70">{expense.expense_date}</td>
                                            <td className="px-4 py-3 align-top">
                                                <Badge variant="secondary">{expense.category}</Badge>
                                            </td>
                                            <td className="px-4 py-3 align-top text-white/80">
                                                <p className="font-semibold text-white">{expense.vendor || 'N/A'}</p>
                                                {expense.description && <p className="text-xs text-white/45">{expense.description}</p>}
                                            </td>
                                            <td className="px-4 py-3 align-top text-white/70">{expense.payment_method || 'N/A'}</td>
                                            <td className="px-4 py-3 align-top text-right font-semibold text-red-300">
                                                -{formatMoney(expense.amount, expense.currency)}
                                            </td>
                                            <td className="px-4 py-3 align-top">
                                                {canDelete && (
                                                    <button
                                                        type="button"
                                                        onClick={() => deleteExpense(expense.id, expense.category)}
                                                        className="rounded-full border border-red-500/30 px-3 py-1.5 text-xs font-semibold text-red-300 transition hover:bg-red-500/10"
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
                            <p className="p-5 text-sm text-white/45 md:hidden">No expenses recorded yet.</p>
                        ) : (
                            <div className="p-4 md:hidden">
                                <MobileCardList>
                                    {(expenses?.data || []).map((expense, index) => (
                                        <MobileCard key={expense.id} index={index}>
                                            <MobileCardHeader
                                                title={expense.vendor || expense.category}
                                                subtitle={expense.expense_date}
                                                badge={<Badge variant="secondary">{expense.category}</Badge>}
                                            />
                                            <div className="mt-3 space-y-0.5 divide-y divide-jv-line/70">
                                                {expense.description && <MobileCardRow label="Notes" value={expense.description} />}
                                                <MobileCardRow label="Method" value={expense.payment_method || 'N/A'} />
                                                <MobileCardRow
                                                    label="Amount"
                                                    value={<span className="text-red-300">-{formatMoney(expense.amount, expense.currency)}</span>}
                                                />
                                            </div>
                                            {canDelete && (
                                                <MobileCardActions>
                                                    <button
                                                        type="button"
                                                        onClick={() => deleteExpense(expense.id, expense.category)}
                                                        className="inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-red-500/30 px-3 py-1.5 text-xs font-semibold text-red-300 transition hover:bg-red-500/10"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                        Delete
                                                    </button>
                                                </MobileCardActions>
                                            )}
                                        </MobileCard>
                                    ))}
                                </MobileCardList>
                            </div>
                        )}

                        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-jv-line px-4 py-3 text-sm text-white/60">
                            <p>
                                Page {expenses?.current_page || 1} of {expenses?.last_page || 1}
                            </p>
                            <div className="flex items-center gap-2">
                                {expenses?.prev_page_url ? (
                                    <Link
                                        href={expenses.prev_page_url}
                                        className="rounded-full border border-jv-line-strong px-3 py-1.5 text-white/70 transition hover:bg-white/[0.06] hover:text-white"
                                        preserveScroll
                                    >
                                        Previous
                                    </Link>
                                ) : (
                                    <span className="cursor-not-allowed rounded-full border border-jv-line px-3 py-1.5 text-white/30">Previous</span>
                                )}
                                {expenses?.next_page_url ? (
                                    <Link
                                        href={expenses.next_page_url}
                                        className="rounded-full border border-jv-line-strong px-3 py-1.5 text-white/70 transition hover:bg-white/[0.06] hover:text-white"
                                        preserveScroll
                                    >
                                        Next
                                    </Link>
                                ) : (
                                    <span className="cursor-not-allowed rounded-full border border-jv-line px-3 py-1.5 text-white/30">Next</span>
                                )}
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
