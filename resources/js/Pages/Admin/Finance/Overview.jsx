import FinanceTabs from '@/Components/finance/FinanceTabs';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatMoney } from '@/lib/utils';
import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowDownRight, ArrowUpRight, Wallet } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

export default function FinanceOverview({ kpis = {}, monthlySeries = [], recentTransactions = [] }) {
    const { flash } = usePage().props;

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">Finance</h2>
                    <Link
                        href={route('admin.finance.ledger.export')}
                        className="rounded-md border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                    >
                        Export All Transactions (CSV)
                    </Link>
                </div>
            }
        >
            <Head title="Finance Overview" />

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

                    <FinanceTabs active="overview" />

                    <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        <KpiCard
                            label="Total Revenue"
                            value={formatMoney(kpis.total_revenue)}
                            change={kpis.revenue_change_percent}
                            tone="emerald"
                        />
                        <KpiCard
                            label="Total Expenses"
                            value={formatMoney(kpis.total_expenses)}
                            change={kpis.expenses_change_percent}
                            tone="red"
                            invertChangeTone
                        />
                        <KpiCard
                            label="Total Payouts"
                            value={formatMoney(kpis.total_payouts)}
                            change={kpis.payouts_change_percent}
                            tone="amber"
                            invertChangeTone
                        />
                        <KpiCard label="Net Profit" value={formatMoney(kpis.net_profit)} tone={kpis.net_profit >= 0 ? 'emerald' : 'red'} />
                    </section>

                    {kpis.pending_payouts_count > 0 && (
                        <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                            <Wallet className="h-4 w-4 shrink-0" />
                            <span>
                                {kpis.pending_payouts_count} pending payout{kpis.pending_payouts_count === 1 ? '' : 's'} totalling{' '}
                                {formatMoney(kpis.pending_payouts)} awaiting settlement.
                            </span>
                            <Link href={route('admin.finance.payouts.index')} className="ml-auto shrink-0 font-semibold text-amber-900 hover:underline">
                                Review
                            </Link>
                        </div>
                    )}

                    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                        <h3 className="text-base font-semibold text-gray-900">Revenue vs Expenses vs Payouts (last 12 months)</h3>
                        <div className="mt-4 h-72 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={monthlySeries} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#059669" stopOpacity={0.35} />
                                            <stop offset="95%" stopColor="#059669" stopOpacity={0.02} />
                                        </linearGradient>
                                        <linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#dc2626" stopOpacity={0.35} />
                                            <stop offset="95%" stopColor="#dc2626" stopOpacity={0.02} />
                                        </linearGradient>
                                        <linearGradient id="payoutFill" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#d97706" stopOpacity={0.35} />
                                            <stop offset="95%" stopColor="#d97706" stopOpacity={0.02} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                                    <YAxis
                                        tick={{ fontSize: 11, fill: '#6b7280' }}
                                        axisLine={false}
                                        tickLine={false}
                                        tickFormatter={(value) => compactMoney(value)}
                                        width={56}
                                    />
                                    <Tooltip formatter={(value) => formatMoney(value)} contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                                    <Legend wrapperStyle={{ fontSize: 12 }} />
                                    <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#059669" fill="url(#revenueFill)" strokeWidth={2} />
                                    <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#dc2626" fill="url(#expenseFill)" strokeWidth={2} />
                                    <Area type="monotone" dataKey="payouts" name="Payouts" stroke="#d97706" fill="url(#payoutFill)" strokeWidth={2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </section>

                    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between gap-3">
                            <h3 className="text-base font-semibold text-gray-900">Recent Transactions</h3>
                            <Link href={route('admin.finance.ledger')} className="text-sm font-semibold text-brand hover:text-brand-dark">
                                View full ledger
                            </Link>
                        </div>

                        <div className="mt-4 space-y-2">
                            {recentTransactions.length === 0 && (
                                <p className="text-sm text-gray-500">No transactions recorded yet.</p>
                            )}

                            {recentTransactions.map((transaction, index) => (
                                <div
                                    key={`${transaction.type}-${transaction.reference}-${index}`}
                                    className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 px-3 py-2.5"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <span
                                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                                                transaction.amount >= 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                                            }`}
                                        >
                                            {transaction.amount >= 0 ? (
                                                <ArrowUpRight className="h-4 w-4" />
                                            ) : (
                                                <ArrowDownRight className="h-4 w-4" />
                                            )}
                                        </span>
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-medium text-gray-900">{transaction.description}</p>
                                            <p className="text-xs text-gray-500">
                                                {transaction.reference} · {transaction.date}
                                            </p>
                                        </div>
                                    </div>
                                    <span
                                        className={`shrink-0 text-sm font-semibold ${
                                            transaction.amount >= 0 ? 'text-emerald-700' : 'text-red-700'
                                        }`}
                                    >
                                        {transaction.amount >= 0 ? '+' : '-'}
                                        {formatMoney(Math.abs(transaction.amount), transaction.currency)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function KpiCard({ label, value, change, tone = 'emerald', invertChangeTone = false }) {
    const toneClasses = {
        emerald: 'text-emerald-700',
        red: 'text-red-700',
        amber: 'text-amber-700',
    };

    const hasChange = typeof change === 'number';
    const isPositiveChange = hasChange && change >= 0;
    const changeIsGood = invertChangeTone ? !isPositiveChange : isPositiveChange;

    return (
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
            <p className={`mt-2 text-xl font-bold ${toneClasses[tone] || 'text-gray-900'} sm:text-2xl`}>{value}</p>
            {hasChange && (
                <p className={`mt-1 flex items-center gap-1 text-xs font-medium ${changeIsGood ? 'text-emerald-600' : 'text-red-600'}`}>
                    {isPositiveChange ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {Math.abs(change)}% vs last month
                </p>
            )}
        </div>
    );
}

function compactMoney(amount) {
    const value = Number(amount || 0);

    if (Math.abs(value) >= 1_000_000) {
        return `₦${(value / 1_000_000).toFixed(1)}M`;
    }

    if (Math.abs(value) >= 1_000) {
        return `₦${(value / 1_000).toFixed(0)}K`;
    }

    return `₦${value.toFixed(0)}`;
}
