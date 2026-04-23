import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';

export default function InvoiceIndex({ invoices, stats = {}, filters = {}, permissions = {} }) {
    const { flash } = usePage().props;
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');
    const canDeleteInvoices = Boolean(permissions?.can_delete_invoices);

    const applyFilters = (event) => {
        event.preventDefault();

        router.get(
            route('admin.invoices.index'),
            {
                search,
                status,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const resetFilters = () => {
        setSearch('');
        setStatus('');

        router.get(route('admin.invoices.index'), {}, { preserveState: true, replace: true });
    };

    const resendInvoice = (invoiceId) => {
        router.post(route('admin.invoices.resend', invoiceId), {}, { preserveScroll: true });
    };

    const sendReminder = (invoiceId) => {
        router.post(route('admin.invoices.remind', invoiceId), {}, { preserveScroll: true });
    };

    const markInvoicePaid = (invoiceId) => {
        const paymentReference = window.prompt('Payment reference (optional):', '');

        if (paymentReference === null) {
            return;
        }

        router.patch(
            route('admin.invoices.mark-paid', invoiceId),
            { payment_reference: paymentReference },
            { preserveScroll: true },
        );
    };

    const deleteInvoice = (invoiceId, invoiceNumber) => {
        if (!window.confirm(`Delete invoice ${invoiceNumber}? This cannot be undone.`)) {
            return;
        }

        router.delete(route('admin.invoices.destroy', invoiceId), {
            preserveScroll: true,
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">Invoices</h2>
                    <Link
                        href={route('dashboard')}
                        className="rounded-md border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                    >
                        Back to Dashboard
                    </Link>
                </div>
            }
        >
            <Head title="Invoice Management" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
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

                    <section className="grid grid-cols-2 gap-3 lg:grid-cols-5">
                        <MetricCard label="Total Invoices" value={stats.total_invoices ?? 0} />
                        <MetricCard label="Pending" value={stats.pending_invoices ?? 0} />
                        <MetricCard label="Paid" value={stats.paid_invoices ?? 0} />
                        <MetricCard label="Pending Amount" value={formatMoney(stats.pending_total ?? 0, 'NGN')} />
                        <MetricCard label="Paid Amount" value={formatMoney(stats.paid_total ?? 0, 'NGN')} />
                    </section>

                    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                        <form onSubmit={applyFilters} className="grid gap-3 sm:grid-cols-[1fr_auto_auto_auto] sm:items-end">
                            <div>
                                <label htmlFor="invoice-search" className="mb-1 block text-sm font-medium text-gray-700">
                                    Search
                                </label>
                                <input
                                    id="invoice-search"
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder="Invoice number, customer, title"
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label htmlFor="invoice-status" className="mb-1 block text-sm font-medium text-gray-700">
                                    Status
                                </label>
                                <select
                                    id="invoice-status"
                                    value={status}
                                    onChange={(event) => setStatus(event.target.value)}
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                                >
                                    <option value="">All</option>
                                    <option value="sent">Pending</option>
                                    <option value="paid">Paid</option>
                                </select>
                            </div>

                            <button
                                type="submit"
                                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                            >
                                Filter
                            </button>
                            <button
                                type="button"
                                onClick={resetFilters}
                                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                            >
                                Reset
                            </button>
                        </form>
                    </section>

                    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-3 py-2 text-left font-semibold text-gray-600">Invoice</th>
                                        <th className="px-3 py-2 text-left font-semibold text-gray-600">Customer</th>
                                        <th className="px-3 py-2 text-left font-semibold text-gray-600">Amount</th>
                                        <th className="px-3 py-2 text-left font-semibold text-gray-600">Status</th>
                                        <th className="px-3 py-2 text-left font-semibold text-gray-600">Reminders</th>
                                        <th className="px-3 py-2 text-left font-semibold text-gray-600">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {(invoices?.data || []).length === 0 && (
                                        <tr>
                                            <td className="px-3 py-4 text-gray-500" colSpan={6}>
                                                No invoices found.
                                            </td>
                                        </tr>
                                    )}

                                    {(invoices?.data || []).map((invoice) => (
                                        <tr key={invoice.id}>
                                            <td className="px-3 py-3 align-top">
                                                <p className="font-semibold text-gray-900">{invoice.invoice_number}</p>
                                                <p className="text-xs text-gray-500">{invoice.title}</p>
                                            </td>
                                            <td className="px-3 py-3 align-top text-gray-700">
                                                <p>{invoice.customer_name}</p>
                                                <p className="text-xs text-gray-500">{invoice.customer_email}</p>
                                            </td>
                                            <td className="px-3 py-3 align-top text-gray-700">
                                                {formatMoney(invoice.amount, invoice.currency)}
                                            </td>
                                            <td className="px-3 py-3 align-top">
                                                <span
                                                    className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                                                        invoice.status === 'paid'
                                                            ? 'bg-emerald-100 text-emerald-700'
                                                            : 'bg-amber-100 text-amber-700'
                                                    }`}
                                                >
                                                    {invoice.status.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="px-3 py-3 align-top text-xs text-gray-700">
                                                <p>Auto: {invoice.automatic_reminders_sent}/13</p>
                                                <p className="text-gray-500">
                                                    Last auto: {invoice.last_automatic_reminder_sent_at || 'N/A'}
                                                </p>
                                                <p className="text-gray-500">
                                                    Last manual: {invoice.last_manual_reminder_sent_at || 'N/A'}
                                                </p>
                                            </td>
                                            <td className="space-x-2 px-3 py-3 align-top">
                                                <Link
                                                    href={route('admin.invoices.show', invoice.id)}
                                                    className="rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                                >
                                                    View
                                                </Link>
                                                <button
                                                    type="button"
                                                    onClick={() => resendInvoice(invoice.id)}
                                                    className="rounded-md border border-indigo-200 px-2 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-50"
                                                >
                                                    Resend
                                                </button>
                                                {invoice.status !== 'paid' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => sendReminder(invoice.id)}
                                                        className="rounded-md border border-amber-200 px-2 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-50"
                                                    >
                                                        Remind
                                                    </button>
                                                )}
                                                {invoice.status !== 'paid' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => markInvoicePaid(invoice.id)}
                                                        className="rounded-md border border-emerald-200 px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                                                    >
                                                        Mark Paid
                                                    </button>
                                                )}
                                                {canDeleteInvoices && (
                                                    <button
                                                        type="button"
                                                        onClick={() => deleteInvoice(invoice.id, invoice.invoice_number)}
                                                        className="rounded-md border border-red-200 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-50"
                                                    >
                                                        Delete
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-gray-600">
                            <p>
                                Page {invoices?.current_page || 1} of {invoices?.last_page || 1}
                            </p>
                            <div className="flex items-center gap-2">
                                {invoices?.prev_page_url ? (
                                    <Link
                                        href={invoices.prev_page_url}
                                        className="rounded-md border border-gray-300 px-3 py-1.5 text-gray-700 hover:bg-gray-50"
                                        preserveScroll
                                    >
                                        Previous
                                    </Link>
                                ) : (
                                    <span className="cursor-not-allowed rounded-md border border-gray-200 px-3 py-1.5 text-gray-400">
                                        Previous
                                    </span>
                                )}
                                {invoices?.next_page_url ? (
                                    <Link
                                        href={invoices.next_page_url}
                                        className="rounded-md border border-gray-300 px-3 py-1.5 text-gray-700 hover:bg-gray-50"
                                        preserveScroll
                                    >
                                        Next
                                    </Link>
                                ) : (
                                    <span className="cursor-not-allowed rounded-md border border-gray-200 px-3 py-1.5 text-gray-400">
                                        Next
                                    </span>
                                )}
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function MetricCard({ label, value }) {
    return (
        <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm sm:p-4">
            <p className="text-[11px] uppercase tracking-wide text-gray-500 sm:text-xs">{label}</p>
            <p className="mt-2 text-lg font-semibold text-gray-900 sm:text-2xl">{value}</p>
        </div>
    );
}

function formatMoney(amount, currency = 'NGN') {
    const formattedAmount = Number(amount).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
    const normalizedCurrency = String(currency || '').toUpperCase();

    if (normalizedCurrency === 'NGN') {
        return `₦${formattedAmount}`;
    }

    if (normalizedCurrency === '') {
        return formattedAmount;
    }

    return `${normalizedCurrency} ${formattedAmount}`;
}
