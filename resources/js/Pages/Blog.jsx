import { Head, Link } from "@inertiajs/react";
import { motion } from "motion/react";
import PageTheme from "@/Layouts/PageTheme";
import PublicPageHeader from "@/Components/PublicPageHeader";
import { Button, Card, Display, Eyebrow, Section, Stagger, StaggerItem } from "@/Components/PublicUI";
import { ArrowRightIcon, DocumentTextIcon, SparklesIcon } from "@heroicons/react/24/outline";

export default function Blog({ posts = [] }) {
    const hasPosts = Array.isArray(posts) && posts.length > 0;

    return (
        <>
            <Head title="Blog" />
            <PageTheme>
                <main className="text-white">
                    <PublicPageHeader
                        pageKey="blog"
                        fallbackTitle="Ideas on branding, content, design, and digital growth."
                        fallbackText="Notes from Bellah Options for founders, creators, and growing teams building stronger digital presence."
                        eyebrow="Blog"
                    />

                    {hasPosts ? (
                        <Section className="border-t border-jv-line">
                            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                                <div>
                                    <Eyebrow>Latest writing</Eyebrow>
                                    <Display size="md" muted="from the studio." className="mt-6">
                                        Notes and ideas
                                    </Display>
                                </div>
                                <span className="jv-mono text-white/35">
                                    {posts.length} post{posts.length === 1 ? "" : "s"}
                                </span>
                            </div>

                            <Stagger className="mt-12 grid gap-6 lg:grid-cols-3">
                                {posts.map((post, index) => {
                                    const isLead = index === 0;

                                    return (
                                        <StaggerItem
                                            as="article"
                                            key={post.id}
                                            className={isLead ? "h-full lg:col-span-2" : "h-full"}
                                        >
                                            <Link
                                                href={post.url}
                                                className="jv-group block h-full"
                                            >
                                                <Card
                                                    hover
                                                    pad={false}
                                                    className={`h-full overflow-hidden ${
                                                        isLead
                                                            ? "grid lg:grid-cols-[1fr_0.9fr]"
                                                            : "flex flex-col"
                                                    }`}
                                                >
                                                    <div
                                                        className={`jv-media jv-media--zoom rounded-none border-0 ${
                                                            isLead
                                                                ? "min-h-72"
                                                                : "aspect-[4/3] rounded-t-jv border-b border-jv-line"
                                                        }`}
                                                    >
                                                        {post.cover_image ? (
                                                            <img
                                                                src={post.cover_image}
                                                                alt={post.title}
                                                            />
                                                        ) : (
                                                            <div className="flex h-full w-full items-center justify-center text-white/25">
                                                                <DocumentTextIcon className="h-16 w-16" />
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex flex-1 flex-col p-6 sm:p-7">
                                                        <span className="jv-mono text-jv-accent">
                                                            {post.category}
                                                        </span>
                                                        <h2
                                                            className={`mt-4 font-semibold tracking-tight text-white ${
                                                                isLead ? "text-2xl sm:text-3xl" : "text-xl"
                                                            }`}
                                                        >
                                                            {post.title}
                                                        </h2>
                                                        <p className="jv-body mt-3 line-clamp-3">
                                                            {post.excerpt}
                                                        </p>

                                                        <div className="mt-auto flex items-center justify-between gap-4 border-t border-jv-line pt-5">
                                                            <span className="jv-small">
                                                                {post.author_name}{" "}
                                                                {post.published_at
                                                                    ? `· ${post.published_at}`
                                                                    : ""}
                                                            </span>
                                                            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/70">
                                                                Read
                                                                <span className="jv-btn-arrow h-7 w-7">
                                                                    <ArrowRightIcon className="h-3.5 w-3.5" />
                                                                </span>
                                                            </span>
                                                        </div>
                                                    </div>
                                                </Card>
                                            </Link>
                                        </StaggerItem>
                                    );
                                })}
                            </Stagger>
                        </Section>
                    ) : (
                        <Section className="border-t border-jv-line">
                            <Card className="jv-grid-bg relative overflow-hidden px-6 py-14 text-center sm:px-12">
                                <div
                                    aria-hidden="true"
                                    className="pointer-events-none absolute -top-24 left-1/2 h-56 w-[min(620px,110%)] -translate-x-1/2 bg-[radial-gradient(closest-side,rgba(0,85,255,0.32),transparent_72%)]"
                                />
                                <div className="relative mx-auto flex max-w-2xl flex-col items-center">
                                    <motion.span
                                        className="flex h-20 w-20 items-center justify-center rounded-full border border-jv-line-strong bg-white/[0.06] text-jv-accent"
                                        animate={{ y: [0, -8, 0] }}
                                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                    >
                                        <SparklesIcon className="h-9 w-9" />
                                    </motion.span>

                                    <Display size="md" className="mt-8">
                                        No blog posts published yet.
                                    </Display>
                                    <p className="jv-lead mt-5">
                                        The first Bellah Options article is being shaped. When a
                                        post is published, it will appear here.
                                    </p>

                                    <div className="mt-8">
                                        <Button href="/contact-us" variant="primary" icon>
                                            Ask us a question
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        </Section>
                    )}
                </main>
            </PageTheme>
        </>
    );
}
