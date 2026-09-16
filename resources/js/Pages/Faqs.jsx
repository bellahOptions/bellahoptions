import { useState } from "react";
import { Head } from "@inertiajs/react";
import PageTheme from "@/Layouts/PageTheme";
import PublicPageHeader from "@/Components/PublicPageHeader";
import { Button, Card, Display, Eyebrow, Section, Stagger, StaggerItem } from "@/Components/PublicUI";
import { MinusSmallIcon, PlusSmallIcon } from "@heroicons/react/24/outline";

function FaqRow({ item, defaultOpen = false }) {
    const [open, setOpen] = useState(defaultOpen);
    const panelId = `faq-panel-${item.id}`;

    return (
        <div
            className={`jv-card overflow-hidden transition-colors ${
                open ? "border-jv-line-strong bg-white/[0.07]" : "hover:border-jv-line-strong"
            }`}
        >
            <button
                type="button"
                onClick={() => setOpen((value) => !value)}
                aria-expanded={open}
                aria-controls={panelId}
                className="flex w-full items-start justify-between gap-5 px-5 py-5 text-left sm:px-6"
            >
                <span className="text-base font-semibold leading-6 tracking-tight text-white sm:text-lg">
                    {item.question}
                </span>
                <span
                    className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition ${
                        open
                            ? "border-transparent bg-jv-accent text-white"
                            : "border-jv-line-strong bg-white/[0.06] text-white/70"
                    }`}
                >
                    {open ? (
                        <MinusSmallIcon className="h-4 w-4" />
                    ) : (
                        <PlusSmallIcon className="h-4 w-4" />
                    )}
                </span>
            </button>

            <div id={panelId} hidden={!open} className="px-5 pb-6 sm:px-6">
                <div className="jv-divider mb-5" />
                <p className="whitespace-pre-line text-sm leading-7 text-white/70">
                    {item.answer}
                </p>
            </div>
        </div>
    );
}

export default function Faqs({ faqs = [] }) {
    const groupedFaqs = (Array.isArray(faqs) ? faqs : []).reduce((groups, item) => {
        const key = item.category || "General";
        if (!groups[key]) {
            groups[key] = [];
        }
        groups[key].push(item);
        return groups;
    }, {});

    const categories = Object.entries(groupedFaqs);

    return (
        <>
            <Head title="Frequently Asked Questions" />

            <PageTheme>
                <main className="text-white">
                    <PublicPageHeader
                        pageKey="faqs"
                        fallbackTitle="Frequently Asked Questions"
                        fallbackText="Clear answers to common questions about Bellah Options services, process, timelines, and delivery."
                        eyebrow="Support"
                    />

                    <Section className="border-t border-jv-line">
                        {categories.length === 0 ? (
                            <Card className="mx-auto max-w-3xl text-center">
                                <Eyebrow>Nothing published yet</Eyebrow>
                                <p className="jv-lead mt-5">
                                    No FAQs published yet. Please check back shortly.
                                </p>
                            </Card>
                        ) : (
                            <div className="space-y-14">
                                {categories.map(([category, items], categoryIndex) => (
                                    <div
                                        key={category}
                                        className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:gap-14"
                                    >
                                        <div className="lg:sticky lg:top-28 lg:self-start">
                                            <span className="jv-mono text-white/35">
                                                {String(categoryIndex + 1).padStart(2, "0")}
                                            </span>
                                            <Display size="sm" className="mt-4">
                                                {category}
                                            </Display>
                                            <p className="jv-small mt-4">
                                                {items.length} question
                                                {items.length === 1 ? "" : "s"}
                                            </p>
                                        </div>

                                        <Stagger className="space-y-3">
                                            {items.map((item, index) => (
                                                <StaggerItem key={item.id}>
                                                    <FaqRow
                                                        item={item}
                                                        defaultOpen={categoryIndex === 0 && index === 0}
                                                    />
                                                </StaggerItem>
                                            ))}
                                        </Stagger>
                                    </div>
                                ))}

                                <Card className="flex flex-col items-center gap-5 text-center sm:flex-row sm:justify-between sm:text-left">
                                    <div>
                                        <Display size="sm">Still have a question?</Display>
                                        <p className="jv-body mt-3 max-w-xl">
                                            Send the details and we will point you to the right
                                            service, package, or next step.
                                        </p>
                                    </div>
                                    <Button href="/contact-us" variant="primary" icon>
                                        Talk to us
                                    </Button>
                                </Card>
                            </div>
                        )}
                    </Section>
                </main>
            </PageTheme>
        </>
    );
}
