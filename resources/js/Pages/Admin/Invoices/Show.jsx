import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';

export default function InvoiceShow({ invoice, permissions = {} }) {
    const { flash } = usePage().props;
    const canDeleteInvoices = Boolean(permissions?.can_delete_invoices);

    const resendInvoice = () => {
        router.post(route('admin.invoices.resend', invoice.id), {}, { preserveScroll: true });
    };

    const sendReminder = () => {
        router.post(route('admin.invoices.remind', invoice.id), {}, { preserveScroll: true });
    };

    const markInvoicePaid = () => {
        const paymentReference = window.prompt('Payment reference (optional):', invoice.payment_reference || '');

        if (paymentReference === null) {
            return;
        }

        router.patch(
            route('admin.invoices.mark-paid', invoice.id),
            { payment_reference: paymentReference },
            { preserveScroll: true },
        );
    };

    const deleteInvoice = () => {
        if (!window.confirm(`Delete invoice ${invoice.invoice_number}? This cannot be undone.`)) {
            return;
        }

        router.delete(route('admin.invoices.destroy', invoice.id));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        Invoice {invoice.invoice_number}
                    </h2>
                    <Link
                        href={route('admin.invoices.index')}
                        className="rounded-md border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                    >
                        Back to Invoices
                    </Link>
                </div>
            }
        >
            <Head title={`Invoice ${invoice.invoice_number}`} />

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
                                <p className="text-xs uppercase tracking-wide text-gray-500">Invoice Title</p>
                                <h3 className="mt-1 text-2xl font-semibold text-gray-900">{invoice.title}</h3>
                                <p className="mt-2 text-sm text-gray-600">
                                    {invoice.description || 'No description provided.'}
                                </p>
                            </div>
                            <span
                                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                    invoice.status === 'paid'
                                        ? 'bg-emerald-100 text-emerald-700'
                                        : 'bg-amber-100 text-amber-700'
                                }`}
                            >
                                {invoice.status.toUpperCase()}
                            </span>
                        </div>

                        <div className="mt-6 grid gap-4 sm:grid-cols-2">
                            <Info label="Amount" value={formatMoney(invoice.amount, invoice.currency)} />
                            <Info label="Due Date" value={invoice.due_date || 'N/A'} />
                            <Info label="Issued At" value={invoice.issued_at || 'N/A'} />
                            <Info label="Paid At" value={invoice.paid_at || 'N/A'} />
                            <Info label="Payment Reference" value={invoice.payment_reference || 'N/A'} />
                            <Info label="Created By" value={invoice.creator || 'N/A'} />
                        </div>

                        <div className="mt-6 flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                onClick={resendInvoice}
                                className="rounded-md border border-indigo-200 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-50"
                            >
                                Resend Original Invoice
                            </button>
                            {invoice.status !== 'paid' && (
                                <button
                                    type="button"
                                    onClick={sendReminder}
                                    className="rounded-md border border-amber-200 px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-50"
                                >
                                    Send Reminder
                                </button>
                            )}
                            {invoice.status !== 'paid' && (
                                <button
                                    type="button"
                                    onClick={markInvoicePaid}
                                    className="rounded-md border border-emerald-200 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                                >
                                    Mark as Paid
                                </button>
                            )}
                            {canDeleteInvoices && (
                                <button
                                    type="button"
                                    onClick={deleteInvoice}
                                    className="rounded-md border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50"
                                >
                                    Delete Invoice
                                </button>
                            )}
                        </div>
                    </section>

                    <section className="grid gap-6 lg:grid-cols-2">
                        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
                            <h4 className="text-base font-semibold text-gray-900">Customer Details</h4>
                            <div className="mt-4 space-y-2 text-sm text-gray-700">
                                <p><span className="font-semibold">Name:</span> {invoice.customer_name}</p>
                                <p><span className="font-semibold">Email:</span> {invoice.customer_email}</p>
                                <p><span className="font-semibold">Occupation:</span> {invoice.customer_occupation || 'N/A'}</p>
                                <p><span className="font-semibold">Phone:</span> {invoice.customer?.phone || 'N/A'}</p>
                                <p><span className="font-semibold">Company:</span> {invoice.customer?.company || 'N/A'}</p>
                                <p><span className="font-semibold">Address:</span> {invoice.customer?.address || 'N/A'}</p>
                            </div>
                        </div>

                        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
                            <h4 className="text-base font-semibold text-gray-900">Reminder Tracking</h4>
                            <div className="mt-4 space-y-2 text-sm text-gray-700">
                                <p>
                                    <span className="font-semibold">Automatic reminders:</span>{' '}
                                    {invoice.automatic_reminders_sent}/13
                                </p>
                                <p>
                                    <span className="font-semibold">Last automatic reminder:</span>{' '}
                                    {invoice.last_automatic_reminder_sent_at || 'N/A'}
                                </p>
                                <p>
                                    <span className="font-semibold">Last manual reminder:</span>{' '}
                                    {invoice.last_manual_reminder_sent_at || 'N/A'}
                                </p>
                                <p>
                                    <span className="font-semibold">Created at:</span>{' '}
                                    {invoice.created_at || 'N/A'}
                                </p>
                                <p>
                                    <span className="font-semibold">Updated at:</span>{' '}
                                    {invoice.updated_at || 'N/A'}
                                </p>
                            </div>
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
