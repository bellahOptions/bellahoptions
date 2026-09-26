import { Head, Link, usePage } from "@inertiajs/react";
import { useEffect, useMemo, useState } from "react";
import PageTheme from "@/Layouts/PageTheme";
import {
    Button,
    Card,
    Display,
    Eyebrow,
    Section,
} from "@/Components/PublicUI";
import {
    ArrowUpIcon,
    BookOpenIcon,
    CheckBadgeIcon,
    ClipboardDocumentListIcon,
    ClockIcon,
    EnvelopeIcon,
    LifebuoyIcon,
    ListBulletIcon,
} from "@heroicons/react/24/outline";

/**
 * Legal policy page: Terms of Service, Privacy Policy and Cookie Policy.
 *
 * Rendered through Inertia so it shares the site's dark theme, navigation and
 * footer with every other public page. It previously used a separate light
 * Blade layout, which is why these three pages looked like a different site.
 *
 * A policy is long by nature, so the page is built around reading: a sticky
 * table of contents on wide screens, a reading-progress rail, and section
 * anchors that are linkable and survive a reload.
 */
export default function Policy({ policy = {}, sections = [], metaItems = [], updatedAt = null }) {
    const { contact = {} } = usePage().props;

    const [activeId, setActiveId] = useState(sections[0]?.id ?? "");
    const [progress, setProgress] = useState(0);

    const title = String(policy.title || "Policy");
    const badge = String(policy.badge || "Legal");
    const heroDescription = String(policy.heroDescription || "");
    const notice = String(policy.notice || "");

    const wordCount = useMemo(
        () =>
            sections.reduce((total, section) => {
                const body = (section.body || []).join(" ");
                const bullets = (section.bullets || []).join(" ");

                return total + `${body} ${bullets}`.split(/\s+/).filter(Boolean).length;
            }, 0),
        [sections],
    );

    const readingMinutes = Math.max(1, Math.round(wordCount / 220));

    // Reading progress: how far through the document the viewport has travelled.
    useEffect(() => {
        const onScroll = () => {
            const doc = document.documentElement;
            const scrollable = doc.scrollHeight - doc.clientHeight;

            setProgress(scrollable <= 0 ? 0 : Math.min(100, Math.max(0, (doc.scrollTop / scrollable) * 100)));
        };

        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });

        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    // Highlight the section currently in view. Uses a top-weighted root margin
    // so the "current" heading is the one just below the header, not whichever
    // happens to be crossing the viewport centre.
    useEffect(() => {
        if (typeof IntersectionObserver === "undefined" || sections.length === 0) {
            return undefined;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries
                    .filter((entry) => entry.isIntersecting)
                    .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

                if (visible.length > 0) {
                    setActiveId(visible[0].target.id);
                }
            },
            { rootMargin: "-120px 0px -70% 0px", threshold: 0 },
        );

        sections.forEach((section) => {
            const element = document.getElementById(section.id);

            if (element) {
                observer.observe(element);
            }
        });

        return () => observer.disconnect();
    }, [sections]);

    return (
        <>
            <Head title={`${title} | Bellah Options`} />

            <PageTheme>
                <main className="text-white">
                    {/* ── Reading progress ── */}
                    <div
                        aria-hidden="true"
                        className="fixed inset-x-0 top-0 z-[70] h-0.5 bg-transparent"
                    >
                        <div
                            className="h-full bg-jv-accent transition-[width] duration-150 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>

                    {/* ── HERO ── */}
                    <section className="jv-glow relative overflow-hidden pt-16 pb-12 sm:pt-20 lg:pt-24">
                        <div className="jv-container relative">
                            <nav aria-label="Breadcrumb" className="jv-mono text-white/40">
                                <Link href="/" className="transition-colors hover:text-white">
                                    Home
                                </Link>
                                <span className="mx-2">/</span>
                                <span className="text-white/70">{title}</span>
                            </nav>

                            <div className="mt-10 grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
                                <div>
                                    <Eyebrow>{badge}</Eyebrow>
                                    <h1 className="jv-display jv-display--xl mt-6">{title}</h1>
                                    <p className="jv-lead mt-6 max-w-2xl">{heroDescription}</p>

                                    <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-xs text-white/50">
                                        <span className="inline-flex items-center gap-2">
                                            <ClockIcon className="h-4 w-4 text-jv-accent" />
                                            {readingMinutes} min read
                                        </span>
                                        <span className="inline-flex items-center gap-2">
                                            <ListBulletIcon className="h-4 w-4 text-jv-accent" />
                                            {sections.length} sections
                                        </span>
                                        {updatedAt ? (
                                            <span className="inline-flex items-center gap-2">
                                                <ClipboardDocumentListIcon className="h-4 w-4 text-jv-accent" />
                                                Updated {updatedAt}
                                            </span>
                                        ) : null}
                                    </div>
                                </div>

                                {metaItems.length > 0 ? (
                                    <Card className="h-fit p-6">
                                        <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-white/45">
                                            <BookOpenIcon className="h-4 w-4 text-jv-accent" />
                                            At a glance
                                        </p>
                                        <dl className="mt-4 space-y-3">
                                            {metaItems.map((item) => (
                                                <div key={item.label}>
                                                    <dt className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/40">
                                                        {item.label}
                                                    </dt>
                                                    <dd className="mt-0.5 text-sm text-white/80">{item.value}</dd>
                                                </div>
                                            ))}
                                        </dl>
                                    </Card>
                                ) : null}
                            </div>
                        </div>
                    </section>

                    {/* ── NOTICE ── */}
                    {notice ? (
                        <Section tight>
                            <div className="rounded-jv border border-jv-accent-line bg-jv-accent/10 p-5 sm:p-6">
                                <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-jv-accent">
                                    <CheckBadgeIcon className="h-4 w-4" />
                                    Please read
                                </p>
                                <p className="mt-3 text-sm leading-7 text-white/80">{notice}</p>
                            </div>
                        </Section>
                    ) : null}

                    {/* ── BODY ── */}
                    <Section className="border-t border-jv-line">
                        <div className="grid gap-12 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-16">
                            {/* Contents */}
                            <aside className="lg:sticky lg:top-28 lg:self-start">
                                <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-white/45">
                                    <ListBulletIcon className="h-4 w-4 text-jv-accent" />
                                    Contents
                                </p>

                                <nav className="mt-4 max-h-[60vh] overflow-y-auto pr-1" aria-label="Section contents">
                                    <ol className="space-y-0.5">
                                        {sections.map((section) => {
                                            const isActive = activeId === section.id;

                                            return (
                                                <li key={section.id}>
                                                    <a
                                                        href={`#${section.id}`}
                                                        aria-current={isActive ? "location" : undefined}
                                                        className={`block rounded-jv-sm px-3 py-2 text-sm leading-5 transition-colors ${
                                                            isActive
                                                                ? "bg-jv-accent/15 font-semibold text-white"
                                                                : "text-white/55 hover:bg-white/[0.05] hover:text-white/85"
                                                        }`}
                                                    >
                                                        {section.title}
                                                    </a>
                                                </li>
                                            );
                                        })}
                                    </ol>
                                </nav>

                                <div className="mt-6 space-y-3 border-t border-jv-line pt-6">
                                    <Button href="/contact-us" variant="ghost" className="w-full justify-center">
                                        <LifebuoyIcon className="h-4 w-4" />
                                        Ask a question
                                    </Button>
                                    <p className="flex items-center gap-2 text-xs text-white/40">
                                        <EnvelopeIcon className="h-3.5 w-3.5" />
                                        {contact?.email || "hello@bellahoptions.com"}
                                    </p>
                                </div>
                            </aside>

                            {/* Sections */}
                            <div className="min-w-0">
                                {sections.length === 0 ? (
                                    <Card className="p-8 text-center">
                                        <p className="text-sm text-white/55">
                                            This policy is being prepared. Please contact us if you need
                                            these terms in the meantime.
                                        </p>
                                    </Card>
                                ) : (
                                    <div className="space-y-10">
                                        {sections.map((section, index) => (
                                            <article
                                                key={section.id}
                                                id={section.id}
                                                className="scroll-mt-32 border-b border-jv-line pb-10 last:border-0 last:pb-0"
                                            >
                                                <div className="flex items-start gap-4">
                                                    <span className="jv-mono pt-1 text-white/25">
                                                        {String(index + 1).padStart(2, "0")}
                                                    </span>
                                                    <div className="min-w-0 flex-1">
                                                        <h2 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
                                                            {section.title}
                                                        </h2>

                                                        {(section.body || []).map((paragraph, paragraphIndex) => (
                                                            <p
                                                                key={`${section.id}-p-${paragraphIndex}`}
                                                                className="mt-4 text-sm leading-7 text-white/70"
                                                            >
                                                                {paragraph}
                                                            </p>
                                                        ))}

                                                        {(section.bullets || []).length > 0 ? (
                                                            <ul className="mt-5 space-y-2.5">
                                                                {section.bullets.map((bullet, bulletIndex) => (
                                                                    <li
                                                                        key={`${section.id}-b-${bulletIndex}`}
                                                                        className="flex items-start gap-3 text-sm leading-7 text-white/70"
                                                                    >
                                                                        <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-jv-accent" />
                                                                        <span>{bullet}</span>
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        ) : null}
                                                    </div>
                                                </div>
                                            </article>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </Section>

                    {/* ── CLOSING CTA ── */}
                    <Section className="jv-section--tight">
                        <div className="jv-card jv-grid-bg relative overflow-hidden p-8 text-center sm:p-14">
                            <div
                                aria-hidden="true"
                                className="pointer-events-none absolute -top-32 left-1/2 h-72 w-[min(760px,110%)] -translate-x-1/2 bg-[radial-gradient(closest-side,rgba(0,85,255,0.4),transparent_72%)]"
                            />
                            <div className="relative mx-auto flex max-w-2xl flex-col items-center">
                                <Eyebrow>Next step</Eyebrow>
                                <Display size="lg" className="mt-6">
                                    Questions about this {badge.toLowerCase()}?
                                </Display>
                                <p className="jv-lead mx-auto mt-6">
                                    We are happy to clarify how these terms apply to your project before
                                    you commit to anything.
                                </p>
                                <div className="mt-9 flex flex-wrap justify-center gap-3">
                                    <Button href="/contact-us" variant="primary" size="lg" icon>
                                        Contact Bellah Options
                                    </Button>
                                    <Button href="/services" variant="ghost" size="lg">
                                        Browse services
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </Section>

                    {/* Back to top */}
                    <div className="jv-container pb-12 text-center">
                        <a
                            href="#top"
                            onClick={(event) => {
                                event.preventDefault();
                                window.scrollTo({ top: 0, behavior: "smooth" });
                            }}
                            className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/45 transition-colors hover:text-white"
                        >
                            <ArrowUpIcon className="h-3.5 w-3.5" />
                            Back to top
                        </a>
                    </div>
                </main>
            </PageTheme>
        </>
    );
}
