import { Head, Link } from "@inertiajs/react";
import { useMemo } from "react";
import PageTheme from "@/Layouts/PageTheme";
import { RevealSection } from "@/Components/MotionReveal";
import { termsSections } from "./policyData";

function sanitizeRichHtml(html) {
    if (typeof window === "undefined" || typeof window.DOMParser === "undefined") {
        return "";
    }

    const doc = new window.DOMParser().parseFromString(String(html || ""), "text/html");

    doc.querySelectorAll("script,style,iframe,object,embed,form,input,button,textarea").forEach((node) => {
        node.remove();
    });

    doc.querySelectorAll("*").forEach((node) => {
        Array.from(node.attributes).forEach((attribute) => {
            const name = attribute.name.toLowerCase();
            const value = String(attribute.value || "").trim().toLowerCase();

            if (name.startsWith("on")) {
                node.removeAttribute(attribute.name);
                return;
            }

            if ((name === "href" || name === "src") && value.startsWith("javascript:")) {
                node.removeAttribute(attribute.name);
            }
        });

        if (node.tagName.toLowerCase() === "a") {
            node.setAttribute("rel", "noopener noreferrer");
        }
    });

    return doc.body.innerHTML;
}

export default function Terms({ term = null }) {
    const rawTermContent = String(term?.content || "").trim();
    const hasHtml = /<[^>]+>/.test(rawTermContent);

    const safeHtml = useMemo(() => {
        if (!hasHtml) {
            return "";
        }

        return sanitizeRichHtml(rawTermContent);
    }, [hasHtml, rawTermContent]);

    const plainParagraphs = useMemo(() => {
        if (hasHtml) {
            return [];
        }

        return rawTermContent.split(/\n{2,}/).map((paragraph) => paragraph.trim()).filter(Boolean);
    }, [hasHtml, rawTermContent]);

    const hasStoredContent = safeHtml.length > 0 || plainParagraphs.length > 0;

    return (
        <>
            <Head title="Terms of Service" />

            <PageTheme>
                <main className="bg-white text-gray-950">
                    <RevealSection className="bg-[#000285] py-16 text-white sm:py-20 lg:py-24">
                        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
                            <p className="text-sm font-black uppercase tracking-[0.22em] text-cyan-300">Legal</p>
                            <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">Terms of Service</h1>
                            <p className="mt-5 max-w-3xl text-base leading-8 text-blue-100 sm:text-lg">
                                Simple, clear terms for Bellah Options services.
                            </p>
                        </div>
                    </RevealSection>

                    <RevealSection className="bg-gray-50 py-12 sm:py-16 lg:py-20">
                        <article className="mx-auto max-w-4xl space-y-6 px-4 sm:px-6 lg:px-8">
                            {hasStoredContent ? (
                                safeHtml ? (
                                    <div
                                        className="rounded-lg border border-gray-200 bg-white p-6 text-sm leading-8 text-gray-700 shadow-sm sm:p-8 [&_a]:text-[#000285] [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-blue-200 [&_blockquote]:pl-4 [&_h1]:text-3xl [&_h1]:font-black [&_h2]:mt-7 [&_h2]:text-2xl [&_h2]:font-black [&_h3]:mt-6 [&_h3]:text-xl [&_h3]:font-black [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-6 [&_p]:mb-4 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6"
                                        dangerouslySetInnerHTML={{ __html: safeHtml }}
                                    />
                                ) : (
                                    <div className="rounded-lg border border-gray-200 bg-white p-6 text-sm leading-8 text-gray-700 shadow-sm sm:p-8">
                                        {plainParagraphs.map((paragraph, index) => (
                                            <p key={`${index}-${paragraph.slice(0, 40)}`} className="mb-4 last:mb-0">
                                                {paragraph}
                                            </p>
                                        ))}
                                    </div>
                                )
                            ) : (
                                <div className="space-y-5">
                                    {termsSections.map((section) => (
                                        <section key={section.id} className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
                                            <h2 className="text-xl font-black text-gray-950">{section.title}</h2>
                                            <div className="mt-4 space-y-3">
                                                {(section.body || []).map((paragraph) => (
                                                    <p key={paragraph} className="text-sm leading-8 text-gray-700">{paragraph}</p>
                                                ))}
                                            </div>
                                            {(section.bullets || []).length > 0 && (
                                                <ul className="mt-4 list-disc space-y-2 pl-6 text-sm leading-8 text-gray-700">
                                                    {section.bullets.map((bullet) => (
                                                        <li key={bullet}>{bullet}</li>
                                                    ))}
                                                </ul>
                                            )}
                                        </section>
                                    ))}
                                </div>
                            )}

                            <div className="rounded-lg bg-[#000285] px-6 py-5 text-white">
                                <p className="text-sm leading-7 text-blue-100">
                                    Questions about these terms? Reach out to us and we will walk you through them.
                                </p>
                                <Link href="/contact-us" className="mt-3 inline-block text-sm font-black text-cyan-300 underline">
                                    Contact Bellah Options
                                </Link>
                            </div>
                        </article>
                    </RevealSection>
                </main>
            </PageTheme>
        </>
    );
}
