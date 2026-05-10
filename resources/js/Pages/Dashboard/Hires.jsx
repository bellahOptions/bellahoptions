import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

export default function Hires({ team_summary: teamSummary = {}, active_hires: activeHires = [] }) {
    return (
        <AuthenticatedLayout>
            <Head title="Manage Hires" />

            <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h1 className="text-2xl font-black text-slate-900">Manage Your Hires</h1>
                    <p className="mt-2 text-sm text-slate-600">View every active engagement and open each job to review detailed delivery updates.</p>
                    <p className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900">
                        Need dedicated unlimited design support? Our Manage Your Hires retainer starts from ₦220,000 monthly (design services only, UI/UX excluded).
                        <Link href={route('manage-hires')} className="ml-2 font-bold underline">
                            View package details
                        </Link>
                    </p>
                </section>

                <section className="grid gap-4 sm:grid-cols-2">
                    <StatCard label="Active Hires" value={teamSummary.active_hires ?? 0} />
                    <StatCard label="Last Activity" value={teamSummary.last_update_at || 'No activity yet'} />
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h2 className="text-lg font-bold text-slate-900">Active Engagements</h2>
                    {activeHires.length === 0 ? (
                        <p className="mt-3 text-sm text-slate-500">No active hires right now.</p>
                    ) : (
                        <div className="mt-4 space-y-3">
                            {activeHires.map((hire) => (
                                <div key={hire.id} className="rounded-lg border border-slate-200 p-4">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <p className="font-semibold text-slate-900">{hire.title}</p>
                                            <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">Status: {hire.status}</p>
                                        </div>
                                        <Link href={hire.show_url} className="text-sm font-semibold text-blue-700 hover:text-blue-800">
                                            Open Job
                                        </Link>
                                    </div>
                                    <div className="mt-3 h-2 w-full rounded-full bg-slate-100">
                                        <div className="h-full rounded-full bg-blue-600" style={{ width: `${Math.max(0, Math.min(100, hire.progress_percent || 0))}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </AuthenticatedLayout>
    );
}

function StatCard({ label, value }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
            <p className="mt-2 text-lg font-black text-slate-900">{value}</p>
        </div>
    );
}
