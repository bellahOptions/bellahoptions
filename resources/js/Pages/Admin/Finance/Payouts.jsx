import { MobileCard, MobileCardActions, MobileCardHeader, MobileCardList, MobileCardRow } from '@/Components/ui/mobile-cards';
import { StatCard, StatGrid } from '@/Components/ui/stat-card';
import FinanceTabs from '@/Components/finance/FinanceTabs';
import { useDebouncedFilterSync } from '@/hooks/use-debounced-filter-sync';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { Check, CheckCircle2, Clock, Hash, Loader2, Plus, RotateCcw, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';

const statusOptions = [
    { value: '', label: 'All statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'paid', label: 'Paid' },
    { value: 'cancelled', label: 'Cancelled' },
];

export default function FinancePayouts({ payouts, stats = {}, filters = {}, currencies = [], permissions = {} }) {
    const { flash } = usePage().props;
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');
    const [showForm, setShowForm] = useState(false);
    const canDelete = Boolean(permissions?.can_delete);

    const isSyncing = useDebouncedFilterSync('admin.finance.payouts.index', { search, status });
    const hasActiveFilters = Boolean(search || status);

    const resetFilters = () => {
        setSearch('');
        setStatus('');
    };

    const form = useForm({
        payee_name: '',
        payee_email: '',
        amount: '',
        currency: 'NGN',
        purpose: '',
    });

    const submitPayout = (event) => {
        event.preventDefault();

        form.post(route('admin.finance.payouts.store'), {
            preserveScroll: true,
            onSuccess: () => {
                form.reset();
                setShowForm(false);
            },
        });
    };

    const markPaid = (payoutId, payeeName) => {
        const paymentReference = window.prompt(`Payment reference for payout to ${payeeName} (optional):`, '');

        if (paymentReference === null) {
            return;
        }

        router.patch(route('admin.finance.payouts.mark-paid', payoutId), { payment_reference: paymentReference }, { preserveScroll: true });
    };

    const deletePayout = (payoutId, payeeName) => {
        if (!window.confirm(`Delete payout to "${payeeName}"? This cannot be undone.`)) {
            return;
        }

        router.delete(route('admin.finance.payouts.destroy', payoutId), { preserveScroll: true });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">Payouts</h2>
                    <button
                        type="button"
                        onClick={() => setShowForm((previous) => !previous)}
                        className="inline-flex items-center gap-1.5 rounded-md bg-brand px-3 py-2 text-xs font-semibold text-white hover:bg-brand-dark"
                    >
                        <Plus className="h-3.5 w-3.5" />
                        {showForm ? 'Close' : 'New Payout'}
                    </button>
                </div>
            }
        >
            <Head title="Payouts" />

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

                    <FinanceTabs active="payouts" />

                    <StatGrid>
                        <StatCard icon={CheckCircle2} label="Total Paid" value={formatMoney(stats.total_paid)} tone="emerald" />
                        <StatCard icon={Clock} label="Pending" value={formatMoney(stats.total_pending)} tone="amber" />
                        <StatCard icon={Hash} label="Pending Count" value={stats.pending_count ?? 0} tone="slate" />
                    </StatGrid>

                    {showForm && (
                        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                            <h3 className="text-lg font-semibold text-gray-900">New Payout</h3>
                            <p className="mt-1 text-sm text-gray-600">Record a payment owed to a team member or freelance contributor.</p>
                            <form onSubmit={submitPayout} className="mt-4 grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">Payee Name</label>
                                    <input
                                        value={form.data.payee_name}
                                        onChange={(event) => form.setData('payee_name', event.target.value)}
                                        placeholder="e.g. Jane Doe"
                                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
                                    />
                                    {form.errors.payee_name && <p className="mt-1 text-xs text-red-600">{form.errors.payee_name}</p>}
                                </div>

                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">Payee Email (optional)</label>
                                    <input
                                        type="email"
                                        value={form.data.payee_email}
                                        onChange={(event) => form.setData('payee_email', event.target.value)}
                                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
                                    />
                                    {form.errors.payee_email && <p className="mt-1 text-xs text-red-600">{form.errors.payee_email}</p>}
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

                                <div className="sm:col-span-2">
                                    <label className="mb-1 block text-sm font-medium text-gray-700">Purpose</label>
                                    <input
                                        value={form.data.purpose}
                                        onChange={(event) => form.setData('purpose', event.target.value)}
                                        placeholder="e.g. Logo design contract work — March"
                                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
                                    />
                                    {form.errors.purpose && <p className="mt-1 text-xs text-red-600">{form.errors.purpose}</p>}
                                </div>

                                <div className="sm:col-span-2 flex justify-end gap-3 border-t border-gray-100 pt-4">
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
                                        {form.processing ? 'Saving...' : 'Create Payout'}
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
                                    placeholder="Search payee or purpose…"
                                    className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-9 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
                                />
                                {isSyncing && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-brand" />}
                            </div>

                            <select
                                value={status}
                                onChange={(event) => setStatus(event.target.value)}
                                aria-label="Status"
                                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30 lg:w-auto"
                            >
                                {statusOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
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
                                        <th className="px-3 py-2 text-left font-semibold text-gray-600">Payee</th>
                                        <th className="px-3 py-2 text-left font-semibold text-gray-600">Purpose</th>
                                        <th className="px-3 py-2 text-right font-semibold text-gray-600">Amount</th>
                                        <th className="px-3 py-2 text-left font-semibold text-gray-600">Status</th>
                                        <th className="px-3 py-2 text-left font-semibold text-gray-600">Paid At</th>
                                        <th className="px-3 py-2 text-left font-semibold text-gray-600">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {(payouts?.data || []).length === 0 && (
                                        <tr>
                                            <td className="px-3 py-4 text-gray-500" colSpan={6}>
                                                No payouts recorded yet.
                                            </td>
                                        </tr>
                                    )}

                                    {(payouts?.data || []).map((payout) => (
                                        <tr key={payout.id}>
                                            <td className="px-3 py-3 align-top">
                                                <p className="font-semibold text-gray-900">{payout.payee_name}</p>
                                                {payout.payee_email && <p className="text-xs text-gray-500">{payout.payee_email}</p>}
                                            </td>
                                            <td className="px-3 py-3 align-top text-gray-700">{payout.purpose}</td>
                                            <td className="px-3 py-3 align-top text-right font-semibold text-gray-900">
                                                {formatMoney(payout.amount, payout.currency)}
                                            </td>
                                            <td className="px-3 py-3 align-top">
                                                <StatusBadge status={payout.status} />
                                            </td>
                                            <td className="px-3 py-3 align-top text-xs text-gray-500">{payout.paid_at || 'N/A'}</td>
                                            <td className="space-x-2 px-3 py-3 align-top">
                                                {payout.status === 'pending' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => markPaid(payout.id, payout.payee_name)}
                                                        className="rounded-md border border-emerald-200 px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                                                    >
                                                        Mark Paid
                                                    </button>
                                                )}
                                                {canDelete && (
                                                    <button
                                                        type="button"
                                                        onClick={() => deletePayout(payout.id, payout.payee_name)}
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

                        {(payouts?.data || []).length === 0 ? (
                            <p className="text-sm text-gray-500 md:hidden">No payouts recorded yet.</p>
                        ) : (
                            <MobileCardList>
                                {(payouts?.data || []).map((payout, index) => (
                                    <MobileCard key={payout.id} index={index}>
                                        <MobileCardHeader
                                            title={payout.payee_name}
                                            subtitle={payout.payee_email || payout.purpose}
                                            badge={<StatusBadge status={payout.status} />}
                                        />
                                        <div className="mt-3 space-y-0.5 divide-y divide-gray-50">
                                            <MobileCardRow label="Purpose" value={payout.purpose} />
                                            <MobileCardRow label="Amount" value={formatMoney(payout.amount, payout.currency)} />
                                            <MobileCardRow label="Paid At" value={payout.paid_at || 'N/A'} />
                                        </div>
                                        {(payout.status === 'pending' || canDelete) && (
                                            <MobileCardActions>
                                                {payout.status === 'pending' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => markPaid(payout.id, payout.payee_name)}
                                                        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md border border-emerald-200 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                                                    >
                                                        <Check className="h-3.5 w-3.5" />
                                                        Mark Paid
                                                    </button>
                                                )}
                                                {canDelete && (
                                                    <button
                                                        type="button"
                                                        onClick={() => deletePayout(payout.id, payout.payee_name)}
                                                        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                        Delete
                                                    </button>
                                                )}
                                            </MobileCardActions>
                                        )}
                                    </MobileCard>
                                ))}
                            </MobileCardList>
                        )}

                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-gray-600">
                            <p>
                                Page {payouts?.current_page || 1} of {payouts?.last_page || 1}
                            </p>
                            <div className="flex items-center gap-2">
                                {payouts?.prev_page_url ? (
                                    <Link href={payouts.prev_page_url} className="rounded-md border border-gray-300 px-3 py-1.5 text-gray-700 hover:bg-gray-50" preserveScroll>
                                        Previous
                                    </Link>
                                ) : (
                                    <span className="cursor-not-allowed rounded-md border border-gray-200 px-3 py-1.5 text-gray-400">Previous</span>
                                )}
                                {payouts?.next_page_url ? (
                                    <Link href={payouts.next_page_url} className="rounded-md border border-gray-300 px-3 py-1.5 text-gray-700 hover:bg-gray-50" preserveScroll>
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

function StatusBadge({ status }) {
    const config = {
        pending: 'bg-amber-100 text-amber-700',
        paid: 'bg-emerald-100 text-emerald-700',
        cancelled: 'bg-gray-100 text-gray-600',
    };

    return (
        <span className={`inline-flex shrink-0 rounded-full px-2 py-1 text-xs font-medium ${config[status] || config.pending}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
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
