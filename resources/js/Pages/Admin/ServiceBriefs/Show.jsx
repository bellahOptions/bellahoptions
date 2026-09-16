import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, useForm } from '@inertiajs/react';

const statusLabels = {
    new: 'New',
    reviewing: 'Reviewing',
    quote_sent: 'Quote Sent',
    won: 'Won',
    lost: 'Lost',
    dormant: 'Dormant',
};

function formatBytes(bytes) {
    if (!bytes) {
        return '0 KB';
    }

    const kb = bytes / 1024;
    return kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(kb))} KB`;
}

export default function ServiceBriefShow({ statuses = [], brief }) {
    const statusForm = useForm({ status: brief.status });

    const submitStatus = (event) => {
        event.preventDefault();
        statusForm.patch(route('admin.service-briefs.status', brief.uuid), { preserveScroll: true });
    };

    const createQuote = () => {
        router.visit(route('admin.invoices.index', {
            from_brief: brief.uuid,
            from_brief_ref: brief.reference_number,
        }));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">Brief {brief.reference_number}</h2>
                    <Link href={route('admin.service-briefs.index')} className="rounded-md border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50">
                        Back to Briefs
                    </Link>
                </div>
            }
        >
            <Head title={`Brief ${brief.reference_number}`} />

            <div className="py-8">
                <div className="mx-auto max-w-4xl space-y-6 px-4 sm:px-6 lg:px-8">
                    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <p className="text-xs uppercase tracking-wide text-gray-500">{brief.service_name}</p>
                                <h3 className="mt-1 text-xl font-semibold text-gray-900">{brief.customer_name}</h3>
                                <p className="text-sm text-gray-600">{brief.customer_email} · {brief.customer_phone}</p>
                            </div>
                            <div className="flex flex-wrap gap-1">
                                {brief.is_rush && <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">Rush</span>}
                                {brief.nda_required && <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">NDA Requested</span>}
                                {brief.has_unsure_answers && <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">Has &quot;not sure&quot; answers</span>}
                            </div>
                        </div>

                        <div className="mt-4 grid gap-4 sm:grid-cols-3">
                            <Info label="Submitted" value={brief.created_at || 'N/A'} />
                            <Info label="Response Due" value={brief.response_due_at || 'N/A'} />
                            <Info label="Marketing Opt-in" value={brief.consent_marketing ? 'Yes' : 'No'} />
                        </div>

                        <div className="mt-6 flex flex-wrap items-center gap-3">
                            <form onSubmit={submitStatus} className="flex items-center gap-2">
                                <select
                                    value={statusForm.data.status}
                                    onChange={(e) => statusForm.setData('status', e.target.value)}
                                    className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                                >
                                    {statuses.map((status) => (
                                        <option key={status} value={status}>{statusLabels[status] || status}</option>
                                    ))}
                                </select>
                                <button type="submit" disabled={statusForm.processing} className="rounded-md border border-brand/30 px-3 py-2 text-xs font-semibold text-brand hover:bg-brand-light">
                                    Update Status
                                </button>
                            </form>

                            {brief.quoted_invoice ? (
                                <Link
                                    href={route('admin.invoices.show', brief.quoted_invoice.uuid)}
                                    className="rounded-md border border-emerald-200 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                                >
                                    View Quote (Invoice {brief.quoted_invoice.invoice_number})
                                </Link>
                            ) : (
                                <button type="button" onClick={createQuote} className="rounded-md border border-emerald-200 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50">
                                    Create Quote
                                </button>
                            )}
                        </div>
                    </section>

                    {brief.files?.length > 0 && (
                        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
                            <h4 className="text-base font-semibold text-gray-900">Attached Files</h4>
                            <ul className="mt-3 space-y-2">
                                {brief.files.map((file) => (
                                    <li key={file.id} className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm">
                                        <div>
                                            <p className="font-medium text-gray-900">{file.original_filename}</p>
                                            <p className="text-xs text-gray-500">{file.field_label} · {formatBytes(file.size_bytes)}</p>
                                        </div>
                                        <a
                                            href={route('admin.service-briefs.files.download', [brief.uuid, file.id])}
                                            className="text-xs font-semibold text-brand hover:underline"
                                        >
                                            Download
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}

                    {brief.sections?.map((section) => (
                        <section key={section.title} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
                            <h4 className="text-base font-semibold text-gray-900">{section.title}</h4>
                            <dl className="mt-3 space-y-3">
                                {section.rows.map((row) => (
                                    <div key={row.label} className="grid gap-1 sm:grid-cols-3 sm:gap-4">
                                        <dt className="text-sm font-semibold text-gray-600">{row.label}</dt>
                                        <dd className="text-sm text-gray-900 sm:col-span-2">{row.value}</dd>
                                    </div>
                                ))}
                            </dl>
                        </section>
                    ))}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function Info({ label, value }) {
    return (
        <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
            <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
            <p className="mt-1 text-sm font-semibold text-gray-900">{value}</p>
        </div>
    );
}
