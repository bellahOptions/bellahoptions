import { Eyebrow } from '@/Components/PublicUI';
import { Card } from '@/Components/ui/card';
import { StatCard, StatGrid } from '@/Components/ui/stat-card';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

export default function Hires({ team_summary: teamSummary = {}, active_hires: activeHires = [] }) {
    return (
        <AuthenticatedLayout>
            <Head title="Manage Hires" />

            <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                <Card className="p-5 sm:p-6">
                    <Eyebrow>Hires</Eyebrow>
                    <h1 className="jv-display jv-display--md mt-5">Manage Your Hires</h1>
                    <p className="jv-lead mt-4">View every active engagement and open each job to review detailed delivery updates.</p>
                    <p className="mt-4 rounded-jv-sm border border-jv-accent-line bg-jv-accent/10 p-3 text-sm text-white/80">
                        Need dedicated unlimited design support? Our Manage Your Hires retainer starts from ₦220,000 monthly (design services only, UI/UX excluded).
                        <Link href={route('manage-hires')} className="ml-2 font-bold text-[#a9c4ff] underline transition hover:text-white">
                            View package details
                        </Link>
                    </p>
                </Card>

                <StatGrid>
                    <StatCard label="Active Hires" value={teamSummary.active_hires ?? 0} tone="brand" />
                    <StatCard label="Last Activity" value={teamSummary.last_update_at || 'No activity yet'} tone="slate" />
                </StatGrid>

                <Card className="p-5">
                    <h2 className="text-lg font-semibold tracking-tight text-white">Active Engagements</h2>
                    {activeHires.length === 0 ? (
                        <p className="mt-3 text-sm text-white/45">No active hires right now.</p>
                    ) : (
                        <div className="mt-4 space-y-3">
                            {activeHires.map((hire) => (
                                <div key={hire.id} className="rounded-jv border border-jv-line bg-white/[0.03] p-4">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <p className="font-semibold text-white">{hire.title}</p>
                                            <p className="mt-1 text-xs uppercase tracking-wide text-white/45">Status: {hire.status}</p>
                                        </div>
                                        <Link href={hire.show_url} className="text-sm font-semibold text-[#a9c4ff] transition hover:text-white">
                                            Open Job
                                        </Link>
                                    </div>
                                    <div className="mt-3 h-2 w-full rounded-full bg-white/[0.08]">
                                        <div className="h-full rounded-full bg-jv-accent" style={{ width: `${Math.max(0, Math.min(100, hire.progress_percent || 0))}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Card>
            </div>
        </AuthenticatedLayout>
    );
}
