import { Head, Link } from "@inertiajs/react";
import PageTheme from "@/Layouts/PageTheme";
import { RevealSection, Stagger, StaggerItem } from "@/Components/MotionReveal";
import PublicPageHeader from "@/Components/PublicPageHeader";
import {
    ArrowRightIcon,
    CheckCircleIcon,
    CodeBracketIcon,
    PaintBrushIcon,
    RectangleGroupIcon,
    SparklesIcon,
} from "@heroicons/react/24/outline";

const iconMap = {
    "brand-design": SparklesIcon,
    "graphic-design": PaintBrushIcon,
    "social-media-design": PaintBrushIcon,
    "web-design": CodeBracketIcon,
    "mobile-app-development": CodeBracketIcon,
    "ui-ux": RectangleGroupIcon,
};

const formatMoney = (amount) => new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
}).format(Number(amount || 0));

export default function Services({ services = [] }) {
    return (
        <>
            <Head title="Services" />
            <PageTheme>
                <main className="bg-white text-gray-950">
                    <PublicPageHeader
                        pageKey="services"
                        fallbackTitle="Creative services built for launch, growth, and consistency."
                        fallbackText="Choose the service lane that matches your next move. Every package is structured to make the brief clearer and the output easier to use."
                    />

                    <RevealSection className="bg-gray-50 py-16 sm:py-20 lg:py-24">
                        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                            <Stagger className="grid gap-6 lg:grid-cols-2">
                                {services.map((service) => {
                                    const Icon = iconMap[service.slug] || SparklesIcon;

                                    return (
                                        <StaggerItem
                                            as="article"
                                            key={service.slug}
                                            className="bg-white p-6 shadow-sm ring-1 ring-gray-200"
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-blue-50 text-[#000285]">
                                                    <Icon className="h-7 w-7" />
                                                </div>
                                                <div>
                                                    <h2 className="text-2xl font-black text-gray-950">{service.name}</h2>
                                                    <p className="mt-2 text-sm leading-6 text-gray-600">{service.description}</p>
                                                </div>
                                            </div>

                                            <div className="mt-6 grid gap-3 sm:grid-cols-3">
                                                {(service.packages || []).map((plan) => (
                                                    <div key={plan.code} className="border border-gray-100 bg-gray-50 p-4">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <p className="font-black text-gray-950">{plan.name}</p>
                                                            {plan.is_recommended && (
                                                                <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-indigo-700">
                                                                    Recommended
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="mt-2">
                                                            {plan.discount_price && Number(plan.original_price || 0) > Number(plan.discount_price || 0) ? (
                                                                <div className="flex items-center gap-2">
                                                                    <p className="text-sm font-bold text-[#000285]">{formatMoney(plan.discount_price)}</p>
                                                                    <p className="text-xs font-semibold text-gray-500 line-through">{formatMoney(plan.original_price)}</p>
                                                                </div>
                                                            ) : (
                                                                <p className="text-sm font-bold text-[#000285]">{formatMoney(plan.price)}</p>
                                                            )}
                                                        </div>
                                                        <p className="mt-2 text-xs leading-5 text-gray-500">{plan.description}</p>
                                                        {Array.isArray(plan.features) && plan.features.length > 0 && (
                                                            <ul className="mt-2 space-y-1">
                                                                {plan.features.slice(0, 4).map((feature) => (
                                                                    <li key={`${plan.code}-${feature}`} className="text-[11px] text-gray-600">
                                                                        - {feature}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        )}
                                                        {plan.sample_image && (
                                                            <img
                                                                src={String(plan.sample_image).startsWith('/') || /^https?:\/\//i.test(String(plan.sample_image))
                                                                    ? String(plan.sample_image)
                                                                    : `/${String(plan.sample_image)}`}
                                                                alt={plan.name}
                                                                className="mt-3 h-16 w-full rounded object-cover"
                                                            />
                                                        )}
                                                    </div>
                                                ))}
                                            </div>

                                            <Link
                                                href={`/order/${service.slug}`}
                                                className="group mt-6 inline-flex items-center gap-2 rounded-md bg-[#000285] px-5 py-3 text-sm font-black text-white transition hover:bg-blue-800"
                                            >
                                                Start {service.name}
                                                <ArrowRightIcon className="h-4 w-4 transition group-hover:translate-x-1" />
                                            </Link>
                                        </StaggerItem>
                                    );
                                })}
                            </Stagger>
                        </div>
                    </RevealSection>

                    <RevealSection className="bg-white py-16 sm:py-20">
                        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
                            <h2 className="text-3xl font-black tracking-tight text-gray-950 sm:text-4xl">
                                Not sure what package fits?
                            </h2>
                            <p className="mx-auto mt-4 max-w-2xl text-gray-600">
                                Send the project context and we will help you choose the right scope.
                            </p>
                            <Link href="/contact-us" className="mt-7 inline-flex items-center gap-2 rounded-md border border-gray-300 px-6 py-3 text-sm font-black text-gray-900 transition hover:border-[#000285] hover:text-[#000285]">
                                Talk to us
                                <CheckCircleIcon className="h-5 w-5" />
                            </Link>
                        </div>
                    </RevealSection>
                </main>
            </PageTheme>
        </>
    );
}
