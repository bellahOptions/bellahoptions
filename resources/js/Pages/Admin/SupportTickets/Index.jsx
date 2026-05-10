import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';

const statusLabels = {
    open: 'Open',
    awaiting_customer: 'Awaiting Customer',
    closed: 'Closed',
};

const statusClasses = {
    open: 'bg-amber-100 text-amber-800',
    awaiting_customer: 'bg-emerald-100 text-emerald-800',
    closed: 'bg-slate-100 text-slate-700',
};

const priorityLabels = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    urgent: 'Urgent',
};

export default function AdminSupportTickets({
    filters = {},
    statuses = [],
    summary = {},
    tickets = [],
    active_ticket_id: activeTicketId = null,
}) {
    const activeTicket = tickets.find((ticket) => ticket.id === activeTicketId) || tickets[0] || null;

    const replyForm = useForm({
        message: '',
    });

    const statusForm = useForm({
        status: activeTicket?.status || 'open',
    });

    const submitReply = (event) => {
        event.preventDefault();

        if (!activeTicket) {
            return;
        }

        replyForm.post(route('admin.support-tickets.reply', activeTicket.id), {
            preserveScroll: true,
            onSuccess: () => replyForm.reset('message'),
        });
    };

    const submitStatus = (event) => {
        event.preventDefault();

        if (!activeTicket) {
            return;
        }

        statusForm.patch(route('admin.support-tickets.status', activeTicket.id), {
            preserveScroll: true,
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Support Tickets" />

            <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h1 className="text-2xl font-black text-slate-900">Support Ticket Desk</h1>
                    <p className="mt-2 text-sm text-slate-600">Track customer requests, reply quickly, and close issues from one place.</p>
                </section>

                <section className="grid gap-4 sm:grid-cols-3">
                    <Stat label="Open" value={summary.open ?? 0} />
                    <Stat label="Awaiting Customer" value={summary.awaiting_customer ?? 0} />
                    <Stat label="Closed" value={summary.closed ?? 0} />
                </section>

                <section className="grid gap-6 xl:grid-cols-[360px_1fr]">
                    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex flex-wrap gap-2">
                            <FilterChip label="All" active={(filters.status || 'all') === 'all'} href={route('admin.support-tickets.index')} />
                            {statuses.map((status) => (
                                <FilterChip
                                    key={status}
                                    label={statusLabels[status] || status}
                                    active={filters.status === status}
                                    href={route('admin.support-tickets.index', { status })}
                                />
                            ))}
                        </div>

                        <div className="space-y-2">
                            {tickets.length === 0 ? (
                                <p className="text-sm text-slate-500">No tickets found for this filter.</p>
                            ) : (
                                tickets.map((ticket) => (
                                    <Link
                                        key={ticket.id}
                                        href={route('admin.support-tickets.index', {
                                            status: filters.status || 'all',
                                            ticket: ticket.id,
                                        })}
                                        className={`block rounded-lg border p-3 text-sm transition ${activeTicket?.id === ticket.id ? 'border-blue-300 bg-blue-50' : 'border-slate-200 hover:bg-slate-50'}`}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <p className="font-bold text-slate-900">{ticket.ticket_number}</p>
                                                <p className="mt-1 text-slate-700">{ticket.subject}</p>
                                            </div>
                                            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusClasses[ticket.status] || statusClasses.closed}`}>
                                                {statusLabels[ticket.status] || ticket.status}
                                            </span>
                                        </div>
                                        <p className="mt-2 text-xs text-slate-500">{ticket.customer.name} · {priorityLabels[ticket.priority] || ticket.priority}</p>
                                    </Link>
                                ))
                            )}
                        </div>
                    </div>

                    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        {!activeTicket ? (
                            <p className="text-sm text-slate-500">Select a ticket to view details.</p>
                        ) : (
                            <>
                                <div className="border-b border-slate-100 pb-3">
                                    <p className="text-xs uppercase tracking-wide text-slate-500">{activeTicket.ticket_number}</p>
                                    <h2 className="mt-1 text-xl font-black text-slate-900">{activeTicket.subject}</h2>
                                    <p className="mt-1 text-sm text-slate-600">{activeTicket.customer.name} · {activeTicket.customer.email}</p>
                                </div>

                                <div className="mt-4 flex flex-wrap items-center gap-2">
                                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClasses[activeTicket.status] || statusClasses.closed}`}>
                                        {statusLabels[activeTicket.status] || activeTicket.status}
                                    </span>
                                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                                        {priorityLabels[activeTicket.priority] || activeTicket.priority}
                                    </span>
                                </div>

                                <div className="mt-4 space-y-3">
                                    {activeTicket.messages.map((message) => (
                                        <article
                                            key={message.id}
                                            className={`rounded-lg border p-3 ${message.sender_type === 'staff' ? 'border-blue-200 bg-blue-50' : 'border-slate-200 bg-slate-50'}`}
                                        >
                                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{message.sender_name}</p>
                                            <div
                                                className="prose prose-sm mt-1 max-w-none text-slate-700"
                                                dangerouslySetInnerHTML={{ __html: message.message }}
                                            />
                                            {message.attachment_url ? (
                                                <a href={message.attachment_url} target="_blank" rel="noreferrer" className="mt-2 block">
                                                    <img src={message.attachment_url} alt={message.attachment_name || 'Support attachment'} className="max-h-52 rounded-md border border-slate-200 object-contain" />
                                                </a>
                                            ) : null}
                                            <p className="mt-2 text-xs text-slate-500">{message.created_at}</p>
                                        </article>
                                    ))}
                                </div>

                                <form onSubmit={submitReply} className="mt-5 border-t border-slate-100 pt-4">
                                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Reply to customer</label>
                                    <textarea
                                        rows={3}
                                        value={replyForm.data.message}
                                        onChange={(event) => replyForm.setData('message', event.target.value)}
                                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500"
                                        required
                                    />
                                    {replyForm.errors.message ? <p className="mt-1 text-xs text-red-600">{replyForm.errors.message}</p> : null}
                                    <button
                                        type="submit"
                                        disabled={replyForm.processing}
                                        className="mt-3 rounded-lg bg-[#000285] px-4 py-2 text-sm font-bold text-white hover:bg-blue-800 disabled:opacity-60"
                                    >
                                        {replyForm.processing ? 'Sending...' : 'Send Reply'}
                                    </button>
                                </form>

                                <form onSubmit={submitStatus} className="mt-5 border-t border-slate-100 pt-4">
                                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Update status</label>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        <select
                                            value={statusForm.data.status}
                                            onChange={(event) => statusForm.setData('status', event.target.value)}
                                            className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500"
                                        >
                                            {statuses.map((status) => (
                                                <option key={status} value={status}>
                                                    {statusLabels[status] || status}
                                                </option>
                                            ))}
                                        </select>
                                        <button
                                            type="submit"
                                            disabled={statusForm.processing}
                                            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                                        >
                                            {statusForm.processing ? 'Saving...' : 'Save Status'}
                                        </button>
                                    </div>
                                    {statusForm.errors.status ? <p className="mt-1 text-xs text-red-600">{statusForm.errors.status}</p> : null}
                                </form>
                            </>
                        )}
                    </section>
                </section>
            </div>
        </AuthenticatedLayout>
    );
}

function FilterChip({ label, active, href }) {
    return (
        <Link
            href={href}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${active ? 'bg-[#000285] text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
        >
            {label}
        </Link>
    );
}

function Stat({ label, value }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
            <p className="mt-2 text-lg font-black text-slate-900">{value}</p>
        </div>
    );
}
