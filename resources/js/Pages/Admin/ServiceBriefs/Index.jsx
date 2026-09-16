import { Card } from '@/Components/ui/card';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

const statusLabels = {
    new: 'New',
    reviewing: 'Reviewing',
    quote_sent: 'Quote Sent',
    won: 'Won',
    lost: 'Lost',
    dormant: 'Dormant',
};

const statusClasses = {
    new: 'bg-amber-500/15 text-amber-300',
    reviewing: 'bg-sky-500/15 text-sky-300',
    quote_sent: 'bg-purple-500/15 text-purple-300',
    won: 'bg-emerald-500/15 text-emerald-300',
    lost: 'bg-red-500/15 text-red-300',
    dormant: 'bg-white/[0.07] text-white/70',
};

export default function ServiceBriefsIndex({ filters = {}, statuses = [], summary = {}, briefs }) {
    const [search, setSearch] = useState(filters.search || '');

    const submitSearch = (event) => {
        event.preventDefault();
        router.get(route('admin.service-briefs.index'), { status: filters.status || 'all', search }, { preserveState: true });
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold leading-tight tracking-tight text-white">Service Briefs</h2>}>
            <Head title="Service Briefs" />

            <div className="py-8">
                <div className="mx-auto max-w-6xl space-y-6 px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-wrap gap-2">
                        <Link
                            href={route('admin.service-briefs.index')}
                            className={`jv-tag px-3.5 py-1.5 text-xs font-semibold transition ${(filters.status || 'all') === 'all' ? 'border-transparent bg-jv-accent text-white' : 'text-white/65 hover:bg-white/[0.09] hover:text-white'}`}
                        >
                            All
                        </Link>
                        {statuses.map((status) => (
                            <Link
                                key={status}
                                href={route('admin.service-briefs.index', { status })}
                                className={`jv-tag px-3.5 py-1.5 text-xs font-semibold transition ${filters.status === status ? 'border-transparent bg-jv-accent text-white' : 'text-white/65 hover:bg-white/[0.09] hover:text-white'}`}
                            >
                                {statusLabels[status] || status} ({summary[status] ?? 0})
                            </Link>
                        ))}
                    </div>

                    <form onSubmit={submitSearch} className="flex gap-2">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search reference, name, or email"
                            className="jv-input w-full max-w-sm"
                        />
                        <button type="submit" className="jv-btn jv-btn--ghost">
                            Search
                        </button>
                    </form>

                    <Card className="overflow-hidden p-0">
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead>
                                    <tr className="border-b border-jv-line">
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-white/45">Reference</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-white/45">Service</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-white/45">Client</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-white/45">Flags</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-white/45">Status</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-white/45">Submitted</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(briefs?.data || []).map((brief) => (
                                        <tr key={brief.uuid} className="border-b border-jv-line/70 transition last:border-0 hover:bg-white/[0.04]">
                                            <td className="px-4 py-3">
                                                <Link href={route('admin.service-briefs.show', brief.uuid)} className="font-semibold text-[#8fb4ff] hover:text-white hover:underline">
                                                    {brief.reference_number}
                                                </Link>
                                            </td>
                                            <td className="px-4 py-3 text-white/80">{brief.service_name}</td>
                                            <td className="px-4 py-3">
                                                <p className="font-medium text-white">{brief.customer_name}</p>
                                                <p className="text-xs text-white/45">{brief.customer_email}</p>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex flex-wrap gap-1">
                                                    {brief.is_rush && <span className="rounded-full bg-red-500/15 px-2.5 py-0.5 text-xs font-semibold text-red-300">Rush</span>}
                                                    {brief.nda_required && <span className="rounded-full bg-white/[0.07] px-2.5 py-0.5 text-xs font-semibold text-white/70">NDA</span>}
                                                    {brief.has_unsure_answers && <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold text-amber-300">Needs advice</span>}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClasses[brief.status] || statusClasses.dormant}`}>
                                                    {statusLabels[brief.status] || brief.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-white/45">{brief.created_at}</td>
                                        </tr>
                                    ))}
                                    {(briefs?.data || []).length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="px-4 py-8 text-center text-white/45">No briefs found.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </Card>

                    <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-white/55">
                        <p>Page {briefs?.current_page || 1} of {briefs?.last_page || 1}</p>
                        <div className="flex items-center gap-2">
                            {briefs?.prev_page_url ? (
                                <Link href={briefs.prev_page_url} className="jv-btn jv-btn--ghost jv-btn--sm" preserveScroll>
                                    Previous
                                </Link>
                            ) : (
                                <span className="jv-btn jv-btn--ghost jv-btn--sm cursor-not-allowed opacity-40">Previous</span>
                            )}
                            {briefs?.next_page_url ? (
                                <Link href={briefs.next_page_url} className="jv-btn jv-btn--ghost jv-btn--sm" preserveScroll>
                                    Next
                                </Link>
                            ) : (
                                <span className="jv-btn jv-btn--ghost jv-btn--sm cursor-not-allowed opacity-40">Next</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
