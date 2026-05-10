import { Head, Link } from "@inertiajs/react";
import PageTheme from "@/Layouts/PageTheme";
import PublicPageHeader from "@/Components/PublicPageHeader";
import { RevealSection } from "@/Components/MotionReveal";
import { CheckCircleIcon } from "@heroicons/react/24/outline";

const formatNaira = (amount) => new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
}).format(Number(amount || 0));

export default function ManageHires({ landing = {} }) {
    const highlights = Array.isArray(landing?.highlights) ? landing.highlights : [];

    return (
        <>
            <Head title="Manage Your Hires" />

            <PageTheme>
                <main className="bg-white text-gray-950">
                    <PublicPageHeader
                        pageKey="manage_hires"
                        eyebrow={landing?.badge || "Dedicated Design Retainer"}
                        fallbackTitle="Dedicated unlimited design support for growth-stage teams."
                        fallbackText="Scale brand and social design execution with one retained creative partner."
                    />

                    <RevealSection className="bg-gray-50 py-16 sm:py-20">
                        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[1fr_360px] lg:px-8">
                            <section className="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                                <h2 className="text-3xl font-black tracking-tight text-gray-950">{landing?.package_name || "Manage Your Hires"}</h2>
                                <p className="text-sm leading-7 text-gray-600">{landing?.tagline || "Unlimited design requests managed by a dedicated Bellah creative team."}</p>
                                <p className="text-sm leading-7 text-gray-600">{landing?.description || "This plan covers design services only and excludes UI/UX."}</p>

                                <div className="grid gap-3 sm:grid-cols-2">
                                    {highlights.map((item) => (
                                        <article key={item} className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                                            <div className="flex items-start gap-2">
                                                <CheckCircleIcon className="mt-0.5 h-5 w-5 text-[#000285]" />
                                                <p className="text-sm font-semibold text-gray-800">{item}</p>
                                            </div>
                                        </article>
                                    ))}
                                </div>

                                <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
                                    {landing?.exclusions_note || "UI/UX design is excluded from this package."}
                                </p>
                            </section>

                            <aside className="rounded-2xl bg-[#000285] p-6 text-white shadow-sm">
                                <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-200">Monthly Plan</p>
                                <p className="mt-3 text-4xl font-black">{formatNaira(landing?.monthly_price_ngn || 220000)}</p>
                                <p className="mt-2 text-sm text-blue-100">Starting price per month</p>

                                <div className="mt-6 space-y-3">
                                    <Link
                                        href={landing?.primary_cta_url || "/contact-us"}
                                        className="inline-flex w-full items-center justify-center rounded-md bg-white px-4 py-3 text-sm font-black text-[#000285] transition hover:bg-slate-100"
                                    >
                                        {landing?.primary_cta_label || "Start This Plan"}
                                    </Link>
                                    <Link
                                        href={landing?.secondary_cta_url || "/services"}
                                        className="inline-flex w-full items-center justify-center rounded-md border border-white/40 px-4 py-3 text-sm font-black text-white transition hover:bg-white/10"
                                    >
                                        {landing?.secondary_cta_label || "Discuss Scope"}
                                    </Link>
                                </div>
                            </aside>
                        </div>
                    </RevealSection>
                </main>
            </PageTheme>
        </>
    );
}
