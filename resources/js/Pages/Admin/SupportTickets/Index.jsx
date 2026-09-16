import { Eyebrow } from '@/Components/PublicUI';
import { Badge } from '@/Components/ui/badge';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';

const statusLabels = {
    open: 'Open',
    awaiting_customer: 'Awaiting Customer',
    closed: 'Closed',
};

const statusVariants = {
    open: 'warning',
    awaiting_customer: 'success',
    closed: 'secondary',
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

            <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
                <section className="jv-card jv-card--pad">
                    <Eyebrow>Support Desk</Eyebrow>
                    <h1 className="jv-display jv-display--md mt-5">Support Ticket Desk</h1>
                    <p className="jv-lead mt-4 max-w-2xl">
                        Track customer requests, reply quickly, and close issues from one place.
                    </p>
                </section>

                <section className="grid gap-4 sm:grid-cols-3">
                    <Stat label="Open" value={summary.open ?? 0} />
                    <Stat label="Awaiting Customer" value={summary.awaiting_customer ?? 0} />
                    <Stat label="Closed" value={summary.closed ?? 0} />
                </section>

                <section className="grid gap-6 xl:grid-cols-[360px_1fr]">
                    <div className="jv-card jv-card--pad space-y-4">
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
                                <p className="text-sm text-white/45">No tickets found for this filter.</p>
                            ) : (
                                tickets.map((ticket) => (
                                    <Link
                                        key={ticket.id}
                                        href={route('admin.support-tickets.index', {
                                            status: filters.status || 'all',
                                            ticket: ticket.id,
                                        })}
                                        className={`block rounded-jv-sm border p-3 text-sm transition ${
                                            activeTicket?.id === ticket.id
                                                ? 'border-jv-accent-line bg-jv-accent/10'
                                                : 'border-jv-line hover:bg-white/[0.05]'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <p className="font-semibold text-white">{ticket.ticket_number}</p>
                                                <p className="mt-1 text-white/80">{ticket.subject}</p>
                                            </div>
                                            <Badge variant={statusVariants[ticket.status] || 'secondary'} className="shrink-0">
                                                {statusLabels[ticket.status] || ticket.status}
                                            </Badge>
                                        </div>
                                        <p className="mt-2 text-xs text-white/45">
                                            {ticket.customer.name} · {priorityLabels[ticket.priority] || ticket.priority}
                                        </p>
                                    </Link>
                                ))
                            )}
                        </div>
                    </div>

                    <section className="jv-card jv-card--pad">
                        {!activeTicket ? (
                            <p className="text-sm text-white/45">Select a ticket to view details.</p>
                        ) : (
                            <>
                                <div className="border-b border-jv-line pb-4">
                                    <p className="jv-mono text-white/40">{activeTicket.ticket_number}</p>
                                    <h2 className="jv-display jv-display--sm mt-2">{activeTicket.subject}</h2>
                                    <p className="mt-2 text-sm text-white/55">
                                        {activeTicket.customer.name} · {activeTicket.customer.email}
                                    </p>
                                </div>

                                <div className="mt-4 flex flex-wrap items-center gap-2">
                                    <Badge variant={statusVariants[activeTicket.status] || 'secondary'}>
                                        {statusLabels[activeTicket.status] || activeTicket.status}
                                    </Badge>
                                    <Badge variant="outline">
                                        {priorityLabels[activeTicket.priority] || activeTicket.priority}
                                    </Badge>
                                </div>

                                <div className="mt-5 space-y-3">
                                    {activeTicket.messages.map((message) => (
                                        <article
                                            key={message.id}
                                            className={`rounded-jv-sm border p-4 ${
                                                message.sender_type === 'staff'
                                                    ? 'border-jv-accent-line bg-jv-accent/10'
                                                    : 'border-jv-line bg-white/[0.03]'
                                            }`}
                                        >
                                            <p className="text-xs font-semibold uppercase tracking-wide text-white/45">{message.sender_name}</p>
                                            <div
                                                className="jv-prose mt-2 max-w-none text-sm"
                                                dangerouslySetInnerHTML={{ __html: message.message }}
                                            />
                                            {message.attachment_url ? (
                                                <a href={message.attachment_url} target="_blank" rel="noreferrer" className="mt-3 block">
                                                    <img
                                                        src={message.attachment_url}
                                                        alt={message.attachment_name || 'Support attachment'}
                                                        className="max-h-52 rounded-jv-sm border border-jv-line object-contain"
                                                    />
                                                </a>
                                            ) : null}
                                            <p className="mt-2 text-xs text-white/40">{message.created_at}</p>
                                        </article>
                                    ))}
                                </div>

                                <form onSubmit={submitReply} className="mt-6 border-t border-jv-line pt-5">
                                    <label className="jv-label" htmlFor="reply-message">Reply to customer</label>
                                    <textarea
                                        id="reply-message"
                                        rows={3}
                                        value={replyForm.data.message}
                                        onChange={(event) => replyForm.setData('message', event.target.value)}
                                        className="jv-textarea mt-2"
                                        required
                                    />
                                    {replyForm.errors.message ? <p className="mt-1 text-xs text-red-300">{replyForm.errors.message}</p> : null}
                                    <button
                                        type="submit"
                                        disabled={replyForm.processing}
                                        className="jv-btn jv-btn--primary mt-3"
                                    >
                                        {replyForm.processing ? 'Sending...' : 'Send Reply'}
                                    </button>
                                </form>

                                <form onSubmit={submitStatus} className="mt-6 border-t border-jv-line pt-5">
                                    <label className="jv-label" htmlFor="status-update">Update status</label>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        <select
                                            id="status-update"
                                            value={statusForm.data.status}
                                            onChange={(event) => statusForm.setData('status', event.target.value)}
                                            className="jv-select w-auto"
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
                                            className="jv-btn jv-btn--ghost"
                                        >
                                            {statusForm.processing ? 'Saving...' : 'Save Status'}
                                        </button>
                                    </div>
                                    {statusForm.errors.status ? <p className="mt-1 text-xs text-red-300">{statusForm.errors.status}</p> : null}
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
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                active
                    ? 'bg-jv-accent text-white'
                    : 'border border-jv-line bg-white/[0.05] text-white/60 hover:bg-white/[0.10] hover:text-white'
            }`}
        >
            {label}
        </Link>
    );
}

function Stat({ label, value }) {
    return (
        <div className="jv-card p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/45">{label}</p>
            <p className="mt-2 text-2xl font-semibold tracking-tight text-white">{value}</p>
        </div>
    );
}
