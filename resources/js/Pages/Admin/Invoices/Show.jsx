import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { MobileCard, MobileCardList, MobileCardRow } from '@/Components/ui/mobile-cards';
import { Select } from '@/Components/ui/select';
import Modal from '@/Components/Modal';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatMoney } from '@/lib/utils';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';

const PAYMENT_METHODS = [
    { value: 'whatsapp', label: 'WhatsApp' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'cash', label: 'Cash' },
    { value: 'paystack', label: 'Paystack' },
    { value: 'flutterwave', label: 'Flutterwave' },
    { value: 'other', label: 'Other' },
];

export default function InvoiceShow({ invoice, permissions = {} }) {
    const { flash } = usePage().props;
    const canDeleteInvoices = Boolean(permissions?.can_delete_invoices);
    const canDeletePaidInvoices = Boolean(permissions?.can_delete_paid_invoices);
    const canDeleteThisInvoice = invoice.status === 'paid' ? canDeletePaidInvoices : canDeleteInvoices;
    const canSendQuestionnaire = Boolean(permissions?.can_send_questionnaire);
    const [showMarkPaidModal, setShowMarkPaidModal] = useState(false);

    const markPaidForm = useForm({
        payment_method: invoice.payment_method || 'whatsapp',
        payment_reference: invoice.payment_reference || '',
    });

    const resendInvoice = () => {
        router.post(route('admin.invoices.resend', invoice.uuid), {}, { preserveScroll: true });
    };

    const duplicateInvoice = () => {
        router.visit(route('admin.invoices.index', {
            duplicate: invoice.uuid,
            duplicate_number: invoice.invoice_number,
        }));
    };

    const sendReminder = () => {
        router.post(route('admin.invoices.remind', invoice.uuid), {}, { preserveScroll: true });
    };

    const submitMarkPaid = (event) => {
        event.preventDefault();

        markPaidForm.patch(route('admin.invoices.mark-paid', invoice.uuid), {
            preserveScroll: true,
            onSuccess: () => setShowMarkPaidModal(false),
        });
    };

    const sendQuestionnaire = () => {
        router.post(route('admin.invoices.send-questionnaire', invoice.uuid), {}, { preserveScroll: true });
    };

    const deleteInvoice = () => {
        if (!window.confirm(`Delete invoice ${invoice.invoice_number}? The customer will automatically be emailed an apology letting them know it was sent in error.`)) {
            return;
        }

        const reason = window.prompt(
            'Optional: add a short note to include in the apology email to the customer (leave blank to skip).',
            '',
        );

        router.delete(route('admin.invoices.destroy', invoice.uuid), {
            data: { reason: reason || '' },
        });
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
                            <Info
                                label="Payment Method"
                                value={PAYMENT_METHODS.find((method) => method.value === invoice.payment_method)?.label || 'N/A'}
                            />
                            <Info label="Created By" value={invoice.creator || 'N/A'} />
                        </div>

                        {invoice.service_order?.service_name && (
                            <div className="mt-4 rounded-lg border border-gray-100 bg-gray-50 p-3">
                                <p className="text-xs uppercase tracking-wide text-gray-500">Service Ordered</p>
                                <p className="mt-1 text-sm font-semibold text-gray-900">
                                    {invoice.service_order.service_name}
                                    {invoice.service_order.package_name ? ` — ${invoice.service_order.package_name}` : ''}
                                </p>
                            </div>
                        )}

                        {invoice.latest_questionnaire && (
                            <div className="mt-4 rounded-lg border border-gray-100 bg-gray-50 p-3 text-sm text-gray-700">
                                {invoice.latest_questionnaire.status === 'completed'
                                    ? `Questionnaire completed ${invoice.latest_questionnaire.completed_at}.`
                                    : `Questionnaire sent ${invoice.latest_questionnaire.requested_at}, awaiting response.`}
                            </div>
                        )}

                        <div className="mt-6 flex flex-wrap items-center gap-2">
                            {invoice.status === 'paid' ? (
                                <button
                                    type="button"
                                    onClick={duplicateInvoice}
                                    className="rounded-md border border-brand/30 px-3 py-2 text-xs font-semibold text-brand hover:bg-brand-light"
                                >
                                    Duplicate Invoice
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={resendInvoice}
                                    className="rounded-md border border-brand/30 px-3 py-2 text-xs font-semibold text-brand hover:bg-brand-light"
                                >
                                    Resend Original Invoice
                                </button>
                            )}
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
                                    onClick={() => setShowMarkPaidModal(true)}
                                    className="rounded-md border border-emerald-200 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                                >
                                    Mark as Paid
                                </button>
                            )}
                            {canSendQuestionnaire && invoice.status === 'paid' && invoice.payment_method === 'whatsapp' && (
                                <button
                                    type="button"
                                    onClick={sendQuestionnaire}
                                    className="rounded-md border border-sky-200 px-3 py-2 text-xs font-semibold text-sky-700 hover:bg-sky-50"
                                >
                                    Send Questionnaire
                                </button>
                            )}
                            {canDeleteThisInvoice && (
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

                    {invoice.items?.length > 0 && (
                        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
                            <h4 className="text-base font-semibold text-gray-900">Line Items</h4>
                            <div className="mt-4 hidden overflow-x-auto md:block">
                                <table className="min-w-full divide-y divide-gray-200 text-sm">
                                    <thead>
                                        <tr>
                                            <th className="px-3 py-2 text-left font-semibold text-gray-600">Description</th>
                                            <th className="px-3 py-2 text-right font-semibold text-gray-600">Qty</th>
                                            <th className="px-3 py-2 text-right font-semibold text-gray-600">Unit Price</th>
                                            <th className="px-3 py-2 text-right font-semibold text-gray-600">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {invoice.items.map((item) => (
                                            <tr key={item.id}>
                                                <td className="px-3 py-2 text-gray-900">{item.description}</td>
                                                <td className="px-3 py-2 text-right text-gray-700">{item.quantity}</td>
                                                <td className="px-3 py-2 text-right text-gray-700">
                                                    {formatMoney(item.unit_price, invoice.currency)}
                                                </td>
                                                <td className="px-3 py-2 text-right text-gray-900">
                                                    {formatMoney(item.amount, invoice.currency)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot>
                                        <tr>
                                            <td colSpan={3} className="px-3 py-2 text-right font-semibold text-gray-900">
                                                Total
                                            </td>
                                            <td className="px-3 py-2 text-right font-semibold text-gray-900">
                                                {formatMoney(invoice.amount, invoice.currency)}
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>

                            <div className="mt-4 md:hidden">
                                <MobileCardList>
                                    {invoice.items.map((item, index) => (
                                        <MobileCard key={item.id} index={index}>
                                            <p className="text-sm font-semibold text-gray-900">{item.description}</p>
                                            <div className="mt-2 space-y-0.5 divide-y divide-gray-50">
                                                <MobileCardRow label="Quantity" value={item.quantity} />
                                                <MobileCardRow label="Unit Price" value={formatMoney(item.unit_price, invoice.currency)} />
                                                <MobileCardRow label="Total" value={formatMoney(item.amount, invoice.currency)} />
                                            </div>
                                        </MobileCard>
                                    ))}
                                </MobileCardList>
                                <div className="mt-3 flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
                                    <span className="text-sm font-semibold text-gray-900">Total</span>
                                    <span className="text-sm font-semibold text-gray-900">
                                        {formatMoney(invoice.amount, invoice.currency)}
                                    </span>
                                </div>
                            </div>
                        </section>
                    )}

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

            <Modal show={showMarkPaidModal} onClose={() => setShowMarkPaidModal(false)} maxWidth="md">
                <form onSubmit={submitMarkPaid} className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900">Mark Invoice as Paid</h3>
                    <p className="mt-1 text-sm text-gray-600">
                        Confirm how {invoice.customer_name} paid for invoice {invoice.invoice_number}.
                    </p>

                    <div className="mt-4 space-y-4">
                        <div>
                            <Label htmlFor="payment_method">Payment Method</Label>
                            <Select
                                id="payment_method"
                                className="mt-1"
                                value={markPaidForm.data.payment_method}
                                onChange={(event) => markPaidForm.setData('payment_method', event.target.value)}
                            >
                                {PAYMENT_METHODS.map((method) => (
                                    <option key={method.value} value={method.value}>{method.label}</option>
                                ))}
                            </Select>
                            {markPaidForm.errors.payment_method && (
                                <p className="mt-1 text-xs text-red-600">{markPaidForm.errors.payment_method}</p>
                            )}
                        </div>

                        <div>
                            <Label htmlFor="payment_reference">Payment Reference (optional)</Label>
                            <Input
                                id="payment_reference"
                                className="mt-1"
                                value={markPaidForm.data.payment_reference}
                                onChange={(event) => markPaidForm.setData('payment_reference', event.target.value)}
                            />
                            {markPaidForm.errors.payment_reference && (
                                <p className="mt-1 text-xs text-red-600">{markPaidForm.errors.payment_reference}</p>
                            )}
                        </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-2">
                        <Button type="button" variant="outline" onClick={() => setShowMarkPaidModal(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={markPaidForm.processing}>
                            {markPaidForm.processing ? 'Saving...' : 'Confirm Payment'}
                        </Button>
                    </div>
                </form>
            </Modal>
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
