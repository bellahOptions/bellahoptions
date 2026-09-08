import { MobileCard, MobileCardList, MobileCardRow } from '@/Components/ui/mobile-cards';
import { StatCard, StatGrid } from '@/Components/ui/stat-card';
import FinanceTabs from '@/Components/finance/FinanceTabs';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatMoney } from '@/lib/utils';
import { Head, Link } from '@inertiajs/react';
import { Bot, CheckCircle2, Database, Megaphone, Users, User, Wallet } from 'lucide-react';

export default function IncomeSplits({ totals = {}, formula = {}, staffRoster = [], splits }) {
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
                            <span className="rounded-full bg-fuchsia-100 px-3 py-1.5 text-fuchsia-700">Staff commissions: per-person %</span>
                            <span className="rounded-full bg-brand-light px-3 py-1.5 text-brand">You: remainder</span>
                        </div>
                    </section>

                    <StatGrid>
                        <StatCard icon={Wallet} label="Total Split" value={formatMoney(totals.grand_total)} tone="brand" />
                        <StatCard icon={Megaphone} label="Ads Savings" value={formatMoney(totals.ads_savings)} tone="sky" />
                        <StatCard icon={Database} label="Data Savings" value={formatMoney(totals.data_savings)} tone="slate" />
                        <StatCard icon={Bot} label="AI Savings" value={formatMoney(totals.ai_savings)} tone="amber" />
                        <StatCard icon={User} label="Partner Paid" value={formatMoney(totals.partner_total)} tone="emerald" />
                        <StatCard icon={Users} label="Staff Commissions" value={formatMoney(totals.staff_commission_total)} tone="fuchsia" />
                        <StatCard icon={CheckCircle2} label="Owner Retains" value={formatMoney(totals.owner_total)} tone="brand" />
                    </StatGrid>

                    {staffRoster.length > 0 && (
                        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                            <h3 className="text-lg font-semibold text-gray-900">Commission-Eligible Staff</h3>
                            <p className="mt-1 text-sm text-gray-600">
                                Lifetime earnings for every staff member currently flagged eligible for commissions.
                            </p>

                            <div className="mt-4 hidden overflow-x-auto md:block">
                                <table className="min-w-full divide-y divide-gray-200 text-sm">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-3 py-2 text-left font-semibold text-gray-600">Staff</th>
                                            <th className="px-3 py-2 text-right font-semibold text-gray-600">Commission %</th>
                                            <th className="px-3 py-2 text-right font-semibold text-gray-600">Invoices</th>
                                            <th className="px-3 py-2 text-right font-semibold text-gray-600">Total Earned</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {staffRoster.map((staff) => (
                                            <tr key={staff.name}>
                                                <td className="px-3 py-3 align-top">
                                                    <p className="font-semibold text-gray-900">{staff.name}</p>
                                                    <p className="text-xs text-gray-500">{staff.position || 'Staff'}</p>
                                                </td>
                                                <td className="px-3 py-3 align-top text-right text-gray-700">{formatPercent(staff.commission_percent)}%</td>
                                                <td className="px-3 py-3 align-top text-right text-gray-700">{staff.invoice_count}</td>
                                                <td className="px-3 py-3 align-top text-right font-semibold text-fuchsia-700">
                                                    {formatMoney(staff.total_earned)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <MobileCardList>
                                {staffRoster.map((staff, index) => (
                                    <MobileCard key={staff.name} index={index}>
                                        <p className="font-semibold text-gray-900">{staff.name}</p>
                                        <p className="text-xs text-gray-500">{staff.position || 'Staff'}</p>
                                        <div className="mt-3 space-y-0.5 divide-y divide-gray-50">
                                            <MobileCardRow label="Commission %" value={`${formatPercent(staff.commission_percent)}%`} />
                                            <MobileCardRow label="Invoices" value={staff.invoice_count} />
                                            <MobileCardRow label="Total Earned" value={formatMoney(staff.total_earned)} />
                                        </div>
                                    </MobileCard>
                                ))}
                            </MobileCardList>
                        </section>
                    )}

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
                                        <th className="px-3 py-2 text-left font-semibold text-gray-600">Staff Commissions</th>
                                        <th className="px-3 py-2 text-right font-semibold text-gray-600">Owner</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {rows.length === 0 && (
                                        <tr>
                                            <td className="px-3 py-4 text-gray-500" colSpan={8}>
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
                                            <td className="px-3 py-3 align-top">
                                                {split.staff_commissions?.length ? (
                                                    <ul className="space-y-1">
                                                        {split.staff_commissions.map((commission, index) => (
                                                            <li key={`${split.id}-${index}`} className="text-xs">
                                                                <span className="font-semibold text-fuchsia-700">
                                                                    {formatMoney(commission.amount, split.currency)}
                                                                </span>
                                                                <span className="text-gray-500"> · {commission.user_name || 'Staff'} ({formatPercent(commission.percent)}%)</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <span className="text-xs text-gray-400">None</span>
                                                )}
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
                                            {split.staff_commissions?.map((commission, index) => (
                                                <MobileCardRow
                                                    key={`${split.id}-${index}`}
                                                    label={commission.user_name || 'Staff'}
                                                    value={formatMoney(commission.amount, split.currency)}
                                                />
                                            ))}
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
