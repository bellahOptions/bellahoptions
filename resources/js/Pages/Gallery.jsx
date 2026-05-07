import { Head, Link } from "@inertiajs/react";
import PageTheme from "@/Layouts/PageTheme";
import { RevealSection, Stagger, StaggerItem } from "@/Components/MotionReveal";
import PublicPageHeader from "@/Components/PublicPageHeader";

export default function Gallery({ projects = [] }) {
    const hasProjects = Array.isArray(projects) && projects.length > 0;

    return (
        <>
            <Head title="Gallery" />
            <PageTheme>
                <main className="bg-white text-gray-950">
                    <PublicPageHeader
                        pageKey="gallery"
                        fallbackTitle="A look at visual systems, campaigns, and brand assets."
                        fallbackText="Every project shown here is published directly by the Bellah Options team."
                    >
                        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                            <a
                                href="https://www.behance.net/bellahoptionsNG"
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center justify-center rounded-lg bg-white px-5 py-3 text-sm font-black text-[#000285] transition hover:bg-blue-50"
                            >
                                View Full Behance Portfolio
                            </a>
                            <Link
                                href="/web-design-samples"
                                className="inline-flex items-center justify-center rounded-lg border border-blue-200 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-900/25"
                            >
                                See Web Design Samples
                            </Link>
                        </div>
                    </PublicPageHeader>

                    <RevealSection className="bg-gray-50 py-16 sm:py-20 lg:py-24">
                        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                            <Stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                                {!hasProjects && (
                                    <article className="col-span-full border border-blue-100 bg-blue-50 p-6 text-sm font-semibold leading-7 text-blue-900">
                                        No gallery projects are published yet. New uploads will appear here once available.
                                    </article>
                                )}
                                {projects.map((project) => {
                                    const hasUrl = typeof project.project_url === "string" && project.project_url.length > 0;

                                    return (
                                    <StaggerItem
                                        as="article"
                                        key={project.id}
                                        className="group overflow-hidden bg-white shadow-sm ring-1 ring-gray-200"
                                    >
                                        <div className="aspect-[4/3] overflow-hidden bg-blue-50">
                                            <img
                                                src={project.image}
                                                alt={project.title}
                                                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                                            />
                                        </div>
                                        <div className="p-6">
                                            <div className="flex items-center justify-between gap-3">
                                                <p className="text-xs font-black uppercase tracking-[0.18em] text-[#000285]">
                                                    {project.category}
                                                </p>
                                            </div>
                                            <h2 className="mt-3 text-2xl font-black text-gray-950">{project.title}</h2>
                                            <p className="mt-3 text-sm leading-6 text-gray-600">{project.description}</p>
                                            {hasUrl && (
                                                <a
                                                    href={project.project_url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="mt-5 inline-flex rounded-lg border border-blue-200 px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#000285] transition hover:bg-blue-50"
                                                >
                                                    View Project
                                                </a>
                                            )}
                                        </div>
                                    </StaggerItem>
                                    );
                                })}
                            </Stagger>
                        </div>
                    </RevealSection>
                </main>
            </PageTheme>
        </>
    );
}
