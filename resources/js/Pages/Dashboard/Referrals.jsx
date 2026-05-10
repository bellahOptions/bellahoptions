import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

export default function Referrals({ referral = {} }) {
    return (
        <AuthenticatedLayout>
            <Head title="Manage Referrals" />

            <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h1 className="text-2xl font-black text-slate-900">Manage Referrals</h1>
                    <p className="mt-2 text-sm text-slate-600">Share your referral URL and track referral momentum month by month.</p>

                    <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Your Referral Link</p>
                        <p className="mt-1 break-all text-sm font-semibold text-blue-900">{referral.link}</p>
                    </div>
                </section>

                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    <StatCard label="Completed Orders" value={referral.completed_orders ?? 0} />
                    <StatCard label="Estimated Discount (NGN)" value={(referral.estimated_discount ?? 0).toLocaleString()} />
                    <StatCard label="Referral Months" value={Array.isArray(referral.monthly) ? referral.monthly.length : 0} />
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h2 className="text-lg font-bold text-slate-900">Monthly Activity</h2>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {(referral.monthly || []).map((month) => (
                            <div key={month.month} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{month.month}</p>
                                <p className="mt-1 text-2xl font-black text-slate-900">{month.referred}</p>
                                <p className="text-xs text-slate-500">Estimated referrals</p>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </AuthenticatedLayout>
    );
}

function StatCard({ label, value }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-black text-slate-900">{value}</p>
        </div>
    );
}
