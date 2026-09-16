import { Head } from "@inertiajs/react";
import PageTheme from "@/Layouts/PageTheme";
import PublicPageHeader from "@/Components/PublicPageHeader";
import { Button, Card, Display, Eyebrow, Section, Stagger, StaggerItem } from "@/Components/PublicUI";
import { ArrowUpRightIcon } from "@heroicons/react/24/outline";

const webProjects = [
    {
        id: "printbuka",
        name: "Printbuka",
        url: "https://printbuka.com.ng/",
        category: "Printing Services Website",
        description: "Website sample for an online print and branding business.",
    },
    {
        id: "reup",
        name: "Reup",
        url: "https://reup.com.ng/",
        category: "Business Website",
        description: "Web sample focused on digital-first brand presentation.",
    },
    {
        id: "titans-resources",
        name: "Titans Resources",
        url: "https://titansresources.com/",
        category: "Corporate Website",
        description: "Professional website sample tailored for company positioning.",
    },
];

export default function WebDesignSamples() {
    return (
        <>
            <Head title="Web Design Samples" />
            <PageTheme>
                <main className="text-white">
                    <PublicPageHeader
                        pageKey="web_design_samples"
                        fallbackTitle="Web Design Samples"
                        fallbackText="A focused set of live web experiences from Bellah Options projects."
                        eyebrow="Web design"
                    />

                    <Section className="border-t border-jv-line">
                        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <Eyebrow>Live builds</Eyebrow>
                                <Display size="md" muted="shipped for real businesses." className="mt-6">
                                    Selected websites
                                </Display>
                            </div>
                            <Button href="/gallery" variant="ghost" icon>
                                Back to gallery
                            </Button>
                        </div>

                        <Stagger className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                            {webProjects.map((project) => (
                                <StaggerItem as="article" key={project.id} className="h-full">
                                    <Card hover className="flex h-full flex-col justify-between">
                                        <div>
                                            <span className="jv-mono text-jv-accent">{project.category}</span>
                                            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-white">
                                                {project.name}
                                            </h2>
                                            <p className="jv-body mt-3">{project.description}</p>
                                        </div>

                                        <a
                                            href={project.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="jv-group mt-8 flex items-center justify-between border-t border-jv-line pt-5"
                                        >
                                            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-white/70">
                                                Visit website
                                            </span>
                                            <span className="jv-btn-arrow h-8 w-8">
                                                <ArrowUpRightIcon className="h-4 w-4" />
                                            </span>
                                        </a>
                                    </Card>
                                </StaggerItem>
                            ))}
                        </Stagger>
                    </Section>
                </main>
            </PageTheme>
        </>
    );
}
