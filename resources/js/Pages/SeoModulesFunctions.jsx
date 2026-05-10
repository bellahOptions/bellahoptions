import { Head, Link } from "@inertiajs/react";
import PageTheme from "@/Layouts/PageTheme";
import PublicPageHeader from "@/Components/PublicPageHeader";
import { RevealSection, Stagger, StaggerItem } from "@/Components/MotionReveal";
import { ArrowRightIcon, CheckCircleIcon } from "@heroicons/react/24/outline";

export default function SeoModulesFunctions({ modules = [], functions = [] }) {
    return (
        <>
            <Head title="SEO Modules and Functions" />

            <PageTheme>
                <main className="bg-white text-gray-950">
                    <PublicPageHeader
                        pageKey="seo_modules_functions"
                        fallbackTitle="SEO modules and functions built for measurable visibility."
                        fallbackText="This page outlines the SEO scope we use to help websites improve crawl quality, relevance, and conversion-oriented search performance."
                    />

                    <RevealSection className="bg-gray-50 py-16 sm:py-20 lg:py-24">
                        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                            <h2 className="text-3xl font-black tracking-tight text-gray-950 sm:text-4xl">
                                SEO Modules
                            </h2>
                            <p className="mt-3 max-w-3xl text-sm leading-7 text-gray-600">
                                Each module focuses on a core search performance layer and can be deployed independently or as one complete SEO system.
                            </p>

                            <Stagger className="mt-8 grid gap-5 md:grid-cols-2">
                                {modules.map((module) => (
                                    <StaggerItem key={module.title} as="article" className="bg-white p-6 shadow-sm ring-1 ring-gray-200">
                                        <h3 className="text-xl font-black text-gray-950">{module.title}</h3>
                                        <p className="mt-3 text-sm leading-7 text-gray-600">{module.description}</p>
                                    </StaggerItem>
                                ))}
                            </Stagger>
                        </div>
                    </RevealSection>

                    <RevealSection className="bg-white py-16 sm:py-20 lg:py-24">
                        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                            <h2 className="text-3xl font-black tracking-tight text-gray-950 sm:text-4xl">
                                SEO Functions
                            </h2>
                            <p className="mt-3 max-w-3xl text-sm leading-7 text-gray-600">
                                These functions translate strategy into repeatable implementation, reporting, and continuous optimization.
                            </p>

                            <Stagger className="mt-8 grid gap-5 md:grid-cols-2">
                                {functions.map((item) => (
                                    <StaggerItem key={item.title} as="article" className="bg-gray-50 p-6 shadow-sm ring-1 ring-gray-200">
                                        <h3 className="text-xl font-black text-gray-950">{item.title}</h3>
                                        <p className="mt-3 text-sm leading-7 text-gray-600">{item.description}</p>
                                    </StaggerItem>
                                ))}
                            </Stagger>
                        </div>
                    </RevealSection>

                    <RevealSection className="bg-[#000285] py-14 sm:py-16">
                        <div className="mx-auto flex max-w-5xl flex-col items-start gap-5 px-4 text-white sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
                            <div>
                                <h2 className="text-2xl font-black sm:text-3xl">Need this SEO scope for your project?</h2>
                                <p className="mt-2 max-w-2xl text-sm leading-7 text-blue-100">
                                    Share your website goals and we can map the right modules and implementation priority.
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-3">
                                <Link
                                    href="/contact-us"
                                    className="inline-flex items-center gap-2 rounded-md bg-white px-5 py-3 text-sm font-black text-[#000285] transition hover:bg-blue-50"
                                >
                                    Talk to us
                                    <ArrowRightIcon className="h-4 w-4" />
                                </Link>
                                <Link
                                    href="/services"
                                    className="inline-flex items-center gap-2 rounded-md border border-blue-300 px-5 py-3 text-sm font-black text-white transition hover:bg-blue-800"
                                >
                                    View services
                                    <CheckCircleIcon className="h-4 w-4" />
                                </Link>
                            </div>
                        </div>
                    </RevealSection>
                </main>
            </PageTheme>
        </>
    );
}
