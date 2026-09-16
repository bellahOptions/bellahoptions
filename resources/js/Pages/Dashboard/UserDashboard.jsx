import { Eyebrow } from '@/Components/PublicUI';
import { Card } from '@/Components/ui/card';
import { MobileCard, MobileCardHeader, MobileCardList, MobileCardRow } from '@/Components/ui/mobile-cards';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useEffect } from 'react';

const compactMoney = new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
});

function statusClasses(status) {
    if (status === 'delivered') {
        return 'bg-emerald-500/15 text-emerald-300';
    }

    return 'bg-amber-500/15 text-amber-300';
}

export default function UserDashboard({
    user = {},
    stats = {},
    recent_projects: recentProjects = [],
    quick_actions: quickActions = {},
    notifications = {},
}) {
    useEffect(() => {
        const hasActiveWork = (stats?.active_projects ?? 0) > 0
            || recentProjects.some((project) => project.status !== 'delivered');

        if (!hasActiveWork) {
            return undefined;
        }

        const timer = window.setInterval(() => {
            router.reload({
                only: ['stats', 'recent_projects', 'notifications'],
                preserveScroll: true,
                preserveState: true,
            });
        }, 8000);

        return () => window.clearInterval(timer);
    }, [stats?.active_projects, recentProjects]);

    return (
        <AuthenticatedLayout>
            <Head title="Dashboard" />

            <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                <Card className="p-5 sm:p-6">
                    <Eyebrow>Customer Workspace</Eyebrow>
                    <h1 className="jv-display jv-display--md mt-5">Welcome back, {user?.name || 'Customer'}</h1>
                    <p className="jv-lead mt-4 max-w-2xl">
                        Track all your active jobs, payouts, and updates from one workspace.
                    </p>
                    <div className="mt-6 flex flex-wrap gap-3">
                        <Link
                            href={quickActions?.order_service_url || route('orders.create', 'social-media-design')}
                            className="jv-btn jv-btn--primary"
                        >
                            Order New Service
                        </Link>
                        <Link
                            href={route('dashboard.support')}
                            className="jv-btn jv-btn--ghost"
                        >
                            Open Support Workspace
                        </Link>
                    </div>
                </Card>

                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <MetricCard label="Total Jobs" value={stats?.total_jobs ?? 0} />
                    <MetricCard label="Active Projects" value={stats?.active_projects ?? 0} />
                    <MetricCard label="Uploads Today" value={stats?.uploaded_today ?? 0} />
                    <MetricCard label="Unread Messages" value={notifications?.unread_count ?? 0} />
                </section>

                <Card className="p-5">
                    <div className="flex items-center justify-between gap-3">
                        <h2 className="text-lg font-semibold tracking-tight text-white">Recent Projects</h2>
                        <Link href={route('dashboard.orders')} className="text-sm font-semibold text-[#a9c4ff] transition-colors hover:text-white">
                            View all jobs
                        </Link>
                    </div>

                    {recentProjects.length === 0 ? (
                        <p className="mt-4 text-sm text-white/45">No projects yet. Start your first service order.</p>
                    ) : (
                        <>
                            <div className="mt-4 hidden overflow-x-auto md:block">
                                <table className="min-w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-jv-line text-left text-xs uppercase tracking-wide text-white/45">
                                            <th className="px-3 py-2 font-medium">Order</th>
                                            <th className="px-3 py-2 font-medium">Description</th>
                                            <th className="px-3 py-2 font-medium">Amount</th>
                                            <th className="px-3 py-2 font-medium">ETA</th>
                                            <th className="px-3 py-2 font-medium">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentProjects.map((project) => (
                                            <tr key={project.order_id} className="border-b border-jv-line/70 transition hover:bg-white/[0.04]">
                                                <td className="px-3 py-3 font-semibold text-white">{project.order_id}</td>
                                                <td className="px-3 py-3 text-white/80">{project.description}</td>
                                                <td className="px-3 py-3 text-white/80">{compactMoney.format(project.amount || 0)}</td>
                                                <td className="px-3 py-3 text-white/80">{project.est_delivery_date || 'TBD'}</td>
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

                            <MobileCardList className="mt-4">
                                {recentProjects.map((project, index) => (
                                    <MobileCard key={project.order_id} index={index}>
                                        <MobileCardHeader
                                            title={project.order_id}
                                            subtitle={project.description}
                                            badge={
                                                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClasses(project.status)}`}>
                                                    {project.status}
                                                </span>
                                            }
                                        />
                                        <div className="mt-3 space-y-0.5 divide-y divide-jv-line/70">
                                            <MobileCardRow label="Amount" value={compactMoney.format(project.amount || 0)} />
                                            <MobileCardRow label="ETA" value={project.est_delivery_date || 'TBD'} />
                                        </div>
                                    </MobileCard>
                                ))}
                            </MobileCardList>
                        </>
                    )}
                </Card>
            </div>
        </AuthenticatedLayout>
    );
}

function MetricCard({ label, value }) {
    return (
        <div className="jv-card rounded-jv border border-jv-line bg-white/[0.04] p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/45">{label}</p>
            <p className="mt-2 text-2xl font-black text-white">{value}</p>
        </div>
    );
}
