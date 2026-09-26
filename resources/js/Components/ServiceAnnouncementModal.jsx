import { Link, usePage } from "@inertiajs/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRightIcon, SparklesIcon, XMarkIcon } from "@heroicons/react/24/outline";
import FastImage from "@/Components/FastImage";

const STORAGE_PREFIX = "bellah:announcement-dismissed:";

/**
 * Reads the dismissal record for this announcement.
 *
 * A record is keyed by the announcement title so editing the copy re-shows the
 * modal, and it stores the expiry timestamp rather than a boolean.
 */
const readDismissal = (key) => {
    if (typeof window === "undefined") {
        return null;
    }

    try {
        const raw = window.localStorage.getItem(`${STORAGE_PREFIX}${key}`);

        if (!raw) {
            return null;
        }

        const expiresAt = Number(raw);

        return Number.isFinite(expiresAt) ? expiresAt : null;
    } catch {
        // Private mode or blocked storage: treat as "not dismissed".
        return null;
    }
};

const writeDismissal = (key, days) => {
    if (typeof window === "undefined" || days <= 0) {
        return;
    }

    try {
        window.localStorage.setItem(
            `${STORAGE_PREFIX}${key}`,
            String(Date.now() + days * 24 * 60 * 60 * 1000),
        );
    } catch {
        // Storage unavailable — the visitor simply sees it again next visit.
    }
};

/**
 * Announcement modal for a newly launched service.
 *
 * Content comes from the server (`serviceAnnouncement` shared prop, managed by a
 * super admin), and the whole modal is absent when the server decides it should
 * not appear. Dismissal is client-side only, so it never affects SEO or crawling.
 */
export default function ServiceAnnouncementModal() {
    const { serviceAnnouncement } = usePage().props;
    const [isOpen, setIsOpen] = useState(false);
    const closeButtonRef = useRef(null);

    const announcement = serviceAnnouncement || null;
    const announcementKey = announcement ? String(announcement.title || "").trim() : "";
    const dismissDays = Number(announcement?.dismiss_days || 0);

    const dismiss = useCallback(() => {
        writeDismissal(announcementKey, dismissDays);
        setIsOpen(false);
    }, [announcementKey, dismissDays]);

    useEffect(() => {
        if (!announcement || announcementKey === "") {
            setIsOpen(false);

            return;
        }

        const expiresAt = readDismissal(announcementKey);

        if (expiresAt !== null && expiresAt > Date.now()) {
            setIsOpen(false);

            return;
        }

        // Let the page paint first: a modal that appears with the first frame
        // reads as a popup, one that arrives just after reads as an invitation.
        const timer = window.setTimeout(() => setIsOpen(true), 1200);

        return () => window.clearTimeout(timer);
    }, [announcement, announcementKey]);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        closeButtonRef.current?.focus();

        const onKeyDown = (event) => {
            if (event.key === "Escape") {
                dismiss();
            }
        };

        window.addEventListener("keydown", onKeyDown);

        return () => window.removeEventListener("keydown", onKeyDown);
    }, [dismiss, isOpen]);

    if (!announcement) {
        return null;
    }

    const hasImage = Boolean(announcement.image);
    const isInternal = String(announcement.cta_url || "").startsWith("/");

    return (
        <AnimatePresence>
            {isOpen ? (
                <motion.div
                    key="announcement"
                    className="fixed inset-0 z-[80] flex items-end justify-center px-3 py-4 sm:items-center sm:px-6 sm:py-8"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <button
                        type="button"
                        aria-label="Dismiss announcement"
                        onClick={dismiss}
                        className="absolute inset-0 cursor-default bg-black/70 backdrop-blur-sm"
                    />

                    <motion.div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="service-announcement-title"
                        className="jv-card relative z-10 w-full max-w-3xl overflow-hidden p-0 shadow-2xl shadow-black/70"
                        initial={{ opacity: 0, y: 28, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 16, scale: 0.98 }}
                        transition={{ type: "spring", stiffness: 260, damping: 26 }}
                    >
                        <div
                            aria-hidden="true"
                            className="pointer-events-none absolute -top-24 left-1/2 h-56 w-[min(620px,120%)] -translate-x-1/2 bg-[radial-gradient(closest-side,rgba(0,85,255,0.45),transparent_72%)]"
                        />

                        <button
                            ref={closeButtonRef}
                            type="button"
                            onClick={dismiss}
                            aria-label="Close announcement"
                            className="absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-jv-line-strong bg-black/50 text-white/70 backdrop-blur transition hover:bg-white/[0.12] hover:text-white focus:outline-none focus:ring-2 focus:ring-jv-accent"
                        >
                            <XMarkIcon className="h-4 w-4" />
                        </button>

                        <div className={hasImage ? "grid sm:grid-cols-[0.9fr_1.1fr]" : ""}>
                            {hasImage ? (
                                <div className="relative hidden min-h-[16rem] sm:block">
                                    <FastImage
                                        src={announcement.image}
                                        variants={announcement.image_variants}
                                        alt=""
                                        sizes="(min-width: 640px) 40vw, 100vw"
                                        width={800}
                                        height={1000}
                                        className="h-full w-full object-cover"
                                    />
                                    <div
                                        aria-hidden="true"
                                        className="absolute inset-0 bg-gradient-to-r from-black/40 via-black/10 to-transparent"
                                    />
                                </div>
                            ) : null}

                            <div className="relative p-6 sm:p-9">
                                {announcement.badge ? (
                                    <span className="jv-mono inline-flex items-center gap-2 rounded-full border border-jv-accent-line bg-jv-accent/15 px-3 py-1 text-jv-accent">
                                        <SparklesIcon className="h-3.5 w-3.5" />
                                        {announcement.badge}
                                    </span>
                                ) : null}

                                <h2
                                    id="service-announcement-title"
                                    className="jv-display jv-display--sm mt-5"
                                >
                                    {announcement.title}
                                </h2>

                                {announcement.body ? (
                                    <p className="jv-body mt-4">{announcement.body}</p>
                                ) : null}

                                <div className="mt-8 flex flex-wrap items-center gap-3">
                                    {announcement.cta_url ? (
                                        isInternal ? (
                                            <Link
                                                href={announcement.cta_url}
                                                onClick={dismiss}
                                                className="jv-btn jv-btn--primary jv-btn--lg"
                                            >
                                                <span className="jv-btn__label">
                                                    {announcement.cta_label || "Learn more"}
                                                </span>
                                                <ArrowRightIcon className="h-4 w-4" />
                                            </Link>
                                        ) : (
                                            <a
                                                href={announcement.cta_url}
                                                onClick={dismiss}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="jv-btn jv-btn--primary jv-btn--lg"
                                            >
                                                <span className="jv-btn__label">
                                                    {announcement.cta_label || "Learn more"}
                                                </span>
                                                <ArrowRightIcon className="h-4 w-4" />
                                            </a>
                                        )
                                    ) : null}

                                    <button
                                        type="button"
                                        onClick={dismiss}
                                        className="jv-btn jv-btn--ghost"
                                    >
                                        <span className="jv-btn__label">Maybe later</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            ) : null}
        </AnimatePresence>
    );
}
