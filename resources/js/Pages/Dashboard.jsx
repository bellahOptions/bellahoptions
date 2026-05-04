import Modal from '@/Components/Modal';
import { Badge } from '@/Components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { CreditCard, FolderKanban, LayoutDashboard, PlusCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Dashboard({
    isStaff = false,
    permissions = {},
    platformSettings = {},
    invoices = [],
    customers = [],
    invoiceStats = {},
    occupations = [],
    supportedCurrencies = [],
    defaultCurrency = 'NGN',
    waitlistStats = {},
    userStats = {},
    clientOrders = [],
    clientOrderStats = {},
    clientInvoices = [],
    orderServices = {},
    orderCurrency = 'NGN',
    orderLocale = 'en_NG',
}) {
    const { flash, auth } = usePage().props;
    const user = auth?.user;

    const canManageInvoices = Boolean(permissions?.can_manage_invoices);
    const canManageSettings = Boolean(permissions?.can_manage_settings);
    const canManageUsers = Boolean(permissions?.can_manage_users);
    const canManageWaitlist = Boolean(permissions?.can_manage_waitlist);

    const {
        data: invoiceData,
        setData: setInvoiceData,
        post: postInvoice,
        processing: invoiceProcessing,
        errors: invoiceErrors,
        reset: resetInvoice,
    } = useForm({
        customer_id: '',
        customer_name: '',
        customer_email: '',
        customer_occupation: '',
        title: '',
        description: '',
        amount: '',
        currency: defaultCurrency,
        due_date: '',
    });

    const {
        data: customerData,
        setData: setCustomerData,
        post: postCustomer,
        processing: customerProcessing,
        errors: customerErrors,
        reset: resetCustomer,
        clearErrors: clearCustomerErrors,
    } = useForm({
        first_name: '',
        last_name: '',
        email: '',
        occupation: '',
        phone: '',
        company: '',
        address: '',
        notes: '',
    });

    const [customerSearchQuery, setCustomerSearchQuery] = useState('');
    const [customerSearchResults, setCustomerSearchResults] = useState([]);
    const [customerSearchLoading, setCustomerSearchLoading] = useState(false);
    const [customerSearchError, setCustomerSearchError] = useState('');
    const [isCustomerSearchFocused, setIsCustomerSearchFocused] = useState(false);
    const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
    const serviceEntries = Object.entries(orderServices || {});
    const [selectedOrderService, setSelectedOrderService] = useState(serviceEntries[0]?.[0] || 'social-media-design');
    const [selectedOrderPackage, setSelectedOrderPackage] = useState('');
    const [activeClientPanel, setActiveClientPanel] = useState('overview');
    const shouldShowCustomerSearchDropdown =
        isCustomerSearchFocused && customerSearchQuery.trim().length >= 2;

    const selectedOrderServiceData = orderServices?.[selectedOrderService] || null;
    const selectedOrderPackages = Object.entries(selectedOrderServiceData?.packages || {});

    useEffect(() => {
        if (!selectedOrderService && serviceEntries.length > 0) {
            setSelectedOrderService(serviceEntries[0][0]);
        }
    }, [selectedOrderService, serviceEntries]);

    useEffect(() => {
        if (selectedOrderPackages.length === 0) {
            setSelectedOrderPackage('');

            return;
        }

        const hasSelected = selectedOrderPackages.some(([packageCode]) => packageCode === selectedOrderPackage);
        if (!hasSelected) {
            setSelectedOrderPackage(selectedOrderPackages[0][0]);
        }
    }, [selectedOrderPackage, selectedOrderPackages]);

    const orderStartHref = route('orders.create', {
        serviceSlug: selectedOrderService || serviceEntries[0]?.[0] || 'social-media-design',
        service: selectedOrderService || serviceEntries[0]?.[0] || 'social-media-design',
        ...(selectedOrderPackage ? { package: selectedOrderPackage } : {}),
    });
    const clientNavItems = [
        { key: 'overview', label: 'Overview', icon: LayoutDashboard },
        { key: 'new-order', label: 'New Order', icon: PlusCircle },
        { key: 'orders', label: 'Orders', icon: FolderKanban },
        { key: 'invoices', label: 'Invoices', icon: CreditCard },
    ];

    useEffect(() => {
        if (!canManageInvoices || !isCustomerSearchFocused) {
            return;
        }

        const query = customerSearchQuery.trim();

        if (query.length < 2) {
            setCustomerSearchLoading(false);
            setCustomerSearchError('');
            setCustomerSearchResults([]);

            return;
        }

        const controller = new AbortController();
        const timeout = setTimeout(async () => {
            setCustomerSearchLoading(true);
            setCustomerSearchError('');

            try {
                const url = `${route('admin.customers.search')}?query=${encodeURIComponent(query)}`;
                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                    signal: controller.signal,
                });

                if (!response.ok) {
                    throw new Error('Search request failed.');
                }

                const payload = await response.json();
                const results = Array.isArray(payload?.results) ? payload.results : [];

                setCustomerSearchResults(results);
            } catch (error) {
                if (error?.name !== 'AbortError') {
                    setCustomerSearchResults([]);
                    setCustomerSearchError('Unable to search right now. Try again.');
                }
            } finally {
                setCustomerSearchLoading(false);
            }
        }, 250);

        return () => {
            controller.abort();
            clearTimeout(timeout);
        };
    }, [canManageInvoices, customerSearchQuery, isCustomerSearchFocused]);

    const submitInvoice = (event) => {
        event.preventDefault();

        postInvoice(route('admin.invoices.store'), {
            preserveScroll: true,
            onSuccess: () => {
                resetInvoice(
                    'customer_id',
                    'customer_name',
                    'customer_email',
                    'customer_occupation',
                    'title',
                    'description',
                    'amount',
                    'due_date',
                );
                setInvoiceData('currency', defaultCurrency);
                setCustomerSearchQuery('');
                setCustomerSearchError('');
                setCustomerSearchResults([]);
            },
        });
    };

    const submitCustomer = (event) => {
        event.preventDefault();

        postCustomer(route('admin.customers.store'), {
            preserveScroll: true,
            onSuccess: () => {
                const fullName = `${customerData.first_name} ${customerData.last_name}`.trim();

                setInvoiceData('customer_id', '');
                setInvoiceData('customer_name', fullName);
                setInvoiceData('customer_email', customerData.email);
                setInvoiceData('customer_occupation', customerData.occupation || '');
                setCustomerSearchQuery(`${fullName} (${customerData.email})`);
                setShowAddCustomerModal(false);
                resetCustomer();
            },
        });
    };

    const selectCustomerCandidate = (candidate) => {
        const resolvedName =
            candidate.display_name ||
            `${candidate.first_name ?? ''} ${candidate.last_name ?? ''}`.trim() ||
            candidate.name ||
            candidate.email;

        setInvoiceData('customer_id', candidate.customer_id ? String(candidate.customer_id) : '');
        setInvoiceData('customer_name', resolvedName);
        setInvoiceData('customer_email', candidate.email ?? '');
        setInvoiceData('customer_occupation', candidate.occupation ?? '');

        setCustomerSearchQuery(`${resolvedName} (${candidate.email})`);
        setCustomerSearchResults([]);
        setCustomerSearchError('');
        setIsCustomerSearchFocused(false);
    };

    const clearSelectedCustomer = () => {
        setInvoiceData('customer_id', '');
        setInvoiceData('customer_name', '');
        setInvoiceData('customer_email', '');
        setInvoiceData('customer_occupation', '');
        setCustomerSearchQuery('');
        setCustomerSearchError('');
        setCustomerSearchResults([]);
        setIsCustomerSearchFocused(false);
    };

    const openAddCustomerModal = () => {
        clearCustomerErrors();
        setShowAddCustomerModal(true);
    };

    const closeAddCustomerModal = () => {
        setShowAddCustomerModal(false);
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

    return (
        <AuthenticatedLayout>
            <Head title={isStaff ? 'Staff Dashboard' : 'Dashboard'} />

            <div className="py-6 sm:py-10">
                <div className="mx-auto max-w-7xl space-y-6 px-4 sm:space-y-8 sm:px-6 lg:px-8">
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

                    {!isStaff && (
                        <>
                            <section className="rounded-2xl border border-blue-100 bg-gradient-to-r from-white via-blue-50 to-indigo-50 p-5 shadow-sm sm:p-8">
                                <h3 className="text-xl font-black text-gray-900 sm:text-2xl">
                                    Welcome, {user?.first_name || user?.name}
                                </h3>
                                <p className="mt-3 max-w-2xl text-sm leading-7 text-gray-600">
                                    Track your service jobs, review payment status, and monitor progress updates from the Bellah team.
                                </p>
                                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                                    <Card>
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-base">Total Jobs</CardTitle>
                                            <CardDescription>All submitted service requests.</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-2xl font-black text-[#000285]">{clientOrderStats.total_orders ?? 0}</p>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-base">Active Jobs</CardTitle>
                                            <CardDescription>Projects currently in progress.</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-2xl font-black text-[#000285]">{clientOrderStats.active_orders ?? 0}</p>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-base">Pending Payments</CardTitle>
                                            <CardDescription>Invoices awaiting payment.</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-2xl font-black text-[#000285]">{clientOrderStats.pending_payments ?? 0}</p>
                                        </CardContent>
                                    </Card>
                                </div>
                                <div className="mt-5 flex flex-wrap gap-3">
                                    <Link
                                        href={orderStartHref}
                                        className="inline-flex items-center rounded-md bg-[#000285] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0010a3]"
                                    >
                                        Start New Order
                                    </Link>
                                    <Link
                                        href={route('services')}
                                        className="inline-flex items-center rounded-md border border-blue-200 bg-white px-4 py-2 text-sm font-semibold text-[#000285] hover:bg-blue-50"
                                    >
                                        Explore Services
                                    </Link>
                                </div>
                            </section>

                            <section className="rounded-2xl border border-gray-200 bg-white p-2 shadow-sm sm:p-3">
                                <div className="flex flex-wrap gap-2">
                                    {clientNavItems.map((item) => {
                                        const Icon = item.icon;
                                        const isActive = activeClientPanel === item.key;

                                        return (
                                            <button
                                                key={item.key}
                                                type="button"
                                                onClick={() => setActiveClientPanel(item.key)}
                                                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                                                    isActive
                                                        ? 'bg-[#000285] text-white shadow-sm'
                                                        : 'bg-blue-50 text-[#000285] hover:bg-blue-100'
                                                }`}
                                            >
                                                <Icon className="h-4 w-4" />
                                                {item.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </section>

                            {activeClientPanel === 'overview' && (
                                <section className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Recent Service Jobs</CardTitle>
                                            <CardDescription>Follow your latest project activity and progress.</CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            {clientOrders.length === 0 && (
                                                <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-6 text-sm text-gray-500">
                                                    No service jobs yet.
                                                </div>
                                            )}

                                            {clientOrders.slice(0, 3).map((order) => (
                                                <article key={`overview-order-${order.uuid}`} className="rounded-lg border border-gray-200 p-4">
                                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                                        <div>
                                                            <p className="text-sm font-semibold text-gray-900">{order.service_name}</p>
                                                            <p className="text-xs text-gray-500">{order.package_name}</p>
                                                        </div>
                                                        <Badge variant={order.payment_status === 'paid' ? 'success' : 'warning'}>
                                                            {String(order.payment_status || '').toUpperCase()}
                                                        </Badge>
                                                    </div>
                                                    <p className="mt-2 text-sm text-gray-700">{formatMoney(order.amount, order.currency)}</p>
                                                    <div className="mt-3 h-2 w-full rounded-full bg-gray-200">
                                                        <div
                                                            className="h-2 rounded-full bg-[#000285]"
                                                            style={{ width: `${Math.max(0, Math.min(100, Number(order.progress_percent || 0)))}%` }}
                                                        />
                                                    </div>
                                                </article>
                                            ))}
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Quick Actions</CardTitle>
                                            <CardDescription>Start new work or continue payment instantly.</CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            <Link
                                                href={orderStartHref}
                                                className="inline-flex w-full items-center justify-center rounded-md bg-[#000285] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0010a3]"
                                            >
                                                Start New Order
                                            </Link>
                                            <button
                                                type="button"
                                                onClick={() => setActiveClientPanel('invoices')}
                                                className="inline-flex w-full items-center justify-center rounded-md border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-[#000285] hover:bg-blue-100"
                                            >
                                                View Invoices
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setActiveClientPanel('orders')}
                                                className="inline-flex w-full items-center justify-center rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50"
                                            >
                                                View All Orders
                                            </button>
                                        </CardContent>
                                    </Card>
                                </section>
                            )}

                            {activeClientPanel === 'new-order' && (
                                <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
                                    <h3 className="text-lg font-semibold text-gray-900">Start New Order</h3>
                                    <p className="mt-1 text-sm text-gray-600">
                                        Place a new order directly from your dashboard by choosing a service and package.
                                    </p>

                                    {serviceEntries.length > 0 ? (
                                        <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_1fr_auto]">
                                            <div>
                                                <label className="mb-1 block text-sm font-medium text-gray-700">Service</label>
                                                <select
                                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                                                    value={selectedOrderService}
                                                    onChange={(event) => setSelectedOrderService(event.target.value)}
                                                >
                                                    {serviceEntries.map(([serviceSlug, serviceData]) => (
                                                        <option key={serviceSlug} value={serviceSlug}>
                                                            {serviceData?.name || serviceSlug}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="mb-1 block text-sm font-medium text-gray-700">Package</label>
                                                <select
                                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                                                    value={selectedOrderPackage}
                                                    onChange={(event) => setSelectedOrderPackage(event.target.value)}
                                                >
                                                    {selectedOrderPackages.map(([packageCode, packageData]) => (
                                                        <option key={packageCode} value={packageCode}>
                                                            {(packageData?.name || packageCode)} - {formatLocalizedMoney(packageData?.price || 0, orderCurrency, orderLocale)}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className="flex items-end">
                                                <Link
                                                    href={orderStartHref}
                                                    className="inline-flex items-center rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-100"
                                                >
                                                    Start Order
                                                </Link>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="mt-5 rounded-lg border border-gray-200 bg-gray-50 px-4 py-4 text-sm text-gray-500">
                                            Order services are temporarily unavailable.
                                        </div>
                                    )}

                                    {selectedOrderServiceData && (
                                        <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 px-4 py-4">
                                            <p className="text-sm font-semibold text-gray-900">{selectedOrderServiceData.name}</p>
                                            <p className="mt-1 text-sm text-gray-600">{selectedOrderServiceData.description}</p>
                                        </div>
                                    )}
                                </section>
                            )}

                            {activeClientPanel === 'orders' && (
                                <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
                                    <h3 className="text-lg font-semibold text-gray-900">Your Service Jobs</h3>
                                    <p className="mt-1 text-sm text-gray-600">
                                        Follow work stages and open each job for detailed updates.
                                    </p>

                                    <div className="mt-5 space-y-4">
                                        {clientOrders.length === 0 && (
                                            <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-6 text-sm text-gray-500">
                                                No service jobs yet.
                                            </div>
                                        )}

                                        {clientOrders.map((order) => (
                                            <article key={order.uuid} className="rounded-lg border border-gray-200 p-4">
                                                <div className="flex flex-wrap items-start justify-between gap-3">
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-900">{order.service_name}</p>
                                                        <p className="text-xs text-gray-500">{order.package_name}</p>
                                                    </div>
                                                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                                                        order.payment_status === 'paid'
                                                            ? 'bg-emerald-100 text-emerald-700'
                                                            : 'bg-amber-100 text-amber-700'
                                                    }`}>
                                                        {String(order.payment_status || '').toUpperCase()}
                                                    </span>
                                                </div>

                                                <p className="mt-3 text-sm text-gray-700">
                                                    {formatMoney(order.amount, order.currency)}
                                                </p>

                                                <div className="mt-3">
                                                    <div className="flex items-center justify-between text-xs text-gray-600">
                                                        <span>{formatOrderStatus(order.order_status)}</span>
                                                        <span>{order.progress_percent}%</span>
                                                    </div>
                                                    <div className="mt-1 h-2 w-full rounded-full bg-gray-200">
                                                        <div
                                                            className="h-2 rounded-full bg-indigo-600"
                                                            style={{ width: `${Math.max(0, Math.min(100, Number(order.progress_percent || 0)))}%` }}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    <Link
                                                        href={route('orders.show', order.uuid)}
                                                        className="rounded-md border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                                    >
                                                        View Progress
                                                    </Link>
                                                    {order.payment_status !== 'paid' && (
                                                        <Link
                                                            href={route('orders.payment.show', order.uuid)}
                                                            className="rounded-md border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
                                                        >
                                                            Complete Payment
                                                        </Link>
                                                    )}
                                                </div>
                                            </article>
                                        ))}
                                    </div>
                                </section>
                            )}

                            {activeClientPanel === 'invoices' && (
                                <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
                                    <h3 className="text-lg font-semibold text-gray-900">Invoices & Payments</h3>
                                    <p className="mt-1 text-sm text-gray-600">
                                        Review invoice status and payment references for your jobs.
                                    </p>

                                    <div className="mt-5 space-y-3">
                                        {clientInvoices.length === 0 && (
                                            <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-6 text-sm text-gray-500">
                                                No invoices available yet.
                                            </div>
                                        )}

                                        {clientInvoices.map((invoice) => (
                                            <article key={`client-invoice-${invoice.id}`} className="rounded-lg border border-gray-200 p-4">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div>
                                                        <p className="text-sm font-semibold text-gray-900">#{invoice.invoice_number}</p>
                                                        <p className="text-xs text-gray-500">{invoice.title}</p>
                                                    </div>
                                                    <span className={`inline-flex rounded-full px-2 py-1 text-[11px] font-semibold ${
                                                        invoice.status === 'paid'
                                                            ? 'bg-emerald-100 text-emerald-700'
                                                            : 'bg-amber-100 text-amber-700'
                                                    }`}>
                                                        {String(invoice.status || '').toUpperCase()}
                                                    </span>
                                                </div>
                                                <p className="mt-3 text-sm text-gray-700">
                                                    {formatMoney(invoice.amount, invoice.currency)}
                                                </p>
                                                {invoice.payment_reference && (
                                                    <p className="mt-1 text-xs text-gray-500">
                                                        Ref: {invoice.payment_reference}
                                                    </p>
                                                )}
                                                {invoice.service_order_uuid && invoice.status !== 'paid' && (
                                                    <div className="mt-3">
                                                        <Link
                                                            href={route('orders.payment.show', invoice.service_order_uuid)}
                                                            className="rounded-md border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
                                                        >
                                                            Pay Invoice
                                                        </Link>
                                                    </div>
                                                )}
                                            </article>
                                        ))}
                                    </div>
                                </section>
                            )}
                        </>
                    )}

                    {isStaff && (
                        <>
                            <section className="rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-[#0c3a5c] p-5 text-white shadow-lg sm:p-6">
                                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200">
                                            Welcome to your office
                                        </p>
                                        <h3 className="mt-2 text-xl font-semibold sm:text-2xl">
                                            Hello, {user?.first_name || user?.name}
                                        </h3>
                                    </div>

                                    
                                </div>
                            </section>

                            {canManageInvoices && (
                                <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
                                    <MetricCard
                                        label="Total Invoices"
                                        value={invoiceStats.total_invoices ?? 0}
                                    />
                                    <MetricCard
                                        label="Pending Payment"
                                        value={invoiceStats.sent_invoices ?? 0}
                                    />
                                    <MetricCard
                                        label="Paid Invoices"
                                        value={invoiceStats.paid_invoices ?? 0}
                                    />
                                    <MetricCard
                                        label="Pending Amount"
                                        value={formatMoney(invoiceStats.sent_total ?? 0, defaultCurrency)}
                                    />
                                    <MetricCard
                                        label="Paid Amount"
                                        value={formatMoney(invoiceStats.paid_total ?? 0, defaultCurrency)}
                                    />
                                </section>
                            )}

                            {(canManageWaitlist || canManageUsers) && (
                                <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                    {canManageWaitlist && (
                                        <>
                                            <MetricCard
                                                label="Waitlist Total"
                                                value={waitlistStats.total_waitlists ?? 0}
                                            />
                                            <MetricCard
                                                label="Waitlist Today"
                                                value={waitlistStats.joined_today ?? 0}
                                            />
                                            <MetricCard
                                                label="Waitlist (7 days)"
                                                value={waitlistStats.joined_last_7_days ?? 0}
                                            />
                                        </>
                                    )}

                                    {canManageUsers && (
                                        <>
                                            <MetricCard
                                                label="Registered Users"
                                                value={userStats.total_users ?? 0}
                                            />
                                            <MetricCard
                                                label="Staff Accounts"
                                                value={userStats.staff_users ?? 0}
                                            />
                                            <MetricCard
                                                label="Customer Accounts"
                                                value={userStats.customer_users ?? 0}
                                            />
                                            <MetricCard
                                                label="Verified Users"
                                                value={userStats.verified_users ?? 0}
                                            />
                                        </>
                                    )}
                                </section>
                            )}

                            {canManageInvoices ? (
                                <section className="grid gap-6 lg:grid-cols-[1fr_1.2fr] lg:gap-8">
                                    <div className="space-y-6 lg:space-y-8">
                                        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
                                            <h3 className="text-lg font-semibold text-gray-900">
                                                Create Invoice
                                            </h3>
                                            <p className="mt-1 text-sm text-gray-600">
                                                Search customers by name or email from saved customers and registered users.
                                            </p>

                                            <form onSubmit={submitInvoice} className="mt-5 space-y-4">
                                                <div className="space-y-2">
                                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                                        <label htmlFor="customer-search" className="block text-sm font-medium text-gray-700">
                                                            Customer Search
                                                        </label>

                                                        <div className="flex items-center gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={openAddCustomerModal}
                                                                className="rounded-md border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
                                                            >
                                                                Add new customer
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={clearSelectedCustomer}
                                                                className="rounded-md border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                                                            >
                                                                Clear
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="relative">
                                                        <input
                                                            id="customer-search"
                                                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                                                            value={customerSearchQuery}
                                                            onChange={(event) => setCustomerSearchQuery(event.target.value)}
                                                            onFocus={() => setIsCustomerSearchFocused(true)}
                                                            onBlur={() => {
                                                                setTimeout(() => {
                                                                    setIsCustomerSearchFocused(false);
                                                                }, 120);
                                                            }}
                                                            placeholder="Search by customer name or email"
                                                        />

                                                        {shouldShowCustomerSearchDropdown && (
                                                            <div className="absolute z-20 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg">
                                                                {customerSearchLoading && (
                                                                    <div className="px-3 py-2 text-xs text-gray-500">
                                                                        Searching...
                                                                    </div>
                                                                )}

                                                                {!customerSearchLoading && customerSearchError && (
                                                                    <div className="px-3 py-2 text-xs text-red-600">
                                                                        {customerSearchError}
                                                                    </div>
                                                                )}

                                                                {!customerSearchLoading && !customerSearchError && customerSearchResults.length === 0 && customerSearchQuery.trim().length >= 2 && (
                                                                    <div className="px-3 py-2 text-xs text-gray-500">
                                                                        No matches found.
                                                                    </div>
                                                                )}

                                                                {!customerSearchLoading && !customerSearchError && customerSearchResults.length > 0 && (
                                                                    <div className="max-h-60 overflow-y-auto py-1">
                                                                        {customerSearchResults.map((candidate, index) => (
                                                                            <button
                                                                                key={`${candidate.source}-${candidate.customer_id ?? candidate.email}-${index}`}
                                                                                type="button"
                                                                                onClick={() => selectCustomerCandidate(candidate)}
                                                                                className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50"
                                                                            >
                                                                                <span className="truncate text-gray-800">
                                                                                    {candidate.display_name || candidate.name || candidate.email}
                                                                                    <span className="ml-2 text-xs text-gray-500">
                                                                                        {candidate.email}
                                                                                    </span>
                                                                                </span>
                                                                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                                                                                    candidate.source === 'customer'
                                                                                        ? 'bg-indigo-100 text-indigo-700'
                                                                                        : 'bg-cyan-100 text-cyan-700'
                                                                                }`}>
                                                                                    {candidate.source}
                                                                                </span>
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="grid gap-4 sm:grid-cols-2">
                                                    <FieldError error={invoiceErrors.customer_name}>
                                                        <label htmlFor="customer_name" className="mb-1 block text-sm font-medium text-gray-700">
                                                            Customer Name
                                                        </label>
                                                        <input
                                                            id="customer_name"
                                                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                                                            value={invoiceData.customer_name}
                                                            onChange={(event) => setInvoiceData('customer_name', event.target.value)}
                                                            required={!invoiceData.customer_id}
                                                        />
                                                    </FieldError>

                                                    <FieldError error={invoiceErrors.customer_email}>
                                                        <label htmlFor="customer_email" className="mb-1 block text-sm font-medium text-gray-700">
                                                            Customer Email
                                                        </label>
                                                        <input
                                                            id="customer_email"
                                                            type="email"
                                                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                                                            value={invoiceData.customer_email}
                                                            onChange={(event) => setInvoiceData('customer_email', event.target.value)}
                                                            required={!invoiceData.customer_id}
                                                        />
                                                    </FieldError>
                                                </div>

                                                <FieldError error={invoiceErrors.customer_occupation}>
                                                    <label htmlFor="customer_occupation" className="mb-1 block text-sm font-medium text-gray-700">
                                                        Occupation
                                                    </label>
                                                    <select
                                                        id="customer_occupation"
                                                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                                                        value={invoiceData.customer_occupation}
                                                        onChange={(event) => setInvoiceData('customer_occupation', event.target.value)}
                                                    >
                                                        <option value="">Select occupation</option>
                                                        {occupations.map((occupation) => (
                                                            <option key={occupation} value={occupation}>
                                                                {occupation}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </FieldError>

                                                <FieldError error={invoiceErrors.title}>
                                                    <label htmlFor="title" className="mb-1 block text-sm font-medium text-gray-700">
                                                        Invoice Title
                                                    </label>
                                                    <input
                                                        id="title"
                                                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                                                        value={invoiceData.title}
                                                        onChange={(event) => setInvoiceData('title', event.target.value)}
                                                        required
                                                    />
                                                </FieldError>

                                                <FieldError error={invoiceErrors.description}>
                                                    <label htmlFor="description" className="mb-1 block text-sm font-medium text-gray-700">
                                                        Description
                                                    </label>
                                                    <textarea
                                                        id="description"
                                                        className="min-h-24 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                                                        value={invoiceData.description}
                                                        onChange={(event) => setInvoiceData('description', event.target.value)}
                                                    />
                                                </FieldError>

                                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                                    <FieldError error={invoiceErrors.amount}>
                                                        <label htmlFor="amount" className="mb-1 block text-sm font-medium text-gray-700">
                                                            Amount
                                                        </label>
                                                        <input
                                                            id="amount"
                                                            type="number"
                                                            step="0.01"
                                                            min="1"
                                                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                                                            value={invoiceData.amount}
                                                            onChange={(event) => setInvoiceData('amount', event.target.value)}
                                                            required
                                                        />
                                                    </FieldError>

                                                    <FieldError error={invoiceErrors.currency}>
                                                        <label htmlFor="currency" className="mb-1 block text-sm font-medium text-gray-700">
                                                            Currency
                                                        </label>
                                                        <select
                                                            id="currency"
                                                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                                                            value={invoiceData.currency}
                                                            onChange={(event) => setInvoiceData('currency', event.target.value)}
                                                            required
                                                        >
                                                            {supportedCurrencies.map((currency) => (
                                                                <option key={currency} value={currency}>
                                                                    {currency}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </FieldError>

                                                    <FieldError error={invoiceErrors.due_date}>
                                                        <label htmlFor="due_date" className="mb-1 block text-sm font-medium text-gray-700">
                                                            Due Date
                                                        </label>
                                                        <input
                                                            id="due_date"
                                                            type="date"
                                                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                                                            value={invoiceData.due_date}
                                                            onChange={(event) => setInvoiceData('due_date', event.target.value)}
                                                        />
                                                    </FieldError>
                                                </div>

                                                <button
                                                    type="submit"
                                                    disabled={invoiceProcessing}
                                                    className="inline-flex w-full items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                                                >
                                                    {invoiceProcessing
                                                        ? 'Creating invoice...'
                                                        : 'Create & Send Invoice'}
                                                </button>
                                            </form>
                                        </div>
                                    </div>

                                    <div className="space-y-6 lg:space-y-8">
                                        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
                                            <div className="flex flex-wrap items-center justify-between gap-3">
                                                <div>
                                                    <h3 className="text-lg font-semibold text-gray-900">
                                                        Invoice Management
                                                    </h3>
                                                    <p className="mt-1 text-sm text-gray-600">
                                                        Track invoice status, resend invoices, and mark payments.
                                                    </p>
                                                </div>
                                                <Link
                                                    href={route('admin.invoices.index')}
                                                    className="rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                                >
                                                    View all invoices
                                                </Link>
                                            </div>

                                            <div className="mt-5 space-y-3 md:hidden">
                                                {invoices.length === 0 && (
                                                    <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-4 text-sm text-gray-500">
                                                        No invoices yet.
                                                    </div>
                                                )}

                                                {invoices.map((invoice) => (
                                                    <article
                                                        key={`invoice-mobile-${invoice.id}`}
                                                        className="rounded-lg border border-gray-200 p-4"
                                                    >
                                                        <p className="text-sm font-semibold text-gray-900">
                                                            {invoice.invoice_number}
                                                        </p>
                                                        <p className="mt-1 text-xs text-gray-500">
                                                            {invoice.title}
                                                        </p>

                                                        <div className="mt-3 space-y-1 text-sm text-gray-700">
                                                            <p>{invoice.customer_name}</p>
                                                            <p className="text-xs text-gray-500">
                                                                {invoice.customer_email}
                                                            </p>
                                                            <p>
                                                                {formatMoney(invoice.amount, invoice.currency)}
                                                            </p>
                                                        </div>

                                                        <div className="mt-3 flex items-center justify-between gap-2">
                                                            <span
                                                                className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                                                                    invoice.status === 'paid'
                                                                        ? 'bg-emerald-100 text-emerald-700'
                                                                        : 'bg-amber-100 text-amber-700'
                                                                }`}
                                                            >
                                                                {invoice.status.toUpperCase()}
                                                            </span>

                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    type="button"
                                                                    className="rounded-md border border-indigo-200 px-2 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-50"
                                                                    onClick={() => resendInvoice(invoice.id)}
                                                                >
                                                                    Resend
                                                                </button>
                                                                {invoice.status !== 'paid' && (
                                                                    <button
                                                                        type="button"
                                                                        className="rounded-md border border-amber-200 px-2 py-1 text-xs font-medium text-amber-700 hover:bg-amber-50"
                                                                        onClick={() => sendReminder(invoice.id)}
                                                                    >
                                                                        Remind
                                                                    </button>
                                                                )}
                                                                {invoice.status !== 'paid' && (
                                                                    <button
                                                                        type="button"
                                                                        className="rounded-md border border-emerald-200 px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
                                                                        onClick={() => markInvoicePaid(invoice.id)}
                                                                    >
                                                                        Paid
                                                                    </button>
                                                                )}
                                                                <Link
                                                                    href={route('admin.invoices.show', invoice.id)}
                                                                    className="rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                                                                >
                                                                    View
                                                                </Link>
                                                            </div>
                                                        </div>
                                                    </article>
                                                ))}
                                            </div>

                                            <div className="mt-5 hidden overflow-x-auto md:block">
                                                <table className="min-w-full divide-y divide-gray-200 text-sm">
                                                    <thead className="bg-gray-50">
                                                        <tr>
                                                            <th className="px-3 py-2 text-left font-semibold text-gray-600">
                                                                Invoice
                                                            </th>
                                                            <th className="px-3 py-2 text-left font-semibold text-gray-600">
                                                                Customer
                                                            </th>
                                                            <th className="px-3 py-2 text-left font-semibold text-gray-600">
                                                                Amount
                                                            </th>
                                                            <th className="px-3 py-2 text-left font-semibold text-gray-600">
                                                                Status
                                                            </th>
                                                            <th className="px-3 py-2 text-left font-semibold text-gray-600">
                                                                Actions
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-100">
                                                        {invoices.length === 0 && (
                                                            <tr>
                                                                <td className="px-3 py-4 text-gray-500" colSpan={5}>
                                                                    No invoices yet.
                                                                </td>
                                                            </tr>
                                                        )}
                                                        {invoices.map((invoice) => (
                                                            <tr key={invoice.id}>
                                                                <td className="px-3 py-3 align-top text-gray-900">
                                                                    <p className="font-medium">
                                                                        {invoice.invoice_number}
                                                                    </p>
                                                                    <p className="text-xs text-gray-500">
                                                                        {invoice.title}
                                                                    </p>
                                                                </td>
                                                                <td className="px-3 py-3 align-top text-gray-700">
                                                                    <p>{invoice.customer_name}</p>
                                                                    <p className="text-xs text-gray-500">
                                                                        {invoice.customer_email}
                                                                    </p>
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
                                                                <td className="space-x-2 px-3 py-3 align-top">
                                                                    <button
                                                                        type="button"
                                                                        className="rounded-md border border-indigo-200 px-2 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-50"
                                                                        onClick={() => resendInvoice(invoice.id)}
                                                                    >
                                                                        Resend
                                                                    </button>
                                                                    {invoice.status !== 'paid' && (
                                                                        <button
                                                                            type="button"
                                                                            className="rounded-md border border-amber-200 px-2 py-1 text-xs font-medium text-amber-700 hover:bg-amber-50"
                                                                            onClick={() => sendReminder(invoice.id)}
                                                                        >
                                                                            Remind
                                                                        </button>
                                                                    )}
                                                                    {invoice.status !== 'paid' && (
                                                                        <button
                                                                            type="button"
                                                                            className="rounded-md border border-emerald-200 px-2 py-1 text-xs font-medium text-emerald-700 hover:bg-emerald-50"
                                                                            onClick={() => markInvoicePaid(invoice.id)}
                                                                        >
                                                                            Mark Paid
                                                                        </button>
                                                                    )}
                                                                    <Link
                                                                        href={route('admin.invoices.show', invoice.id)}
                                                                        className="rounded-md border border-slate-200 px-2 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                                                                    >
                                                                        View
                                                                    </Link>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>

                                        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
                                            <h3 className="text-lg font-semibold text-gray-900">
                                                Saved Customers
                                            </h3>
                                            <p className="mt-1 text-sm text-gray-600">
                                                Reuse these customer records in new invoices.
                                            </p>

                                            <div className="mt-5 space-y-3 md:hidden">
                                                {customers.length === 0 && (
                                                    <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-4 text-sm text-gray-500">
                                                        No saved customers yet.
                                                    </div>
                                                )}

                                                {customers.map((customer) => (
                                                    <article
                                                        key={`customer-mobile-${customer.id}`}
                                                        className="rounded-lg border border-gray-200 p-4"
                                                    >
                                                        <p className="text-sm font-semibold text-gray-900">
                                                            {displayCustomerName(customer)}
                                                        </p>
                                                        <p className="mt-1 text-xs text-gray-500">
                                                            {customer.email}
                                                        </p>
                                                        <p className="mt-2 text-sm text-gray-700">
                                                            Occupation: {customer.occupation || 'N/A'}
                                                        </p>
                                                        <p className="mt-1 text-sm text-gray-700">
                                                            Address: {customer.address || 'N/A'}
                                                        </p>
                                                    </article>
                                                ))}
                                            </div>

                                            <div className="mt-5 hidden overflow-x-auto md:block">
                                                <table className="min-w-full divide-y divide-gray-200 text-sm">
                                                    <thead className="bg-gray-50">
                                                        <tr>
                                                            <th className="px-3 py-2 text-left font-semibold text-gray-600">
                                                                First Name
                                                            </th>
                                                            <th className="px-3 py-2 text-left font-semibold text-gray-600">
                                                                Last Name
                                                            </th>
                                                            <th className="px-3 py-2 text-left font-semibold text-gray-600">
                                                                Email
                                                            </th>
                                                            <th className="px-3 py-2 text-left font-semibold text-gray-600">
                                                                Address
                                                            </th>
                                                            <th className="px-3 py-2 text-left font-semibold text-gray-600">
                                                                Occupation
                                                            </th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-100">
                                                        {customers.length === 0 && (
                                                            <tr>
                                                                <td className="px-3 py-4 text-gray-500" colSpan={5}>
                                                                    No saved customers yet.
                                                                </td>
                                                            </tr>
                                                        )}
                                                        {customers.map((customer) => (
                                                            <tr key={customer.id}>
                                                                <td className="px-3 py-3 align-top text-gray-900">
                                                                    {customer.first_name || 'N/A'}
                                                                </td>
                                                                <td className="px-3 py-3 align-top text-gray-700">
                                                                    {customer.last_name || 'N/A'}
                                                                </td>
                                                                <td className="px-3 py-3 align-top text-gray-700">
                                                                    {customer.email}
                                                                </td>
                                                                <td className="px-3 py-3 align-top text-gray-700">
                                                                    {customer.address || 'N/A'}
                                                                </td>
                                                                <td className="px-3 py-3 align-top text-gray-700">
                                                                    {customer.occupation || 'N/A'}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            ) : (
                                <section className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800">
                                    Your role does not have invoice management permissions.
                                </section>
                            )}
                        </>
                    )}
                </div>
            </div>

            <Modal show={showAddCustomerModal} onClose={closeAddCustomerModal} maxWidth="2xl">
                <div className="p-5 sm:p-6">
                    <h3 className="text-lg font-semibold text-gray-900">Add new customer</h3>
                    <p className="mt-1 text-sm text-gray-600">
                        This customer will be saved for future invoices automatically.
                    </p>

                    <form onSubmit={submitCustomer} className="mt-5 space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <FieldError error={customerErrors.first_name}>
                                <label htmlFor="customer-form-first-name" className="mb-1 block text-sm font-medium text-gray-700">
                                    First Name
                                </label>
                                <input
                                    id="customer-form-first-name"
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                                    value={customerData.first_name}
                                    onChange={(event) => setCustomerData('first_name', event.target.value)}
                                    required
                                />
                            </FieldError>

                            <FieldError error={customerErrors.last_name}>
                                <label htmlFor="customer-form-last-name" className="mb-1 block text-sm font-medium text-gray-700">
                                    Last Name
                                </label>
                                <input
                                    id="customer-form-last-name"
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                                    value={customerData.last_name}
                                    onChange={(event) => setCustomerData('last_name', event.target.value)}
                                    required
                                />
                            </FieldError>
                        </div>

                        <FieldError error={customerErrors.email}>
                            <label htmlFor="customer-form-email" className="mb-1 block text-sm font-medium text-gray-700">
                                Email
                            </label>
                            <input
                                id="customer-form-email"
                                type="email"
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                                value={customerData.email}
                                onChange={(event) => setCustomerData('email', event.target.value)}
                                required
                            />
                        </FieldError>

                        <FieldError error={customerErrors.occupation}>
                            <label htmlFor="customer-form-occupation" className="mb-1 block text-sm font-medium text-gray-700">
                                Occupation
                            </label>
                            <select
                                id="customer-form-occupation"
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                                value={customerData.occupation}
                                onChange={(event) => setCustomerData('occupation', event.target.value)}
                            >
                                <option value="">Select occupation</option>
                                {occupations.map((occupation) => (
                                    <option key={occupation} value={occupation}>
                                        {occupation}
                                    </option>
                                ))}
                            </select>
                        </FieldError>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <FieldError error={customerErrors.phone}>
                                <label htmlFor="customer-form-phone" className="mb-1 block text-sm font-medium text-gray-700">
                                    Phone
                                </label>
                                <input
                                    id="customer-form-phone"
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                                    value={customerData.phone}
                                    onChange={(event) => setCustomerData('phone', event.target.value)}
                                />
                            </FieldError>

                            <FieldError error={customerErrors.company}>
                                <label htmlFor="customer-form-company" className="mb-1 block text-sm font-medium text-gray-700">
                                    Company
                                </label>
                                <input
                                    id="customer-form-company"
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                                    value={customerData.company}
                                    onChange={(event) => setCustomerData('company', event.target.value)}
                                />
                            </FieldError>
                        </div>

                        <FieldError error={customerErrors.address}>
                            <label htmlFor="customer-form-address" className="mb-1 block text-sm font-medium text-gray-700">
                                Address
                            </label>
                            <textarea
                                id="customer-form-address"
                                className="min-h-20 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                                value={customerData.address}
                                onChange={(event) => setCustomerData('address', event.target.value)}
                            />
                        </FieldError>

                        <FieldError error={customerErrors.notes}>
                            <label htmlFor="customer-form-notes" className="mb-1 block text-sm font-medium text-gray-700">
                                Internal Notes
                            </label>
                            <textarea
                                id="customer-form-notes"
                                className="min-h-20 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                                value={customerData.notes}
                                onChange={(event) => setCustomerData('notes', event.target.value)}
                            />
                        </FieldError>

                        <div className="flex flex-wrap items-center justify-end gap-2">
                            <button
                                type="button"
                                onClick={closeAddCustomerModal}
                                className="rounded-md border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                disabled={customerProcessing}
                                className="inline-flex items-center rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {customerProcessing ? 'Saving customer...' : 'Save Customer'}
                            </button>
                        </div>
                    </form>
                </div>
            </Modal>
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

function StatusChip({ label, active }) {
    return (
        <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                active ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
            }`}
        >
            {label}: {active ? 'ON' : 'OFF'}
        </span>
    );
}

function FieldError({ error, children }) {
    return (
        <div>
            {children}
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
    );
}

function formatRole(role) {
    if (!role) {
        return 'Staff';
    }

    const labels = {
        super_admin: 'Super Admin',
        customer_rep: 'Customer Representative',
        admin: 'Admin',
        staff: 'Staff',
    };

    return labels[role] || role;
}

function displayCustomerName(customer) {
    const firstName = customer?.first_name ?? '';
    const lastName = customer?.last_name ?? '';
    const fromParts = `${firstName} ${lastName}`.trim();

    if (fromParts !== '') {
        return fromParts;
    }

    if (customer?.name) {
        return customer.name;
    }

    return customer?.email || 'Customer';
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

function formatOrderStatus(status) {
    const labels = {
        awaiting_payment: 'Awaiting Payment',
        queued: 'Queued',
        in_progress: 'In Progress',
        in_review: 'In Review',
        completed: 'Completed',
        cancelled: 'Cancelled',
    };

    return labels[status] || String(status || '').replaceAll('_', ' ');
}

function formatLocalizedMoney(amount, currency = 'NGN', locale = 'en_NG') {
    const numeric = Number(amount || 0);
    const normalizedCurrency = String(currency || 'NGN').toUpperCase();
    const normalizedLocale = String(locale || 'en_NG').replace('_', '-');

    try {
        return new Intl.NumberFormat(normalizedLocale, {
            style: 'currency',
            currency: normalizedCurrency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        }).format(numeric);
    } catch (error) {
        return formatMoney(numeric, normalizedCurrency);
    }
}
