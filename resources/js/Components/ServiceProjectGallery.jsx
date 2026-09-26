import FastImage from "@/Components/FastImage";
import { Card, Eyebrow, Section, SectionHeading, Stagger, StaggerItem } from "@/Components/PublicUI";
import {
    ArrowUpRightIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    XMarkIcon,
} from "@heroicons/react/24/outline";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Projects belonging to a service, shown on that service's landing page.
 *
 * A grid is the right default because these are images an operator wants
 * scanned quickly, but a single thumbnail is a poor way to judge design work, so
 * each tile opens a lightbox that doubles as a carousel: arrow keys or the
 * on-screen buttons move through the whole set without going back to the grid.
 *
 * The section renders nothing at all when the service has no projects. An empty
 * "our work" heading with a placeholder underneath reads as unfinished work,
 * which is worse than simply not making the claim.
 */
export default function ServiceProjectGallery({
    projects = [],
    serviceName = 'this service',
    eyebrow = 'Selected work',
}) {
    const items = Array.isArray(projects) ? projects.filter((project) => project?.image) : [];
    const label = String(serviceName || '').trim() || 'this service';
    const [openIndex, setOpenIndex] = useState(null);
    const closeButtonRef = useRef(null);

    const isOpen = openIndex !== null && items[openIndex] !== undefined;

    const close = useCallback(() => setOpenIndex(null), []);

    const step = useCallback(
        (offset) => {
            setOpenIndex((current) => {
                if (current === null || items.length === 0) {
                    return current;
                }

                // Wrap around: at the last image the next one is the first.
                return (current + offset + items.length) % items.length;
            });
        },
        [items.length],
    );

    useEffect(() => {
        if (!isOpen) {
            return undefined;
        }

        const onKeyDown = (event) => {
            if (event.key === 'Escape') {
                close();
            } else if (event.key === 'ArrowRight') {
                step(1);
            } else if (event.key === 'ArrowLeft') {
                step(-1);
            }
        };

        window.addEventListener('keydown', onKeyDown);

        // The grid behind the lightbox must not scroll while it is open.
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        closeButtonRef.current?.focus();

        return () => {
            window.removeEventListener('keydown', onKeyDown);
            document.body.style.overflow = previousOverflow;
        };
    }, [isOpen, close, step]);

    if (items.length === 0) {
        return null;
    }

    const active = isOpen ? items[openIndex] : null;

    return (
        <>
            <Section className="border-t border-jv-line">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <Eyebrow>{eyebrow}</Eyebrow>
                        <SectionHeading
                            className="mt-6"
                            align="left"
                            title={`Projects we delivered for ${label}`}
                            description="Published by our team. Open any project to see it full size."
                        />
                    </div>
                    <span className="jv-mono text-white/35">
                        {items.length} {items.length === 1 ? 'project' : 'projects'}
                    </span>
                </div>

                <Stagger className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {items.map((project, index) => (
                        <StaggerItem as="article" key={project.id ?? index} className="h-full">
                            <button
                                type="button"
                                onClick={() => setOpenIndex(index)}
                                aria-label={`Open ${project.title}`}
                                className="block h-full w-full text-left"
                            >
                                <Card
                                    hover
                                    pad={false}
                                    className="jv-group flex h-full flex-col overflow-hidden"
                                >
                                    <div className="jv-media jv-media--zoom aspect-[4/3] rounded-b-none border-0 border-b border-jv-line">
                                        <FastImage
                                            src={project.image}
                                            variants={project.image_variants || []}
                                            alt={project.title}
                                            sizes="(min-width: 1024px) 380px, (min-width: 640px) 45vw, 92vw"
                                        />
                                    </div>

                                    <div className="flex flex-1 flex-col p-6">
                                        <span className="jv-mono text-jv-accent">
                                            {project.category}
                                        </span>
                                        <h3 className="mt-3 text-lg font-semibold tracking-tight text-white">
                                            {project.title}
                                        </h3>

                                        {project.description ? (
                                            <p className="jv-body mt-3 line-clamp-3">
                                                {project.description}
                                            </p>
                                        ) : null}
                                    </div>
                                </Card>
                            </button>
                        </StaggerItem>
                    ))}
                </Stagger>
            </Section>

            {isOpen && active ? (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label={`${active.title}. Project ${openIndex + 1} of ${items.length}.`}
                    className="fixed inset-0 z-[100] flex flex-col bg-black/90 backdrop-blur-sm"
                >
                    {/* Clicking the backdrop closes, matching every other lightbox. */}
                    <button
                        type="button"
                        aria-label="Close project"
                        onClick={close}
                        className="absolute inset-0 h-full w-full cursor-default"
                        tabIndex={-1}
                    />

                    <div className="relative z-10 flex items-center justify-between gap-4 px-4 py-4 sm:px-8">
                        <span className="jv-mono text-white/50">
                            {openIndex + 1} / {items.length}
                        </span>

                        <div className="flex items-center gap-2">
                            {active.project_url ? (
                                <a
                                    href={active.project_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="jv-btn jv-btn--ghost jv-btn--sm"
                                >
                                    View project
                                    <ArrowUpRightIcon className="h-4 w-4" />
                                </a>
                            ) : null}
                            <button
                                ref={closeButtonRef}
                                type="button"
                                onClick={close}
                                aria-label="Close project"
                                className="jv-btn jv-btn--ghost jv-btn--sm"
                            >
                                <XMarkIcon className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    <div className="relative z-10 flex min-h-0 flex-1 items-center justify-center px-4 pb-4 sm:px-16">
                        {items.length > 1 ? (
                            <button
                                type="button"
                                onClick={() => step(-1)}
                                aria-label="Previous project"
                                className="absolute left-1 z-20 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white transition hover:bg-black/75 sm:left-4"
                            >
                                <ChevronLeftIcon className="h-5 w-5" />
                            </button>
                        ) : null}

                        <img
                            src={active.image}
                            alt={active.title}
                            className="max-h-full max-w-full rounded-jv object-contain shadow-2xl"
                        />

                        {items.length > 1 ? (
                            <button
                                type="button"
                                onClick={() => step(1)}
                                aria-label="Next project"
                                className="absolute right-1 z-20 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white transition hover:bg-black/75 sm:right-4"
                            >
                                <ChevronRightIcon className="h-5 w-5" />
                            </button>
                        ) : null}
                    </div>

                    <div className="relative z-10 mx-auto w-full max-w-3xl px-4 pb-8 text-center sm:px-8">
                        <p className="jv-mono text-jv-accent">{active.category}</p>
                        <p className="mt-2 text-lg font-semibold text-white">{active.title}</p>
                        {active.description ? (
                            <p className="jv-body mt-2">{active.description}</p>
                        ) : null}
                    </div>
                </div>
            ) : null}
        </>
    );
}
