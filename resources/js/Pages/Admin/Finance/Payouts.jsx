import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Card } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { MobileCard, MobileCardActions, MobileCardHeader, MobileCardList, MobileCardRow } from '@/Components/ui/mobile-cards';
import { Select } from '@/Components/ui/select';
import { StatCard, StatGrid } from '@/Components/ui/stat-card';
import FinanceTabs from '@/Components/finance/FinanceTabs';
import { useDebouncedFilterSync } from '@/hooks/use-debounced-filter-sync';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatMoney } from '@/lib/utils';
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
                    <h2 className="jv-display jv-display--sm">Payouts</h2>
                    <Button
                        type="button"
                        size="sm"
                        onClick={() => setShowForm((previous) => !previous)}
                    >
                        <Plus className="h-3.5 w-3.5" />
                        {showForm ? 'Close' : 'New Payout'}
                    </Button>
                </div>
            }
        >
            <Head title="Payouts" />

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

                    <FinanceTabs active="payouts" />

                    <StatGrid>
                        <StatCard icon={CheckCircle2} label="Total Paid" value={formatMoney(stats.total_paid)} tone="emerald" />
                        <StatCard icon={Clock} label="Pending" value={formatMoney(stats.total_pending)} tone="amber" />
                        <StatCard icon={Hash} label="Pending Count" value={stats.pending_count ?? 0} tone="slate" />
                    </StatGrid>

                    {showForm && (
                        <Card className="p-5 sm:p-6">
                            <h3 className="text-lg font-semibold text-white">New Payout</h3>
                            <p className="mt-1 text-sm text-white/70">Record a payment owed to a team member or freelance contributor.</p>
                            <form onSubmit={submitPayout} className="mt-4 grid gap-4 sm:grid-cols-2">
                                <div>
                                    <Label className="mb-1 block">Payee Name</Label>
                                    <Input
                                        value={form.data.payee_name}
                                        onChange={(event) => form.setData('payee_name', event.target.value)}
                                        placeholder="e.g. Jane Doe"
                                    />
                                    {form.errors.payee_name && <p className="mt-1 text-xs text-red-300">{form.errors.payee_name}</p>}
                                </div>

                                <div>
                                    <Label className="mb-1 block">Payee Email (optional)</Label>
                                    <Input
                                        type="email"
                                        value={form.data.payee_email}
                                        onChange={(event) => form.setData('payee_email', event.target.value)}
                                    />
                                    {form.errors.payee_email && <p className="mt-1 text-xs text-red-300">{form.errors.payee_email}</p>}
                                </div>

                                <div>
                                    <Label className="mb-1 block">Amount</Label>
                                    <Input
                                        type="number"
                                        min="0.01"
                                        step="0.01"
                                        value={form.data.amount}
                                        onChange={(event) => form.setData('amount', event.target.value)}
                                    />
                                    {form.errors.amount && <p className="mt-1 text-xs text-red-300">{form.errors.amount}</p>}
                                </div>

                                <div>
                                    <Label className="mb-1 block">Currency</Label>
                                    <Select
                                        value={form.data.currency}
                                        onChange={(event) => form.setData('currency', event.target.value)}
                                    >
                                        {currencies.map((currency) => (
                                            <option key={currency} value={currency}>
                                                {currency}
                                            </option>
                                        ))}
                                    </Select>
                                </div>

                                <div className="sm:col-span-2">
                                    <Label className="mb-1 block">Purpose</Label>
                                    <Input
                                        value={form.data.purpose}
                                        onChange={(event) => form.setData('purpose', event.target.value)}
                                        placeholder="e.g. Logo design contract work — March"
                                    />
                                    {form.errors.purpose && <p className="mt-1 text-xs text-red-300">{form.errors.purpose}</p>}
                                </div>

                                <div className="flex justify-end gap-3 border-t border-jv-line pt-4 sm:col-span-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setShowForm(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={form.processing}
                                    >
                                        {form.processing ? 'Saving...' : 'Create Payout'}
                                    </Button>
                                </div>
                            </form>
                        </Card>
                    )}

                    <Card className="p-4 sm:p-5">
                        <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
                            <div className="relative flex-1 lg:min-w-[220px]">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                                <Input
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder="Search payee or purpose…"
                                    className="py-2.5 pl-9 pr-9"
                                />
                                {isSyncing && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-jv-accent" />}
                            </div>

                            <Select
                                value={status}
                                onChange={(event) => setStatus(event.target.value)}
                                aria-label="Status"
                                className="py-2.5 lg:w-auto"
                            >
                                {statusOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </Select>

                            <Button
                                type="button"
                                variant="ghost"
                                onClick={resetFilters}
                                disabled={!hasActiveFilters}
                                className="w-full border border-jv-line-strong text-white/70 hover:bg-white/[0.06] hover:text-white lg:w-auto"
                            >
                                <RotateCcw className="h-3.5 w-3.5" />
                                Reset
                            </Button>
                        </div>
                    </Card>

                    <Card className="overflow-hidden">
                        <div className="hidden overflow-x-auto md:block">
                            <table className="min-w-full text-sm">
                                <thead className="border-b border-jv-line">
                                    <tr>
                                        <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-white/45">Payee</th>
                                        <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-white/45">Purpose</th>
                                        <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-white/45">Amount</th>
                                        <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-white/45">Status</th>
                                        <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-white/45">Paid At</th>
                                        <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-white/45">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(payouts?.data || []).length === 0 && (
                                        <tr className="border-b border-jv-line/70">
                                            <td className="px-3 py-4 text-white/45" colSpan={6}>
                                                No payouts recorded yet.
                                            </td>
                                        </tr>
                                    )}

                                    {(payouts?.data || []).map((payout) => (
                                        <tr key={payout.id} className="border-b border-jv-line/70 transition hover:bg-white/[0.04]">
                                            <td className="px-3 py-3 align-top">
                                                <p className="font-semibold text-white">{payout.payee_name}</p>
                                                {payout.payee_email && <p className="text-xs text-white/45">{payout.payee_email}</p>}
                                            </td>
                                            <td className="px-3 py-3 align-top text-white/70">{payout.purpose}</td>
                                            <td className="px-3 py-3 align-top text-right font-semibold text-white">
                                                {formatMoney(payout.amount, payout.currency)}
                                            </td>
                                            <td className="px-3 py-3 align-top">
                                                <StatusBadge status={payout.status} />
                                            </td>
                                            <td className="px-3 py-3 align-top text-xs text-white/45">{payout.paid_at || 'N/A'}</td>
                                            <td className="space-x-2 px-3 py-3 align-top">
                                                {payout.status === 'pending' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => markPaid(payout.id, payout.payee_name)}
                                                        className="inline-flex items-center rounded-full border border-emerald-500/30 px-2.5 py-1 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/10"
                                                    >
                                                        Mark Paid
                                                    </button>
                                                )}
                                                {canDelete && (
                                                    <button
                                                        type="button"
                                                        onClick={() => deletePayout(payout.id, payout.payee_name)}
                                                        className="inline-flex items-center rounded-full border border-red-500/30 px-2.5 py-1 text-xs font-semibold text-red-300 transition hover:bg-red-500/10"
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
                            <p className="p-5 text-sm text-white/45 md:hidden">No payouts recorded yet.</p>
                        ) : (
                            <div className="p-4 md:hidden">
                                <MobileCardList>
                                    {(payouts?.data || []).map((payout, index) => (
                                        <MobileCard key={payout.id} index={index}>
                                            <MobileCardHeader
                                                title={payout.payee_name}
                                                subtitle={payout.payee_email || payout.purpose}
                                                badge={<StatusBadge status={payout.status} />}
                                            />
                                            <div className="mt-3 divide-y divide-jv-line">
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
                                                            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-emerald-500/30 px-3 py-1.5 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/10"
                                                        >
                                                            <Check className="h-3.5 w-3.5" />
                                                            Mark Paid
                                                        </button>
                                                    )}
                                                    {canDelete && (
                                                        <button
                                                            type="button"
                                                            onClick={() => deletePayout(payout.id, payout.payee_name)}
                                                            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-red-500/30 px-3 py-1.5 text-xs font-semibold text-red-300 transition hover:bg-red-500/10"
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
                            </div>
                        )}

                        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-jv-line px-4 py-3 text-sm text-white/60">
                            <p>
                                Page {payouts?.current_page || 1} of {payouts?.last_page || 1}
                            </p>
                            <div className="flex items-center gap-2">
                                {payouts?.prev_page_url ? (
                                    <Link
                                        href={payouts.prev_page_url}
                                        className="rounded-full border border-jv-line-strong px-3 py-1.5 text-white/70 transition hover:bg-white/[0.06] hover:text-white"
                                        preserveScroll
                                    >
                                        Previous
                                    </Link>
                                ) : (
                                    <span className="cursor-not-allowed rounded-full border border-jv-line px-3 py-1.5 text-white/30">Previous</span>
                                )}
                                {payouts?.next_page_url ? (
                                    <Link
                                        href={payouts.next_page_url}
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

function StatusBadge({ status }) {
    const variants = {
        pending: 'warning',
        paid: 'success',
        cancelled: 'secondary',
    };

    return (
        <Badge variant={variants[status] || variants.pending} className="shrink-0">
            {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
    );
}
