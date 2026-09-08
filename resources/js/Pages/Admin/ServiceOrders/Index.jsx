import { MobileCard, MobileCardActions, MobileCardHeader, MobileCardList, MobileCardRow } from '@/Components/ui/mobile-cards';
import { StatCard, StatGrid } from '@/Components/ui/stat-card';
import { useDebouncedFilterSync } from '@/hooks/use-debounced-filter-sync';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatMoney } from '@/lib/utils';
import { Head, Link, usePage } from '@inertiajs/react';
import { CheckCircle2, Clock, Loader2, Package, RefreshCw, RotateCcw, Search, Wallet } from 'lucide-react';
import { useState } from 'react';

const orderStatusOptions = [
    'submitted',
    'pending_consultation',
    'awaiting_payment',
    'payment_pending_confirmation',
    'queued',
    'in_progress',
    'in_review',
    'completed',
    'cancelled',
];

const paymentStatusOptions = ['pending', 'processing', 'paid', 'not_required', 'failed'];

export default function ServiceOrderIndex({ orders, stats = {}, filters = {}, serviceSlugs = [] }) {
    const { flash } = usePage().props;
    const [search, setSearch] = useState(filters.search || '');
    const [orderStatus, setOrderStatus] = useState(filters.order_status || '');
    const [paymentStatus, setPaymentStatus] = useState(filters.payment_status || '');
    const [serviceSlug, setServiceSlug] = useState(filters.service_slug || '');

    const isSyncing = useDebouncedFilterSync('admin.service-orders.index', {
        search,
        order_status: orderStatus,
        payment_status: paymentStatus,
        service_slug: serviceSlug,
    });

    const hasActiveFilters = Boolean(search || orderStatus || paymentStatus || serviceSlug);

    const resetFilters = () => {
        setSearch('');
        setOrderStatus('');
        setPaymentStatus('');
        setServiceSlug('');
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">Order Management</h2>
                    <Link
                        href={route('dashboard')}
                        className="rounded-md border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                    >
                        Back to Dashboard
                    </Link>
                </div>
            }
        >
            <Head title="Order Management" />

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

                    <StatGrid>
                        <StatCard icon={Package} label="Total Orders" value={stats.total_orders ?? 0} tone="sky" />
                        <StatCard icon={Clock} label="Awaiting Payment" value={stats.awaiting_payment ?? 0} tone="amber" />
                        <StatCard icon={RefreshCw} label="In Progress" value={stats.in_progress ?? 0} tone="sky" />
                        <StatCard icon={CheckCircle2} label="Completed" value={stats.completed ?? 0} tone="emerald" />
                        <StatCard icon={Wallet} label="Paid Total" value={formatMoney(stats.paid_total ?? 0, 'NGN')} tone="emerald" />
                    </StatGrid>

                    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
                        <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
                            <div className="relative flex-1 lg:min-w-[240px]">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <input
                                    id="order-search"
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder="Search order code, customer, email, service…"
                                    className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-9 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
                                />
                                {isSyncing && (
                                    <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-brand" />
                                )}
                            </div>

                            <select
                                id="order-status"
                                value={orderStatus}
                                onChange={(event) => setOrderStatus(event.target.value)}
                                aria-label="Order status"
                                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30 lg:w-auto"
                            >
                                <option value="">All statuses</option>
                                {orderStatusOptions.map((option) => (
                                    <option key={option} value={option}>
                                        {formatStatusLabel(option)}
                                    </option>
                                ))}
                            </select>

                            <select
                                id="payment-status"
                                value={paymentStatus}
                                onChange={(event) => setPaymentStatus(event.target.value)}
                                aria-label="Payment status"
                                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30 lg:w-auto"
                            >
                                <option value="">All payments</option>
                                {paymentStatusOptions.map((option) => (
                                    <option key={option} value={option}>
                                        {formatStatusLabel(option)}
                                    </option>
                                ))}
                            </select>

                            <select
                                id="service-slug"
                                value={serviceSlug}
                                onChange={(event) => setServiceSlug(event.target.value)}
                                aria-label="Service"
                                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30 lg:w-auto"
                            >
                                <option value="">All services</option>
                                {serviceSlugs.map((slug) => (
                                    <option key={slug} value={slug}>
                                        {formatStatusLabel(slug)}
                                    </option>
                                ))}
                            </select>

                            <button
                                type="button"
                                onClick={resetFilters}
                                disabled={!hasActiveFilters}
                                className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 lg:w-auto"
                            >
                                <RotateCcw className="h-3.5 w-3.5" />
                                Reset
                            </button>
                        </div>
                    </section>

                    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                        <div className="hidden overflow-x-auto md:block">
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-3 py-2 text-left font-semibold text-gray-600">Order</th>
                                        <th className="px-3 py-2 text-left font-semibold text-gray-600">Customer</th>
                                        <th className="px-3 py-2 text-left font-semibold text-gray-600">Service</th>
                                        <th className="px-3 py-2 text-left font-semibold text-gray-600">Amount</th>
                                        <th className="px-3 py-2 text-left font-semibold text-gray-600">Payment</th>
                                        <th className="px-3 py-2 text-left font-semibold text-gray-600">Order Status</th>
                                        <th className="px-3 py-2 text-left font-semibold text-gray-600">Progress</th>
                                        <th className="px-3 py-2 text-left font-semibold text-gray-600">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {(orders?.data || []).length === 0 && (
                                        <tr>
                                            <td className="px-3 py-4 text-gray-500" colSpan={8}>
                                                No orders found.
                                            </td>
                                        </tr>
                                    )}

                                    {(orders?.data || []).map((order) => (
                                        <tr key={order.id}>
                                            <td className="px-3 py-3 align-top">
                                                <p className="font-semibold text-gray-900">{order.order_code}</p>
                                                <p className="text-xs text-gray-500">{order.created_at}</p>
                                            </td>
                                            <td className="px-3 py-3 align-top text-gray-700">
                                                <p>{order.full_name}</p>
                                                <p className="text-xs text-gray-500">{order.email}</p>
                                            </td>
                                            <td className="px-3 py-3 align-top text-gray-700">
                                                <p>{order.service_name}</p>
                                                <p className="text-xs text-gray-500">{order.package_name}</p>
                                            </td>
                                            <td className="px-3 py-3 align-top text-gray-700">
                                                {formatMoney(order.amount, order.currency)}
                                            </td>
                                            <td className="px-3 py-3 align-top">
                                                <StatusBadge status={order.payment_status} kind="payment" />
                                            </td>
                                            <td className="px-3 py-3 align-top">
                                                <StatusBadge status={order.order_status} kind="order" />
                                            </td>
                                            <td className="px-3 py-3 align-top text-gray-700">
                                                {order.progress_percent}%
                                            </td>
                                            <td className="px-3 py-3 align-top">
                                                <Link
                                                    href={route('admin.service-orders.show', order.order_code)}
                                                    className="rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                                >
                                                    View
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {(orders?.data || []).length === 0 ? (
                            <p className="text-sm text-gray-500 md:hidden">No orders found.</p>
                        ) : (
                            <MobileCardList>
                                {(orders?.data || []).map((order, index) => (
                                    <MobileCard key={order.id} index={index}>
                                        <MobileCardHeader
                                            title={order.order_code}
                                            subtitle={order.created_at}
                                            badge={<StatusBadge status={order.payment_status} kind="payment" />}
                                        />

                                        <div className="mt-3 space-y-0.5 divide-y divide-gray-50">
                                            <MobileCardRow label="Customer" value={order.full_name} />
                                            <MobileCardRow label="Email" value={order.email} />
                                            <MobileCardRow label="Service" value={`${order.service_name} · ${order.package_name}`} />
                                            <MobileCardRow label="Amount" value={formatMoney(order.amount, order.currency)} />
                                        </div>

                                        <div className="mt-3 flex items-center justify-between gap-3">
                                            <StatusBadge status={order.order_status} kind="order" />
                                            <div className="flex-1">
                                                <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                                                    <div
                                                        className="h-full rounded-full bg-brand transition-all"
                                                        style={{ width: `${Math.max(0, Math.min(100, order.progress_percent || 0))}%` }}
                                                    />
                                                </div>
                                            </div>
                                            <span className="shrink-0 text-xs font-semibold text-gray-500">
                                                {order.progress_percent}%
                                            </span>
                                        </div>

                                        <MobileCardActions>
                                            <Link
                                                href={route('admin.service-orders.show', order.order_code)}
                                                className="w-full rounded-md border border-slate-200 px-3 py-2 text-center text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                            >
                                                View Order
                                            </Link>
                                        </MobileCardActions>
                                    </MobileCard>
                                ))}
                            </MobileCardList>
                        )}

                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-gray-600">
                            <p>
                                Page {orders?.current_page || 1} of {orders?.last_page || 1}
                            </p>
                            <div className="flex items-center gap-2">
                                {orders?.prev_page_url ? (
                                    <Link
                                        href={orders.prev_page_url}
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
                                {orders?.next_page_url ? (
                                    <Link
                                        href={orders.next_page_url}
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

export function StatusBadge({ status, kind = 'order' }) {
    const normalized = String(status || '').toLowerCase();

    const orderColors = {
        completed: 'bg-emerald-100 text-emerald-700',
        in_review: 'bg-sky-100 text-sky-700',
        in_progress: 'bg-sky-100 text-sky-700',
        queued: 'bg-indigo-100 text-indigo-700',
        cancelled: 'bg-red-100 text-red-700',
    };

    const paymentColors = {
        paid: 'bg-emerald-100 text-emerald-700',
        processing: 'bg-sky-100 text-sky-700',
        not_required: 'bg-slate-100 text-slate-700',
        failed: 'bg-red-100 text-red-700',
    };

    const colorMap = kind === 'payment' ? paymentColors : orderColors;
    const className = colorMap[normalized] || 'bg-amber-100 text-amber-700';

    return (
        <span className={`inline-flex shrink-0 rounded-full px-2 py-1 text-xs font-medium ${className}`}>
            {formatStatusLabel(status)}
        </span>
    );
}

export function formatStatusLabel(value) {
    return String(value || '')
        .split(/[-_]/)
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}
