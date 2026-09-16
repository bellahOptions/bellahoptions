import { Card } from '@/Components/ui/card';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatMoney } from '@/lib/utils';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { formatStatusLabel, StatusBadge } from './Index';

const updatableStatuses = ['awaiting_payment', 'queued', 'in_progress', 'in_review', 'completed', 'cancelled'];

export default function ServiceOrderShow({ order }) {
    const { flash } = usePage().props;

    const statusForm = useForm({
        status: updatableStatuses.includes(order.order_status) ? order.order_status : 'queued',
        progress_percent: order.progress_percent,
        note: '',
        is_public: true,
    });

    const submitStatusUpdate = (event) => {
        event.preventDefault();

        statusForm.post(route('admin.service-orders.updates.store', order.order_code), {
            preserveScroll: true,
            onSuccess: () => statusForm.setData('note', ''),
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-xl font-semibold leading-tight tracking-tight text-white">Order {order.order_code}</h2>
                    <Link
                        href={route('admin.service-orders.index')}
                        className="jv-btn jv-btn--ghost jv-btn--sm"
                    >
                        Back to Orders
                    </Link>
                </div>
            }
        >
            <Head title={`Order ${order.order_code}`} />

            <div className="py-8">
                <div className="mx-auto max-w-5xl space-y-6 px-4 sm:px-6 lg:px-8">
                    {flash?.success && (
                        <div className="rounded-jv-sm border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                            {flash.success}
                        </div>
                    )}

                    {flash?.error && (
                        <div className="rounded-jv-sm border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                            {flash.error}
                        </div>
                    )}

                    <Card className="p-5 sm:p-6">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <p className="jv-mono text-white/45">{order.service_name}</p>
                                <h3 className="mt-2 text-2xl font-semibold tracking-tight text-white">{order.package_name}</h3>
                                <p className="mt-2 text-sm text-white/55">{order.project_summary}</p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                <StatusBadge status={order.payment_status} kind="payment" />
                                <StatusBadge status={order.order_status} kind="order" />
                            </div>
                        </div>

                        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            <Info label="Amount" value={formatMoney(order.amount, order.currency)} />
                            <Info label="Base Amount" value={formatMoney(order.base_amount, order.currency)} />
                            <Info
                                label="Discount"
                                value={
                                    order.discount_code
                                        ? `${order.discount_code} (${formatMoney(order.discount_amount, order.currency)})`
                                        : 'None'
                                }
                            />
                            <Info label="Progress" value={`${order.progress_percent}%`} />
                            <Info label="Payment Provider" value={formatStatusLabel(order.payment_provider) || 'N/A'} />
                            <Info label="Payment Reference" value={order.paystack_reference || 'N/A'} />
                            <Info label="Paid At" value={order.paid_at || 'N/A'} />
                            <Info label="Created At" value={order.created_at || 'N/A'} />
                            <Info
                                label="Invoice"
                                value={order.invoice ? `#${order.invoice.invoice_number} (${formatStatusLabel(order.invoice.status)})` : 'N/A'}
                            />
                        </div>
                    </Card>

                    <section className="grid gap-6 lg:grid-cols-2">
                        <Card className="p-5 sm:p-6">
                            <h4 className="text-base font-semibold text-white">Contact Details</h4>
                            <div className="mt-4 space-y-2 text-sm text-white/70">
                                <p><span className="font-semibold text-white/85">Name:</span> {order.full_name}</p>
                                <p><span className="font-semibold text-white/85">Email:</span> {order.email}</p>
                                <p><span className="font-semibold text-white/85">Phone:</span> {order.phone || 'N/A'}</p>
                                <p><span className="font-semibold text-white/85">Business:</span> {order.business_name || 'N/A'}</p>
                                <p><span className="font-semibold text-white/85">Position:</span> {order.position || 'N/A'}</p>
                                <p><span className="font-semibold text-white/85">Website:</span> {order.business_website || 'N/A'}</p>
                                <p><span className="font-semibold text-white/85">Account:</span> {order.user ? `${order.user.name} (${order.user.email})` : 'Guest checkout'}</p>
                            </div>
                        </Card>

                        <Card className="p-5 sm:p-6">
                            <h4 className="text-base font-semibold text-white">Project Brief</h4>
                            <div className="mt-4 space-y-2 text-sm text-white/70">
                                <p><span className="font-semibold text-white/85">Goals:</span> {order.project_goals || 'N/A'}</p>
                                <p><span className="font-semibold text-white/85">Target Audience:</span> {order.target_audience || 'N/A'}</p>
                                <p><span className="font-semibold text-white/85">Preferred Style:</span> {order.preferred_style || 'N/A'}</p>
                                <p><span className="font-semibold text-white/85">Deliverables:</span> {order.deliverables || 'N/A'}</p>
                                <p><span className="font-semibold text-white/85">Additional Details:</span> {order.additional_details || 'N/A'}</p>
                            </div>
                        </Card>
                    </section>

                    <Card className="p-5 sm:p-6">
                        <h4 className="text-base font-semibold text-white">Update Order Status</h4>
                        <form onSubmit={submitStatusUpdate} className="mt-4 grid gap-4 sm:grid-cols-2">
                            <div>
                                <label htmlFor="order-status" className="jv-label mb-1.5 block">
                                    Status
                                </label>
                                <select
                                    id="order-status"
                                    value={statusForm.data.status}
                                    onChange={(event) => statusForm.setData('status', event.target.value)}
                                    className="jv-select"
                                >
                                    {updatableStatuses.map((option) => (
                                        <option key={option} value={option}>
                                            {formatStatusLabel(option)}
                                        </option>
                                    ))}
                                </select>
                                {statusForm.errors.status && (
                                    <p className="mt-1 text-xs text-red-300">{statusForm.errors.status}</p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="progress-percent" className="jv-label mb-1.5 block">
                                    Progress (%)
                                </label>
                                <input
                                    id="progress-percent"
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={statusForm.data.progress_percent}
                                    onChange={(event) => statusForm.setData('progress_percent', event.target.value)}
                                    className="jv-input"
                                />
                                {statusForm.errors.progress_percent && (
                                    <p className="mt-1 text-xs text-red-300">{statusForm.errors.progress_percent}</p>
                                )}
                            </div>

                            <div className="sm:col-span-2">
                                <label htmlFor="update-note" className="jv-label mb-1.5 block">
                                    Note (optional)
                                </label>
                                <textarea
                                    id="update-note"
                                    rows={3}
                                    value={statusForm.data.note}
                                    onChange={(event) => statusForm.setData('note', event.target.value)}
                                    placeholder="Note visible to the team (and client, if public)"
                                    className="jv-textarea"
                                />
                                {statusForm.errors.note && (
                                    <p className="mt-1 text-xs text-red-300">{statusForm.errors.note}</p>
                                )}
                            </div>

                            <div className="flex items-center gap-2 sm:col-span-2">
                                <input
                                    id="update-is-public"
                                    type="checkbox"
                                    checked={statusForm.data.is_public}
                                    onChange={(event) => statusForm.setData('is_public', event.target.checked)}
                                    className="h-4 w-4 rounded border-jv-line-strong bg-white/[0.06] text-jv-accent accent-jv-accent focus:ring-jv-accent/40"
                                />
                                <label htmlFor="update-is-public" className="text-sm text-white/70">
                                    Visible to the client
                                </label>
                            </div>

                            <div className="sm:col-span-2">
                                <button
                                    type="submit"
                                    disabled={statusForm.processing}
                                    className="jv-btn jv-btn--primary disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {statusForm.processing ? 'Saving...' : 'Save Update'}
                                </button>
                            </div>
                        </form>
                    </Card>

                    <Card className="p-5 sm:p-6">
                        <h4 className="text-base font-semibold text-white">Status History</h4>
                        <div className="mt-4 space-y-4">
                            {(order.updates || []).length === 0 && (
                                <p className="text-sm text-white/45">No status updates yet.</p>
                            )}

                            {(order.updates || []).map((update) => (
                                <div key={update.id} className="border-l-2 border-jv-accent/40 pl-4">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <StatusBadge status={update.status} kind="order" />
                                        <span className="text-xs text-white/45">{update.progress_percent}%</span>
                                        {!update.is_public && (
                                            <span className="inline-flex rounded-full bg-white/[0.07] px-2.5 py-1 text-xs font-semibold text-white/70">
                                                Internal
                                            </span>
                                        )}
                                    </div>
                                    {update.note && <p className="mt-1 text-sm text-white/70">{update.note}</p>}
                                    <p className="mt-1 text-xs text-white/45">
                                        {update.created_at} {update.creator ? `by ${update.creator}` : ''}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </Card>
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
