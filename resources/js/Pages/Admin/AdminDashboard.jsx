import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';

const money = new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
});

export default function AdminDashboard({
    user = {},
    notifications = {},
    kpis = [],
    pending_payments: pendingPayments = [],
    pending_invoices: pendingInvoices = [],
    staff_presence: staffPresence = [],
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
                        <Link href={route('admin.live-chat.index')} className="rounded-lg bg-[#000285] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0012ad]">
                            Open Live Chat
                        </Link>
                        <Link href={route('admin.support-tickets.index')} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                            Open Support Tickets
                        </Link>
                        <Link href={route('admin.invoices.index')} className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                            Manage Invoices
                        </Link>
                    </div>
                </section>

                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {kpis.map((kpi) => (
                        <article key={kpi.key} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{kpi.label}</p>
                            <p className="mt-2 text-2xl font-black text-slate-900">
                                {kpi.label.includes('NGN') ? money.format(kpi.value || 0) : (kpi.value || 0).toLocaleString()}
                            </p>
                        </article>
                    ))}
                </section>

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

                <section className="grid gap-6 xl:grid-cols-2">
                    <Panel title="Staff Presence">
                        {staffPresence.length === 0 ? (
                            <p className="text-sm text-slate-500">No presence data yet.</p>
                        ) : (
                            <div className="space-y-3">
                                {staffPresence.map((staff) => (
                                    <div key={staff.id} className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
                                        <div>
                                            <p className="font-semibold text-slate-900">{staff.name}</p>
                                            <p className="text-xs text-slate-500">Open chats: {staff.open_chats}</p>
                                        </div>
                                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${staff.online ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                                            {staff.online ? 'Online' : 'Offline'}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Panel>

                    <Panel title="Unread Chat Queue">
                        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Unread Chats</p>
                            <p className="mt-2 text-3xl font-black text-amber-900">{notifications?.unread_chats ?? 0}</p>
                            <p className="mt-1 text-sm text-amber-800">Respond from Live Chat to keep response times healthy.</p>
                        </div>
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

    return (
        <div className="overflow-x-auto">
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
                                    {typeof column.render === 'function' ? column.render(row) : row[column.key]}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
