import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

const money = new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
});

export default function Orders({ orders = [], stats = {} }) {
    return (
        <AuthenticatedLayout>
            <Head title="Job Progress" />

            <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
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
                    <div className="overflow-x-auto">
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
                                            <Link href={order.show_url} className="text-sm font-semibold text-blue-700 hover:text-blue-800">
                                                Open
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
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
