import { Eyebrow } from '@/Components/PublicUI';
import { Card } from '@/Components/ui/card';
import { MobileCard, MobileCardHeader, MobileCardList, MobileCardRow } from '@/Components/ui/mobile-cards';
import { StatCard, StatGrid } from '@/Components/ui/stat-card';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatMoney } from '@/lib/utils';
import { Head, Link } from '@inertiajs/react';
import { Calendar, ReceiptText, Wallet } from 'lucide-react';

export default function MyEarnings({ stats = {}, splits }) {
    const rows = splits?.data || [];

    return (
        <AuthenticatedLayout>
            <Head title="My Earnings" />

            <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
                <Card className="p-5 sm:p-6">
                    <Eyebrow>Earnings</Eyebrow>
                    <h1 className="jv-display jv-display--md mt-5">My Earnings</h1>
                    <p className="jv-lead mt-4">
                        Your share of every invoice payment, calculated automatically the moment it&apos;s marked paid.
                    </p>
                </Card>

                <StatGrid>
                    <StatCard icon={Wallet} label="Total Earned" value={formatMoney(stats.total_earned)} tone="emerald" />
                    <StatCard icon={Calendar} label="This Month" value={formatMoney(stats.this_month)} tone="brand" />
                    <StatCard icon={ReceiptText} label="Invoices Contributed To" value={stats.invoice_count ?? 0} tone="sky" />
                </StatGrid>

                <Card className="overflow-hidden">
                    <div className="border-b border-jv-line px-5 py-4 sm:px-6">
                        <h2 className="text-lg font-semibold tracking-tight text-white">Earnings History</h2>
                    </div>

                    <div className="hidden overflow-x-auto md:block">
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="border-b border-jv-line text-left text-xs uppercase tracking-wide text-white/45">
                                    <th className="px-5 py-3 font-medium sm:px-6">Invoice</th>
                                    <th className="px-5 py-3 font-medium sm:px-6">Paid</th>
                                    <th className="px-5 py-3 text-right font-medium sm:px-6">Invoice Total</th>
                                    <th className="px-5 py-3 text-right font-medium sm:px-6">Your Cut</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.length === 0 && (
                                    <tr>
                                        <td className="px-5 py-4 text-white/45 sm:px-6" colSpan={4}>
                                            No earnings recorded yet.
                                        </td>
                                    </tr>
                                )}

                                {rows.map((split) => (
                                    <tr key={split.id} className="border-b border-jv-line/70 transition hover:bg-white/[0.04]">
                                        <td className="px-5 py-3 align-top sm:px-6">
                                            <p className="font-semibold text-white">{split.invoice_number}</p>
                                            <p className="text-xs text-white/45">{split.invoice_title}</p>
                                        </td>
                                        <td className="px-5 py-3 align-top text-white/80 sm:px-6">{split.paid_at}</td>
                                        <td className="px-5 py-3 align-top text-right text-white/80 sm:px-6">
                                            {formatMoney(split.total_amount, split.currency)}
                                        </td>
                                        <td className="px-5 py-3 align-top text-right sm:px-6">
                                            <p className="font-semibold text-emerald-300">{formatMoney(split.your_amount, split.currency)}</p>
                                            <p className="text-xs text-white/45">{split.your_percent}%</p>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="p-5 md:hidden">
                        {rows.length === 0 ? (
                            <p className="text-sm text-white/45">No earnings recorded yet.</p>
                        ) : (
                            <MobileCardList>
                                {rows.map((split, index) => (
                                    <MobileCard key={split.id} index={index}>
                                        <MobileCardHeader title={split.invoice_number} subtitle={`${split.invoice_title} · ${split.paid_at}`} />
                                        <div className="mt-3 space-y-0.5 divide-y divide-jv-line/70">
                                            <MobileCardRow label="Invoice Total" value={formatMoney(split.total_amount, split.currency)} />
                                            <MobileCardRow
                                                label="Your Cut"
                                                value={
                                                    <span className="text-emerald-300">
                                                        {formatMoney(split.your_amount, split.currency)} ({split.your_percent}%)
                                                    </span>
                                                }
                                            />
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
                                <span className="cursor-not-allowed rounded-full border border-jv-line px-3.5 py-2 text-xs font-semibold text-white/25">
                                    Previous
                                </span>
                            )}
                            {splits?.next_page_url ? (
                                <Link href={splits.next_page_url} className="jv-btn jv-btn--ghost jv-btn--sm" preserveScroll>
                                    Next
                                </Link>
                            ) : (
                                <span className="cursor-not-allowed rounded-full border border-jv-line px-3.5 py-2 text-xs font-semibold text-white/25">
                                    Next
                                </span>
                            )}
                        </div>
                    </div>
                </Card>
            </div>
        </AuthenticatedLayout>
    );
}
