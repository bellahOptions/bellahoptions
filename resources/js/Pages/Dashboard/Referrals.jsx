import { Eyebrow } from '@/Components/PublicUI';
import { Card } from '@/Components/ui/card';
import { StatCard, StatGrid } from '@/Components/ui/stat-card';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head } from '@inertiajs/react';

export default function Referrals({ referral = {} }) {
    return (
        <AuthenticatedLayout>
            <Head title="Manage Referrals" />

            <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                <Card className="p-5 sm:p-6">
                    <Eyebrow>Referrals</Eyebrow>
                    <h1 className="jv-display jv-display--md mt-5">Manage Referrals</h1>
                    <p className="jv-lead mt-4">Share your referral URL and track referral momentum month by month.</p>

                    <div className="mt-4 rounded-jv-sm border border-jv-accent-line bg-jv-accent/10 p-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-[#a9c4ff]">Your Referral Link</p>
                        <p className="mt-1 break-all text-sm font-semibold text-white">{referral.link}</p>
                    </div>
                </Card>

                <StatGrid>
                    <StatCard label="Completed Orders" value={referral.completed_orders ?? 0} tone="emerald" />
                    <StatCard label="Estimated Discount (NGN)" value={(referral.estimated_discount ?? 0).toLocaleString()} tone="brand" />
                    <StatCard label="Referral Months" value={Array.isArray(referral.monthly) ? referral.monthly.length : 0} tone="sky" />
                </StatGrid>

                <Card className="p-5">
                    <h2 className="text-lg font-semibold tracking-tight text-white">Monthly Activity</h2>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {(referral.monthly || []).map((month) => (
                            <div key={month.month} className="rounded-jv-sm border border-jv-line bg-white/[0.05] p-3">
                                <p className="text-xs font-semibold uppercase tracking-wide text-white/45">{month.month}</p>
                                <p className="mt-1 text-2xl font-semibold text-white">{month.referred}</p>
                                <p className="text-xs text-white/45">Estimated referrals</p>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </AuthenticatedLayout>
    );
}
