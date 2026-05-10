import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

const compactMoney = new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
});

function statusClasses(status) {
    if (status === 'delivered') {
        return 'bg-emerald-100 text-emerald-700';
    }

    return 'bg-amber-100 text-amber-700';
}

export default function UserDashboard({
    user = {},
    stats = {},
    recent_projects: recentProjects = [],
    quick_actions: quickActions = {},
    notifications = {},
}) {
    return (
        <AuthenticatedLayout>
            <Head title="Dashboard" />

            <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                <section className="rounded-2xl border border-slate-200 bg-gradient-to-r from-white via-sky-50 to-blue-50 p-6">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">Customer Workspace</p>
                    <h1 className="mt-2 text-2xl font-black text-slate-900">Welcome back, {user?.name || 'Customer'}</h1>
                    <p className="mt-2 max-w-2xl text-sm text-slate-600">
                        Track all your active jobs, payouts, and updates from one light workspace.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-3">
                        <Link
                            href={quickActions?.order_service_url || route('orders.create', 'social-media-design')}
                            className="rounded-lg bg-[#000285] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0012ad]"
                        >
                            Order New Service
                        </Link>
                        <Link
                            href={route('dashboard.support')}
                            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                        >
                            Open Support Workspace
                        </Link>
                    </div>
                </section>

                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <MetricCard label="Total Jobs" value={stats?.total_jobs ?? 0} />
                    <MetricCard label="Active Projects" value={stats?.active_projects ?? 0} />
                    <MetricCard label="Uploads Today" value={stats?.uploaded_today ?? 0} />
                    <MetricCard label="Unread Messages" value={notifications?.unread_count ?? 0} />
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                        <h2 className="text-lg font-bold text-slate-900">Recent Projects</h2>
                        <Link href={route('dashboard.orders')} className="text-sm font-semibold text-blue-700 hover:text-blue-800">
                            View all jobs
                        </Link>
                    </div>

                    {recentProjects.length === 0 ? (
                        <p className="mt-4 text-sm text-slate-500">No projects yet. Start your first service order.</p>
                    ) : (
                        <div className="mt-4 overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200 text-sm">
                                <thead>
                                    <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                                        <th className="px-3 py-2">Order</th>
                                        <th className="px-3 py-2">Description</th>
                                        <th className="px-3 py-2">Amount</th>
                                        <th className="px-3 py-2">ETA</th>
                                        <th className="px-3 py-2">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {recentProjects.map((project) => (
                                        <tr key={project.order_id}>
                                            <td className="px-3 py-3 font-semibold text-slate-700">{project.order_id}</td>
                                            <td className="px-3 py-3 text-slate-600">{project.description}</td>
                                            <td className="px-3 py-3 text-slate-700">{compactMoney.format(project.amount || 0)}</td>
                                            <td className="px-3 py-3 text-slate-600">{project.est_delivery_date || 'TBD'}</td>
                                            <td className="px-3 py-3">
                                                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClasses(project.status)}`}>
                                                    {project.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </div>
        </AuthenticatedLayout>
    );
}

function MetricCard({ label, value }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-black text-slate-900">{value}</p>
        </div>
    );
}
