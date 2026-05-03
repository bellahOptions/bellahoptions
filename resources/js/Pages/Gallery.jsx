import { Head } from "@inertiajs/react";
import PageTheme from "@/Layouts/PageTheme";
import { RevealSection, Stagger, StaggerItem } from "@/Components/MotionReveal";

export default function Gallery({ projects = [] }) {
    return (
        <>
            <Head title="Gallery" />
            <PageTheme>
                <main className="bg-white text-gray-950">
                    <RevealSection className="bg-[#000285] py-20 text-white sm:py-24 lg:py-28">
                        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
                            <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                                A look at visual systems, campaigns, and brand assets.
                            </h1>
                            <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-blue-100">
                                When super-admin uploads are available, they appear here. Until then, this gallery uses selected public samples from the Bellah Options library.
                            </p>
                        </div>
                    </RevealSection>

                    <RevealSection className="bg-gray-50 py-16 sm:py-20 lg:py-24">
                        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                            <Stagger className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                                {projects.map((project) => (
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
                                                {project.source === "sample" && (
                                                    <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                                                        Sample
                                                    </span>
                                                )}
                                            </div>
                                            <h2 className="mt-3 text-2xl font-black text-gray-950">{project.title}</h2>
                                            <p className="mt-3 text-sm leading-6 text-gray-600">{project.description}</p>
                                        </div>
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
