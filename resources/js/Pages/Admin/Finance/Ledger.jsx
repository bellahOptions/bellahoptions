import { Card } from '@/Components/ui/card';
import { MobileCard, MobileCardHeader, MobileCardList, MobileCardRow } from '@/Components/ui/mobile-cards';
import { StatCard, StatGrid } from '@/Components/ui/stat-card';
import FinanceTabs from '@/Components/finance/FinanceTabs';
import { useDebouncedFilterSync } from '@/hooks/use-debounced-filter-sync';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatMoney } from '@/lib/utils';
import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowDownRight, ArrowUpRight, Download, Loader2, RotateCcw, Scale, Search, TrendingDown, TrendingUp } from 'lucide-react';
import { useState } from 'react';

const typeOptions = [
    { value: '', label: 'All types' },
    { value: 'income', label: 'Income' },
    { value: 'expense', label: 'Expenses' },
    { value: 'payout', label: 'Payouts' },
];

export default function FinanceLedger({ transactions, totals = {}, filters = {} }) {
    const { flash } = usePage().props;
    const [search, setSearch] = useState(filters.search || '');
    const [type, setType] = useState(filters.type || '');
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');

    const isSyncing = useDebouncedFilterSync('admin.finance.ledger', {
        search,
        type,
        date_from: dateFrom,
        date_to: dateTo,
    });

    const hasActiveFilters = Boolean(search || type || dateFrom || dateTo);

    const resetFilters = () => {
        setSearch('');
        setType('');
        setDateFrom('');
        setDateTo('');
    };

    const exportUrl = route('admin.finance.ledger.export', {
        search,
        type,
        date_from: dateFrom,
        date_to: dateTo,
    });

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="jv-display jv-display--sm">Transaction Ledger</h2>
                    <a
                        href={exportUrl}
                        className="jv-btn jv-btn--ghost jv-btn--sm"
                    >
                        <Download className="h-3.5 w-3.5" />
                        Export CSV
                    </a>
                </div>
            }
        >
            <Head title="Transaction Ledger" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
                    {flash?.success && (
                        <div className="rounded-jv-sm border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                            {flash.success}
                        </div>
                    )}

                    <FinanceTabs active="ledger" />

                    <StatGrid>
                        <StatCard icon={TrendingUp} label="Income" value={formatMoney(totals.income)} tone="emerald" />
                        <StatCard
                            icon={TrendingDown}
                            label="Expenses + Payouts"
                            value={formatMoney((totals.expense || 0) + (totals.payout || 0))}
                            tone="red"
                        />
                        <StatCard
                            icon={Scale}
                            label="Net"
                            value={formatMoney(totals.net)}
                            tone={(totals.net || 0) >= 0 ? 'emerald' : 'red'}
                        />
                    </StatGrid>

                    <Card className="p-4 sm:p-5">
                        <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
                            <div className="relative flex-1 lg:min-w-[220px]">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                                <input
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder="Search description or reference…"
                                    className="jv-input py-2.5 pl-9 pr-9"
                                />
                                {isSyncing && (
                                    <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-jv-accent" />
                                )}
                            </div>

                            <select
                                value={type}
                                onChange={(event) => setType(event.target.value)}
                                aria-label="Transaction type"
                                className="jv-select py-2.5 lg:w-auto"
                            >
                                {typeOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>

                            <input
                                type="date"
                                value={dateFrom}
                                onChange={(event) => setDateFrom(event.target.value)}
                                aria-label="From date"
                                className="jv-input py-2.5 lg:w-auto"
                            />
                            <input
                                type="date"
                                value={dateTo}
                                onChange={(event) => setDateTo(event.target.value)}
                                aria-label="To date"
                                className="jv-input py-2.5 lg:w-auto"
                            />

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
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-white/45">Type</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-white/45">Description</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-white/45">Reference</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-white/45">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(transactions?.data || []).length === 0 && (
                                        <tr className="border-b border-jv-line/70">
                                            <td className="px-4 py-4 text-white/45" colSpan={5}>
                                                No transactions found.
                                            </td>
                                        </tr>
                                    )}

                                    {(transactions?.data || []).map((transaction, index) => (
                                        <tr
                                            key={`${transaction.reference}-${index}`}
                                            className="border-b border-jv-line/70 transition hover:bg-white/[0.04]"
                                        >
                                            <td className="px-4 py-3 align-top text-white/80">{transaction.date}</td>
                                            <td className="px-4 py-3 align-top">
                                                <TypeBadge type={transaction.type} />
                                            </td>
                                            <td className="px-4 py-3 align-top font-medium text-white">{transaction.description}</td>
                                            <td className="px-4 py-3 align-top text-xs text-white/45">{transaction.reference}</td>
                                            <td
                                                className={`px-4 py-3 align-top text-right font-semibold ${
                                                    transaction.amount >= 0 ? 'text-emerald-300' : 'text-red-300'
                                                }`}
                                            >
                                                {transaction.amount >= 0 ? '+' : '-'}
                                                {formatMoney(Math.abs(transaction.amount), transaction.currency)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {(transactions?.data || []).length === 0 ? (
                            <p className="p-5 text-sm text-white/45 md:hidden">No transactions found.</p>
                        ) : (
                            <div className="p-4 md:hidden">
                                <MobileCardList>
                                    {(transactions?.data || []).map((transaction, index) => (
                                        <MobileCard key={`${transaction.reference}-mobile-${index}`} index={index}>
                                            <MobileCardHeader
                                                title={transaction.description}
                                                subtitle={transaction.date}
                                                badge={<TypeBadge type={transaction.type} />}
                                            />
                                            <div className="mt-3 divide-y divide-jv-line">
                                                <MobileCardRow label="Reference" value={transaction.reference} />
                                                <MobileCardRow
                                                    label="Amount"
                                                    value={
                                                        <span className={transaction.amount >= 0 ? 'text-emerald-300' : 'text-red-300'}>
                                                            {transaction.amount >= 0 ? '+' : '-'}
                                                            {formatMoney(Math.abs(transaction.amount), transaction.currency)}
                                                        </span>
                                                    }
                                                />
                                            </div>
                                        </MobileCard>
                                    ))}
                                </MobileCardList>
                            </div>
                        )}

                        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-jv-line px-4 py-3 text-sm text-white/60">
                            <p>
                                Page {transactions?.current_page || 1} of {transactions?.last_page || 1}
                            </p>
                            <div className="flex items-center gap-2">
                                {transactions?.prev_page_url ? (
                                    <Link
                                        href={transactions.prev_page_url}
                                        className="rounded-full border border-jv-line-strong px-3 py-1.5 text-white/70 transition hover:bg-white/[0.06] hover:text-white"
                                        preserveScroll
                                    >
                                        Previous
                                    </Link>
                                ) : (
                                    <span className="cursor-not-allowed rounded-full border border-jv-line px-3 py-1.5 text-white/30">Previous</span>
                                )}
                                {transactions?.next_page_url ? (
                                    <Link
                                        href={transactions.next_page_url}
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

function TypeBadge({ type }) {
    const config = {
        income: { label: 'Income', className: 'bg-emerald-500/15 text-emerald-300', Icon: ArrowUpRight },
        expense: { label: 'Expense', className: 'bg-red-500/15 text-red-300', Icon: ArrowDownRight },
        payout: { label: 'Payout', className: 'bg-amber-500/15 text-amber-300', Icon: ArrowDownRight },
    };

    const { label, className, Icon } = config[type] || config.expense;

    return (
        <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${className}`}>
            <Icon className="h-3 w-3" />
            {label}
        </span>
    );
}
