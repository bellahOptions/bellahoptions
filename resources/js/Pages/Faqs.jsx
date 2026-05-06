import { Head } from "@inertiajs/react";
import PageTheme from "@/Layouts/PageTheme";
import { RevealSection } from "@/Components/MotionReveal";
import PublicPageHeader from "@/Components/PublicPageHeader";

export default function Faqs({ faqs = [] }) {
    const groupedFaqs = faqs.reduce((groups, item) => {
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
                <main className="bg-white text-gray-950">
                    <PublicPageHeader
                        pageKey="faqs"
                        fallbackTitle="Frequently Asked Questions"
                        fallbackText="Clear answers to common questions about Bellah Options services, process, timelines, and delivery."
                        className="py-16 text-white sm:py-20 lg:py-24"
                    />

                    <RevealSection className="bg-gray-50 py-16 sm:py-20 lg:py-24">
                        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
                            {categories.length === 0 ? (
                                <div className="rounded-lg border border-blue-100 bg-white p-8 text-center text-sm font-semibold text-gray-600">
                                    No FAQs published yet. Please check back shortly.
                                </div>
                            ) : (
                                <div className="space-y-8">
                                    {categories.map(([category, items]) => (
                                        <section key={category} className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
                                            <h2 className="text-2xl font-black text-gray-950">{category}</h2>
                                            <div className="mt-5 space-y-3">
                                                {items.map((item) => (
                                                    <details key={item.id} className="group rounded-md border border-gray-200 bg-gray-50 p-4 open:bg-white">
                                                        <summary className="cursor-pointer list-none text-sm font-black text-[#000285]">
                                                            {item.question}
                                                        </summary>
                                                        <p className="mt-3 whitespace-pre-line text-sm leading-7 text-gray-700">
                                                            {item.answer}
                                                        </p>
                                                    </details>
                                                ))}
                                            </div>
                                        </section>
                                    ))}
                                </div>
                            )}
                        </div>
                    </RevealSection>
                </main>
            </PageTheme>
        </>
    );
}
