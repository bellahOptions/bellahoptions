import { useEffect, useMemo, useRef, useState } from 'react';

const QUICK_REACTIONS = ['👍', '❤️', '😂', '🙏'];

function csrfToken() {
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';
}

function formatDateTime(value) {
    if (!value) {
        return '';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return '';
    }

    return date.toLocaleString([], {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function mergeByMessageId(previous, incoming) {
    if (!Array.isArray(incoming) || incoming.length === 0) {
        return previous;
    }

    const map = new Map(previous.map((message) => [message.id, message]));
    for (const message of incoming) {
        map.set(message.id, message);
    }

    return Array.from(map.values()).sort((a, b) => Number(a.id) - Number(b.id));
}

function createClientMessageId() {
    const randomPart = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2);

    return `smsg_${Date.now()}_${randomPart}`;
}

export default function StaffLiveChatWorkspace({
    initialThreadId = null,
    className = '',
    compact = false,
}) {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [threads, setThreads] = useState([]);
    const [selectedThreadId, setSelectedThreadId] = useState(initialThreadId);
    const [selectedThread, setSelectedThread] = useState(null);
    const [messages, setMessages] = useState([]);
    const [draft, setDraft] = useState('');
    const [sending, setSending] = useState(false);
    const [togglingStatus, setTogglingStatus] = useState(false);
    const [joining, setJoining] = useState(false);
    const [onlineStaffIds, setOnlineStaffIds] = useState([]);
    const [onlineStaff, setOnlineStaff] = useState([]);
    const [showNudge, setShowNudge] = useState(false);

    const scrollerRef = useRef(null);
    const audioContextRef = useRef(null);
    const nudgeTimerRef = useRef(null);
    const lastKnownCustomerMessageIdRef = useRef(0);
    const typingTimerRef = useRef(null);
    const messagesRef = useRef([]);

    const selectedThreadLabel = selectedThread?.display_name ?? 'Select a conversation';

    const selectedThreadMeta = useMemo(() => {
        if (!selectedThread) {
            return 'No conversation selected';
        }

        const statusLine = selectedThread.customer_is_online ? 'Customer online' : 'Customer offline';

        if (selectedThread.display_email) {
            return `${selectedThread.display_email} · ${statusLine}`;
        }

        return statusLine;
    }, [selectedThread]);

    const callApi = async (url, options = {}) => {
        const response = await fetch(url, {
            method: options.method ?? 'GET',
            credentials: 'same-origin',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-TOKEN': csrfToken(),
                ...(options.headers ?? {}),
            },
            body: options.body ? JSON.stringify(options.body) : undefined,
        });

        if (!response.ok) {
            throw new Error('Request failed');
        }

        return response.json();
    };

    const playNotificationSound = () => {
        if (typeof window === 'undefined') {
            return;
        }

        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) {
            return;
        }

        try {
            if (!audioContextRef.current) {
                audioContextRef.current = new AudioCtx();
            }

            const context = audioContextRef.current;
            if (context.state === 'suspended') {
                context.resume().catch(() => {
                    // Browser may require a user gesture.
                });
            }

            const startAt = context.currentTime + 0.01;
            const oscillator = context.createOscillator();
            const gain = context.createGain();

            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(740, startAt);
            oscillator.frequency.exponentialRampToValueAtTime(520, startAt + 0.16);

            gain.gain.setValueAtTime(0.0001, startAt);
            gain.gain.exponentialRampToValueAtTime(0.16, startAt + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.24);

            oscillator.connect(gain);
            gain.connect(context.destination);

            oscillator.start(startAt);
            oscillator.stop(startAt + 0.25);
        } catch {
            // Silent by design.
        }
    };

    const triggerNudge = () => {
        setShowNudge(true);

        if (nudgeTimerRef.current) {
            window.clearTimeout(nudgeTimerRef.current);
        }

        nudgeTimerRef.current = window.setTimeout(() => {
            setShowNudge(false);
            nudgeTimerRef.current = null;
        }, 2400);
    };

    const loadOverview = async ({ hydrateMessages = true, fetchOnlyNew = false } = {}) => {
        const params = new URLSearchParams();
        if (selectedThreadId) {
            params.set('thread_id', String(selectedThreadId));
        }

        if (fetchOnlyNew && messagesRef.current.length > 0) {
            params.set('after_id', String(messagesRef.current[messagesRef.current.length - 1]?.id ?? 0));
        }

        const url = `${route('admin.live-chat.overview')}?${params.toString()}`;
        const payload = await callApi(url);

        const incomingThreads = Array.isArray(payload?.threads) ? payload.threads : [];
        const incomingMessages = Array.isArray(payload?.messages) ? payload.messages : [];

        setThreads(incomingThreads);
        setOnlineStaffIds(Array.isArray(payload?.staff_presence?.online_staff_ids) ? payload.staff_presence.online_staff_ids : []);
        setOnlineStaff(Array.isArray(payload?.staff_presence?.online_staff) ? payload.staff_presence.online_staff : []);

        const threadFromPayload = payload?.selected_thread ?? null;
        setSelectedThread(threadFromPayload);

        const nextSelectedId = threadFromPayload?.id ?? incomingThreads[0]?.id ?? null;
        if (nextSelectedId && nextSelectedId !== selectedThreadId) {
            setSelectedThreadId(nextSelectedId);
            setMessages(incomingMessages);
            return;
        }

        if (hydrateMessages) {
            if (fetchOnlyNew) {
                const hasNewCustomerReply = incomingMessages.some((message) => {
                    if (message.sender_type !== 'customer') {
                        return false;
                    }

                    const id = Number(message.id);
                    if (id > lastKnownCustomerMessageIdRef.current) {
                        lastKnownCustomerMessageIdRef.current = id;
                        return true;
                    }

                    return false;
                });

                if (hasNewCustomerReply) {
                    triggerNudge();
                    playNotificationSound();
                }

                setMessages((previous) => mergeByMessageId(previous, incomingMessages));
            } else {
                const highestCustomerId = incomingMessages
                    .filter((message) => message.sender_type === 'customer')
                    .reduce((largest, message) => (Number(message.id) > largest ? Number(message.id) : largest), 0);

                if (highestCustomerId > lastKnownCustomerMessageIdRef.current) {
                    lastKnownCustomerMessageIdRef.current = highestCustomerId;
                }

                setMessages(incomingMessages);
            }
        }
    };

    const updateTyping = async (isTyping) => {
        if (!selectedThreadId) {
            return;
        }

        try {
            const payload = await callApi(route('admin.live-chat.threads.typing', selectedThreadId), {
                method: 'POST',
                body: { is_typing: isTyping },
            });

            if (payload?.thread) {
                setSelectedThread(payload.thread);
            }
        } catch {
            // Silent by design.
        }
    };

    useEffect(() => {
        const bootstrap = async () => {
            setLoading(true);
            setError('');

            try {
                await loadOverview({ hydrateMessages: true, fetchOnlyNew: false });
            } catch {
                setError('Unable to load live chats right now.');
            } finally {
                setLoading(false);
            }
        };

        bootstrap();
    }, []);

    useEffect(() => {
        const poll = window.setInterval(async () => {
            try {
                await loadOverview({ hydrateMessages: true, fetchOnlyNew: true });
            } catch {
                // Keep polling silent.
            }
        }, 3500);

        return () => window.clearInterval(poll);
    }, [selectedThreadId]);

    useEffect(() => {
        messagesRef.current = messages;
    }, [messages]);

    useEffect(() => {
        if (!selectedThreadId) {
            return;
        }

        const switchThread = async () => {
            try {
                await loadOverview({ hydrateMessages: true, fetchOnlyNew: false });
            } catch {
                setError('Unable to open this conversation right now.');
            }
        };

        switchThread();
    }, [selectedThreadId]);

    useEffect(() => {
        scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        if (!selectedThreadId) {
            return undefined;
        }

        if (typingTimerRef.current) {
            window.clearTimeout(typingTimerRef.current);
        }

        const shouldType = draft.trim().length > 0;
        typingTimerRef.current = window.setTimeout(() => {
            updateTyping(shouldType);
        }, 260);

        return () => {
            if (typingTimerRef.current) {
                window.clearTimeout(typingTimerRef.current);
            }
        };
    }, [draft, selectedThreadId]);

    useEffect(() => {
        return () => {
            if (typingTimerRef.current) {
                window.clearTimeout(typingTimerRef.current);
            }
            if (nudgeTimerRef.current) {
                window.clearTimeout(nudgeTimerRef.current);
            }
        };
    }, []);

    const sendMessage = async (event) => {
        event.preventDefault();
        if (!selectedThreadId || sending) {
            return;
        }

        const message = draft.trim();
        if (message === '') {
            return;
        }

        setSending(true);
        setError('');

        try {
            const payload = await callApi(route('admin.live-chat.threads.messages.send', selectedThreadId), {
                method: 'POST',
                body: {
                    message,
                    client_message_id: createClientMessageId(),
                },
            });

            if (payload?.thread) {
                setSelectedThread(payload.thread);
            }

            if (payload?.message) {
                setMessages((previous) => mergeByMessageId(previous, [payload.message]));
            }

            setDraft('');
            updateTyping(false);
            await loadOverview({ hydrateMessages: false, fetchOnlyNew: false });
        } catch {
            setError('Message could not be sent. Please try again.');
        } finally {
            setSending(false);
        }
    };

    const updateStatus = async (status) => {
        if (!selectedThreadId || togglingStatus) {
            return;
        }

        setTogglingStatus(true);
        setError('');

        try {
            const payload = await callApi(route('admin.live-chat.threads.status', selectedThreadId), {
                method: 'PATCH',
                body: { status },
            });

            if (payload?.thread) {
                setSelectedThread(payload.thread);
            }

            await loadOverview({ hydrateMessages: false, fetchOnlyNew: false });
        } catch {
            setError('Unable to update chat status right now.');
        } finally {
            setTogglingStatus(false);
        }
    };

    const joinThread = async () => {
        if (!selectedThreadId || joining) {
            return;
        }

        setJoining(true);
        setError('');

        try {
            const payload = await callApi(route('admin.live-chat.threads.join', selectedThreadId), {
                method: 'PATCH',
                body: {},
            });

            if (payload?.thread) {
                setSelectedThread(payload.thread);
            }

            await loadOverview({ hydrateMessages: false, fetchOnlyNew: false });
        } catch {
            setError('Unable to join this chat right now.');
        } finally {
            setJoining(false);
        }
    };

    const toggleReaction = async (messageId, emoji) => {
        try {
            const payload = await callApi(route('admin.live-chat.messages.react', messageId), {
                method: 'POST',
                body: { emoji },
            });

            if (payload?.message) {
                setMessages((previous) => previous.map((item) => (
                    item.id === payload.message.id ? payload.message : item
                )));
            }

            if (payload?.thread) {
                setSelectedThread(payload.thread);
            }
        } catch {
            // Silent by design.
        }
    };

    return (
        <section className={`flex min-h-0 overflow-hidden rounded-2xl border border-gray-200 bg-white ${className}`}>
            <aside className="flex w-[43%] min-w-[260px] flex-col border-r border-gray-200 bg-gray-50">
                <header className="space-y-2 border-b border-gray-200 px-4 py-3">
                    <p className="text-sm font-black uppercase tracking-[0.18em] text-[#000285]">Live Conversations</p>
                    <p className="text-xs text-gray-600">{onlineStaffIds.length} staff online now</p>

                    {showNudge && (
                        <div className="rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-black uppercase tracking-wide text-[#000285]">
                            New customer message received.
                        </div>
                    )}
                </header>

                <div className="border-b border-gray-200 px-3 py-2">
                    <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#000285]">Online Team</p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {onlineStaff.length === 0 && <span className="text-[11px] text-gray-600">No active staff presence.</span>}
                        {onlineStaff.map((staff) => (
                            <span key={staff.id} className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-gray-800 ring-1 ring-gray-200">
                                {staff.name}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto">
                    {loading && <p className="px-4 py-3 text-sm text-gray-700">Loading threads...</p>}
                    {!loading && threads.length === 0 && (
                        <p className="px-4 py-3 text-sm text-gray-700">No active conversations yet.</p>
                    )}

                    {threads.map((threadItem) => {
                        const active = Number(selectedThreadId) === threadItem.id;

                        return (
                            <button
                                key={threadItem.id}
                                type="button"
                                onClick={() => setSelectedThreadId(threadItem.id)}
                                className={`w-full border-b border-gray-200 px-4 py-3 text-left transition ${
                                    active ? 'bg-white' : 'hover:bg-gray-100'
                                }`}
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <p className="truncate text-sm font-black text-gray-900">{threadItem.display_name}</p>
                                    {threadItem.unread_count > 0 && (
                                        <span className="inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[#000285] px-1 text-[11px] font-black text-white">
                                            {threadItem.unread_count > 99 ? '99+' : threadItem.unread_count}
                                        </span>
                                    )}
                                </div>
                                <p className="mt-1 truncate text-xs text-gray-600">{threadItem.display_email || 'Guest visitor'}</p>
                                <p className="mt-2 truncate text-xs text-gray-500">
                                    {threadItem.latest_message?.body || 'No messages yet'}
                                </p>
                                <div className="mt-2 flex items-center justify-between">
                                    <span
                                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                                            threadItem.status === 'open'
                                                ? 'bg-emerald-100 text-emerald-700'
                                                : 'bg-slate-200 text-slate-700'
                                        }`}
                                    >
                                        {threadItem.status}
                                    </span>
                                    <span className="text-[11px] text-gray-500">
                                        {threadItem.customer_is_online ? 'customer online' : formatDateTime(threadItem.last_message_at)}
                                    </span>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </aside>

            <div className="flex min-w-0 flex-1 flex-col bg-white">
                <header className="border-b border-gray-200 bg-white px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <p className="text-sm font-black text-gray-900">{selectedThreadLabel}</p>
                            <p className="text-xs text-gray-600">{selectedThreadMeta}</p>
                        </div>

                        {selectedThread && (
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={joinThread}
                                    disabled={joining}
                                    className="rounded-md border border-gray-300 px-2.5 py-1 text-xs font-bold text-gray-700 transition hover:border-[#000285] hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-55"
                                >
                                    {joining ? 'Joining...' : 'Join Chat'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => updateStatus('open')}
                                    disabled={togglingStatus || selectedThread.status === 'open'}
                                    className="rounded-md border border-emerald-300 px-2.5 py-1 text-xs font-bold text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-55"
                                >
                                    Reopen
                                </button>
                                <button
                                    type="button"
                                    onClick={() => updateStatus('closed')}
                                    disabled={togglingStatus || selectedThread.status === 'closed'}
                                    className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-55"
                                >
                                    Close
                                </button>
                            </div>
                        )}
                    </div>
                </header>

                <div
                    ref={scrollerRef}
                    className={`min-h-0 flex-1 space-y-3 overflow-y-auto bg-gray-50 px-4 py-4 ${compact ? 'max-h-[50vh]' : ''}`}
                >
                    {messages.length === 0 && (
                        <p className="text-sm text-gray-600">Choose a conversation to begin live support.</p>
                    )}

                    {messages.map((message) => {
                        const isStaff = message.sender_type === 'staff';

                        return (
                            <article
                                key={message.id}
                                className={`max-w-[82%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                                    isStaff ? 'ml-auto bg-[#000285] text-white' : 'mr-auto border border-gray-200 bg-white text-gray-900'
                                }`}
                            >
                                <p className="whitespace-pre-wrap break-words">{message.body}</p>
                                <p className={`mt-1 text-[11px] ${isStaff ? 'text-blue-100' : 'text-gray-500'}`}>
                                    {message.sender_name} · {formatDateTime(message.created_at)}
                                </p>

                                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                                    {Array.isArray(message.reactions) && message.reactions.map((reaction) => (
                                        <button
                                            key={`${message.id}-${reaction.emoji}`}
                                            type="button"
                                            onClick={() => toggleReaction(message.id, reaction.emoji)}
                                            className={`rounded-full px-2 py-0.5 text-[11px] transition ${
                                                isStaff
                                                    ? 'border border-blue-300/40 bg-blue-900 text-white hover:bg-blue-950'
                                                    : 'border border-gray-300 bg-gray-100 text-gray-800 hover:bg-gray-200'
                                            }`}
                                        >
                                            {reaction.emoji} {reaction.count}
                                        </button>
                                    ))}
                                    {QUICK_REACTIONS.map((emoji) => (
                                        <button
                                            key={`${message.id}-quick-${emoji}`}
                                            type="button"
                                            onClick={() => toggleReaction(message.id, emoji)}
                                            className={`rounded-full px-1 py-0.5 text-xs ${isStaff ? 'text-blue-100 hover:bg-blue-900' : 'text-gray-600 hover:bg-gray-100'}`}
                                            title={`React with ${emoji}`}
                                        >
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            </article>
                        );
                    })}

                    {selectedThread?.customer_typing && (
                        <div className="mr-auto inline-flex max-w-[72%] items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700">
                            <span className="inline-flex gap-1">
                                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#000285] [animation-delay:0ms]" />
                                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#000285] [animation-delay:120ms]" />
                                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#000285] [animation-delay:240ms]" />
                            </span>
                            Customer is typing...
                        </div>
                    )}
                </div>

                <form onSubmit={sendMessage} className="border-t border-gray-200 bg-white p-3">
                    <div className="flex items-end gap-2">
                        <textarea
                            value={draft}
                            onChange={(event) => setDraft(event.target.value)}
                            rows={2}
                            maxLength={2000}
                            disabled={!selectedThreadId}
                            placeholder={selectedThreadId ? 'Type a reply for this customer...' : 'Select a conversation first'}
                            className="min-h-10 flex-1 resize-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-[#000285] focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-100"
                        />
                        <button
                            type="submit"
                            disabled={sending || !selectedThreadId}
                            className="rounded-lg bg-[#000285] px-4 py-2 text-sm font-black text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {sending ? 'Sending...' : 'Send'}
                        </button>
                    </div>

                    {selectedThread?.staff_typing && (
                        <p className="mt-1 text-[11px] text-gray-500">You are typing...</p>
                    )}
                    {error && <p className="mt-2 text-xs font-medium text-red-600">{error}</p>}
                </form>
            </div>
        </section>
    );
}
