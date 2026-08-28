import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';

const currencies = ['NGN', 'USD', 'EUR', 'GBP'];

export default function InvoiceIndex({ invoices, stats = {}, filters = {}, permissions = {}, occupations = [] }) {
    const { flash } = usePage().props;
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');
    const canDeleteInvoices = Boolean(permissions?.can_delete_invoices);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [customerQuery, setCustomerQuery] = useState('');
    const [customerResults, setCustomerResults] = useState([]);
    const [customerSearchLoading, setCustomerSearchLoading] = useState(false);
    const [selectedCustomerLabel, setSelectedCustomerLabel] = useState('');
    const customerSearchTimer = useRef(null);

    const createForm = useForm({
        customer_id: '',
        customer_name: '',
        customer_email: '',
        customer_occupation: '',
        title: '',
        description: '',
        items: [{ description: '', quantity: 1, unit_price: '' }],
        currency: 'NGN',
        due_date: '',
    });

    const invoiceItemsTotal = createForm.data.items.reduce(
        (sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unit_price) || 0),
        0,
    );

    const updateItem = (index, field, value) => {
        const nextItems = createForm.data.items.map((item, itemIndex) => (
            itemIndex === index ? { ...item, [field]: value } : item
        ));
        createForm.setData('items', nextItems);
    };

    const addItem = () => {
        createForm.setData('items', [...createForm.data.items, { description: '', quantity: 1, unit_price: '' }]);
    };

    const removeItem = (index) => {
        createForm.setData('items', createForm.data.items.filter((_, itemIndex) => itemIndex !== index));
    };

    useEffect(() => {
        if (customerQuery.trim().length < 2) {
            setCustomerResults([]);
            return undefined;
        }

        if (customerSearchTimer.current) {
            window.clearTimeout(customerSearchTimer.current);
        }

        customerSearchTimer.current = window.setTimeout(() => {
            setCustomerSearchLoading(true);

            window.axios
                .get(route('admin.customers.search'), { params: { query: customerQuery.trim() } })
                .then((response) => {
                    setCustomerResults(Array.isArray(response?.data?.results) ? response.data.results : []);
                })
                .catch(() => setCustomerResults([]))
                .finally(() => setCustomerSearchLoading(false));
        }, 300);

        return () => {
            if (customerSearchTimer.current) {
                window.clearTimeout(customerSearchTimer.current);
            }
        };
    }, [customerQuery]);

    const selectCustomer = (result) => {
        createForm.setData((previous) => ({
            ...previous,
            customer_id: result.customer_id || '',
            customer_name: result.display_name || '',
            customer_email: result.email || '',
            customer_occupation: result.occupation || '',
        }));
        setSelectedCustomerLabel(`${result.display_name} (${result.email})`);
        setCustomerQuery('');
        setCustomerResults([]);
    };

    const clearSelectedCustomer = () => {
        createForm.setData((previous) => ({ ...previous, customer_id: '' }));
        setSelectedCustomerLabel('');
    };

    const submitCreateInvoice = (event) => {
        event.preventDefault();

        createForm.post(route('admin.invoices.store'), {
            preserveScroll: true,
            onSuccess: () => {
                createForm.reset();
                setSelectedCustomerLabel('');
                setCustomerQuery('');
                setCustomerResults([]);
                setShowCreateForm(false);
            },
        });
    };

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
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setShowCreateForm((previous) => !previous)}
                            className="rounded-md bg-brand px-3 py-2 text-xs font-semibold text-white hover:bg-brand-dark"
                        >
                            {showCreateForm ? 'Close' : 'New Invoice'}
                        </button>
                        <Link
                            href={route('dashboard')}
                            className="rounded-md border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                        >
                            Back to Dashboard
                        </Link>
                    </div>
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

                    {showCreateForm && (
                        <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                            <h3 className="text-lg font-semibold text-gray-900">New Invoice</h3>
                            <p className="mt-1 text-sm text-gray-600">
                                Search for an existing customer or fill in the details for a new one, then set the invoice amount.
                            </p>

                            <form onSubmit={submitCreateInvoice} className="mt-5 space-y-4">
                                <div>
                                    <label htmlFor="customer-search" className="mb-1 block text-sm font-medium text-gray-700">
                                        Find customer
                                    </label>
                                    {selectedCustomerLabel ? (
                                        <div className="flex items-center justify-between rounded-md border border-brand/30 bg-brand-light px-3 py-2 text-sm text-brand">
                                            <span>{selectedCustomerLabel}</span>
                                            <button
                                                type="button"
                                                onClick={clearSelectedCustomer}
                                                className="text-xs font-semibold text-brand hover:text-brand-dark"
                                            >
                                                Change
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="relative">
                                            <input
                                                id="customer-search"
                                                value={customerQuery}
                                                onChange={(event) => setCustomerQuery(event.target.value)}
                                                placeholder="Search by name or email"
                                                autoComplete="off"
                                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
                                            />
                                            {customerSearchLoading && (
                                                <p className="mt-1 text-xs text-gray-500">Searching...</p>
                                            )}
                                            {customerResults.length > 0 && (
                                                <ul className="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg">
                                                    {customerResults.map((result) => (
                                                        <li key={`${result.source}-${result.customer_id || result.email}`}>
                                                            <button
                                                                type="button"
                                                                onClick={() => selectCustomer(result)}
                                                                className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                                                            >
                                                                <span className="font-medium text-gray-900">{result.display_name}</span>
                                                                <span className="ml-2 text-xs text-gray-500">{result.email}</span>
                                                            </button>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    )}
                                    <p className="mt-1 text-xs text-gray-500">
                                        No match? Fill in the customer name and email below to invoice someone new.
                                    </p>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <label htmlFor="customer-name" className="mb-1 block text-sm font-medium text-gray-700">
                                            Customer name
                                        </label>
                                        <input
                                            id="customer-name"
                                            value={createForm.data.customer_name}
                                            onChange={(event) => createForm.setData('customer_name', event.target.value)}
                                            disabled={Boolean(createForm.data.customer_id)}
                                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30 disabled:bg-gray-100"
                                        />
                                        {createForm.errors.customer_name && (
                                            <p className="mt-1 text-xs text-red-600">{createForm.errors.customer_name}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label htmlFor="customer-email" className="mb-1 block text-sm font-medium text-gray-700">
                                            Customer email
                                        </label>
                                        <input
                                            id="customer-email"
                                            type="email"
                                            value={createForm.data.customer_email}
                                            onChange={(event) => createForm.setData('customer_email', event.target.value)}
                                            disabled={Boolean(createForm.data.customer_id)}
                                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30 disabled:bg-gray-100"
                                        />
                                        {createForm.errors.customer_email && (
                                            <p className="mt-1 text-xs text-red-600">{createForm.errors.customer_email}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label htmlFor="customer-occupation" className="mb-1 block text-sm font-medium text-gray-700">
                                            Occupation (optional)
                                        </label>
                                        <select
                                            id="customer-occupation"
                                            value={createForm.data.customer_occupation}
                                            onChange={(event) => createForm.setData('customer_occupation', event.target.value)}
                                            disabled={Boolean(createForm.data.customer_id)}
                                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30 disabled:bg-gray-100"
                                        >
                                            <option value="">Not specified</option>
                                            {occupations.map((occupation) => (
                                                <option key={occupation} value={occupation}>
                                                    {occupation}
                                                </option>
                                            ))}
                                        </select>
                                        {createForm.errors.customer_occupation && (
                                            <p className="mt-1 text-xs text-red-600">{createForm.errors.customer_occupation}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label htmlFor="invoice-due-date" className="mb-1 block text-sm font-medium text-gray-700">
                                            Due date (optional)
                                        </label>
                                        <input
                                            id="invoice-due-date"
                                            type="date"
                                            value={createForm.data.due_date}
                                            onChange={(event) => createForm.setData('due_date', event.target.value)}
                                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
                                        />
                                        {createForm.errors.due_date && (
                                            <p className="mt-1 text-xs text-red-600">{createForm.errors.due_date}</p>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="invoice-title" className="mb-1 block text-sm font-medium text-gray-700">
                                        Invoice title
                                    </label>
                                    <input
                                        id="invoice-title"
                                        value={createForm.data.title}
                                        onChange={(event) => createForm.setData('title', event.target.value)}
                                        placeholder="e.g. Brand Design Package"
                                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
                                    />
                                    {createForm.errors.title && (
                                        <p className="mt-1 text-xs text-red-600">{createForm.errors.title}</p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="invoice-description" className="mb-1 block text-sm font-medium text-gray-700">
                                        Description (optional)
                                    </label>
                                    <textarea
                                        id="invoice-description"
                                        value={createForm.data.description}
                                        onChange={(event) => createForm.setData('description', event.target.value)}
                                        rows={3}
                                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
                                    />
                                    {createForm.errors.description && (
                                        <p className="mt-1 text-xs text-red-600">{createForm.errors.description}</p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="invoice-currency" className="mb-1 block text-sm font-medium text-gray-700">
                                        Currency
                                    </label>
                                    <select
                                        id="invoice-currency"
                                        value={createForm.data.currency}
                                        onChange={(event) => createForm.setData('currency', event.target.value)}
                                        className="w-full max-w-[160px] rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
                                    >
                                        {currencies.map((currency) => (
                                            <option key={currency} value={currency}>
                                                {currency}
                                            </option>
                                        ))}
                                    </select>
                                    {createForm.errors.currency && (
                                        <p className="mt-1 text-xs text-red-600">{createForm.errors.currency}</p>
                                    )}
                                </div>

                                <div>
                                    <div className="mb-2 flex items-center justify-between">
                                        <label className="block text-sm font-medium text-gray-700">Line items</label>
                                        <button
                                            type="button"
                                            onClick={addItem}
                                            className="text-xs font-semibold text-brand hover:text-brand-dark"
                                        >
                                            + Add item
                                        </button>
                                    </div>

                                    <div className="space-y-2">
                                        {createForm.data.items.map((item, index) => (
                                            <div key={index} className="grid grid-cols-[1fr_70px_110px_auto] items-center gap-2">
                                                <input
                                                    value={item.description}
                                                    onChange={(event) => updateItem(index, 'description', event.target.value)}
                                                    placeholder="e.g. Logo design"
                                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
                                                />
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={item.quantity}
                                                    onChange={(event) => updateItem(index, 'quantity', event.target.value)}
                                                    className="w-full rounded-md border border-gray-300 px-2 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
                                                />
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={item.unit_price}
                                                    onChange={(event) => updateItem(index, 'unit_price', event.target.value)}
                                                    placeholder="Unit price"
                                                    className="w-full rounded-md border border-gray-300 px-2 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removeItem(index)}
                                                    disabled={createForm.data.items.length === 1}
                                                    title="Remove item"
                                                    className="rounded-md border border-gray-300 px-2 py-2 text-xs font-semibold text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ))}
                                    </div>

                                    {createForm.errors.items && (
                                        <p className="mt-2 text-xs text-red-600">{createForm.errors.items}</p>
                                    )}

                                    <p className="mt-2 text-right text-sm font-semibold text-gray-900">
                                        Total: {formatMoney(invoiceItemsTotal, createForm.data.currency)}
                                    </p>
                                </div>

                                <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowCreateForm(false)}
                                        className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={createForm.processing}
                                        className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {createForm.processing ? 'Creating...' : 'Create & Send Invoice'}
                                    </button>
                                </div>
                            </form>
                        </section>
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
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
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
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
                                >
                                    <option value="">All</option>
                                    <option value="sent">Pending</option>
                                    <option value="paid">Paid</option>
                                </select>
                            </div>

                            <button
                                type="submit"
                                className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
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
                                                    className="rounded-md border border-brand/30 px-2 py-1 text-xs font-semibold text-brand hover:bg-brand-light"
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
