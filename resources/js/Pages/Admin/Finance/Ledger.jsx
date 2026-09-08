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
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">Transaction Ledger</h2>
                    <a
                        href={exportUrl}
                        className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
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
                        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
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

                    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
                        <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
                            <div className="relative flex-1 lg:min-w-[220px]">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <input
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder="Search description or reference…"
                                    className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-9 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
                                />
                                {isSyncing && (
                                    <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-brand" />
                                )}
                            </div>

                            <select
                                value={type}
                                onChange={(event) => setType(event.target.value)}
                                aria-label="Transaction type"
                                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30 lg:w-auto"
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
                                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30 lg:w-auto"
                            />
                            <input
                                type="date"
                                value={dateTo}
                                onChange={(event) => setDateTo(event.target.value)}
                                aria-label="To date"
                                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30 lg:w-auto"
                            />

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
                                        <th className="px-3 py-2 text-left font-semibold text-gray-600">Type</th>
                                        <th className="px-3 py-2 text-left font-semibold text-gray-600">Description</th>
                                        <th className="px-3 py-2 text-left font-semibold text-gray-600">Reference</th>
                                        <th className="px-3 py-2 text-right font-semibold text-gray-600">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {(transactions?.data || []).length === 0 && (
                                        <tr>
                                            <td className="px-3 py-4 text-gray-500" colSpan={5}>
                                                No transactions found.
                                            </td>
                                        </tr>
                                    )}

                                    {(transactions?.data || []).map((transaction, index) => (
                                        <tr key={`${transaction.reference}-${index}`}>
                                            <td className="px-3 py-3 align-top text-gray-700">{transaction.date}</td>
                                            <td className="px-3 py-3 align-top">
                                                <TypeBadge type={transaction.type} />
                                            </td>
                                            <td className="px-3 py-3 align-top text-gray-900">{transaction.description}</td>
                                            <td className="px-3 py-3 align-top text-xs text-gray-500">{transaction.reference}</td>
                                            <td
                                                className={`px-3 py-3 align-top text-right font-semibold ${
                                                    transaction.amount >= 0 ? 'text-emerald-700' : 'text-red-700'
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
                            <p className="text-sm text-gray-500 md:hidden">No transactions found.</p>
                        ) : (
                            <MobileCardList>
                                {(transactions?.data || []).map((transaction, index) => (
                                    <MobileCard key={`${transaction.reference}-mobile-${index}`} index={index}>
                                        <MobileCardHeader
                                            title={transaction.description}
                                            subtitle={transaction.date}
                                            badge={<TypeBadge type={transaction.type} />}
                                        />
                                        <div className="mt-3 space-y-0.5 divide-y divide-gray-50">
                                            <MobileCardRow label="Reference" value={transaction.reference} />
                                            <MobileCardRow
                                                label="Amount"
                                                value={
                                                    <span className={transaction.amount >= 0 ? 'text-emerald-700' : 'text-red-700'}>
                                                        {transaction.amount >= 0 ? '+' : '-'}
                                                        {formatMoney(Math.abs(transaction.amount), transaction.currency)}
                                                    </span>
                                                }
                                            />
                                        </div>
                                    </MobileCard>
                                ))}
                            </MobileCardList>
                        )}

                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-gray-600">
                            <p>
                                Page {transactions?.current_page || 1} of {transactions?.last_page || 1}
                            </p>
                            <div className="flex items-center gap-2">
                                {transactions?.prev_page_url ? (
                                    <Link href={transactions.prev_page_url} className="rounded-md border border-gray-300 px-3 py-1.5 text-gray-700 hover:bg-gray-50" preserveScroll>
                                        Previous
                                    </Link>
                                ) : (
                                    <span className="cursor-not-allowed rounded-md border border-gray-200 px-3 py-1.5 text-gray-400">Previous</span>
                                )}
                                {transactions?.next_page_url ? (
                                    <Link href={transactions.next_page_url} className="rounded-md border border-gray-300 px-3 py-1.5 text-gray-700 hover:bg-gray-50" preserveScroll>
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

function TypeBadge({ type }) {
    const config = {
        income: { label: 'Income', className: 'bg-emerald-100 text-emerald-700', Icon: ArrowUpRight },
        expense: { label: 'Expense', className: 'bg-red-100 text-red-700', Icon: ArrowDownRight },
        payout: { label: 'Payout', className: 'bg-amber-100 text-amber-700', Icon: ArrowDownRight },
    };

    const { label, className, Icon } = config[type] || config.expense;

    return (
        <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${className}`}>
            <Icon className="h-3 w-3" />
            {label}
        </span>
    );
}

