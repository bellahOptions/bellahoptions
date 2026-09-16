import { Eyebrow } from '@/Components/PublicUI';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Card } from '@/Components/ui/card';
import { MobileCard, MobileCardActions, MobileCardHeader, MobileCardList, MobileCardRow } from '@/Components/ui/mobile-cards';
import { StatCard, StatGrid } from '@/Components/ui/stat-card';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';

const money = new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
});

export default function Orders({ orders = [], stats = {} }) {
    const { flash } = usePage().props;
    const [renewingId, setRenewingId] = useState(null);

    const renewOrder = (order) => {
        if (!window.confirm(`Renew "${order.service_name} · ${order.package_name}"? A new invoice for ${money.format(order.amount || 0)} will be created for you to pay.`)) {
            return;
        }

        setRenewingId(order.id);
        router.post(route('dashboard.orders.renew', order.id), {}, {
            onFinish: () => setRenewingId(null),
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Job Progress" />

            <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                {flash?.success && (
                    <div className="rounded-jv-sm border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                        {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div className="rounded-jv-sm border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                        {flash.error}
                    </div>
                )}

                <Card className="p-5 sm:p-6">
                    <Eyebrow>Job Progress</Eyebrow>
                    <h1 className="jv-display jv-display--md mt-5">Job Progress & Management</h1>
                    <p className="jv-lead mt-4">Monitor every service order and open any job for full status details.</p>
                </Card>

                <StatGrid>
                    <StatCard label="Total" value={stats.total ?? 0} tone="brand" />
                    <StatCard label="Active" value={stats.active ?? 0} tone="sky" />
                    <StatCard label="Completed" value={stats.completed ?? 0} tone="emerald" />
                    <StatCard label="Unpaid" value={stats.unpaid ?? 0} tone="amber" />
                </StatGrid>

                <Card className="p-5">
                    <div className="hidden overflow-x-auto md:block">
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="border-b border-jv-line text-left text-xs uppercase tracking-wide text-white/45">
                                    <th className="px-3 py-2 font-medium">Code</th>
                                    <th className="px-3 py-2 font-medium">Service</th>
                                    <th className="px-3 py-2 font-medium">Amount</th>
                                    <th className="px-3 py-2 font-medium">Payment</th>
                                    <th className="px-3 py-2 font-medium">Progress</th>
                                    <th className="px-3 py-2 font-medium">Status</th>
                                    <th className="px-3 py-2"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map((order) => (
                                    <tr key={order.id} className="border-b border-jv-line/70 transition hover:bg-white/[0.04]">
                                        <td className="px-3 py-3 font-semibold text-white">{order.order_code}</td>
                                        <td className="px-3 py-3 text-white/80">{order.service_name} · {order.package_name}</td>
                                        <td className="px-3 py-3 text-white/80">{money.format(order.amount || 0)}</td>
                                        <td className="px-3 py-3 capitalize text-white/80">{order.payment_status}</td>
                                        <td className="px-3 py-3">
                                            <div className="h-2 w-32 rounded-full bg-white/[0.08]">
                                                <div className="h-full rounded-full bg-jv-accent" style={{ width: `${Math.max(0, Math.min(100, order.progress_percent || 0))}%` }} />
                                            </div>
                                        </td>
                                        <td className="px-3 py-3 capitalize text-white/80">{order.order_status}</td>
                                        <td className="px-3 py-3 text-right">
                                            <div className="flex items-center justify-end gap-3">
                                                {order.can_renew && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => renewOrder(order)}
                                                        disabled={renewingId === order.id}
                                                        className="text-emerald-300 hover:bg-emerald-500/10 hover:text-emerald-200"
                                                    >
                                                        {renewingId === order.id ? 'Renewing…' : 'Renew'}
                                                    </Button>
                                                )}
                                                <Link href={order.show_url} className="jv-btn jv-btn--ghost jv-btn--sm">
                                                    Open
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {orders.length === 0 ? (
                        <p className="text-sm text-white/45 md:hidden">No jobs yet.</p>
                    ) : (
                        <MobileCardList>
                            {orders.map((order, index) => (
                                <MobileCard key={order.id} index={index}>
                                    <MobileCardHeader
                                        title={order.order_code}
                                        subtitle={`${order.service_name} · ${order.package_name}`}
                                        badge={
                                            <Badge variant={order.payment_status === 'paid' ? 'success' : 'warning'} className="shrink-0 capitalize">
                                                {order.payment_status}
                                            </Badge>
                                        }
                                    />

                                    <div className="mt-3 space-y-0.5 divide-y divide-jv-line/70">
                                        <MobileCardRow label="Amount" value={money.format(order.amount || 0)} />
                                        <MobileCardRow label="Status" value={<span className="capitalize">{order.order_status}</span>} />
                                    </div>

                                    <div className="mt-3 flex items-center gap-3">
                                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.08]">
                                            <div
                                                className="h-full rounded-full bg-jv-accent transition-all"
                                                style={{ width: `${Math.max(0, Math.min(100, order.progress_percent || 0))}%` }}
                                            />
                                        </div>
                                        <span className="shrink-0 text-xs font-semibold text-white/45">
                                            {order.progress_percent || 0}%
                                        </span>
                                    </div>

                                    <MobileCardActions>
                                        <Link
                                            href={order.show_url}
                                            className="jv-btn jv-btn--ghost jv-btn--sm flex-1"
                                        >
                                            Open
                                        </Link>
                                        {order.can_renew && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => renewOrder(order)}
                                                disabled={renewingId === order.id}
                                                className="flex-1 text-emerald-300 hover:bg-emerald-500/10 hover:text-emerald-200"
                                            >
                                                {renewingId === order.id ? 'Renewing…' : 'Renew'}
                                            </Button>
                                        )}
                                    </MobileCardActions>
                                </MobileCard>
                            ))}
                        </MobileCardList>
                    )}
                </Card>
            </div>
        </AuthenticatedLayout>
    );
}
