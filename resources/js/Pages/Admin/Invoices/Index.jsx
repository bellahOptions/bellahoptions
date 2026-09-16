import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Card } from '@/Components/ui/card';
import { MobileCard, MobileCardActions, MobileCardHeader, MobileCardList, MobileCardRow } from '@/Components/ui/mobile-cards';
import { StatCard, StatGrid } from '@/Components/ui/stat-card';
import { useDebouncedFilterSync } from '@/hooks/use-debounced-filter-sync';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatMoney } from '@/lib/utils';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { BadgeDollarSign, CheckCircle2, Clock, FileText, Loader2, RotateCcw, Search, Wallet } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const currencies = ['NGN', 'USD', 'EUR', 'GBP'];

const fieldClass = 'jv-input';
const labelClass = 'mb-1 block text-sm font-medium text-white/65';
const errorClass = 'mt-1 text-xs text-red-300';

export default function InvoiceIndex({ invoices, stats = {}, filters = {}, permissions = {}, occupations = [] }) {
    const { flash } = usePage().props;
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');
    const canDeleteInvoices = Boolean(permissions?.can_delete_invoices);
    const canDeletePaidInvoices = Boolean(permissions?.can_delete_paid_invoices);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [duplicateNotice, setDuplicateNotice] = useState('');
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
                setDuplicateNotice('');
            },
        });
    };

    const isSyncing = useDebouncedFilterSync('admin.invoices.index', { search, status });
    const hasActiveFilters = Boolean(search || status);

    const resetFilters = () => {
        setSearch('');
        setStatus('');
    };

    const resendInvoice = (invoiceId) => {
        router.post(route('admin.invoices.resend', invoiceId), {}, { preserveScroll: true });
    };

    const prefillFromInvoiceTemplate = (template, sourceInvoiceNumber) => {
        createForm.setData({
            customer_id: template.customer_id || '',
            customer_name: template.customer_name || '',
            customer_email: template.customer_email || '',
            customer_occupation: template.customer_occupation || '',
            title: template.title || '',
            description: template.description || '',
            items: template.items?.length
                ? template.items.map((item) => ({
                      description: item.description || '',
                      quantity: item.quantity || 1,
                      unit_price: item.unit_price || '',
                  }))
                : [{ description: '', quantity: 1, unit_price: '' }],
            currency: template.currency || 'NGN',
            due_date: template.due_date || '',
        });

        if (template.customer_id && template.customer_name) {
            setSelectedCustomerLabel(`${template.customer_name} (${template.customer_email || ''})`);
        }

        setDuplicateNotice(`Reviewing a copy of invoice ${sourceInvoiceNumber}. Edit anything needed, then send when ready — nothing has been emailed yet.`);
        setShowCreateForm(true);

        window.requestAnimationFrame(() => {
            document.getElementById('invoice-title')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
    };

    const duplicateInvoice = (invoiceId, invoiceNumber) => {
        window.axios
            .get(route('admin.invoices.duplicate', invoiceId))
            .then((response) => {
                prefillFromInvoiceTemplate(response?.data?.invoice || {}, invoiceNumber);
            })
            .catch((error) => {
                window.alert(error?.response?.data?.message || 'Unable to load this invoice for duplication.');
            });
    };

    const prefillFromBrief = (briefUuid, referenceNumber) => {
        window.axios
            .get(route('admin.service-briefs.quote-template', briefUuid))
            .then((response) => {
                prefillFromInvoiceTemplate(response?.data?.invoice || {}, `brief ${referenceNumber}`);
            })
            .catch((error) => {
                window.alert(error?.response?.data?.message || 'Unable to load this brief for quoting.');
            });
    };

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const duplicateId = params.get('duplicate');
        const duplicateNumber = params.get('duplicate_number');
        const fromBrief = params.get('from_brief');
        const fromBriefRef = params.get('from_brief_ref');

        if (duplicateId) {
            duplicateInvoice(duplicateId, duplicateNumber || `#${duplicateId}`);

            params.delete('duplicate');
            params.delete('duplicate_number');
            const query = params.toString();
            window.history.replaceState({}, '', `${window.location.pathname}${query ? `?${query}` : ''}`);
        } else if (fromBrief) {
            prefillFromBrief(fromBrief, fromBriefRef || fromBrief);

            params.delete('from_brief');
            params.delete('from_brief_ref');
            const query = params.toString();
            window.history.replaceState({}, '', `${window.location.pathname}${query ? `?${query}` : ''}`);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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

    const canDeleteInvoice = (invoice) => (
        invoice.status === 'paid' ? canDeletePaidInvoices : canDeleteInvoices
    );

    const deleteInvoice = (invoiceId, invoiceNumber) => {
        if (!window.confirm(`Delete invoice ${invoiceNumber}? The customer will automatically be emailed an apology letting them know it was sent in error.`)) {
            return;
        }

        const reason = window.prompt(
            'Optional: add a short note to include in the apology email to the customer (leave blank to skip).',
            '',
        );

        router.delete(route('admin.invoices.destroy', invoiceId), {
            data: { reason: reason || '' },
            preserveScroll: true,
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="jv-display jv-display--sm">Invoices</h2>
                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            size="sm"
                            onClick={() => {
                                setShowCreateForm((previous) => !previous);
                                setDuplicateNotice('');
                            }}
                        >
                            {showCreateForm ? 'Close' : 'New Invoice'}
                        </Button>
                        <Link
                            href={route('dashboard')}
                            className="jv-btn jv-btn--ghost jv-btn--sm"
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
                        <div className="rounded-jv-sm border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                            {flash.success}
                        </div>
                    )}

                    {flash?.error && (
                        <div className="rounded-jv-sm border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                            {flash.error}
                        </div>
                    )}

                    {showCreateForm && (
                        <Card className="p-5">
                            <h3 className="text-lg font-semibold text-white">New Invoice</h3>
                            <p className="mt-1 text-sm text-white/60">
                                Search for an existing customer or fill in the details for a new one, then set the invoice amount.
                            </p>

                            {duplicateNotice && (
                                <div className="mt-3 rounded-jv-sm border border-jv-accent-line bg-jv-accent/10 px-3 py-2 text-sm text-[#a9c4ff]">
                                    {duplicateNotice}
                                </div>
                            )}

                            <form onSubmit={submitCreateInvoice} className="mt-5 space-y-4">
                                <div>
                                    <label htmlFor="customer-search" className={labelClass}>
                                        Find customer
                                    </label>
                                    {selectedCustomerLabel ? (
                                        <div className="flex items-center justify-between rounded-jv-sm border border-jv-accent-line bg-jv-accent/10 px-3 py-2 text-sm text-[#a9c4ff]">
                                            <span>{selectedCustomerLabel}</span>
                                            <button
                                                type="button"
                                                onClick={clearSelectedCustomer}
                                                className="text-xs font-semibold text-jv-accent transition hover:text-[#4d8bff]"
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
                                                className={fieldClass}
                                            />
                                            {customerSearchLoading && (
                                                <p className="mt-1 text-xs text-white/45">Searching...</p>
                                            )}
                                            {customerResults.length > 0 && (
                                                <ul className="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded-jv-sm border border-jv-line-strong bg-[#12121a] backdrop-blur-xl">
                                                    {customerResults.map((result) => (
                                                        <li key={`${result.source}-${result.customer_id || result.email}`}>
                                                            <button
                                                                type="button"
                                                                onClick={() => selectCustomer(result)}
                                                                className="block w-full px-3 py-2 text-left text-sm transition hover:bg-white/[0.06]"
                                                            >
                                                                <span className="font-medium text-white">{result.display_name}</span>
                                                                <span className="ml-2 text-xs text-white/45">{result.email}</span>
                                                            </button>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    )}
                                    <p className="mt-1 text-xs text-white/45">
                                        No match? Fill in the customer name and email below to invoice someone new.
                                    </p>
                                </div>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <label htmlFor="customer-name" className={labelClass}>
                                            Customer name
                                        </label>
                                        <input
                                            id="customer-name"
                                            value={createForm.data.customer_name}
                                            onChange={(event) => createForm.setData('customer_name', event.target.value)}
                                            disabled={Boolean(createForm.data.customer_id)}
                                            className={`${fieldClass} disabled:bg-white/[0.03]`}
                                        />
                                        {createForm.errors.customer_name && (
                                            <p className={errorClass}>{createForm.errors.customer_name}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label htmlFor="customer-email" className={labelClass}>
                                            Customer email
                                        </label>
                                        <input
                                            id="customer-email"
                                            type="email"
                                            value={createForm.data.customer_email}
                                            onChange={(event) => createForm.setData('customer_email', event.target.value)}
                                            disabled={Boolean(createForm.data.customer_id)}
                                            className={`${fieldClass} disabled:bg-white/[0.03]`}
                                        />
                                        {createForm.errors.customer_email && (
                                            <p className={errorClass}>{createForm.errors.customer_email}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label htmlFor="customer-occupation" className={labelClass}>
                                            Occupation (optional)
                                        </label>
                                        <select
                                            id="customer-occupation"
                                            value={createForm.data.customer_occupation}
                                            onChange={(event) => createForm.setData('customer_occupation', event.target.value)}
                                            disabled={Boolean(createForm.data.customer_id)}
                                            className="jv-select disabled:bg-white/[0.03]"
                                        >
                                            <option value="">Not specified</option>
                                            {occupations.map((occupation) => (
                                                <option key={occupation} value={occupation}>
                                                    {occupation}
                                                </option>
                                            ))}
                                        </select>
                                        {createForm.errors.customer_occupation && (
                                            <p className={errorClass}>{createForm.errors.customer_occupation}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label htmlFor="invoice-due-date" className={labelClass}>
                                            Due date (optional)
                                        </label>
                                        <input
                                            id="invoice-due-date"
                                            type="date"
                                            value={createForm.data.due_date}
                                            onChange={(event) => createForm.setData('due_date', event.target.value)}
                                            className={fieldClass}
                                        />
                                        {createForm.errors.due_date && (
                                            <p className={errorClass}>{createForm.errors.due_date}</p>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="invoice-title" className={labelClass}>
                                        Invoice title
                                    </label>
                                    <input
                                        id="invoice-title"
                                        value={createForm.data.title}
                                        onChange={(event) => createForm.setData('title', event.target.value)}
                                        placeholder="e.g. Brand Design Package"
                                        className={fieldClass}
                                    />
                                    {createForm.errors.title && (
                                        <p className={errorClass}>{createForm.errors.title}</p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="invoice-description" className={labelClass}>
                                        Description (optional)
                                    </label>
                                    <textarea
                                        id="invoice-description"
                                        value={createForm.data.description}
                                        onChange={(event) => createForm.setData('description', event.target.value)}
                                        rows={3}
                                        className="jv-textarea"
                                    />
                                    {createForm.errors.description && (
                                        <p className={errorClass}>{createForm.errors.description}</p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="invoice-currency" className={labelClass}>
                                        Currency
                                    </label>
                                    <select
                                        id="invoice-currency"
                                        value={createForm.data.currency}
                                        onChange={(event) => createForm.setData('currency', event.target.value)}
                                        className="jv-select max-w-[160px]"
                                    >
                                        {currencies.map((currency) => (
                                            <option key={currency} value={currency}>
                                                {currency}
                                            </option>
                                        ))}
                                    </select>
                                    {createForm.errors.currency && (
                                        <p className={errorClass}>{createForm.errors.currency}</p>
                                    )}
                                </div>

                                <div>
                                    <div className="mb-2 flex items-center justify-between">
                                        <label className="block text-sm font-medium text-white/65">Line items</label>
                                        <button
                                            type="button"
                                            onClick={addItem}
                                            className="text-xs font-semibold text-jv-accent transition hover:text-[#4d8bff]"
                                        >
                                            + Add item
                                        </button>
                                    </div>

                                    <div className="space-y-2">
                                        {createForm.data.items.map((item, index) => (
                                            <div key={index} className="grid grid-cols-1 gap-2 rounded-jv-sm border border-jv-line p-2 sm:grid-cols-[1fr_70px_110px_auto] sm:items-center sm:border-0 sm:p-0">
                                                <input
                                                    value={item.description}
                                                    onChange={(event) => updateItem(index, 'description', event.target.value)}
                                                    placeholder="e.g. Logo design"
                                                    className={`${fieldClass} min-w-0`}
                                                />
                                                {/* On mobile this wrapper stacks qty/price/remove as a row below the
                                                    description; from sm: up, `contents` drops it from the layout so
                                                    its children rejoin the parent grid's fixed columns directly. */}
                                                <div className="grid grid-cols-[1fr_1fr_auto] items-center gap-2 sm:contents">
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={item.quantity}
                                                        onChange={(event) => updateItem(index, 'quantity', event.target.value)}
                                                        placeholder="Qty"
                                                        className={`${fieldClass} min-w-0`}
                                                    />
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        value={item.unit_price}
                                                        onChange={(event) => updateItem(index, 'unit_price', event.target.value)}
                                                        placeholder="Unit price"
                                                        className={`${fieldClass} min-w-0`}
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeItem(index)}
                                                        disabled={createForm.data.items.length === 1}
                                                        title="Remove item"
                                                        className="rounded-full border border-jv-line-strong px-3 py-2 text-xs font-semibold text-white/60 transition hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {createForm.errors.items && (
                                        <p className="mt-2 text-xs text-red-300">{createForm.errors.items}</p>
                                    )}

                                    <p className="mt-2 text-right text-sm font-semibold text-white">
                                        Total: {formatMoney(invoiceItemsTotal, createForm.data.currency)}
                                    </p>
                                </div>

                                <div className="flex justify-end gap-3 border-t border-jv-line pt-4">
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        onClick={() => {
                                            setShowCreateForm(false);
                                            setDuplicateNotice('');
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={createForm.processing}
                                    >
                                        {createForm.processing ? 'Creating...' : 'Create & Send Invoice'}
                                    </Button>
                                </div>
                            </form>
                        </Card>
                    )}

                    <StatGrid>
                        <StatCard icon={FileText} label="Total Invoices" value={stats.total_invoices ?? 0} tone="sky" />
                        <StatCard icon={Clock} label="Pending" value={stats.pending_invoices ?? 0} tone="amber" />
                        <StatCard icon={CheckCircle2} label="Paid" value={stats.paid_invoices ?? 0} tone="emerald" />
                        <StatCard icon={Wallet} label="Pending Amount" value={formatMoney(stats.pending_total ?? 0, 'NGN')} tone="amber" />
                        <StatCard icon={BadgeDollarSign} label="Paid Amount" value={formatMoney(stats.paid_total ?? 0, 'NGN')} tone="emerald" />
                    </StatGrid>

                    <Card className="p-4 sm:p-5">
                        <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
                            <div className="relative flex-1 lg:min-w-[240px]">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                                <input
                                    id="invoice-search"
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder="Search invoice number, customer, title…"
                                    className="jv-input py-2.5 pl-9 pr-9"
                                />
                                {isSyncing && (
                                    <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-jv-accent" />
                                )}
                            </div>

                            <select
                                id="invoice-status"
                                value={status}
                                onChange={(event) => setStatus(event.target.value)}
                                aria-label="Invoice status"
                                className="jv-select py-2.5 lg:w-auto"
                            >
                                <option value="">All statuses</option>
                                <option value="sent">Pending</option>
                                <option value="paid">Paid</option>
                            </select>

                            <button
                                type="button"
                                onClick={resetFilters}
                                disabled={!hasActiveFilters}
                                className="jv-btn jv-btn--ghost jv-btn--sm w-full lg:w-auto"
                            >
                                <RotateCcw className="h-3.5 w-3.5" />
                                Reset
                            </button>
                        </div>
                    </Card>

                    <Card className="overflow-hidden">
                        <div className="hidden overflow-x-auto md:block">
                            <table className="min-w-full text-sm">
                                <thead className="border-b border-jv-line">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-white/45">Invoice</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-white/45">Customer</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-white/45">Amount</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-white/45">Status</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-white/45">Reminders</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-white/45">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(invoices?.data || []).length === 0 && (
                                        <tr className="border-b border-jv-line/70">
                                            <td className="px-4 py-4 text-white/45" colSpan={6}>
                                                No invoices found.
                                            </td>
                                        </tr>
                                    )}

                                    {(invoices?.data || []).map((invoice) => (
                                        <tr key={invoice.id} className="border-b border-jv-line/70 transition hover:bg-white/[0.04]">
                                            <td className="px-4 py-3 align-top">
                                                <p className="font-semibold text-white">{invoice.invoice_number}</p>
                                                <p className="text-xs text-white/45">{invoice.title}</p>
                                            </td>
                                            <td className="px-4 py-3 align-top text-white/70">
                                                <p>{invoice.customer_name}</p>
                                                <p className="text-xs text-white/45">{invoice.customer_email}</p>
                                            </td>
                                            <td className="px-4 py-3 align-top font-semibold text-white">
                                                {formatMoney(invoice.amount, invoice.currency)}
                                            </td>
                                            <td className="px-4 py-3 align-top">
                                                <Badge variant={invoice.status === 'paid' ? 'success' : 'warning'}>
                                                    {invoice.status.toUpperCase()}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 align-top text-xs text-white/70">
                                                <p>Auto: {invoice.automatic_reminders_sent}/13</p>
                                                <p className="text-white/45">
                                                    Last auto: {invoice.last_automatic_reminder_sent_at || 'N/A'}
                                                </p>
                                                <p className="text-white/45">
                                                    Last manual: {invoice.last_manual_reminder_sent_at || 'N/A'}
                                                </p>
                                            </td>
                                            <td className="space-x-2 px-4 py-3 align-top">
                                                <Link
                                                    href={route('admin.invoices.show', invoice.uuid)}
                                                    className="inline-flex items-center rounded-full border border-jv-line-strong px-2.5 py-1 text-xs font-semibold text-white/75 transition hover:border-jv-accent-line hover:bg-jv-accent/10 hover:text-white"
                                                >
                                                    View
                                                </Link>
                                                {invoice.status === 'paid' ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => duplicateInvoice(invoice.uuid, invoice.invoice_number)}
                                                        className="inline-flex items-center rounded-full border border-jv-accent-line px-2.5 py-1 text-xs font-semibold text-[#a9c4ff] transition hover:bg-jv-accent/15"
                                                    >
                                                        Duplicate
                                                    </button>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => resendInvoice(invoice.uuid)}
                                                        className="inline-flex items-center rounded-full border border-jv-accent-line px-2.5 py-1 text-xs font-semibold text-[#a9c4ff] transition hover:bg-jv-accent/15"
                                                    >
                                                        Resend
                                                    </button>
                                                )}
                                                {invoice.status !== 'paid' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => sendReminder(invoice.uuid)}
                                                        className="inline-flex items-center rounded-full border border-amber-500/30 px-2.5 py-1 text-xs font-semibold text-amber-300 transition hover:bg-amber-500/10"
                                                    >
                                                        Remind
                                                    </button>
                                                )}
                                                {invoice.status !== 'paid' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => markInvoicePaid(invoice.uuid)}
                                                        className="inline-flex items-center rounded-full border border-emerald-500/30 px-2.5 py-1 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/10"
                                                    >
                                                        Mark Paid
                                                    </button>
                                                )}
                                                {canDeleteInvoice(invoice) && (
                                                    <button
                                                        type="button"
                                                        onClick={() => deleteInvoice(invoice.uuid, invoice.invoice_number)}
                                                        className="inline-flex items-center rounded-full border border-red-500/30 px-2.5 py-1 text-xs font-semibold text-red-300 transition hover:bg-red-500/10"
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

                        {(invoices?.data || []).length === 0 ? (
                            <p className="p-5 text-sm text-white/45 md:hidden">No invoices found.</p>
                        ) : (
                            <div className="p-4 md:hidden">
                                <MobileCardList>
                                    {(invoices?.data || []).map((invoice, index) => (
                                        <MobileCard key={invoice.id} index={index}>
                                            <MobileCardHeader
                                                title={invoice.invoice_number}
                                                subtitle={invoice.title}
                                                badge={
                                                    <Badge variant={invoice.status === 'paid' ? 'success' : 'warning'}>
                                                        {invoice.status.toUpperCase()}
                                                    </Badge>
                                                }
                                            />

                                            <div className="mt-3 divide-y divide-jv-line">
                                                <MobileCardRow label="Customer" value={invoice.customer_name} />
                                                <MobileCardRow label="Email" value={invoice.customer_email} />
                                                <MobileCardRow label="Amount" value={formatMoney(invoice.amount, invoice.currency)} />
                                                <MobileCardRow label="Auto reminders" value={`${invoice.automatic_reminders_sent}/13`} />
                                                <MobileCardRow label="Last reminder" value={invoice.last_automatic_reminder_sent_at || invoice.last_manual_reminder_sent_at || 'N/A'} />
                                            </div>

                                            <MobileCardActions>
                                                <Link
                                                    href={route('admin.invoices.show', invoice.uuid)}
                                                    className="rounded-full border border-jv-line-strong px-3 py-1.5 text-xs font-semibold text-white/75 transition hover:bg-white/[0.06] hover:text-white"
                                                >
                                                    View
                                                </Link>
                                                {invoice.status === 'paid' ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => duplicateInvoice(invoice.uuid, invoice.invoice_number)}
                                                        className="rounded-full border border-jv-accent-line px-3 py-1.5 text-xs font-semibold text-[#a9c4ff] transition hover:bg-jv-accent/15"
                                                    >
                                                        Duplicate
                                                    </button>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        onClick={() => resendInvoice(invoice.uuid)}
                                                        className="rounded-full border border-jv-accent-line px-3 py-1.5 text-xs font-semibold text-[#a9c4ff] transition hover:bg-jv-accent/15"
                                                    >
                                                        Resend
                                                    </button>
                                                )}
                                                {invoice.status !== 'paid' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => sendReminder(invoice.uuid)}
                                                        className="rounded-full border border-amber-500/30 px-3 py-1.5 text-xs font-semibold text-amber-300 transition hover:bg-amber-500/10"
                                                    >
                                                        Remind
                                                    </button>
                                                )}
                                                {invoice.status !== 'paid' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => markInvoicePaid(invoice.uuid)}
                                                        className="rounded-full border border-emerald-500/30 px-3 py-1.5 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/10"
                                                    >
                                                        Mark Paid
                                                    </button>
                                                )}
                                                {canDeleteInvoice(invoice) && (
                                                    <button
                                                        type="button"
                                                        onClick={() => deleteInvoice(invoice.uuid, invoice.invoice_number)}
                                                        className="rounded-full border border-red-500/30 px-3 py-1.5 text-xs font-semibold text-red-300 transition hover:bg-red-500/10"
                                                    >
                                                        Delete
                                                    </button>
                                                )}
                                            </MobileCardActions>
                                        </MobileCard>
                                    ))}
                                </MobileCardList>
                            </div>
                        )}

                        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-jv-line px-4 py-3 text-sm text-white/60">
                            <p>
                                Page {invoices?.current_page || 1} of {invoices?.last_page || 1}
                            </p>
                            <div className="flex items-center gap-2">
                                {invoices?.prev_page_url ? (
                                    <Link
                                        href={invoices.prev_page_url}
                                        className="rounded-full border border-jv-line-strong px-3 py-1.5 text-white/70 transition hover:bg-white/[0.06] hover:text-white"
                                        preserveScroll
                                    >
                                        Previous
                                    </Link>
                                ) : (
                                    <span className="cursor-not-allowed rounded-full border border-jv-line px-3 py-1.5 text-white/30">
                                        Previous
                                    </span>
                                )}
                                {invoices?.next_page_url ? (
                                    <Link
                                        href={invoices.next_page_url}
                                        className="rounded-full border border-jv-line-strong px-3 py-1.5 text-white/70 transition hover:bg-white/[0.06] hover:text-white"
                                        preserveScroll
                                    >
                                        Next
                                    </Link>
                                ) : (
                                    <span className="cursor-not-allowed rounded-full border border-jv-line px-3 py-1.5 text-white/30">
                                        Next
                                    </span>
                                )}
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
