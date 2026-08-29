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

            <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                <section className="rounded-2xl border border-slate-200 bg-gradient-to-r from-white via-sky-50 to-blue-50 p-6">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-700">Admin & Staff Workspace</p>
                    <h1 className="mt-2 text-2xl font-black text-slate-900">Welcome, {user?.name || 'Team Member'}</h1>
                    <p className="mt-2 max-w-2xl text-sm text-slate-600">
                        Monitor invoices, pending payments, and team operations from one light-themed dashboard.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-3">
                        <Link href={route('admin.support-tickets.index')} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark">
                            Open Support Tickets
                        </Link>
                        <Link href={route('admin.invoices.index')} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
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
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-lg font-bold text-slate-900">{title}</h2>
                {actionHref && actionLabel ? (
                    <Link href={actionHref} className="text-sm font-semibold text-blue-700 hover:text-blue-800">
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
        return <p className="text-sm text-slate-500">{emptyText}</p>;
    }

    const [titleColumn, ...restColumns] = columns;
    const cellValue = (row, column) => (typeof column.render === 'function' ? column.render(row) : row[column.key]);

    return (
        <>
            <div className="hidden overflow-x-auto md:block">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead>
                        <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                            {columns.map((column) => (
                                <th key={column.key} className="px-3 py-2">
                                    {column.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {rows.map((row) => (
                            <tr key={row.id}>
                                {columns.map((column) => (
                                    <td key={column.key} className="px-3 py-3 text-slate-700">
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
                        <p className="text-sm font-semibold text-slate-900">{cellValue(row, titleColumn)}</p>
                        <div className="mt-2 space-y-0.5 divide-y divide-gray-50">
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
