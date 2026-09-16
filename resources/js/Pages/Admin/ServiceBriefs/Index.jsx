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
    new: 'bg-amber-100 text-amber-800',
    reviewing: 'bg-blue-100 text-blue-800',
    quote_sent: 'bg-purple-100 text-purple-800',
    won: 'bg-emerald-100 text-emerald-800',
    lost: 'bg-red-100 text-red-800',
    dormant: 'bg-slate-100 text-slate-700',
};

export default function ServiceBriefsIndex({ filters = {}, statuses = [], summary = {}, briefs }) {
    const [search, setSearch] = useState(filters.search || '');

    const submitSearch = (event) => {
        event.preventDefault();
        router.get(route('admin.service-briefs.index'), { status: filters.status || 'all', search }, { preserveState: true });
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Service Briefs</h2>}>
            <Head title="Service Briefs" />

            <div className="py-8">
                <div className="mx-auto max-w-6xl space-y-6 px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-wrap gap-2">
                        <Link
                            href={route('admin.service-briefs.index')}
                            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${(filters.status || 'all') === 'all' ? 'bg-brand text-white' : 'bg-gray-100 text-gray-700'}`}
                        >
                            All
                        </Link>
                        {statuses.map((status) => (
                            <Link
                                key={status}
                                href={route('admin.service-briefs.index', { status })}
                                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${filters.status === status ? 'bg-brand text-white' : 'bg-gray-100 text-gray-700'}`}
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
                            className="w-full max-w-sm rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
                        />
                        <button type="submit" className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                            Search
                        </button>
                    </form>

                    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Reference</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Service</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Client</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Flags</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Submitted</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {(briefs?.data || []).map((brief) => (
                                    <tr key={brief.uuid} className="hover:bg-gray-50">
                                        <td className="px-4 py-3">
                                            <Link href={route('admin.service-briefs.show', brief.uuid)} className="font-semibold text-brand hover:underline">
                                                {brief.reference_number}
                                            </Link>
                                        </td>
                                        <td className="px-4 py-3 text-gray-700">{brief.service_name}</td>
                                        <td className="px-4 py-3">
                                            <p className="font-medium text-gray-900">{brief.customer_name}</p>
                                            <p className="text-xs text-gray-500">{brief.customer_email}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex flex-wrap gap-1">
                                                {brief.is_rush && <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">Rush</span>}
                                                {brief.nda_required && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">NDA</span>}
                                                {brief.has_unsure_answers && <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">Needs advice</span>}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClasses[brief.status] || statusClasses.dormant}`}>
                                                {statusLabels[brief.status] || brief.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-500">{brief.created_at}</td>
                                    </tr>
                                ))}
                                {(briefs?.data || []).length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-8 text-center text-gray-500">No briefs found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-gray-600">
                        <p>Page {briefs?.current_page || 1} of {briefs?.last_page || 1}</p>
                        <div className="flex items-center gap-2">
                            {briefs?.prev_page_url ? (
                                <Link href={briefs.prev_page_url} className="rounded-md border border-gray-300 px-3 py-1.5 text-gray-700 hover:bg-gray-50" preserveScroll>
                                    Previous
                                </Link>
                            ) : (
                                <span className="cursor-not-allowed rounded-md border border-gray-200 px-3 py-1.5 text-gray-400">Previous</span>
                            )}
                            {briefs?.next_page_url ? (
                                <Link href={briefs.next_page_url} className="rounded-md border border-gray-300 px-3 py-1.5 text-gray-700 hover:bg-gray-50" preserveScroll>
                                    Next
                                </Link>
                            ) : (
                                <span className="cursor-not-allowed rounded-md border border-gray-200 px-3 py-1.5 text-gray-400">Next</span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
