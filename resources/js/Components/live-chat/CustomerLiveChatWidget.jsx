import { AnimatePresence, motion } from 'motion/react';
import { usePage } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';

const CHAT_TOKEN_STORAGE_KEY = 'bellah_live_chat_token';
const QUICK_REACTIONS = ['👍', '❤️', '😂', '🙏'];

function formatTime(value) {
    if (!value) {
        return '';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return '';
    }

    return date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
    });
}

function csrfToken() {
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';
}

function latestMessageId(chatMessages) {
    return chatMessages.reduce((largestId, message) => (Number(message.id) > largestId ? Number(message.id) : largestId), 0);
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

    return `cmsg_${Date.now()}_${randomPart}`;
}

export default function CustomerLiveChatWidget({ show = true }) {
    const { auth = {} } = usePage().props;
    const currentUser = auth?.user ?? null;
    const isLoggedCustomer = Boolean(currentUser && !currentUser.is_staff);

    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [thread, setThread] = useState(null);
    const [messages, setMessages] = useState([]);
    const [faqs, setFaqs] = useState([]);
    const [messageDraft, setMessageDraft] = useState('');
    const [guestName, setGuestName] = useState('');
    const [guestEmail, setGuestEmail] = useState('');
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');
    const [showNudge, setShowNudge] = useState(false);
    const [closing, setClosing] = useState(false);

    const scrollerRef = useRef(null);
    const nudgeTimerRef = useRef(null);
    const audioContextRef = useRef(null);
    const hasBootstrappedRef = useRef(false);
    const lastKnownStaffMessageIdRef = useRef(0);
    const typingTimerRef = useRef(null);
    const messagesRef = useRef([]);

    const headerLabel = useMemo(() => {
        if (!thread) {
            return 'Live Chat';
        }

        if (thread.status === 'closed') {
            return 'Live Chat (Closed)';
        }

        return 'Live Chat';
    }, [thread]);

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

            oscillator.type = 'triangle';
            oscillator.frequency.setValueAtTime(920, startAt);
            oscillator.frequency.exponentialRampToValueAtTime(540, startAt + 0.18);

            gain.gain.setValueAtTime(0.0001, startAt);
            gain.gain.exponentialRampToValueAtTime(0.2, startAt + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.24);

            oscillator.connect(gain);
            gain.connect(context.destination);

            oscillator.start(startAt);
            oscillator.stop(startAt + 0.26);
        } catch {
            // Ignore audio failures to avoid blocking chat UX.
        }
    };

    const triggerUnreadNudge = () => {
        setShowNudge(true);

        if (nudgeTimerRef.current) {
            window.clearTimeout(nudgeTimerRef.current);
        }

        nudgeTimerRef.current = window.setTimeout(() => {
            setShowNudge(false);
            nudgeTimerRef.current = null;
        }, 2800);
    };

    const handlePotentialStaffReplies = (incomingMessages, isInitialLoad = false) => {
        if (!Array.isArray(incomingMessages) || incomingMessages.length === 0) {
            return;
        }

        const staffIds = incomingMessages
            .filter((message) => message.sender_type === 'staff')
            .map((message) => Number(message.id));

        const newestStaffId = staffIds.length ? Math.max(...staffIds) : 0;
        const highestKnownId = lastKnownStaffMessageIdRef.current;

        if (newestStaffId > highestKnownId) {
            lastKnownStaffMessageIdRef.current = newestStaffId;

            if (!isInitialLoad && hasBootstrappedRef.current) {
                const pageVisible = typeof document !== 'undefined' ? document.visibilityState === 'visible' : true;

                if (!isOpen || !pageVisible) {
                    triggerUnreadNudge();
                    playNotificationSound();
                }
            }
        }
    };

    const callChatApi = async (url, options = {}) => {
        const token = window.localStorage.getItem(CHAT_TOKEN_STORAGE_KEY) ?? '';
        const response = await fetch(url, {
            method: options.method ?? 'GET',
            credentials: 'same-origin',
            headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-TOKEN': csrfToken(),
                ...(token ? { 'X-Live-Chat-Token': token } : {}),
                ...(options.headers ?? {}),
            },
            body: options.body ? JSON.stringify(options.body) : undefined,
            keepalive: options.keepalive ?? false,
        });

        if (!response.ok) {
            throw new Error('Request failed');
        }

        const payload = await response.json();
        if (payload?.token) {
            window.localStorage.setItem(CHAT_TOKEN_STORAGE_KEY, payload.token);
        }

        return payload;
    };

    const bootstrapSession = async () => {
        setLoading(true);
        setError('');

        try {
            const payload = await callChatApi(route('live-chat.session'));
            const incomingMessages = Array.isArray(payload?.messages) ? payload.messages : [];

            handlePotentialStaffReplies(incomingMessages, true);
            setThread(payload?.thread ?? null);
            setMessages(incomingMessages);
            setFaqs(Array.isArray(payload?.faqs) ? payload.faqs : []);

            if ((payload?.thread?.guest_name ?? '').trim() !== '') {
                setGuestName(payload.thread.guest_name);
            }
            if ((payload?.thread?.guest_email ?? '').trim() !== '') {
                setGuestEmail(payload.thread.guest_email);
            }

            hasBootstrappedRef.current = true;
        } catch {
            setError('Live chat is currently unavailable. Please try again shortly.');
        } finally {
            setLoading(false);
        }
    };

    const pollMessages = async (markRead = false) => {
        if (!thread?.id) {
            return;
        }

        try {
            const params = new URLSearchParams({
                after_id: String(latestMessageId(messagesRef.current)),
                mark_read: markRead ? '1' : '0',
            });
            const payload = await callChatApi(`${route('live-chat.messages')}?${params.toString()}`);

            const incomingMessages = Array.isArray(payload?.messages) ? payload.messages : [];
            if (incomingMessages.length > 0) {
                handlePotentialStaffReplies(incomingMessages);
                setMessages((previous) => mergeByMessageId(previous, incomingMessages));
            }

            if (payload?.thread) {
                setThread(payload.thread);
            }
        } catch {
            // Keep chat quiet during background polling.
        }
    };

    const updatePresence = async (online) => {
        try {
            const payload = await callChatApi(route('live-chat.presence'), {
                method: 'POST',
                body: { is_online: online },
                keepalive: true,
            });

            if (payload?.thread) {
                setThread(payload.thread);
            }
        } catch {
            // Silent by design.
        }
    };

    const updateTyping = async (isTyping) => {
        try {
            const payload = await callChatApi(route('live-chat.typing'), {
                method: 'POST',
                body: { is_typing: isTyping },
            });

            if (payload?.thread) {
                setThread(payload.thread);
            }
        } catch {
            // Silent by design.
        }
    };

    useEffect(() => {
        if (!show) {
            return;
        }

        bootstrapSession();
    }, [show]);

    useEffect(() => {
        if (!show || !thread?.id) {
            return undefined;
        }

        const timer = window.setInterval(() => {
            pollMessages(isOpen);
        }, 3500);

        return () => window.clearInterval(timer);
    }, [thread?.id, isOpen, show]);

    useEffect(() => {
        messagesRef.current = messages;
    }, [messages]);

    useEffect(() => {
        if (!thread?.id) {
            return;
        }

        if (isOpen) {
            updatePresence(true);
            pollMessages(true);
        }
    }, [isOpen, thread?.id]);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        scrollerRef.current?.scrollTo({ top: scrollerRef.current.scrollHeight, behavior: 'smooth' });
    }, [messages, isOpen]);

    useEffect(() => {
        if (!thread?.id || !isOpen) {
            return undefined;
        }

        if (typingTimerRef.current) {
            window.clearTimeout(typingTimerRef.current);
        }

        const shouldType = messageDraft.trim().length > 0;
        typingTimerRef.current = window.setTimeout(() => {
            updateTyping(shouldType);
        }, 260);

        return () => {
            if (typingTimerRef.current) {
                window.clearTimeout(typingTimerRef.current);
            }
        };
    }, [messageDraft, isOpen, thread?.id]);

    useEffect(() => {
        return () => {
            if (nudgeTimerRef.current) {
                window.clearTimeout(nudgeTimerRef.current);
            }

            if (typingTimerRef.current) {
                window.clearTimeout(typingTimerRef.current);
            }
        };
    }, []);

    const sendMessage = async (event) => {
        event.preventDefault();

        const message = messageDraft.trim();
        if (message === '' || sending) {
            return;
        }

        if (!isLoggedCustomer && !thread?.id && guestName.trim().length < 2) {
            setError('Please add your name so our team can identify you.');
            return;
        }

        setSending(true);
        setError('');

        try {
            const payload = await callChatApi(route('live-chat.messages.send'), {
                method: 'POST',
                body: {
                    message,
                    guest_name: !isLoggedCustomer ? (guestName.trim() || undefined) : undefined,
                    guest_email: !isLoggedCustomer ? (guestEmail.trim() || undefined) : undefined,
                    client_message_id: createClientMessageId(),
                },
            });

            if (payload?.thread) {
                setThread(payload.thread);
            }

            if (payload?.message) {
                setMessages((previous) => mergeByMessageId(previous, [payload.message]));
            }

            setMessageDraft('');
            updateTyping(false);
        } catch {
            setError('We could not send that message. Please try again.');
        } finally {
            setSending(false);
        }
    };

    const closeChat = async () => {
        if (closing) {
            return;
        }

        setClosing(true);
        setError('');

        try {
            const payload = await callChatApi(route('live-chat.close'), {
                method: 'PATCH',
                body: {},
            });

            if (payload?.thread) {
                setThread(payload.thread);
            }

            await pollMessages(true);
            updatePresence(false);
        } catch {
            setError('Unable to close chat right now. Please try again.');
        } finally {
            setClosing(false);
        }
    };

    const toggleReaction = async (messageId, emoji) => {
        try {
            const payload = await callChatApi(route('live-chat.messages.react', messageId), {
                method: 'POST',
                body: { emoji },
            });

            if (payload?.message) {
                setMessages((previous) => previous.map((item) => (
                    item.id === payload.message.id ? payload.message : item
                )));
            }
        } catch {
            // Silent by design.
        }
    };

    const applyFaq = (faq) => {
        if (!faq?.question) {
            return;
        }

        setMessageDraft(faq.question);
    };

    if (!show) {
        return null;
    }

    const unreadCount = Number(thread?.unread_from_staff ?? 0);
    const shouldAlert = unreadCount > 0 && !isOpen;
    const staffTyping = Boolean(thread?.staff_typing);
    const offlineOneWayMode = Number(thread?.online_staff_count ?? 0) === 0;

    return (
        <div className="fixed bottom-5 right-5 z-[70]">
            <AnimatePresence>
                {showNudge && shouldAlert && (
                    <motion.div
                        initial={{ opacity: 0, y: 12, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.96 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                        className="mb-3 rounded-xl border border-blue-200 bg-white px-3 py-2 text-xs font-semibold text-blue-900 shadow-lg shadow-blue-200/60"
                    >
                        New support reply received.
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.button
                type="button"
                onClick={() => {
                    setIsOpen((previous) => {
                        const next = !previous;
                        if (!next) {
                            updateTyping(false);
                            updatePresence(false);
                        }

                        return next;
                    });
                }}
                className="relative inline-flex h-14 w-14 items-center justify-center rounded-full bg-blue-700 text-white shadow-xl shadow-blue-900/35 transition hover:bg-blue-800"
                aria-label="Open live chat"
                animate={shouldAlert ? { scale: [1, 1.06, 1] } : { scale: 1 }}
                transition={shouldAlert ? { duration: 1.1, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.18 }}
                whileTap={{ scale: 0.96 }}
            >
                {shouldAlert && (
                    <span className="absolute inset-0 rounded-full border-2 border-blue-200 animate-ping" aria-hidden="true" />
                )}

                <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h8M8 14h5m-8 6 2.5-3H19a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h.5L5 20Z" />
                </svg>

                <AnimatePresence>
                    {unreadCount > 0 && !isOpen && (
                        <motion.span
                            initial={{ opacity: 0, y: 4, scale: 0.65 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 2, scale: 0.75 }}
                            className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-xs font-bold text-blue-800 ring-1 ring-blue-200"
                        >
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </motion.span>
                    )}
                </AnimatePresence>
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <motion.section
                        initial={{ opacity: 0, y: 18, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 14, scale: 0.98 }}
                        transition={{ duration: 0.22, ease: 'easeOut' }}
                        className="mt-3 w-[min(92vw,390px)] origin-bottom-right overflow-hidden rounded-2xl border border-blue-200 bg-white shadow-2xl shadow-blue-200/50"
                    >
                        <header className="flex items-center justify-between border-b border-blue-200 bg-blue-700 px-4 py-3 text-white">
                            <div>
                                <p className="text-sm font-bold">{headerLabel}</p>
                                <p className="text-xs text-blue-100">
                                    {offlineOneWayMode
                                        ? 'Offline mode: one-way message delivery is active.'
                                        : 'At least one staff member is online now.'}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setIsOpen(false);
                                    updateTyping(false);
                                    updatePresence(false);
                                }}
                                className="rounded-md p-1 text-blue-100 transition hover:bg-white/10 hover:text-white"
                                aria-label="Close live chat"
                            >
                                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m6 6 12 12M6 18 18 6" />
                                </svg>
                            </button>
                        </header>

                        <div ref={scrollerRef} className="max-h-80 space-y-3 overflow-y-auto bg-blue-50 px-3 py-3">
                            {loading && <p className="text-sm text-blue-900">Loading conversation...</p>}

                            {!loading && messages.length === 0 && (
                                <div className="space-y-3">
                                    <p className="text-sm text-blue-900">Start a conversation and our support staff will respond here.</p>
                                    {faqs.length > 0 && (
                                        <div className="space-y-2">
                                            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Quick FAQs</p>
                                            {faqs.slice(0, 4).map((faq, index) => (
                                                <button
                                                    key={`faq-suggest-${index}`}
                                                    type="button"
                                                    onClick={() => applyFaq(faq)}
                                                    className="w-full rounded-lg border border-blue-200 bg-white px-2.5 py-2 text-left text-xs text-blue-900 transition hover:border-blue-400 hover:bg-blue-100"
                                                >
                                                    {faq.question}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            <AnimatePresence initial={false}>
                                {messages.map((message) => {
                                    const fromStaff = message.sender_type === 'staff';

                                    return (
                                        <motion.article
                                            key={message.id}
                                            initial={{ opacity: 0, y: 8, scale: 0.98 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 4, scale: 0.98 }}
                                            transition={{ duration: 0.18, ease: 'easeOut' }}
                                            className={`max-w-[86%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                                                fromStaff
                                                    ? 'mr-auto border border-blue-200 bg-white text-blue-950'
                                                    : 'ml-auto bg-blue-700 text-white'
                                            }`}
                                        >
                                            <p className="whitespace-pre-wrap break-words">{message.body}</p>
                                            <p className={`mt-1 text-[11px] ${fromStaff ? 'text-blue-700' : 'text-blue-100'}`}>
                                                {message.sender_name} · {formatTime(message.created_at)}
                                            </p>

                                            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                                                {Array.isArray(message.reactions) && message.reactions.map((reaction) => (
                                                    <button
                                                        key={`${message.id}-${reaction.emoji}`}
                                                        type="button"
                                                        onClick={() => toggleReaction(message.id, reaction.emoji)}
                                                        className={`rounded-full border px-2 py-0.5 text-[11px] transition ${
                                                            fromStaff
                                                                ? 'border-blue-300 bg-blue-50 text-blue-900 hover:bg-blue-100'
                                                                : 'border-blue-300/50 bg-blue-800 text-white hover:bg-blue-900'
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
                                                        className={`rounded-full border border-transparent px-1 py-0.5 text-xs transition ${
                                                            fromStaff
                                                                ? 'text-blue-700 hover:border-blue-300 hover:bg-blue-100'
                                                                : 'text-blue-100 hover:border-blue-300/50 hover:bg-blue-800'
                                                        }`}
                                                        title={`React with ${emoji}`}
                                                    >
                                                        {emoji}
                                                    </button>
                                                ))}
                                            </div>
                                        </motion.article>
                                    );
                                })}
                            </AnimatePresence>

                            {staffTyping && (
                                <div className="mr-auto inline-flex max-w-[72%] items-center gap-1.5 rounded-full border border-blue-200 bg-white px-3 py-1.5 text-xs text-blue-900">
                                    <span className="inline-flex gap-1">
                                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-500 [animation-delay:0ms]" />
                                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-500 [animation-delay:120ms]" />
                                        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-blue-500 [animation-delay:240ms]" />
                                    </span>
                                    Support is typing...
                                </div>
                            )}
                        </div>

                        <form onSubmit={sendMessage} className="space-y-2 border-t border-blue-200 bg-white p-3">
                            {!isLoggedCustomer && !thread?.id && (
                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                    <input
                                        type="text"
                                        value={guestName}
                                        onChange={(event) => setGuestName(event.target.value)}
                                        placeholder="Your name"
                                        className="rounded-lg border border-blue-300 bg-white px-3 py-2 text-sm text-blue-950 placeholder:text-blue-500 focus:border-blue-700 focus:outline-none"
                                        autoComplete="name"
                                    />
                                    <input
                                        type="email"
                                        value={guestEmail}
                                        onChange={(event) => setGuestEmail(event.target.value)}
                                        placeholder="Your email (optional)"
                                        className="rounded-lg border border-blue-300 bg-white px-3 py-2 text-sm text-blue-950 placeholder:text-blue-500 focus:border-blue-700 focus:outline-none"
                                        autoComplete="email"
                                    />
                                </div>
                            )}

                            <div className="flex items-end gap-2">
                                <textarea
                                    value={messageDraft}
                                    onChange={(event) => setMessageDraft(event.target.value)}
                                    rows={2}
                                    maxLength={2000}
                                    placeholder={thread?.status === 'closed' ? 'This chat is closed. Send a message to reopen it.' : 'Type your message...'}
                                    className="min-h-10 flex-1 resize-none rounded-lg border border-blue-300 bg-white px-3 py-2 text-sm text-blue-950 placeholder:text-blue-500 focus:border-blue-700 focus:outline-none"
                                />
                                <button
                                    type="submit"
                                    disabled={sending}
                                    className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {sending ? 'Sending...' : 'Send'}
                                </button>
                            </div>

                            <div className="flex items-center justify-between gap-2">
                                <button
                                    type="button"
                                    onClick={closeChat}
                                    disabled={closing || !thread?.id}
                                    className="rounded-md border border-blue-300 px-2.5 py-1 text-xs font-semibold text-blue-900 transition hover:border-blue-400 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {closing ? 'Closing...' : 'Close Chat'}
                                </button>
                                <p className="text-[11px] text-blue-700">
                                    {thread?.assigned_staff_online ? 'Assigned staff is online' : `${thread?.online_staff_count ?? 0} staff online`}
                                </p>
                            </div>

                            {error && <p className="text-xs font-medium text-red-600">{error}</p>}
                        </form>
                    </motion.section>
                )}
            </AnimatePresence>
        </div>
    );
}
