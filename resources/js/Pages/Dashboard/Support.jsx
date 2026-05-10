import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import RichTextEditor from '@/Components/RichTextEditor';
import { Head, Link, useForm } from '@inertiajs/react';

const priorityOptions = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    urgent: 'Urgent',
};

const statusLabels = {
    open: 'Open',
    awaiting_customer: 'Awaiting You',
    closed: 'Closed',
};

const statusClasses = {
    open: 'bg-amber-100 text-amber-800',
    awaiting_customer: 'bg-emerald-100 text-emerald-800',
    closed: 'bg-slate-100 text-slate-700',
};

const editorModules = {
    toolbar: [
        [{ header: [3, 4, false] }],
        ['bold', 'italic', 'underline'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['blockquote'],
        ['clean'],
    ],
};

const editorFormats = [
    'header',
    'bold',
    'italic',
    'underline',
    'list',
    'bullet',
    'blockquote',
];

export default function Support({
    support = {},
    priorities = [],
    tickets = [],
    active_ticket_id: activeTicketId = null,
    updates = [],
}) {
    const createForm = useForm({
        subject: '',
        priority: priorities.includes('medium') ? 'medium' : priorities[0] || 'medium',
        message: '',
        attachment: null,
    });

    const replyForm = useForm({
        message: '',
        attachment: null,
    });

    const activeTicket = tickets.find((ticket) => ticket.id === activeTicketId) || tickets[0] || null;

    const submitCreate = (event) => {
        event.preventDefault();

        createForm.post(route('dashboard.support.tickets.store'), {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => createForm.reset('subject', 'message', 'attachment'),
        });
    };

    const submitReply = (event) => {
        event.preventDefault();

        if (!activeTicket) {
            return;
        }

        replyForm.post(route('dashboard.support.tickets.reply', activeTicket.id), {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => replyForm.reset('message', 'attachment'),
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Support Tickets" />

            <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
                <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h1 className="text-2xl font-black text-slate-900">Support Tickets</h1>
                    <p className="mt-2 text-sm text-slate-600">
                        Create a ticket for any request, and track replies from the Bellah support team here.
                    </p>
                </section>

                <section className="grid gap-4 sm:grid-cols-3">
                    <SupportStat label="Open" value={support.open_tickets ?? 0} />
                    <SupportStat label="Awaiting You" value={support.awaiting_customer ?? 0} />
                    <SupportStat label="Closed" value={support.closed_tickets ?? 0} />
                </section>

                <section className="grid gap-6 xl:grid-cols-[360px_1fr]">
                    <div className="space-y-6">
                        <form onSubmit={submitCreate} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <h2 className="text-lg font-bold text-slate-900">New Ticket</h2>

                            <div className="mt-4 space-y-4">
                                <div>
                                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Subject</label>
                                    <input
                                        type="text"
                                        value={createForm.data.subject}
                                        onChange={(event) => createForm.setData('subject', event.target.value)}
                                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500"
                                        required
                                    />
                                    {createForm.errors.subject ? <p className="mt-1 text-xs text-red-600">{createForm.errors.subject}</p> : null}
                                </div>

                                <div>
                                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Priority</label>
                                    <select
                                        value={createForm.data.priority}
                                        onChange={(event) => createForm.setData('priority', event.target.value)}
                                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500"
                                    >
                                        {priorities.map((priority) => (
                                            <option key={priority} value={priority}>
                                                {priorityOptions[priority] || priority}
                                            </option>
                                        ))}
                                    </select>
                                    {createForm.errors.priority ? <p className="mt-1 text-xs text-red-600">{createForm.errors.priority}</p> : null}
                                </div>

                                <div>
                                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Message</label>
                                    <div className="mt-1 overflow-hidden rounded-lg border border-slate-300 bg-white">
                                        <RichTextEditor
                                            value={createForm.data.message}
                                            onChange={(value) => createForm.setData('message', value)}
                                            modules={editorModules}
                                            formats={editorFormats}
                                            placeholder="Describe your issue clearly..."
                                            className="min-h-[180px]"
                                        />
                                    </div>
                                    {createForm.errors.message ? <p className="mt-1 text-xs text-red-600">{createForm.errors.message}</p> : null}
                                </div>

                                <div>
                                    <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Image Attachment (Optional)</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(event) => createForm.setData('attachment', event.target.files?.[0] || null)}
                                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700"
                                    />
                                    {createForm.errors.attachment ? <p className="mt-1 text-xs text-red-600">{createForm.errors.attachment}</p> : null}
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={createForm.processing}
                                className="mt-4 w-full rounded-lg bg-[#000285] px-4 py-2 text-sm font-bold text-white hover:bg-blue-800 disabled:opacity-60"
                            >
                                {createForm.processing ? 'Submitting...' : 'Create Ticket'}
                            </button>
                        </form>

                        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <h2 className="text-lg font-bold text-slate-900">Recent Tickets</h2>
                            {tickets.length === 0 ? (
                                <p className="mt-3 text-sm text-slate-500">No support tickets yet.</p>
                            ) : (
                                <div className="mt-3 space-y-2">
                                    {tickets.map((ticket) => (
                                        <Link
                                            key={ticket.id}
                                            href={route('dashboard.support', { ticket: ticket.id })}
                                            className={`block rounded-lg border p-3 text-sm transition ${activeTicket?.id === ticket.id ? 'border-blue-300 bg-blue-50' : 'border-slate-200 hover:bg-slate-50'}`}
                                        >
                                            <p className="font-bold text-slate-900">{ticket.ticket_number}</p>
                                            <p className="mt-1 text-slate-700">{ticket.subject}</p>
                                            <div className="mt-2 flex items-center gap-2">
                                                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusClasses[ticket.status] || statusClasses.closed}`}>
                                                    {statusLabels[ticket.status] || ticket.status}
                                                </span>
                                                <span className="text-xs text-slate-500">{priorityOptions[ticket.priority] || ticket.priority}</span>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            {!activeTicket ? (
                                <p className="text-sm text-slate-500">Select a ticket to view messages.</p>
                            ) : (
                                <>
                                    <div className="border-b border-slate-100 pb-3">
                                        <p className="text-xs uppercase tracking-wide text-slate-500">{activeTicket.ticket_number}</p>
                                        <h3 className="mt-1 text-lg font-bold text-slate-900">{activeTicket.subject}</h3>
                                    </div>

                                    <div className="mt-4 space-y-3">
                                        {activeTicket.messages.map((message) => (
                                            <article
                                                key={message.id}
                                                className={`rounded-lg border p-3 ${message.sender_type === 'staff' ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-slate-50'}`}
                                            >
                                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{message.sender_name}</p>
                                                <div
                                                    className="prose prose-sm mt-1 max-w-none text-slate-700"
                                                    dangerouslySetInnerHTML={{ __html: message.message }}
                                                />
                                                {message.attachment_url ? (
                                                    <a href={message.attachment_url} target="_blank" rel="noreferrer" className="mt-2 block">
                                                        <img src={message.attachment_url} alt={message.attachment_name || 'Ticket attachment'} className="max-h-52 rounded-md border border-slate-200 object-contain" />
                                                    </a>
                                                ) : null}
                                                <p className="mt-2 text-xs text-slate-500">{message.created_at}</p>
                                            </article>
                                        ))}
                                    </div>

                                    {activeTicket.status !== 'closed' ? (
                                        <form onSubmit={submitReply} className="mt-4 border-t border-slate-100 pt-4">
                                            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Reply</label>
                                            <div className="mt-1 overflow-hidden rounded-lg border border-slate-300 bg-white">
                                                <RichTextEditor
                                                    value={replyForm.data.message}
                                                    onChange={(value) => replyForm.setData('message', value)}
                                                    modules={editorModules}
                                                    formats={editorFormats}
                                                    placeholder="Type your reply..."
                                                    className="min-h-[150px]"
                                                />
                                            </div>
                                            {replyForm.errors.message ? <p className="mt-1 text-xs text-red-600">{replyForm.errors.message}</p> : null}
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(event) => replyForm.setData('attachment', event.target.files?.[0] || null)}
                                                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700"
                                            />
                                            {replyForm.errors.attachment ? <p className="mt-1 text-xs text-red-600">{replyForm.errors.attachment}</p> : null}
                                            <button
                                                type="submit"
                                                disabled={replyForm.processing}
                                                className="mt-3 rounded-lg bg-[#000285] px-4 py-2 text-sm font-bold text-white hover:bg-blue-800 disabled:opacity-60"
                                            >
                                                {replyForm.processing ? 'Sending...' : 'Send Reply'}
                                            </button>
                                        </form>
                                    ) : (
                                        <p className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                                            This ticket is closed. Send a new ticket if you still need help.
                                        </p>
                                    )}
                                </>
                            )}
                        </section>

                        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                            <h2 className="text-lg font-bold text-slate-900">Recent Project Updates</h2>
                            {updates.length === 0 ? (
                                <p className="mt-3 text-sm text-slate-500">No updates yet.</p>
                            ) : (
                                <div className="mt-4 space-y-3">
                                    {updates.map((update) => (
                                        <article key={update.id} className="rounded-lg border border-slate-200 p-4">
                                            <p className="text-xs uppercase tracking-wide text-slate-500">{update.order_label}</p>
                                            <p className="mt-2 text-sm text-slate-700">{update.note}</p>
                                            <p className="mt-2 text-xs text-slate-500">{update.created_at}</p>
                                        </article>
                                    ))}
                                </div>
                            )}
                        </section>
                    </div>
                </section>
            </div>
        </AuthenticatedLayout>
    );
}

function SupportStat({ label, value }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
            <p className="mt-2 text-lg font-black text-slate-900">{value}</p>
        </div>
    );
}
