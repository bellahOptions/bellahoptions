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
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">Order {order.order_code}</h2>
                    <Link
                        href={route('admin.service-orders.index')}
                        className="rounded-md border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
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
                        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                            {flash.success}
                        </div>
                    )}

                    {flash?.error && (
                        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {flash.error}
                        </div>
                    )}

                    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <p className="text-xs uppercase tracking-wide text-gray-500">{order.service_name}</p>
                                <h3 className="mt-1 text-2xl font-semibold text-gray-900">{order.package_name}</h3>
                                <p className="mt-2 text-sm text-gray-600">{order.project_summary}</p>
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
                    </section>

                    <section className="grid gap-6 lg:grid-cols-2">
                        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
                            <h4 className="text-base font-semibold text-gray-900">Contact Details</h4>
                            <div className="mt-4 space-y-2 text-sm text-gray-700">
                                <p><span className="font-semibold">Name:</span> {order.full_name}</p>
                                <p><span className="font-semibold">Email:</span> {order.email}</p>
                                <p><span className="font-semibold">Phone:</span> {order.phone || 'N/A'}</p>
                                <p><span className="font-semibold">Business:</span> {order.business_name || 'N/A'}</p>
                                <p><span className="font-semibold">Position:</span> {order.position || 'N/A'}</p>
                                <p><span className="font-semibold">Website:</span> {order.business_website || 'N/A'}</p>
                                <p><span className="font-semibold">Account:</span> {order.user ? `${order.user.name} (${order.user.email})` : 'Guest checkout'}</p>
                            </div>
                        </div>

                        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
                            <h4 className="text-base font-semibold text-gray-900">Project Brief</h4>
                            <div className="mt-4 space-y-2 text-sm text-gray-700">
                                <p><span className="font-semibold">Goals:</span> {order.project_goals || 'N/A'}</p>
                                <p><span className="font-semibold">Target Audience:</span> {order.target_audience || 'N/A'}</p>
                                <p><span className="font-semibold">Preferred Style:</span> {order.preferred_style || 'N/A'}</p>
                                <p><span className="font-semibold">Deliverables:</span> {order.deliverables || 'N/A'}</p>
                                <p><span className="font-semibold">Additional Details:</span> {order.additional_details || 'N/A'}</p>
                            </div>
                        </div>
                    </section>

                    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
                        <h4 className="text-base font-semibold text-gray-900">Update Order Status</h4>
                        <form onSubmit={submitStatusUpdate} className="mt-4 grid gap-4 sm:grid-cols-2">
                            <div>
                                <label htmlFor="order-status" className="mb-1 block text-sm font-medium text-gray-700">
                                    Status
                                </label>
                                <select
                                    id="order-status"
                                    value={statusForm.data.status}
                                    onChange={(event) => statusForm.setData('status', event.target.value)}
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
                                >
                                    {updatableStatuses.map((option) => (
                                        <option key={option} value={option}>
                                            {formatStatusLabel(option)}
                                        </option>
                                    ))}
                                </select>
                                {statusForm.errors.status && (
                                    <p className="mt-1 text-xs text-red-600">{statusForm.errors.status}</p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="progress-percent" className="mb-1 block text-sm font-medium text-gray-700">
                                    Progress (%)
                                </label>
                                <input
                                    id="progress-percent"
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={statusForm.data.progress_percent}
                                    onChange={(event) => statusForm.setData('progress_percent', event.target.value)}
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
                                />
                                {statusForm.errors.progress_percent && (
                                    <p className="mt-1 text-xs text-red-600">{statusForm.errors.progress_percent}</p>
                                )}
                            </div>

                            <div className="sm:col-span-2">
                                <label htmlFor="update-note" className="mb-1 block text-sm font-medium text-gray-700">
                                    Note (optional)
                                </label>
                                <textarea
                                    id="update-note"
                                    rows={3}
                                    value={statusForm.data.note}
                                    onChange={(event) => statusForm.setData('note', event.target.value)}
                                    placeholder="Note visible to the team (and client, if public)"
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
                                />
                                {statusForm.errors.note && (
                                    <p className="mt-1 text-xs text-red-600">{statusForm.errors.note}</p>
                                )}
                            </div>

                            <div className="flex items-center gap-2 sm:col-span-2">
                                <input
                                    id="update-is-public"
                                    type="checkbox"
                                    checked={statusForm.data.is_public}
                                    onChange={(event) => statusForm.setData('is_public', event.target.checked)}
                                    className="rounded border-gray-300 text-brand focus:ring-brand/30"
                                />
                                <label htmlFor="update-is-public" className="text-sm text-gray-700">
                                    Visible to the client
                                </label>
                            </div>

                            <div className="sm:col-span-2">
                                <button
                                    type="submit"
                                    disabled={statusForm.processing}
                                    className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {statusForm.processing ? 'Saving...' : 'Save Update'}
                                </button>
                            </div>
                        </form>
                    </section>

                    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
                        <h4 className="text-base font-semibold text-gray-900">Status History</h4>
                        <div className="mt-4 space-y-4">
                            {(order.updates || []).length === 0 && (
                                <p className="text-sm text-gray-500">No status updates yet.</p>
                            )}

                            {(order.updates || []).map((update) => (
                                <div key={update.id} className="border-l-2 border-brand/30 pl-4">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <StatusBadge status={update.status} kind="order" />
                                        <span className="text-xs text-gray-500">{update.progress_percent}%</span>
                                        {!update.is_public && (
                                            <span className="inline-flex rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">
                                                Internal
                                            </span>
                                        )}
                                    </div>
                                    {update.note && <p className="mt-1 text-sm text-gray-700">{update.note}</p>}
                                    <p className="mt-1 text-xs text-gray-500">
                                        {update.created_at} {update.creator ? `by ${update.creator}` : ''}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>
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
