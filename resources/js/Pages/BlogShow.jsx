import { Head, Link } from "@inertiajs/react";
import { useMemo } from "react";
import PageTheme from "@/Layouts/PageTheme";
import { Button, Card, Display, Eyebrow, Section, Stagger, StaggerItem } from "@/Components/PublicUI";
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

    const hasRelated = Array.isArray(relatedPosts) && relatedPosts.length > 0;

    return (
        <>
            <Head title={post.title} />
            <PageTheme>
                <main className="text-white">
                    <section className="jv-glow jv-grid-bg relative overflow-hidden pt-14 pb-12 sm:pt-16 sm:pb-14 lg:pt-20 lg:pb-16">
                        <div className="jv-container relative">
                            <Link
                                href="/blog"
                                className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/60 transition hover:text-white"
                            >
                                <ArrowLeftIcon className="h-4 w-4" />
                                Back to Blog
                            </Link>

                            <div className="mt-8 max-w-4xl">
                                <span className="jv-mono text-jv-accent">{post.category}</span>
                                <h1 className="jv-display jv-display--xl mt-6">{post.title}</h1>
                                {post.excerpt ? (
                                    <p className="jv-lead mt-6 max-w-3xl">{post.excerpt}</p>
                                ) : null}

                                <div className="mt-7 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-jv-line pt-6">
                                    <span className="text-sm font-semibold text-white/80">
                                        {post.author_name}
                                    </span>
                                    {post.published_at ? (
                                        <>
                                            <span className="text-white/20">•</span>
                                            <span className="jv-mono text-white/40">
                                                {post.published_at}
                                            </span>
                                        </>
                                    ) : null}
                                </div>
                            </div>
                        </div>
                    </section>

                    <Section tight className="pt-0">
                        <div className="jv-media jv-glow mx-auto max-w-5xl">
                            {post.cover_image ? (
                                <img
                                    src={post.cover_image}
                                    alt={post.title}
                                    className="max-h-[520px] w-full object-cover"
                                />
                            ) : (
                                <div className="flex h-72 items-center justify-center bg-white/[0.03] text-white/25 sm:h-80">
                                    <DocumentTextIcon className="h-20 w-20" />
                                </div>
                            )}
                        </div>
                    </Section>

                    <Section className="pt-0">
                        <article className="mx-auto max-w-3xl">
                            {safeBodyHtml ? (
                                <div
                                    className="jv-prose"
                                    dangerouslySetInnerHTML={{ __html: safeBodyHtml }}
                                />
                            ) : (
                                <div className="space-y-6 text-base leading-8 text-white/70 sm:text-lg">
                                    {fallbackParagraphs.map((paragraph, index) => (
                                        <p key={`${index}-${paragraph.slice(0, 40)}`}>
                                            {paragraph}
                                        </p>
                                    ))}
                                </div>
                            )}

                            <div className="mt-14 flex flex-col gap-5 border-t border-jv-line pt-8 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <p className="jv-mono text-white/40">Keep exploring</p>
                                    <p className="jv-body mt-2 max-w-md">
                                        Have a project that needs this kind of thinking?
                                        Let&apos;s talk about the brief.
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    <Button href="/contact-us" variant="primary" icon>
                                        Start a conversation
                                    </Button>
                                    <Button href="/blog" variant="ghost">
                                        All articles
                                    </Button>
                                </div>
                            </div>
                        </article>
                    </Section>

                    {hasRelated && (
                        <Section className="border-t border-jv-line">
                            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                                <div>
                                    <Eyebrow>Keep reading</Eyebrow>
                                    <Display size="md" className="mt-6">
                                        Related articles
                                    </Display>
                                </div>
                                <Button href="/blog" variant="ghost" icon>
                                    View all posts
                                </Button>
                            </div>

                            <Stagger className="mt-12 grid gap-6 lg:grid-cols-3">
                                {relatedPosts.map((item) => (
                                    <StaggerItem as="article" key={item.id} className="h-full">
                                        <Link href={item.url} className="jv-group block h-full">
                                            <Card hover className="flex h-full flex-col">
                                                <span className="jv-mono text-jv-accent">
                                                    {item.category}
                                                </span>
                                                <h3 className="mt-4 text-xl font-semibold tracking-tight text-white">
                                                    {item.title}
                                                </h3>
                                                <p className="jv-body mt-3 line-clamp-3">
                                                    {item.excerpt}
                                                </p>
                                                <span className="mt-auto flex items-center justify-between border-t border-jv-line pt-5">
                                                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-white/70">
                                                        Read article
                                                    </span>
                                                    <span className="jv-btn-arrow h-7 w-7">
                                                        <ArrowRightIcon className="h-3.5 w-3.5" />
                                                    </span>
                                                </span>
                                            </Card>
                                        </Link>
                                    </StaggerItem>
                                ))}
                            </Stagger>
                        </Section>
                    )}
                </main>
            </PageTheme>
        </>
    );
}
