import { Head, Link } from "@inertiajs/react";
import { useMemo, useState } from "react";
import PageTheme from "@/Layouts/PageTheme";
import { RevealSection } from "@/Components/MotionReveal";
import { ArrowRightIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";

export default function PolicyLayout({
    title,
    eyebrow,
    description,
    sections = [],
    meta = [],
    notice = "",
    ctaHref = "/contact-us",
    ctaLabel = "Contact Bellah Options",
}) {
    const [query, setQuery] = useState("");
    const normalizedQuery = query.trim().toLowerCase();

    const filteredSections = useMemo(() => {
        if (!normalizedQuery) {
            return sections;
        }

        return sections.filter((section) => {
            const body = (section.body || []).join(" ").toLowerCase();
            const bullets = (section.bullets || []).join(" ").toLowerCase();
            const heading = String(section.title || "").toLowerCase();

            return [heading, body, bullets].some((value) => value.includes(normalizedQuery));
        });
    }, [normalizedQuery, sections]);

    const hasSections = sections.length > 0;

    return (
        <>
            <Head title={title} />

            <PageTheme>
                <main className="bg-white text-gray-950">
                    <RevealSection className="bg-[#000285] py-16 text-white sm:py-20 lg:py-24">
                        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                            <div className="max-w-4xl">
                                <p className="text-sm font-black uppercase tracking-[0.22em] text-cyan-300">
                                    {eyebrow}
                                </p>
                                <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                                    {title}
                                </h1>
                                <p className="mt-5 max-w-3xl text-base leading-8 text-blue-100 sm:text-lg">
                                    {description}
                                </p>
                            </div>
                        </div>
                    </RevealSection>

                    <RevealSection className="bg-gray-50 py-12 sm:py-16 lg:py-20">
                        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                            {meta.length > 0 && (
                                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                                    {meta.map((item) => (
                                        <div key={item.label} className="border border-gray-200 bg-white p-5 shadow-sm">
                                            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#000285]">
                                                {item.label}
                                            </p>
                                            <p className="mt-2 text-sm leading-7 text-gray-700">
                                                {item.value}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {notice && (
                                <div className="mt-6 border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-7 text-amber-900">
                                    {notice}
                                </div>
                            )}

                            <div className="mt-8 grid gap-8 lg:grid-cols-[300px_1fr]">
                                <aside className="lg:sticky lg:top-24 lg:self-start">
                                    <div className="border border-gray-200 bg-white p-6 shadow-sm">
                                        <p className="text-sm font-black uppercase tracking-[0.18em] text-[#000285]">
                                            Quick Navigation
                                        </p>
                                        <div className="relative mt-5">
                                            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                            <input
                                                type="search"
                                                value={query}
                                                onChange={(event) => setQuery(event.target.value)}
                                                placeholder="Search this page"
                                                className="w-full border border-gray-300 py-3 pl-10 pr-4 text-sm text-gray-950 outline-none transition focus:border-[#000285]"
                                            />
                                        </div>
                                        <div className="mt-5 space-y-2">
                                            {filteredSections.map((section, index) => (
                                                <a
                                                    key={section.id}
                                                    href={`#${section.id}`}
                                                    className="block border border-transparent px-3 py-2 text-sm font-bold text-gray-600 transition hover:border-blue-100 hover:bg-blue-50 hover:text-[#000285]"
                                                >
                                                    {index + 1}. {section.title}
                                                </a>
                                            ))}
                                        </div>
                                        {filteredSections.length === 0 && (
                                            <p className="mt-4 text-sm leading-6 text-gray-500">
                                                No section matches your search.
                                            </p>
                                        )}
                                    </div>
                                </aside>

                                <div className="space-y-6">
                                    {!hasSections && (
                                        <section className="border border-red-200 bg-red-50 p-6 text-sm leading-7 text-red-700 shadow-sm">
                                            This page content is temporarily unavailable. Please contact Bellah Options for a copy while we restore it.
                                        </section>
                                    )}

                                    {filteredSections.map((section, index) => (
                                        <section
                                            key={section.id}
                                            id={section.id}
                                            className="border border-gray-200 bg-white p-6 shadow-sm sm:p-8"
                                        >
                                            <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-600">
                                                Section {index + 1}
                                            </p>
                                            <h2 className="mt-3 text-2xl font-black tracking-tight text-gray-950 sm:text-3xl">
                                                {section.title}
                                            </h2>
                                            <div className="mt-5 space-y-4">
                                                {(section.body || []).map((paragraph) => (
                                                    <p key={paragraph} className="text-sm leading-8 text-gray-600 sm:text-base">
                                                        {paragraph}
                                                    </p>
                                                ))}
                                            </div>
                                            {(section.bullets || []).length > 0 && (
                                                <ul className="mt-5 space-y-3 border-t border-gray-100 pt-5">
                                                    {section.bullets.map((bullet) => (
                                                        <li key={bullet} className="flex items-start gap-3 text-sm leading-7 text-gray-600 sm:text-base">
                                                            <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#000285]" />
                                                            <span>{bullet}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </section>
                                    ))}

                                    <section className="bg-[#000285] p-6 text-white sm:p-8">
                                        <p className="text-sm font-black uppercase tracking-[0.18em] text-cyan-300">
                                            Need Clarification?
                                        </p>
                                        <h2 className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">
                                            Reach out before you proceed.
                                        </h2>
                                        <p className="mt-4 max-w-2xl text-sm leading-7 text-blue-100 sm:text-base">
                                            If you have questions about these legal terms or how they apply to your project, our team can walk you through them before work begins.
                                        </p>
                                        <Link
                                            href={ctaHref}
                                            className="mt-6 inline-flex items-center gap-2 bg-white px-5 py-3 text-sm font-black text-[#000285] transition hover:bg-cyan-50"
                                        >
                                            {ctaLabel}
                                            <ArrowRightIcon className="h-4 w-4" />
                                        </Link>
                                    </section>
                                </div>
                            </div>
                        </div>
                    </RevealSection>
                </main>
            </PageTheme>
        </>
    );
}
