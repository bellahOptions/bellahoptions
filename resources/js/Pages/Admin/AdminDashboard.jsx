import { Eyebrow } from '@/Components/PublicUI';
import {
    CHART_COLORS,
    ChartCard,
    KpiSparkline,
    RevenueChart,
    SplitDonut,
    UserGrowthChart,
} from '@/Components/Charts';
import ServiceImagesManager from '@/Components/ServiceImagesManager';
import { MobileCard, MobileCardList, MobileCardRow } from '@/Components/ui/mobile-cards';
import { StatCard, StatGrid } from '@/Components/ui/stat-card';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import {
    BarChart3,
    CheckCircle2,
    Clock,
    FileText,
    Headphones,
    ImageIcon,
    LifeBuoy,
    ShieldCheck,
    Ticket,
    TrendingDown,
    TrendingUp,
    Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const money = new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
});

const kpiIcons = {
    total_invoice: FileText,
    paid_invoice_ngn: CheckCircle2,
    pending_invoice_ngn: Clock,
    total_customers: Users,
    open_support_tickets: LifeBuoy,
};

const kpiTones = {
    total_invoice: 'sky',
    paid_invoice_ngn: 'emerald',
    pending_invoice_ngn: 'amber',
    total_customers: 'brand',
    open_support_tickets: 'slate',
};

const kpiChartColors = {
    total_invoice: CHART_COLORS.sky,
    paid_invoice_ngn: CHART_COLORS.emerald,
    pending_invoice_ngn: CHART_COLORS.amber,
    total_customers: CHART_COLORS.brandSoft,
    open_support_tickets: CHART_COLORS.violet,
};

export default function AdminDashboard({
    user = {},
    kpis = [],
    revenue_series: revenueSeries = [],
    user_growth: userGrowth = [],
    pending_payments: pendingPayments = [],
    pending_invoices: pendingInvoices = [],
    completion = {},
    service_images: serviceImages = {},
    service_image_defaults: serviceImageDefaults = {},
    can_manage_settings: canManageSettings = false,
}) {
    const delivered = Number(completion?.delivered || 0);
    const remaining = Number(completion?.remaining || 0);
    const winRate = Number(completion?.win_rate || 0);

    return (
        <AuthenticatedLayout>
            <Head title="Staff Dashboard" />

            <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
                <section className="jv-card jv-card--pad">
                    <Eyebrow>Admin &amp; Staff Workspace</Eyebrow>
                    <h1 className="jv-display jv-display--md mt-5">Welcome, {user?.name || 'Team Member'}</h1>
                    <p className="jv-lead mt-4 max-w-2xl">
                        Monitor invoices, pending payments, and team operations from one dark workspace.
                    </p>
                    <div className="mt-6 flex flex-wrap gap-3">
                        <Link href={route('admin.support-tickets.index')} className="jv-btn jv-btn--primary">
                            <Headphones className="h-4 w-4" />
                            Open Support Tickets
                        </Link>
                        <Link href={route('admin.invoices.index')} className="jv-btn jv-btn--ghost">
                            <FileText className="h-4 w-4" />
                            Manage Invoices
                        </Link>
                    </div>
                </section>

                <StatGrid>
                    {kpis.map((kpi) => {
                        const trend = Array.isArray(kpi.trend) ? kpi.trend : [];
                        const change = Number(kpi.change_percent || 0);
                        const TrendIcon = change < 0 ? TrendingDown : TrendingUp;

                        return (
                            <div key={kpi.key} className="flex flex-col gap-3">
                                <StatCard
                                    icon={kpiIcons[kpi.key]}
                                    label={kpi.label}
                                    value={kpi.label.includes('NGN') ? money.format(kpi.value || 0) : (kpi.value || 0).toLocaleString()}
                                    tone={kpiTones[kpi.key] || 'brand'}
                                />
                                <div className="flex items-center gap-3 px-1">
                                    <span
                                        className={cn(
                                            'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold',
                                            change < 0
                                                ? 'bg-rose-500/15 text-rose-300'
                                                : 'bg-emerald-500/15 text-emerald-300',
                                        )}
                                    >
                                        <TrendIcon className="h-3 w-3" />
                                        {change >= 0 ? '+' : ''}{change.toFixed(1)}%
                                    </span>
                                    <span className="text-[11px] text-white/40">vs previous 30 days</span>
                                </div>
                                <KpiSparkline data={trend} color={kpiChartColors[kpi.key] || CHART_COLORS.brand} />
                            </div>
                        );
                    })}
                </StatGrid>

                <section className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
                    <RevenueChart data={revenueSeries} />

                    <ChartCard
                        title="Today's Completion"
                        description="Jobs delivered against those still open today."
                        icon={BarChart3}
                        height={280}
                        isEmpty={delivered + remaining === 0}
                        emptyText="No jobs scheduled for today."
                    >
                        <SplitDonut
                            data={[
                                { name: 'Delivered', value: delivered, color: CHART_COLORS.emerald },
                                { name: 'Remaining', value: remaining, color: CHART_COLORS.amber },
                            ]}
                            height={280}
                            centerValue={`${winRate.toFixed(0)}%`}
                            centerLabel="Completed"
                        />
                    </ChartCard>
                </section>

                <UserGrowthChart data={userGrowth} />

                <section className="grid gap-6 xl:grid-cols-2">
                    <Panel
                        title="Pending Payments"
                        icon={Clock}
                        actionHref={route('admin.invoices.index')}
                        actionLabel="View invoices"
                    >
                        <Table
                            rows={pendingPayments}
                            emptyText="No pending payments right now."
                            columns={[
                                { key: 'user', label: 'Customer' },
                                { key: 'amount', label: 'Amount', render: (row) => money.format(row.amount || 0) },
                                { key: 'method', label: 'Method', render: (row) => <MethodBadge label={row.method} /> },
                                { key: 'date', label: 'Date' },
                            ]}
                        />
                    </Panel>

                    <Panel
                        title="Pending Invoices"
                        icon={Ticket}
                        actionHref={route('admin.invoices.index')}
                        actionLabel="Open invoice module"
                    >
                        <Table
                            rows={pendingInvoices}
                            emptyText="No pending invoices right now."
                            columns={[
                                { key: 'user', label: 'Customer' },
                                { key: 'amount', label: 'Amount', render: (row) => money.format(row.amount || 0) },
                                { key: 'wallet', label: 'Currency', render: (row) => <MethodBadge label={row.wallet} /> },
                                { key: 'date', label: 'Date' },
                            ]}
                        />
                    </Panel>
                </section>

                {canManageSettings && (
                    <Panel
                        title="Service Page & Modal Images"
                        icon={ImageIcon}
                        actionHref={route('admin.settings.edit')}
                        actionLabel="Open platform settings"
                    >
                        <ServiceImagesManager
                            serviceImages={serviceImages}
                            serviceImageDefaults={serviceImageDefaults}
                        />
                    </Panel>
                )}
            </div>
        </AuthenticatedLayout>
    );
}

/**
 * Small pill used for payment method / currency cells so the tables scan faster
 * than a column of plain uppercase strings.
 */
function MethodBadge({ label }) {
    const text = String(label || '').trim();

    if (text === '') {
        return <span className="text-white/35">—</span>;
    }

    return (
        <span className="inline-flex items-center gap-1.5 rounded-full border border-jv-line-strong bg-white/[0.06] px-2.5 py-0.5 text-xs font-semibold text-white/75">
            <ShieldCheck className="h-3 w-3 text-jv-accent" />
            {text}
        </span>
    );
}

function Panel({ title, icon: Icon = null, actionHref, actionLabel, children }) {
    return (
        <section className="jv-card jv-card--pad">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    {Icon ? (
                        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-jv-sm border border-jv-line-strong bg-white/[0.06] text-jv-accent">
                            <Icon className="h-4 w-4" />
                        </span>
                    ) : null}
                    <h2 className="text-lg font-semibold tracking-tight text-white">{title}</h2>
                </div>
                {actionHref && actionLabel ? (
                    <Link href={actionHref} className="text-sm font-semibold text-jv-accent transition hover:text-[#5c93ff]">
                        {actionLabel}
                    </Link>
                ) : null}
            </div>
            {children}
        </section>
    );
}

function Table({ rows = [], columns = [], emptyText = 'No records found.' }) {
    if (rows.length === 0) {
        return <p className="text-sm text-white/45">{emptyText}</p>;
    }

    const [titleColumn, ...restColumns] = columns;
    const cellValue = (row, column) => (typeof column.render === 'function' ? column.render(row) : row[column.key]);

    return (
        <>
            <div className="hidden overflow-x-auto md:block">
                <table className="min-w-full text-sm">
                    <thead>
                        <tr className="border-b border-jv-line text-left text-xs uppercase tracking-wide text-white/45">
                            {columns.map((column) => (
                                <th key={column.key} className="px-3 py-2 font-medium">
                                    {column.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row) => (
                            <tr key={row.id} className="border-b border-jv-line/70 transition hover:bg-white/[0.04]">
                                {columns.map((column) => (
                                    <td key={column.key} className="px-3 py-3 text-white/80">
                                        {cellValue(row, column)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <MobileCardList>
                {rows.map((row, index) => (
                    <MobileCard key={row.id} index={index}>
                        <p className="text-sm font-semibold text-white">{cellValue(row, titleColumn)}</p>
                        <div className="mt-2 space-y-0.5 divide-y divide-jv-line/70">
                            {restColumns.map((column) => (
                                <MobileCardRow key={column.key} label={column.label} value={cellValue(row, column)} />
                            ))}
                        </div>
                    </MobileCard>
                ))}
            </MobileCardList>
        </>
    );
}
