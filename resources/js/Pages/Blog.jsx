import { Head, Link } from "@inertiajs/react";
import { motion } from "motion/react";
import PageTheme from "@/Layouts/PageTheme";
import { RevealSection, Stagger, StaggerItem } from "@/Components/MotionReveal";
import PublicPageHeader from "@/Components/PublicPageHeader";
import { ArrowRightIcon, DocumentTextIcon, SparklesIcon } from "@heroicons/react/24/outline";

export default function Blog({ posts = [] }) {
    const hasPosts = Array.isArray(posts) && posts.length > 0;

    return (
        <>
            <Head title="Blog" />
            <PageTheme>
                <main className="bg-white text-gray-950">
                    <PublicPageHeader
                        pageKey="blog"
                        fallbackTitle="Ideas on branding, content, design, and digital growth."
                        fallbackText="Notes from Bellah Options for founders, creators, and growing teams building stronger digital presence."
                        eyebrow="Blog"
                    />

                    {hasPosts ? (
                        <RevealSection className="bg-gray-50 py-16 sm:py-20 lg:py-24">
                            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                                <Stagger className="grid gap-6 lg:grid-cols-3">
                                    {posts.map((post, index) => (
                                        <StaggerItem
                                            as="article"
                                            key={post.id}
                                            className={index === 0 ? "overflow-hidden bg-white shadow-sm ring-1 ring-gray-200 lg:col-span-2" : "overflow-hidden bg-white shadow-sm ring-1 ring-gray-200"}
                                        >
                                            <Link href={post.url} className={index === 0 ? "grid h-full lg:grid-cols-[1fr_0.9fr]" : "block h-full"}>
                                                <div className={index === 0 ? "min-h-72 bg-blue-50" : "aspect-[4/3] bg-blue-50"}>
                                                    {post.cover_image ? (
                                                        <img
                                                            src={post.cover_image}
                                                            alt={post.title}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="flex h-full w-full items-center justify-center bg-blue-50 text-[#000285]">
                                                            <DocumentTextIcon className="h-20 w-20" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex flex-col p-6">
                                                    <p className="text-xs font-black uppercase tracking-[0.18em] text-[#000285]">
                                                        {post.category}
                                                    </p>
                                                    <h2 className="mt-4 text-2xl font-black text-gray-950">
                                                        {post.title}
                                                    </h2>
                                                    <p className="mt-3 text-sm leading-6 text-gray-600">
                                                        {post.excerpt}
                                                    </p>
                                                    <div className="mt-6 flex items-center justify-between gap-4 border-t border-gray-100 pt-5 text-sm">
                                                        <span className="font-bold text-gray-500">
                                                            {post.author_name} {post.published_at ? `· ${post.published_at}` : ""}
                                                        </span>
                                                        <span className="inline-flex items-center gap-2 font-black text-[#000285]">
                                                            Read
                                                            <ArrowRightIcon className="h-4 w-4" />
                                                        </span>
                                                    </div>
                                                </div>
                                            </Link>
                                        </StaggerItem>
                                    ))}
                                </Stagger>
                            </div>
                        </RevealSection>
                    ) : (
                        <RevealSection className="bg-gray-50 py-20 sm:py-24 lg:py-28">
                            <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
                                <motion.div
                                    className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-blue-100 text-[#000285]"
                                    animate={{ y: [0, -10, 0], rotate: [0, 5, -5, 0] }}
                                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                >
                                    <SparklesIcon className="h-14 w-14" />
                                </motion.div>
                                <h2 className="mt-8 text-3xl font-black tracking-tight text-gray-950 sm:text-4xl">
                                    No blog posts published yet.
                                </h2>
                                <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-gray-600">
                                    The first Bellah Options article is being shaped. When a post is published, it will appear here.
                                </p>
                                <Link href="/contact-us" className="mt-8 inline-flex items-center gap-2 rounded-md bg-[#000285] px-6 py-3 text-sm font-black text-white">
                                    Ask us a question
                                    <ArrowRightIcon className="h-4 w-4" />
                                </Link>
                            </div>
                        </RevealSection>
                    )}
                </main>
            </PageTheme>
        </>
    );
}
