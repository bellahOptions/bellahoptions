import { Eyebrow } from '@/Components/PublicUI';
import { MobileCard, MobileCardList, MobileCardRow } from '@/Components/ui/mobile-cards';
import { StatCard, StatGrid } from '@/Components/ui/stat-card';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { CheckCircle2, Clock, FileText, LifeBuoy, Users } from 'lucide-react';

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

export default function AdminDashboard({
    user = {},
    kpis = [],
    pending_payments: pendingPayments = [],
    pending_invoices: pendingInvoices = [],
}) {
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
                            Open Support Tickets
                        </Link>
                        <Link href={route('admin.invoices.index')} className="jv-btn jv-btn--ghost">
                            Manage Invoices
                        </Link>
                    </div>
                </section>

                <StatGrid>
                    {kpis.map((kpi) => (
                        <StatCard
                            key={kpi.key}
                            icon={kpiIcons[kpi.key]}
                            label={kpi.label}
                            value={kpi.label.includes('NGN') ? money.format(kpi.value || 0) : (kpi.value || 0).toLocaleString()}
                            tone={kpiTones[kpi.key] || 'brand'}
                        />
                    ))}
                </StatGrid>

                <section className="grid gap-6 xl:grid-cols-2">
                    <Panel title="Pending Payments" actionHref={route('admin.invoices.index')} actionLabel="View invoices">
                        <Table
                            rows={pendingPayments}
                            emptyText="No pending payments right now."
                            columns={[
                                { key: 'user', label: 'Customer' },
                                { key: 'amount', label: 'Amount', render: (row) => money.format(row.amount || 0) },
                                { key: 'method', label: 'Method' },
                                { key: 'date', label: 'Date' },
                            ]}
                        />
                    </Panel>

                    <Panel title="Pending Invoices" actionHref={route('admin.invoices.index')} actionLabel="Open invoice module">
                        <Table
                            rows={pendingInvoices}
                            emptyText="No pending invoices right now."
                            columns={[
                                { key: 'user', label: 'Customer' },
                                { key: 'amount', label: 'Amount', render: (row) => money.format(row.amount || 0) },
                                { key: 'wallet', label: 'Currency' },
                                { key: 'date', label: 'Date' },
                            ]}
                        />
                    </Panel>
                </section>
            </div>
        </AuthenticatedLayout>
    );
}

function Panel({ title, actionHref, actionLabel, children }) {
    return (
        <section className="jv-card jv-card--pad">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold tracking-tight text-white">{title}</h2>
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
