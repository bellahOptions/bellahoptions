import { Head, Link } from "@inertiajs/react";
import { useMemo } from "react";
import PageTheme from "@/Layouts/PageTheme";
import { RevealSection, Stagger, StaggerItem } from "@/Components/MotionReveal";
import { ArrowLeftIcon, ArrowRightIcon, DocumentTextIcon } from "@heroicons/react/24/outline";

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

export default function BlogShow({ post, relatedPosts = [] }) {
    const rawBody = String(post?.body || "").trim();
    const hasHtmlBody = /<[^>]+>/.test(rawBody);

    const safeBodyHtml = useMemo(() => {
        if (!hasHtmlBody) {
            return "";
        }

        return sanitizeRichHtml(rawBody);
    }, [hasHtmlBody, rawBody]);

    const fallbackParagraphs = useMemo(() => {
        if (hasHtmlBody) {
            return [];
        }

        return rawBody.split(/\n{2,}/).map((paragraph) => paragraph.trim()).filter(Boolean);
    }, [hasHtmlBody, rawBody]);

    return (
        <>
            <Head title={post.title} />
            <PageTheme>
                <main className="bg-white text-gray-950">
                    <RevealSection className="bg-[#000285] py-16 text-white sm:py-20 lg:py-24">
                        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
                            <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-black text-cyan-200 hover:text-white">
                                <ArrowLeftIcon className="h-4 w-4" />
                                Back to Blog
                            </Link>
                            <p className="mt-8 text-sm font-black uppercase tracking-[0.22em] text-cyan-300">
                                {post.category}
                            </p>
                            <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                                {post.title}
                            </h1>
                            <p className="mt-6 max-w-3xl text-lg leading-8 text-blue-100">
                                {post.excerpt}
                            </p>
                            <p className="mt-6 text-sm font-bold text-blue-200">
                                {post.author_name} {post.published_at ? `· ${post.published_at}` : ""}
                            </p>
                        </div>
                    </RevealSection>

                    <RevealSection className="bg-gray-50 py-10 sm:py-12">
                        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
                            <div className="overflow-hidden rounded-2xl bg-blue-50 shadow-sm">
                                {post.cover_image ? (
                                    <img src={post.cover_image} alt={post.title} className="max-h-[520px] w-full object-cover" />
                                ) : (
                                    <div className="flex h-80 items-center justify-center text-[#000285]">
                                        <DocumentTextIcon className="h-24 w-24" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </RevealSection>

                    <RevealSection className="bg-white py-16 sm:py-20">
                        <article className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
                            {safeBodyHtml ? (
                                <div
                                    className="space-y-6 text-lg leading-8 text-gray-700 [&_a]:text-[#000285] [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-blue-200 [&_blockquote]:pl-4 [&_h2]:mt-8 [&_h2]:text-2xl [&_h2]:font-black [&_h3]:mt-7 [&_h3]:text-xl [&_h3]:font-black [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-6 [&_p]:mb-4 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6"
                                    dangerouslySetInnerHTML={{ __html: safeBodyHtml }}
                                />
                            ) : (
                                <div className="space-y-6 text-lg leading-8 text-gray-700">
                                    {fallbackParagraphs.map((paragraph, index) => (
                                        <p key={`${index}-${paragraph.slice(0, 40)}`}>{paragraph}</p>
                                    ))}
                                </div>
                            )}
                        </article>
                    </RevealSection>

                    {relatedPosts.length > 0 && (
                        <RevealSection className="bg-gray-50 py-16 sm:py-20 lg:py-24">
                            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                                    <div>
                                        <p className="text-sm font-black uppercase tracking-[0.22em] text-[#000285]">Keep Reading</p>
                                        <h2 className="mt-3 text-3xl font-black tracking-tight text-gray-950">Related articles</h2>
                                    </div>
                                    <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-black text-[#000285]">
                                        View all posts
                                        <ArrowRightIcon className="h-4 w-4" />
                                    </Link>
                                </div>

                                <Stagger className="mt-10 grid gap-6 lg:grid-cols-3">
                                    {relatedPosts.map((item) => (
                                        <StaggerItem as="article" key={item.id} className="bg-white p-6 shadow-sm ring-1 ring-gray-200">
                                            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#000285]">{item.category}</p>
                                            <h3 className="mt-4 text-xl font-black text-gray-950">{item.title}</h3>
                                            <p className="mt-3 text-sm leading-6 text-gray-600">{item.excerpt}</p>
                                            <Link href={item.url} className="mt-6 inline-flex items-center gap-2 text-sm font-black text-[#000285]">
                                                Read article
                                                <ArrowRightIcon className="h-4 w-4" />
                                            </Link>
                                        </StaggerItem>
                                    ))}
                                </Stagger>
                            </div>
                        </RevealSection>
                    )}
                </main>
            </PageTheme>
        </>
    );
}
