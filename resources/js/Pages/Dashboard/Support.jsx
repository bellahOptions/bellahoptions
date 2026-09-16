import { Eyebrow } from '@/Components/PublicUI';
import RichTextEditor from '@/Components/RichTextEditor';
import { Card } from '@/Components/ui/card';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
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
    open: 'bg-amber-500/15 text-amber-300',
    awaiting_customer: 'bg-emerald-500/15 text-emerald-300',
    closed: 'bg-white/[0.07] text-white/70',
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
                <Card className="p-5 sm:p-6">
                    <Eyebrow>Support Workspace</Eyebrow>
                    <h1 className="jv-display jv-display--md mt-5">Support Tickets</h1>
                    <p className="jv-lead mt-4">
                        Create a ticket for any request, and track replies from the Bellah support team here.
                    </p>
                </Card>

                <section className="grid gap-4 sm:grid-cols-3">
                    <SupportStat label="Open" value={support.open_tickets ?? 0} />
                    <SupportStat label="Awaiting You" value={support.awaiting_customer ?? 0} />
                    <SupportStat label="Closed" value={support.closed_tickets ?? 0} />
                </section>

                <section className="grid gap-6 xl:grid-cols-[360px_1fr]">
                    <div className="space-y-6">
                        <form onSubmit={submitCreate} className="jv-card p-5">
                            <h2 className="text-lg font-semibold tracking-tight text-white">New Ticket</h2>

                            <div className="mt-4 space-y-4">
                                <div>
                                    <label className="jv-label">Subject</label>
                                    <input
                                        type="text"
                                        value={createForm.data.subject}
                                        onChange={(event) => createForm.setData('subject', event.target.value)}
                                        className="jv-input mt-1"
                                        required
                                    />
                                    {createForm.errors.subject ? <p className="mt-1 text-xs text-red-300">{createForm.errors.subject}</p> : null}
                                </div>

                                <div>
                                    <label className="jv-label">Priority</label>
                                    <select
                                        value={createForm.data.priority}
                                        onChange={(event) => createForm.setData('priority', event.target.value)}
                                        className="jv-select mt-1"
                                    >
                                        {priorities.map((priority) => (
                                            <option key={priority} value={priority}>
                                                {priorityOptions[priority] || priority}
                                            </option>
                                        ))}
                                    </select>
                                    {createForm.errors.priority ? <p className="mt-1 text-xs text-red-300">{createForm.errors.priority}</p> : null}
                                </div>

                                <div>
                                    <label className="jv-label">Message</label>
                                    <div className="mt-1 overflow-hidden rounded-jv-sm border border-jv-line-strong bg-white/[0.05]">
                                        <RichTextEditor
                                            value={createForm.data.message}
                                            onChange={(value) => createForm.setData('message', value)}
                                            modules={editorModules}
                                            formats={editorFormats}
                                            placeholder="Describe your issue clearly..."
                                            className="min-h-[180px]"
                                        />
                                    </div>
                                    {createForm.errors.message ? <p className="mt-1 text-xs text-red-300">{createForm.errors.message}</p> : null}
                                </div>

                                <div>
                                    <label className="jv-label">Image Attachment (Optional)</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(event) => createForm.setData('attachment', event.target.files?.[0] || null)}
                                        className="jv-input mt-1 file:mr-4 file:rounded-full file:border-0 file:bg-jv-accent file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white"
                                    />
                                    {createForm.errors.attachment ? <p className="mt-1 text-xs text-red-300">{createForm.errors.attachment}</p> : null}
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={createForm.processing}
                                className="jv-btn jv-btn--primary mt-4 w-full"
                            >
                                {createForm.processing ? 'Submitting...' : 'Create Ticket'}
                            </button>
                        </form>

                        <div className="jv-card p-5">
                            <h2 className="text-lg font-semibold tracking-tight text-white">Recent Tickets</h2>
                            {tickets.length === 0 ? (
                                <p className="mt-3 text-sm text-white/45">No support tickets yet.</p>
                            ) : (
                                <div className="mt-3 space-y-2">
                                    {tickets.map((ticket) => (
                                        <Link
                                            key={ticket.id}
                                            href={route('dashboard.support', { ticket: ticket.id })}
                                            className={`block rounded-jv-sm border p-3 text-sm transition ${activeTicket?.id === ticket.id ? 'border-jv-accent-line bg-jv-accent/10' : 'border-jv-line hover:bg-white/[0.06]'}`}
                                        >
                                            <p className="font-semibold text-white">{ticket.ticket_number}</p>
                                            <p className="mt-1 text-white/70">{ticket.subject}</p>
                                            <div className="mt-2 flex items-center gap-2">
                                                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${statusClasses[ticket.status] || statusClasses.closed}`}>
                                                    {statusLabels[ticket.status] || ticket.status}
                                                </span>
                                                <span className="text-xs text-white/45">{priorityOptions[ticket.priority] || ticket.priority}</span>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <section className="jv-card p-5">
                            {!activeTicket ? (
                                <p className="text-sm text-white/45">Select a ticket to view messages.</p>
                            ) : (
                                <>
                                    <div className="border-b border-jv-line pb-3">
                                        <p className="text-xs uppercase tracking-wide text-white/45">{activeTicket.ticket_number}</p>
                                        <h3 className="mt-1 text-lg font-semibold tracking-tight text-white">{activeTicket.subject}</h3>
                                    </div>

                                    <div className="mt-4 space-y-3">
                                        {activeTicket.messages.map((message) => (
                                            <article
                                                key={message.id}
                                                className={`rounded-jv-sm border p-3 ${message.sender_type === 'staff' ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-jv-line bg-white/[0.04]'}`}
                                            >
                                                <p className="text-xs font-semibold uppercase tracking-wide text-white/45">{message.sender_name}</p>
                                                <div
                                                    className="prose prose-sm mt-1 max-w-none text-white/70"
                                                    dangerouslySetInnerHTML={{ __html: message.message }}
                                                />
                                                {message.attachment_url ? (
                                                    <a href={message.attachment_url} target="_blank" rel="noreferrer" className="mt-2 block">
                                                        <img src={message.attachment_url} alt={message.attachment_name || 'Ticket attachment'} className="max-h-52 rounded-jv-sm border border-jv-line object-contain" />
                                                    </a>
                                                ) : null}
                                                <p className="mt-2 text-xs text-white/45">{message.created_at}</p>
                                            </article>
                                        ))}
                                    </div>

                                    {activeTicket.status !== 'closed' ? (
                                        <form onSubmit={submitReply} className="mt-4 border-t border-jv-line pt-4">
                                            <label className="jv-label">Reply</label>
                                            <div className="mt-1 overflow-hidden rounded-jv-sm border border-jv-line-strong bg-white/[0.05]">
                                                <RichTextEditor
                                                    value={replyForm.data.message}
                                                    onChange={(value) => replyForm.setData('message', value)}
                                                    modules={editorModules}
                                                    formats={editorFormats}
                                                    placeholder="Type your reply..."
                                                    className="min-h-[150px]"
                                                />
                                            </div>
                                            {replyForm.errors.message ? <p className="mt-1 text-xs text-red-300">{replyForm.errors.message}</p> : null}
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(event) => replyForm.setData('attachment', event.target.files?.[0] || null)}
                                                className="jv-input mt-2 file:mr-4 file:rounded-full file:border-0 file:bg-jv-accent file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white"
                                            />
                                            {replyForm.errors.attachment ? <p className="mt-1 text-xs text-red-300">{replyForm.errors.attachment}</p> : null}
                                            <button
                                                type="submit"
                                                disabled={replyForm.processing}
                                                className="jv-btn jv-btn--primary mt-3"
                                            >
                                                {replyForm.processing ? 'Sending...' : 'Send Reply'}
                                            </button>
                                        </form>
                                    ) : (
                                        <p className="mt-4 rounded-jv-sm border border-jv-line bg-white/[0.04] p-3 text-sm text-white/70">
                                            This ticket is closed. Send a new ticket if you still need help.
                                        </p>
                                    )}
                                </>
                            )}
                        </section>

                        <section className="jv-card p-5">
                            <h2 className="text-lg font-semibold tracking-tight text-white">Recent Project Updates</h2>
                            {updates.length === 0 ? (
                                <p className="mt-3 text-sm text-white/45">No updates yet.</p>
                            ) : (
                                <div className="mt-4 space-y-3">
                                    {updates.map((update) => (
                                        <article key={update.id} className="rounded-jv-sm border border-jv-line bg-white/[0.04] p-4">
                                            <p className="text-xs uppercase tracking-wide text-white/45">{update.order_label}</p>
                                            <p className="mt-2 text-sm text-white/70">{update.note}</p>
                                            <p className="mt-2 text-xs text-white/45">{update.created_at}</p>
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
        <div className="jv-card rounded-jv border border-jv-line bg-white/[0.04] p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/45">{label}</p>
            <p className="mt-2 text-lg font-black text-white">{value}</p>
        </div>
    );
}
