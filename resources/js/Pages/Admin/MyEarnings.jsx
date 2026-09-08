import { MobileCard, MobileCardHeader, MobileCardList, MobileCardRow } from '@/Components/ui/mobile-cards';
import { StatCard, StatGrid } from '@/Components/ui/stat-card';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatMoney } from '@/lib/utils';
import { Head, Link } from '@inertiajs/react';
import { Calendar, ReceiptText, Wallet } from 'lucide-react';

export default function MyEarnings({ stats = {}, splits }) {
    const rows = splits?.data || [];

    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold leading-tight text-gray-800">My Earnings</h2>}
        >
            <Head title="My Earnings" />

            <div className="py-8">
                <div className="mx-auto max-w-5xl space-y-6 px-4 sm:px-6 lg:px-8">
                    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                        <p className="text-sm text-gray-600">
                            Your share of every invoice payment, calculated automatically the moment it's marked paid.
                        </p>
                    </section>

                    <StatGrid>
                        <StatCard icon={Wallet} label="Total Earned" value={formatMoney(stats.total_earned)} tone="emerald" />
                        <StatCard icon={Calendar} label="This Month" value={formatMoney(stats.this_month)} tone="brand" />
                        <StatCard icon={ReceiptText} label="Invoices Contributed To" value={stats.invoice_count ?? 0} tone="sky" />
                    </StatGrid>

                    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                        <h3 className="text-lg font-semibold text-gray-900">Earnings History</h3>

                        <div className="mt-4 hidden overflow-x-auto md:block">
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-3 py-2 text-left font-semibold text-gray-600">Invoice</th>
                                        <th className="px-3 py-2 text-left font-semibold text-gray-600">Paid</th>
                                        <th className="px-3 py-2 text-right font-semibold text-gray-600">Invoice Total</th>
                                        <th className="px-3 py-2 text-right font-semibold text-gray-600">Your Cut</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {rows.length === 0 && (
                                        <tr>
                                            <td className="px-3 py-4 text-gray-500" colSpan={4}>
                                                No earnings recorded yet.
                                            </td>
                                        </tr>
                                    )}

                                    {rows.map((split) => (
                                        <tr key={split.id}>
                                            <td className="px-3 py-3 align-top">
                                                <p className="font-semibold text-gray-900">{split.invoice_number}</p>
                                                <p className="text-xs text-gray-500">{split.invoice_title}</p>
                                            </td>
                                            <td className="px-3 py-3 align-top text-gray-700">{split.paid_at}</td>
                                            <td className="px-3 py-3 align-top text-right text-gray-700">
                                                {formatMoney(split.total_amount, split.currency)}
                                            </td>
                                            <td className="px-3 py-3 align-top text-right">
                                                <p className="font-semibold text-emerald-700">{formatMoney(split.your_amount, split.currency)}</p>
                                                <p className="text-xs text-gray-500">{split.your_percent}%</p>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {rows.length === 0 ? (
                            <p className="text-sm text-gray-500 md:hidden">No earnings recorded yet.</p>
                        ) : (
                            <MobileCardList>
                                {rows.map((split, index) => (
                                    <MobileCard key={split.id} index={index}>
                                        <MobileCardHeader title={split.invoice_number} subtitle={`${split.invoice_title} · ${split.paid_at}`} />
                                        <div className="mt-3 space-y-0.5 divide-y divide-gray-50">
                                            <MobileCardRow label="Invoice Total" value={formatMoney(split.total_amount, split.currency)} />
                                            <MobileCardRow
                                                label="Your Cut"
                                                value={
                                                    <span className="text-emerald-700">
                                                        {formatMoney(split.your_amount, split.currency)} ({split.your_percent}%)
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
