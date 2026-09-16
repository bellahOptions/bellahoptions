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
                    <h2 className="text-xl font-semibold leading-tight tracking-tight text-white">Order Management</h2>
                    <Link
                        href={route('dashboard')}
                        className="jv-btn jv-btn--ghost jv-btn--sm"
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
                        <div className="rounded-jv-sm border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                            {flash.success}
                        </div>
                    )}

                    {flash?.error && (
                        <div className="rounded-jv-sm border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
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

                    <section className="jv-card p-4 sm:p-5">
                        <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
                            <div className="relative flex-1 lg:min-w-[240px]">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                                <input
                                    id="order-search"
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder="Search order code, customer, email, service…"
                                    className="jv-input py-2.5 pl-9 pr-9"
                                />
                                {isSyncing && (
                                    <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-jv-accent" />
                                )}
                            </div>

                            <select
                                id="order-status"
                                value={orderStatus}
                                onChange={(event) => setOrderStatus(event.target.value)}
                                aria-label="Order status"
                                className="jv-select w-full py-2.5 lg:w-auto"
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
                                className="jv-select w-full py-2.5 lg:w-auto"
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
                                className="jv-select w-full py-2.5 lg:w-auto"
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
                                className="jv-btn jv-btn--ghost w-full disabled:cursor-not-allowed disabled:opacity-40 lg:w-auto"
                            >
                                <RotateCcw className="h-3.5 w-3.5" />
                                Reset
                            </button>
                        </div>
                    </section>

                    <section className="jv-card p-4 sm:p-5">
                        <div className="hidden overflow-x-auto md:block">
                            <table className="min-w-full text-sm">
                                <thead>
                                    <tr className="border-b border-jv-line">
                                        <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-white/45">Order</th>
                                        <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-white/45">Customer</th>
                                        <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-white/45">Service</th>
                                        <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-white/45">Amount</th>
                                        <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-white/45">Payment</th>
                                        <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-white/45">Order Status</th>
                                        <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-white/45">Progress</th>
                                        <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-white/45">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(orders?.data || []).length === 0 && (
                                        <tr>
                                            <td className="px-3 py-4 text-white/45" colSpan={8}>
                                                No orders found.
                                            </td>
                                        </tr>
                                    )}

                                    {(orders?.data || []).map((order) => (
                                        <tr key={order.id} className="border-b border-jv-line/70 transition last:border-0 hover:bg-white/[0.04]">
                                            <td className="px-3 py-3 align-top">
                                                <p className="font-semibold text-white">{order.order_code}</p>
                                                <p className="text-xs text-white/45">{order.created_at}</p>
                                            </td>
                                            <td className="px-3 py-3 align-top text-white/80">
                                                <p>{order.full_name}</p>
                                                <p className="text-xs text-white/45">{order.email}</p>
                                            </td>
                                            <td className="px-3 py-3 align-top text-white/80">
                                                <p>{order.service_name}</p>
                                                <p className="text-xs text-white/45">{order.package_name}</p>
                                            </td>
                                            <td className="px-3 py-3 align-top text-white/80">
                                                {formatMoney(order.amount, order.currency)}
                                            </td>
                                            <td className="px-3 py-3 align-top">
                                                <StatusBadge status={order.payment_status} kind="payment" />
                                            </td>
                                            <td className="px-3 py-3 align-top">
                                                <StatusBadge status={order.order_status} kind="order" />
                                            </td>
                                            <td className="px-3 py-3 align-top text-white/80">
                                                {order.progress_percent}%
                                            </td>
                                            <td className="px-3 py-3 align-top">
                                                <Link
                                                    href={route('admin.service-orders.show', order.order_code)}
                                                    className="jv-btn jv-btn--outline jv-btn--sm"
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
                            <p className="text-sm text-white/45 md:hidden">No orders found.</p>
                        ) : (
                            <MobileCardList>
                                {(orders?.data || []).map((order, index) => (
                                    <MobileCard key={order.id} index={index}>
                                        <MobileCardHeader
                                            title={order.order_code}
                                            subtitle={order.created_at}
                                            badge={<StatusBadge status={order.payment_status} kind="payment" />}
                                        />

                                        <div className="mt-3 space-y-0.5 divide-y divide-jv-line/70">
                                            <MobileCardRow label="Customer" value={order.full_name} />
                                            <MobileCardRow label="Email" value={order.email} />
                                            <MobileCardRow label="Service" value={`${order.service_name} · ${order.package_name}`} />
                                            <MobileCardRow label="Amount" value={formatMoney(order.amount, order.currency)} />
                                        </div>

                                        <div className="mt-3 flex items-center justify-between gap-3">
                                            <StatusBadge status={order.order_status} kind="order" />
                                            <div className="flex-1">
                                                <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.08]">
                                                    <div
                                                        className="h-full rounded-full bg-jv-accent transition-all"
                                                        style={{ width: `${Math.max(0, Math.min(100, order.progress_percent || 0))}%` }}
                                                    />
                                                </div>
                                            </div>
                                            <span className="shrink-0 text-xs font-semibold text-white/45">
                                                {order.progress_percent}%
                                            </span>
                                        </div>

                                        <MobileCardActions>
                                            <Link
                                                href={route('admin.service-orders.show', order.order_code)}
                                                className="jv-btn jv-btn--outline jv-btn--sm w-full"
                                            >
                                                View Order
                                            </Link>
                                        </MobileCardActions>
                                    </MobileCard>
                                ))}
                            </MobileCardList>
                        )}

                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-white/55">
                            <p>
                                Page {orders?.current_page || 1} of {orders?.last_page || 1}
                            </p>
                            <div className="flex items-center gap-2">
                                {orders?.prev_page_url ? (
                                    <Link
                                        href={orders.prev_page_url}
                                        className="jv-btn jv-btn--ghost jv-btn--sm"
                                        preserveScroll
                                    >
                                        Previous
                                    </Link>
                                ) : (
                                    <span className="jv-btn jv-btn--ghost jv-btn--sm cursor-not-allowed opacity-40">
                                        Previous
                                    </span>
                                )}
                                {orders?.next_page_url ? (
                                    <Link
                                        href={orders.next_page_url}
                                        className="jv-btn jv-btn--ghost jv-btn--sm"
                                        preserveScroll
                                    >
                                        Next
                                    </Link>
                                ) : (
                                    <span className="jv-btn jv-btn--ghost jv-btn--sm cursor-not-allowed opacity-40">
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
        completed: 'bg-emerald-500/15 text-emerald-300',
        in_review: 'bg-sky-500/15 text-sky-300',
        in_progress: 'bg-sky-500/15 text-sky-300',
        queued: 'bg-indigo-500/15 text-indigo-300',
        cancelled: 'bg-red-500/15 text-red-300',
    };

    const paymentColors = {
        paid: 'bg-emerald-500/15 text-emerald-300',
        processing: 'bg-sky-500/15 text-sky-300',
        not_required: 'bg-white/[0.07] text-white/70',
        failed: 'bg-red-500/15 text-red-300',
    };

    const colorMap = kind === 'payment' ? paymentColors : orderColors;
    const className = colorMap[normalized] || 'bg-amber-500/15 text-amber-300';

    return (
        <span className={`inline-flex shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}>
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
