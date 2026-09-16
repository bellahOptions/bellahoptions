import { Card } from '@/Components/ui/card';
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
                    <h2 className="jv-display jv-display--sm">Finance</h2>
                    <Link
                        href={route('admin.finance.ledger.export')}
                        className="jv-btn jv-btn--ghost jv-btn--sm"
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
                        <div className="rounded-jv-sm border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                            {flash.success}
                        </div>
                    )}
                    {flash?.error && (
                        <div className="rounded-jv-sm border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
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
                        <div className="flex items-center gap-3 rounded-jv-sm border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                            <Wallet className="h-4 w-4 shrink-0" />
                            <span>
                                {kpis.pending_payouts_count} pending payout{kpis.pending_payouts_count === 1 ? '' : 's'} totalling{' '}
                                {formatMoney(kpis.pending_payouts)} awaiting settlement.
                            </span>
                            <Link href={route('admin.finance.payouts.index')} className="ml-auto shrink-0 font-semibold text-amber-100 hover:underline">
                                Review
                            </Link>
                        </div>
                    )}

                    <Card className="p-5">
                        <h3 className="text-base font-semibold text-white">Revenue vs Expenses vs Payouts (last 12 months)</h3>
                        <div className="mt-4 h-72 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={monthlySeries} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#34d399" stopOpacity={0.35} />
                                            <stop offset="95%" stopColor="#34d399" stopOpacity={0.02} />
                                        </linearGradient>
                                        <linearGradient id="expenseFill" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f87171" stopOpacity={0.35} />
                                            <stop offset="95%" stopColor="#f87171" stopOpacity={0.02} />
                                        </linearGradient>
                                        <linearGradient id="payoutFill" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.35} />
                                            <stop offset="95%" stopColor="#fbbf24" stopOpacity={0.02} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.12)" />
                                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.5)' }} axisLine={false} tickLine={false} />
                                    <YAxis
                                        tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.5)' }}
                                        axisLine={false}
                                        tickLine={false}
                                        tickFormatter={(value) => compactMoney(value)}
                                        width={56}
                                    />
                                    <Tooltip
                                        formatter={(value) => formatMoney(value)}
                                        contentStyle={{
                                            backgroundColor: '#12121a',
                                            border: '1px solid rgba(255,255,255,0.12)',
                                            borderRadius: 12,
                                            color: '#fff',
                                            fontSize: 12,
                                        }}
                                        labelStyle={{ color: 'rgba(255,255,255,0.6)' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Legend wrapperStyle={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }} />
                                    <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#34d399" fill="url(#revenueFill)" strokeWidth={2} />
                                    <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#f87171" fill="url(#expenseFill)" strokeWidth={2} />
                                    <Area type="monotone" dataKey="payouts" name="Payouts" stroke="#fbbf24" fill="url(#payoutFill)" strokeWidth={2} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>

                    <Card className="p-5">
                        <div className="flex items-center justify-between gap-3">
                            <h3 className="text-base font-semibold text-white">Recent Transactions</h3>
                            <Link href={route('admin.finance.ledger')} className="text-sm font-semibold text-jv-accent hover:text-[#4d8bff]">
                                View full ledger
                            </Link>
                        </div>

                        <div className="mt-4 space-y-2">
                            {recentTransactions.length === 0 && (
                                <p className="text-sm text-white/45">No transactions recorded yet.</p>
                            )}

                            {recentTransactions.map((transaction, index) => (
                                <div
                                    key={`${transaction.type}-${transaction.reference}-${index}`}
                                    className="flex items-center justify-between gap-3 rounded-jv-sm border border-jv-line px-3 py-2.5 transition hover:bg-white/[0.04]"
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <span
                                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                                                transaction.amount >= 0 ? 'bg-emerald-500/15 text-emerald-300' : 'bg-red-500/15 text-red-300'
                                            }`}
                                        >
                                            {transaction.amount >= 0 ? (
                                                <ArrowUpRight className="h-4 w-4" />
                                            ) : (
                                                <ArrowDownRight className="h-4 w-4" />
                                            )}
                                        </span>
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-medium text-white">{transaction.description}</p>
                                            <p className="text-xs text-white/45">
                                                {transaction.reference} · {transaction.date}
                                            </p>
                                        </div>
                                    </div>
                                    <span
                                        className={`shrink-0 text-sm font-semibold ${
                                            transaction.amount >= 0 ? 'text-emerald-300' : 'text-red-300'
                                        }`}
                                    >
                                        {transaction.amount >= 0 ? '+' : '-'}
                                        {formatMoney(Math.abs(transaction.amount), transaction.currency)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function KpiCard({ label, value, change, tone = 'emerald', invertChangeTone = false }) {
    const toneClasses = {
        emerald: 'text-emerald-300',
        red: 'text-red-300',
        amber: 'text-amber-300',
    };

    const hasChange = typeof change === 'number';
    const isPositiveChange = hasChange && change >= 0;
    const changeIsGood = invertChangeTone ? !isPositiveChange : isPositiveChange;

    return (
        <Card className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/45">{label}</p>
            <p className={`mt-2 text-xl font-bold ${toneClasses[tone] || 'text-white'} sm:text-2xl`}>{value}</p>
            {hasChange && (
                <p className={`mt-1 flex items-center gap-1 text-xs font-medium ${changeIsGood ? 'text-emerald-300' : 'text-red-300'}`}>
                    {isPositiveChange ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {Math.abs(change)}% vs last month
                </p>
            )}
        </Card>
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
