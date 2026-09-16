import { Head } from "@inertiajs/react";
import PageTheme from "@/Layouts/PageTheme";
import PublicPageHeader from "@/Components/PublicPageHeader";
import { Button, Card, Display, Eyebrow, Section, Stagger, StaggerItem } from "@/Components/PublicUI";
import { ArrowUpRightIcon, PhotoIcon } from "@heroicons/react/24/outline";

export default function Gallery({ projects = [] }) {
    const hasProjects = Array.isArray(projects) && projects.length > 0;

    return (
        <>
            <Head title="Gallery" />
            <PageTheme>
                <main className="text-white">
                    <PublicPageHeader
                        pageKey="gallery"
                        fallbackTitle="A look at visual systems, campaigns, and brand assets."
                        fallbackText="Every project shown here is published directly by the Bellah Options team."
                        eyebrow="Portfolio"
                    >
                        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
                            <Button
                                href="https://www.behance.net/bellahoptionsNG"
                                external
                                variant="primary"
                                icon
                            >
                                View Full Behance Portfolio
                            </Button>
                            <Button href="/web-design-samples" variant="ghost">
                                See Web Design Samples
                            </Button>
                        </div>
                    </PublicPageHeader>

                    <Section className="border-t border-jv-line">
                        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <Eyebrow>Selected work</Eyebrow>
                                <Display size="md" muted="published by our team." className="mt-6">
                                    Projects in the gallery
                                </Display>
                            </div>
                            <span className="jv-mono text-white/35">
                                {hasProjects ? `${projects.length} projects` : "No projects"}
                            </span>
                        </div>

                        {!hasProjects ? (
                            <Card className="mt-12 flex flex-col items-center gap-5 text-center">
                                <span className="flex h-12 w-12 items-center justify-center rounded-full border border-jv-line-strong bg-white/[0.06] text-jv-accent">
                                    <PhotoIcon className="h-6 w-6" />
                                </span>
                                <div>
                                    <Display size="sm">No gallery projects yet</Display>
                                    <p className="jv-lead mx-auto mt-4 max-w-xl">
                                        No gallery projects are published yet. New uploads will
                                        appear here once available.
                                    </p>
                                </div>
                                <Button href="/contact-us" variant="ghost" icon>
                                    Start a project
                                </Button>
                            </Card>
                        ) : (
                            <Stagger className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                {projects.map((project) => {
                                    const hasUrl =
                                        typeof project.project_url === "string" &&
                                        project.project_url.length > 0;

                                    const body = (
                                        <Card
                                            hover
                                            pad={false}
                                            className="jv-group flex h-full flex-col overflow-hidden"
                                        >
                                            <div className="jv-media jv-media--zoom aspect-[4/3] rounded-b-none border-0 border-b border-jv-line">
                                                {project.image ? (
                                                    <img src={project.image} alt={project.title} />
                                                ) : (
                                                    <div className="flex h-full w-full items-center justify-center text-white/30">
                                                        <PhotoIcon className="h-12 w-12" />
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex flex-1 flex-col p-6">
                                                <span className="jv-mono text-jv-accent">
                                                    {project.category}
                                                </span>
                                                <h2 className="mt-3 text-xl font-semibold tracking-tight text-white">
                                                    {project.title}
                                                </h2>
                                                <p className="jv-body mt-3 line-clamp-3">
                                                    {project.description}
                                                </p>

                                                {hasUrl ? (
                                                    <span className="mt-auto flex items-center justify-between border-t border-jv-line pt-5">
                                                        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-white/70">
                                                            View project
                                                        </span>
                                                        <span className="jv-btn-arrow h-8 w-8">
                                                            <ArrowUpRightIcon className="h-4 w-4" />
                                                        </span>
                                                    </span>
                                                ) : null}
                                            </div>
                                        </Card>
                                    );

                                    return (
                                        <StaggerItem
                                            as="article"
                                            key={project.id}
                                            className="h-full"
                                        >
                                            {hasUrl ? (
                                                <a
                                                    href={project.project_url}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="block h-full"
                                                >
                                                    {body}
                                                </a>
                                            ) : (
                                                body
                                            )}
                                        </StaggerItem>
                                    );
                                })}
                            </Stagger>
                        )}
                    </Section>
                </main>
            </PageTheme>
        </>
    );
}
