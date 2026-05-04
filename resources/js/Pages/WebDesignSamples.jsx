import { Head } from "@inertiajs/react";
import PageTheme from "@/Layouts/PageTheme";
import { RevealSection, Stagger, StaggerItem } from "@/Components/MotionReveal";

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
                <main className="bg-white text-gray-950">
                    <RevealSection className="bg-[#000285] py-20 text-white sm:py-24 lg:py-28">
                        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
                            <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                                Web Design Samples
                            </h1>
                            <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-blue-100">
                                A focused set of live web experiences from Bellah Options projects.
                            </p>
                        </div>
                    </RevealSection>

                    <RevealSection className="bg-gray-50 py-16 sm:py-20 lg:py-24">
                        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                            <Stagger className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                                {webProjects.map((project) => (
                                    <StaggerItem
                                        as="article"
                                        key={project.id}
                                        className="group flex h-full flex-col justify-between bg-white p-6 shadow-sm ring-1 ring-gray-200 transition hover:shadow-lg"
                                    >
                                        <div>
                                            <p className="text-xs font-black uppercase tracking-[0.18em] text-[#000285]">
                                                {project.category}
                                            </p>
                                            <h2 className="mt-3 text-2xl font-black text-gray-950">{project.name}</h2>
                                            <p className="mt-3 text-sm leading-6 text-gray-600">{project.description}</p>
                                        </div>
                                        <a
                                            href={project.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="mt-6 inline-flex rounded-lg border border-blue-200 px-3 py-2 text-xs font-black uppercase tracking-[0.12em] text-[#000285] transition hover:bg-blue-50"
                                        >
                                            Visit Website
                                        </a>
                                    </StaggerItem>
                                ))}
                            </Stagger>
                        </div>
                    </RevealSection>
                </main>
            </PageTheme>
        </>
    );
}
