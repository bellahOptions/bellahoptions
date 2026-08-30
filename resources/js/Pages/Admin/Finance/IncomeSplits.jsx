import { MobileCard, MobileCardList, MobileCardRow } from '@/Components/ui/mobile-cards';
import { StatCard, StatGrid } from '@/Components/ui/stat-card';
import FinanceTabs from '@/Components/finance/FinanceTabs';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { Bot, CheckCircle2, Database, Megaphone, User, Wallet } from 'lucide-react';

export default function IncomeSplits({ totals = {}, formula = {}, splits }) {
    const rows = splits?.data || [];

    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Income Splits</h2>}
        >
            <Head title="Income Splits" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
                    <FinanceTabs active="income-splits" />

                    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                        <h3 className="text-lg font-semibold text-gray-900">How every paid invoice is split</h3>
                        <p className="mt-1 text-sm text-gray-600">
                            Applied automatically the moment an invoice is marked paid — the three reserve
                            percentages and the partner percentage are fixed; you (owner) absorb whatever remains,
                            so every split always reconciles to exactly 100% of the invoice.
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
                            <span className="rounded-full bg-sky-100 px-3 py-1.5 text-sky-700">Ads Savings {formatPercent(formula.ads_savings_percent)}%</span>
                            <span className="rounded-full bg-violet-100 px-3 py-1.5 text-violet-700">Data Savings {formatPercent(formula.data_savings_percent)}%</span>
                            <span className="rounded-full bg-amber-100 px-3 py-1.5 text-amber-700">AI Savings {formatPercent(formula.ai_savings_percent)}%</span>
                            <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-emerald-700">Partner {formatPercent(formula.partner_percent)}%</span>
                            <span className="rounded-full bg-brand-light px-3 py-1.5 text-brand">You: remainder</span>
                        </div>
                    </section>

                    <StatGrid>
                        <StatCard icon={Wallet} label="Total Split Across" value={formatMoney(totals.grand_total)} tone="brand" />
                        <StatCard icon={Megaphone} label="Ads Savings" value={formatMoney(totals.ads_savings)} tone="sky" />
                        <StatCard icon={Database} label="Data Savings" value={formatMoney(totals.data_savings)} tone="slate" />
                        <StatCard icon={Bot} label="AI Savings" value={formatMoney(totals.ai_savings)} tone="amber" />
                        <StatCard icon={User} label="Paid to Partner" value={formatMoney(totals.partner_total)} tone="emerald" />
                        <StatCard icon={CheckCircle2} label="Retained by Owner" value={formatMoney(totals.owner_total)} tone="brand" />
                    </StatGrid>

                    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                        <h3 className="text-lg font-semibold text-gray-900">Split History</h3>

                        <div className="mt-4 hidden overflow-x-auto md:block">
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-3 py-2 text-left font-semibold text-gray-600">Invoice</th>
                                        <th className="px-3 py-2 text-right font-semibold text-gray-600">Total</th>
                                        <th className="px-3 py-2 text-right font-semibold text-gray-600">Ads</th>
                                        <th className="px-3 py-2 text-right font-semibold text-gray-600">Data</th>
                                        <th className="px-3 py-2 text-right font-semibold text-gray-600">AI</th>
                                        <th className="px-3 py-2 text-right font-semibold text-gray-600">Partner</th>
                                        <th className="px-3 py-2 text-right font-semibold text-gray-600">Owner</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {rows.length === 0 && (
                                        <tr>
                                            <td className="px-3 py-4 text-gray-500" colSpan={7}>
                                                No paid invoices have been split yet.
                                            </td>
                                        </tr>
                                    )}

                                    {rows.map((split) => (
                                        <tr key={split.id}>
                                            <td className="px-3 py-3 align-top">
                                                <p className="font-semibold text-gray-900">{split.invoice_number}</p>
                                                <p className="text-xs text-gray-500">{split.invoice_title} · {split.paid_at}</p>
                                            </td>
                                            <td className="px-3 py-3 align-top text-right font-semibold text-gray-900">
                                                {formatMoney(split.total_amount, split.currency)}
                                            </td>
                                            <td className="px-3 py-3 align-top text-right text-gray-700">{formatMoney(split.ads_savings_amount, split.currency)}</td>
                                            <td className="px-3 py-3 align-top text-right text-gray-700">{formatMoney(split.data_savings_amount, split.currency)}</td>
                                            <td className="px-3 py-3 align-top text-right text-gray-700">{formatMoney(split.ai_savings_amount, split.currency)}</td>
                                            <td className="px-3 py-3 align-top text-right">
                                                <p className="font-semibold text-emerald-700">{formatMoney(split.partner_amount, split.currency)}</p>
                                                <p className="text-xs text-gray-500">
                                                    {split.partner_name || 'Partner'} · {split.partner_notified ? 'Notified' : 'Not notified'}
                                                </p>
                                            </td>
                                            <td className="px-3 py-3 align-top text-right">
                                                <p className="font-semibold text-brand">{formatMoney(split.owner_amount, split.currency)}</p>
                                                <p className="text-xs text-gray-500">{split.owner_name || 'Owner'}</p>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {rows.length === 0 ? (
                            <p className="text-sm text-gray-500 md:hidden">No paid invoices have been split yet.</p>
                        ) : (
                            <MobileCardList>
                                {rows.map((split, index) => (
                                    <MobileCard key={split.id} index={index}>
                                        <p className="font-semibold text-gray-900">{split.invoice_number}</p>
                                        <p className="text-xs text-gray-500">{split.invoice_title} · {split.paid_at}</p>
                                        <div className="mt-3 space-y-0.5 divide-y divide-gray-50">
                                            <MobileCardRow label="Total" value={formatMoney(split.total_amount, split.currency)} />
                                            <MobileCardRow label="Ads Savings" value={formatMoney(split.ads_savings_amount, split.currency)} />
                                            <MobileCardRow label="Data Savings" value={formatMoney(split.data_savings_amount, split.currency)} />
                                            <MobileCardRow label="AI Savings" value={formatMoney(split.ai_savings_amount, split.currency)} />
                                            <MobileCardRow label={split.partner_name || 'Partner'} value={formatMoney(split.partner_amount, split.currency)} />
                                            <MobileCardRow label={split.owner_name || 'Owner'} value={formatMoney(split.owner_amount, split.currency)} />
                                        </div>
                                    </MobileCard>
                                ))}
                            </MobileCardList>
                        )}

                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-gray-600">
                            <p>
                                Page {splits?.current_page || 1} of {splits?.last_page || 1}
                            </p>
                            <div className="flex items-center gap-2">
                                {splits?.prev_page_url ? (
                                    <Link href={splits.prev_page_url} className="rounded-md border border-gray-300 px-3 py-1.5 text-gray-700 hover:bg-gray-50" preserveScroll>
                                        Previous
                                    </Link>
                                ) : (
                                    <span className="cursor-not-allowed rounded-md border border-gray-200 px-3 py-1.5 text-gray-400">Previous</span>
                                )}
                                {splits?.next_page_url ? (
                                    <Link href={splits.next_page_url} className="rounded-md border border-gray-300 px-3 py-1.5 text-gray-700 hover:bg-gray-50" preserveScroll>
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

function formatPercent(value) {
    const number = Number(value || 0);
    return Number.isInteger(number) ? number : number.toFixed(2);
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
