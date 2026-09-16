import { Badge } from '@/Components/ui/badge';
import { Card } from '@/Components/ui/card';
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
            header={<h2 className="jv-display jv-display--sm">Income Splits</h2>}
        >
            <Head title="Income Splits" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
                    <FinanceTabs active="income-splits" />

                    <Card className="p-5 sm:p-6">
                        <h3 className="text-lg font-semibold text-white">How every paid invoice is split</h3>
                        <p className="mt-1 text-sm text-white/60">
                            Applied automatically the moment an invoice is marked paid — the three reserve
                            percentages and the partner percentage are fixed; you (owner) absorb whatever remains,
                            so every split always reconciles to exactly 100% of the invoice.
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2">
                            <Badge className="border-transparent bg-sky-500/15 px-3 py-1.5 text-sky-300">Ads Savings {formatPercent(formula.ads_savings_percent)}%</Badge>
                            <Badge className="border-transparent bg-violet-500/15 px-3 py-1.5 text-violet-300">Data Savings {formatPercent(formula.data_savings_percent)}%</Badge>
                            <Badge className="border-transparent bg-amber-500/15 px-3 py-1.5 text-amber-300">AI Savings {formatPercent(formula.ai_savings_percent)}%</Badge>
                            <Badge className="border-transparent bg-emerald-500/15 px-3 py-1.5 text-emerald-300">Partner {formatPercent(formula.partner_percent)}%</Badge>
                            <Badge className="border-transparent bg-fuchsia-500/15 px-3 py-1.5 text-fuchsia-300">Staff commissions: per-person %</Badge>
                            <Badge className="border-transparent bg-jv-accent/20 px-3 py-1.5 text-[#a9c4ff]">You: remainder</Badge>
                        </div>
                    </Card>

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
                        <Card className="overflow-hidden">
                            <div className="border-b border-jv-line px-5 py-4 sm:px-6">
                                <h3 className="text-lg font-semibold text-white">Commission-Eligible Staff</h3>
                                <p className="mt-1 text-sm text-white/60">
                                    Lifetime earnings for every staff member currently flagged eligible for commissions.
                                </p>
                            </div>

                            <div className="hidden overflow-x-auto md:block">
                                <table className="min-w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-jv-line text-xs uppercase tracking-wide text-white/45">
                                            <th className="px-5 py-3 font-medium sm:px-6">Staff</th>
                                            <th className="px-5 py-3 text-right font-medium sm:px-6">Commission %</th>
                                            <th className="px-5 py-3 text-right font-medium sm:px-6">Invoices</th>
                                            <th className="px-5 py-3 text-right font-medium sm:px-6">Total Earned</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {staffRoster.map((staff) => (
                                            <tr key={staff.name} className="border-b border-jv-line/70 transition hover:bg-white/[0.04]">
                                                <td className="px-5 py-3 align-top sm:px-6">
                                                    <p className="font-semibold text-white">{staff.name}</p>
                                                    <p className="text-xs text-white/45">{staff.position || 'Staff'}</p>
                                                </td>
                                                <td className="px-5 py-3 align-top text-right text-white/80 sm:px-6">{formatPercent(staff.commission_percent)}%</td>
                                                <td className="px-5 py-3 align-top text-right text-white/80 sm:px-6">{staff.invoice_count}</td>
                                                <td className="px-5 py-3 align-top text-right font-semibold text-fuchsia-300 sm:px-6">
                                                    {formatMoney(staff.total_earned)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="p-5 md:hidden">
                                <MobileCardList>
                                    {staffRoster.map((staff, index) => (
                                        <MobileCard key={staff.name} index={index}>
                                            <p className="font-semibold text-white">{staff.name}</p>
                                            <p className="text-xs text-white/45">{staff.position || 'Staff'}</p>
                                            <div className="mt-3 space-y-0.5 divide-y divide-jv-line/70">
                                                <MobileCardRow label="Commission %" value={`${formatPercent(staff.commission_percent)}%`} />
                                                <MobileCardRow label="Invoices" value={staff.invoice_count} />
                                                <MobileCardRow label="Total Earned" value={formatMoney(staff.total_earned)} />
                                            </div>
                                        </MobileCard>
                                    ))}
                                </MobileCardList>
                            </div>
                        </Card>
                    )}

                    <Card className="overflow-hidden">
                        <div className="border-b border-jv-line px-5 py-4 sm:px-6">
                            <h3 className="text-lg font-semibold text-white">Split History</h3>
                        </div>

                        <div className="hidden overflow-x-auto md:block">
                            <table className="min-w-full text-sm">
                                <thead>
                                    <tr className="border-b border-jv-line text-xs uppercase tracking-wide text-white/45">
                                        <th className="px-5 py-3 text-left font-medium sm:px-6">Invoice</th>
                                        <th className="px-5 py-3 text-right font-medium sm:px-6">Total</th>
                                        <th className="px-5 py-3 text-right font-medium sm:px-6">Ads</th>
                                        <th className="px-5 py-3 text-right font-medium sm:px-6">Data</th>
                                        <th className="px-5 py-3 text-right font-medium sm:px-6">AI</th>
                                        <th className="px-5 py-3 text-right font-medium sm:px-6">Partner</th>
                                        <th className="px-5 py-3 text-left font-medium sm:px-6">Staff Commissions</th>
                                        <th className="px-5 py-3 text-right font-medium sm:px-6">Owner</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.length === 0 && (
                                        <tr className="border-b border-jv-line/70">
                                            <td className="px-5 py-4 text-white/45 sm:px-6" colSpan={8}>
                                                No paid invoices have been split yet.
                                            </td>
                                        </tr>
                                    )}

                                    {rows.map((split) => (
                                        <tr key={split.id} className="border-b border-jv-line/70 transition hover:bg-white/[0.04]">
                                            <td className="px-5 py-3 align-top sm:px-6">
                                                <p className="font-semibold text-white">{split.invoice_number}</p>
                                                <p className="text-xs text-white/45">{split.invoice_title} · {split.paid_at}</p>
                                            </td>
                                            <td className="px-5 py-3 align-top text-right font-semibold text-white sm:px-6">
                                                {formatMoney(split.total_amount, split.currency)}
                                            </td>
                                            <td className="px-5 py-3 align-top text-right text-white/80 sm:px-6">{formatMoney(split.ads_savings_amount, split.currency)}</td>
                                            <td className="px-5 py-3 align-top text-right text-white/80 sm:px-6">{formatMoney(split.data_savings_amount, split.currency)}</td>
                                            <td className="px-5 py-3 align-top text-right text-white/80 sm:px-6">{formatMoney(split.ai_savings_amount, split.currency)}</td>
                                            <td className="px-5 py-3 align-top text-right sm:px-6">
                                                <p className="font-semibold text-emerald-300">{formatMoney(split.partner_amount, split.currency)}</p>
                                                <p className="text-xs text-white/45">
                                                    {split.partner_name || 'Partner'} · {split.partner_notified ? 'Notified' : 'Not notified'}
                                                </p>
                                            </td>
                                            <td className="px-5 py-3 align-top sm:px-6">
                                                {split.staff_commissions?.length ? (
                                                    <ul className="space-y-1">
                                                        {split.staff_commissions.map((commission, index) => (
                                                            <li key={`${split.id}-${index}`} className="text-xs">
                                                                <span className="font-semibold text-fuchsia-300">
                                                                    {formatMoney(commission.amount, split.currency)}
                                                                </span>
                                                                <span className="text-white/45"> · {commission.user_name || 'Staff'} ({formatPercent(commission.percent)}%)</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <span className="text-xs text-white/40">None</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3 align-top text-right sm:px-6">
                                                <p className="font-semibold text-[#a9c4ff]">{formatMoney(split.owner_amount, split.currency)}</p>
                                                <p className="text-xs text-white/45">{split.owner_name || 'Owner'}</p>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="p-5 md:hidden">
                            {rows.length === 0 ? (
                                <p className="text-sm text-white/45">No paid invoices have been split yet.</p>
                            ) : (
                                <MobileCardList>
                                    {rows.map((split, index) => (
                                        <MobileCard key={split.id} index={index}>
                                            <p className="font-semibold text-white">{split.invoice_number}</p>
                                            <p className="text-xs text-white/45">{split.invoice_title} · {split.paid_at}</p>
                                            <div className="mt-3 space-y-0.5 divide-y divide-jv-line/70">
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
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-jv-line px-5 py-4 text-sm text-white/55 sm:px-6">
                            <p>
                                Page {splits?.current_page || 1} of {splits?.last_page || 1}
                            </p>
                            <div className="flex items-center gap-2">
                                {splits?.prev_page_url ? (
                                    <Link href={splits.prev_page_url} className="jv-btn jv-btn--ghost jv-btn--sm" preserveScroll>
                                        Previous
                                    </Link>
                                ) : (
                                    <span className="cursor-not-allowed rounded-full border border-jv-line px-3.5 py-2 text-xs font-semibold text-white/25">Previous</span>
                                )}
                                {splits?.next_page_url ? (
                                    <Link href={splits.next_page_url} className="jv-btn jv-btn--ghost jv-btn--sm" preserveScroll>
                                        Next
                                    </Link>
                                ) : (
                                    <span className="cursor-not-allowed rounded-full border border-jv-line px-3.5 py-2 text-xs font-semibold text-white/25">Next</span>
                                )}
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function formatPercent(value) {
    const number = Number(value || 0);
    return Number.isInteger(number) ? number : number.toFixed(2);
}
