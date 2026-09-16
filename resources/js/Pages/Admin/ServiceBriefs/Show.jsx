import { Card } from '@/Components/ui/card';
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
                    <h2 className="text-xl font-semibold leading-tight tracking-tight text-white">Brief {brief.reference_number}</h2>
                    <Link href={route('admin.service-briefs.index')} className="jv-btn jv-btn--ghost jv-btn--sm">
                        Back to Briefs
                    </Link>
                </div>
            }
        >
            <Head title={`Brief ${brief.reference_number}`} />

            <div className="py-8">
                <div className="mx-auto max-w-4xl space-y-6 px-4 sm:px-6 lg:px-8">
                    <Card className="p-5 sm:p-6">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <p className="jv-mono text-white/45">{brief.service_name}</p>
                                <h3 className="mt-2 text-xl font-semibold tracking-tight text-white">{brief.customer_name}</h3>
                                <p className="mt-1 text-sm text-white/55">{brief.customer_email} · {brief.customer_phone}</p>
                            </div>
                            <div className="flex flex-wrap gap-1">
                                {brief.is_rush && <span className="rounded-full bg-red-500/15 px-2.5 py-1 text-xs font-semibold text-red-300">Rush</span>}
                                {brief.nda_required && <span className="rounded-full bg-white/[0.07] px-2.5 py-1 text-xs font-semibold text-white/70">NDA Requested</span>}
                                {brief.has_unsure_answers && <span className="rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-semibold text-amber-300">Has &quot;not sure&quot; answers</span>}
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
                                    className="jv-select w-auto"
                                >
                                    {statuses.map((status) => (
                                        <option key={status} value={status}>{statusLabels[status] || status}</option>
                                    ))}
                                </select>
                                <button type="submit" disabled={statusForm.processing} className="jv-btn jv-btn--primary jv-btn--sm disabled:cursor-not-allowed disabled:opacity-60">
                                    Update Status
                                </button>
                            </form>

                            {brief.quoted_invoice ? (
                                <Link
                                    href={route('admin.invoices.show', brief.quoted_invoice.uuid)}
                                    className="jv-btn jv-btn--sm border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10 hover:text-emerald-200"
                                >
                                    View Quote (Invoice {brief.quoted_invoice.invoice_number})
                                </Link>
                            ) : (
                                <button type="button" onClick={createQuote} className="jv-btn jv-btn--sm border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10 hover:text-emerald-200">
                                    Create Quote
                                </button>
                            )}
                        </div>
                    </Card>

                    {brief.files?.length > 0 && (
                        <Card className="p-5 sm:p-6">
                            <h4 className="text-base font-semibold text-white">Attached Files</h4>
                            <ul className="mt-3 space-y-2">
                                {brief.files.map((file) => (
                                    <li key={file.id} className="flex items-center justify-between rounded-jv-sm border border-jv-line bg-white/[0.04] px-3 py-2 text-sm">
                                        <div>
                                            <p className="font-medium text-white">{file.original_filename}</p>
                                            <p className="text-xs text-white/45">{file.field_label} · {formatBytes(file.size_bytes)}</p>
                                        </div>
                                        <a
                                            href={route('admin.service-briefs.files.download', [brief.uuid, file.id])}
                                            className="text-xs font-semibold text-[#8fb4ff] hover:text-white hover:underline"
                                        >
                                            Download
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </Card>
                    )}

                    {brief.sections?.map((section) => (
                        <Card key={section.title} className="p-5 sm:p-6">
                            <h4 className="text-base font-semibold text-white">{section.title}</h4>
                            <dl className="mt-3 space-y-3">
                                {section.rows.map((row) => (
                                    <div key={row.label} className="grid gap-1 sm:grid-cols-3 sm:gap-4">
                                        <dt className="text-sm font-semibold text-white/55">{row.label}</dt>
                                        <dd className="text-sm text-white/85 sm:col-span-2">{row.value}</dd>
                                    </div>
                                ))}
                            </dl>
                        </Card>
                    ))}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function Info({ label, value }) {
    return (
        <div className="rounded-jv-sm border border-jv-line bg-white/[0.04] p-3">
            <p className="text-xs uppercase tracking-wide text-white/45">{label}</p>
            <p className="mt-1 text-sm font-semibold text-white">{value}</p>
        </div>
    );
}
