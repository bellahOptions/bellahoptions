import { MobileCard, MobileCardActions, MobileCardHeader, MobileCardList, MobileCardRow } from '@/Components/ui/mobile-cards';
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
                    <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                        {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                        {flash.error}
                    </div>
                )}

                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h1 className="text-2xl font-black text-slate-900">Job Progress & Management</h1>
                    <p className="mt-2 text-sm text-slate-600">Monitor every service order and open any job for full status details.</p>
                </section>

                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <MiniStat label="Total" value={stats.total ?? 0} />
                    <MiniStat label="Active" value={stats.active ?? 0} />
                    <MiniStat label="Completed" value={stats.completed ?? 0} />
                    <MiniStat label="Unpaid" value={stats.unpaid ?? 0} />
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="hidden overflow-x-auto md:block">
                        <table className="min-w-full divide-y divide-slate-200 text-sm">
                            <thead>
                                <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                                    <th className="px-3 py-2">Code</th>
                                    <th className="px-3 py-2">Service</th>
                                    <th className="px-3 py-2">Amount</th>
                                    <th className="px-3 py-2">Payment</th>
                                    <th className="px-3 py-2">Progress</th>
                                    <th className="px-3 py-2">Status</th>
                                    <th className="px-3 py-2"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {orders.map((order) => (
                                    <tr key={order.id}>
                                        <td className="px-3 py-3 font-semibold text-slate-700">{order.order_code}</td>
                                        <td className="px-3 py-3 text-slate-600">{order.service_name} · {order.package_name}</td>
                                        <td className="px-3 py-3 text-slate-700">{money.format(order.amount || 0)}</td>
                                        <td className="px-3 py-3 text-slate-600 capitalize">{order.payment_status}</td>
                                        <td className="px-3 py-3">
                                            <div className="h-2 w-32 rounded-full bg-slate-100">
                                                <div className="h-full rounded-full bg-blue-600" style={{ width: `${Math.max(0, Math.min(100, order.progress_percent || 0))}%` }} />
                                            </div>
                                        </td>
                                        <td className="px-3 py-3 text-slate-600 capitalize">{order.order_status}</td>
                                        <td className="px-3 py-3 text-right">
                                            <div className="flex items-center justify-end gap-3">
                                                {order.can_renew && (
                                                    <button
                                                        type="button"
                                                        onClick={() => renewOrder(order)}
                                                        disabled={renewingId === order.id}
                                                        className="text-sm font-semibold text-emerald-700 hover:text-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
                                                    >
                                                        {renewingId === order.id ? 'Renewing…' : 'Renew'}
                                                    </button>
                                                )}
                                                <Link href={order.show_url} className="text-sm font-semibold text-blue-700 hover:text-blue-800">
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
                        <p className="text-sm text-slate-500 md:hidden">No jobs yet.</p>
                    ) : (
                        <MobileCardList>
                            {orders.map((order, index) => (
                                <MobileCard key={order.id} index={index}>
                                    <MobileCardHeader
                                        title={order.order_code}
                                        subtitle={`${order.service_name} · ${order.package_name}`}
                                        badge={
                                            <span className="inline-flex shrink-0 rounded-full bg-slate-100 px-2 py-1 text-xs font-medium capitalize text-slate-700">
                                                {order.payment_status}
                                            </span>
                                        }
                                    />

                                    <div className="mt-3 space-y-0.5 divide-y divide-gray-50">
                                        <MobileCardRow label="Amount" value={money.format(order.amount || 0)} />
                                        <MobileCardRow label="Status" value={<span className="capitalize">{order.order_status}</span>} />
                                    </div>

                                    <div className="mt-3 flex items-center gap-3">
                                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                                            <div
                                                className="h-full rounded-full bg-blue-600 transition-all"
                                                style={{ width: `${Math.max(0, Math.min(100, order.progress_percent || 0))}%` }}
                                            />
                                        </div>
                                        <span className="shrink-0 text-xs font-semibold text-slate-500">
                                            {order.progress_percent || 0}%
                                        </span>
                                    </div>

                                    <MobileCardActions>
                                        <Link
                                            href={order.show_url}
                                            className="flex-1 rounded-md border border-slate-200 px-3 py-2 text-center text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                        >
                                            Open
                                        </Link>
                                        {order.can_renew && (
                                            <button
                                                type="button"
                                                onClick={() => renewOrder(order)}
                                                disabled={renewingId === order.id}
                                                className="flex-1 rounded-md border border-emerald-200 px-3 py-2 text-center text-xs font-semibold text-emerald-700 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
                                            >
                                                {renewingId === order.id ? 'Renewing…' : 'Renew'}
                                            </button>
                                        )}
                                    </MobileCardActions>
                                </MobileCard>
                            ))}
                        </MobileCardList>
                    )}
                </section>
            </div>
        </AuthenticatedLayout>
    );
}

function MiniStat({ label, value }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-black text-slate-900">{value}</p>
        </div>
    );
}
