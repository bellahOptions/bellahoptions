import { Head } from "@inertiajs/react";
import PageTheme from "@/Layouts/PageTheme";
import PublicPageHeader from "@/Components/PublicPageHeader";
import {
    Button,
    Card,
    CheckItem,
    Display,
    Eyebrow,
    Section,
    Stagger,
    StaggerItem,
} from "@/Components/PublicUI";
import { CheckCircleIcon } from "@heroicons/react/24/outline";

export default function SeoModulesFunctions({ modules = [], functions = [] }) {
    return (
        <>
            <Head title="SEO Modules and Functions" />

            <PageTheme>
                <main className="text-white">
                    <PublicPageHeader
                        pageKey="seo_modules_functions"
                        fallbackTitle="SEO modules and functions built for measurable visibility."
                        fallbackText="This page outlines the SEO scope we use to help websites improve crawl quality, relevance, and conversion-oriented search performance."
                        eyebrow="SEO"
                    />

                    <Section className="border-t border-jv-line">
                        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
                            <div>
                                <Eyebrow>Foundations</Eyebrow>
                                <Display size="lg" muted="that compound over time." className="mt-6">
                                    SEO Modules
                                </Display>
                            </div>
                            <p className="jv-lead lg:justify-self-end">
                                Each module focuses on a core search performance layer and can
                                be deployed independently or as one complete SEO system.
                            </p>
                        </div>

                        <Stagger className="mt-14 grid gap-5 md:grid-cols-2">
                            {modules.map((module, index) => (
                                <StaggerItem key={module.title} as="article" className="h-full">
                                    <Card hover className="flex h-full flex-col">
                                        <span className="jv-mono text-white/35">
                                            {String(index + 1).padStart(2, "0")}
                                        </span>
                                        <h3 className="mt-4 text-xl font-semibold tracking-tight text-white">
                                            {module.title}
                                        </h3>
                                        <p className="jv-body mt-3">{module.description}</p>
                                    </Card>
                                </StaggerItem>
                            ))}
                        </Stagger>
                    </Section>

                    <Section className="border-y border-jv-line jv-glow overflow-hidden">
                        <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
                            <div>
                                <Eyebrow>Execution</Eyebrow>
                                <Display size="lg" muted="into repeatable work." className="mt-6">
                                    SEO Functions
                                </Display>
                            </div>
                            <p className="jv-lead">
                                These functions translate strategy into repeatable
                                implementation, reporting, and continuous optimization.
                            </p>
                        </div>

                        <Stagger className="mt-14 grid gap-5 md:grid-cols-2">
                            {functions.map((item) => (
                                <StaggerItem key={item.title} as="article" className="h-full">
                                    <Card hover className="flex h-full flex-col">
                                        <span className="inline-flex h-11 w-11 items-center justify-center rounded-jv-sm border border-jv-line-strong bg-white/[0.06] text-jv-accent">
                                            <CheckCircleIcon className="h-5 w-5" />
                                        </span>
                                        <h3 className="mt-6 text-xl font-semibold tracking-tight text-white">
                                            {item.title}
                                        </h3>
                                        <p className="jv-body mt-3">{item.description}</p>
                                    </Card>
                                </StaggerItem>
                            ))}
                        </Stagger>
                    </Section>

                    <Section tight>
                        <div className="jv-card jv-grid-bg relative overflow-hidden p-8 sm:p-12 lg:p-16">
                            <div
                                aria-hidden="true"
                                className="pointer-events-none absolute -top-28 left-1/2 h-64 w-[min(680px,110%)] -translate-x-1/2 bg-[radial-gradient(closest-side,rgba(0,85,255,0.38),transparent_72%)]"
                            />
                            <div className="relative grid gap-8 lg:grid-cols-[1.1fr_auto] lg:items-center">
                                <div>
                                    <Eyebrow>Next step</Eyebrow>
                                    <Display size="md" className="mt-6">
                                        Need this SEO scope for your project?
                                    </Display>
                                    <p className="jv-lead mt-5 max-w-2xl">
                                        Share your website goals and we can map the right
                                        modules and implementation priority.
                                    </p>

                                    <ul className="mt-7 grid gap-3 sm:grid-cols-2">
                                        <CheckItem>Technical crawl and index review</CheckItem>
                                        <CheckItem>Content and keyword mapping</CheckItem>
                                        <CheckItem>Reporting tied to real outcomes</CheckItem>
                                        <CheckItem>Ongoing optimization cycles</CheckItem>
                                    </ul>
                                </div>

                                <div className="flex flex-wrap gap-3 lg:flex-col">
                                    <Button href="/contact-us" variant="primary" size="lg" icon>
                                        Talk to us
                                    </Button>
                                    <Button href="/services" variant="ghost" size="lg">
                                        View services
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </Section>
                </main>
            </PageTheme>
        </>
    );
}
