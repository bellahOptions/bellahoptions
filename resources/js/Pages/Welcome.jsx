import { Head, Link } from "@inertiajs/react";
import Slider from "@/Components/Slider";
import PageTheme from "@/Layouts/PageTheme";
import { RevealSection, Stagger, StaggerItem } from "@/Components/MotionReveal";
import {
    ArrowRightIcon,
    BoltIcon,
    CheckBadgeIcon,
    CheckCircleIcon,
    ClipboardDocumentCheckIcon,
    CodeBracketIcon,
    DevicePhoneMobileIcon,
    LightBulbIcon,
    MegaphoneIcon,
    PaintBrushIcon,
    PresentationChartLineIcon,
    RectangleGroupIcon,
    RocketLaunchIcon,
    SparklesIcon,
    SwatchIcon,
    UserGroupIcon,
} from "@heroicons/react/24/outline";

const brandLogos = [
    {
        name: "Wingram",
        src: "https://bellahoptions.com/images/Wingram-07.svg",
    },
    {
        name: "BOSS",
        src: "https://bellahoptions.com/images/BOSS-logo-02.svg",
    },
    {
        name: "Reup",
        src: "https://bellahoptions.com/images/reup-05.svg",
    },
];

const services = [
    {
        title: "Brand Design",
        description:
            "Logos, identity systems, brand guides, and launch assets that make your business easier to recognize and trust.",
        href: "/order/brand-design",
        icon: CheckBadgeIcon,
        accent: "bg-blue-600",
        tint: "bg-blue-50 text-blue-700 ring-blue-100",
    },
    {
        title: "Graphic Design",
        description:
            "Social media creatives, campaign visuals, flyers, and print-ready designs for everyday business growth.",
        href: "/order/graphic-design",
        icon: PaintBrushIcon,
        accent: "bg-blue-500",
        tint: "bg-blue-50 text-blue-700 ring-blue-100",
    },
    {
        title: "Web Design",
        description:
            "Responsive websites and landing pages shaped around clear messaging, strong visuals, and simple conversion paths.",
        href: "/order/web-design",
        icon: CodeBracketIcon,
        accent: "bg-blue-500",
        tint: "bg-blue-50 text-blue-700 ring-blue-100",
    },
    {
        title: "UI/UX Design",
        description:
            "Product flows, wireframes, and interface design that help your users move with less friction and more confidence.",
        href: "/order/ui-ux",
        icon: RectangleGroupIcon,
        accent: "bg-blue-500",
        tint: "bg-blue-50 text-blue-700 ring-blue-100",
    },
];

const strengths = [
    {
        title: "Purposeful visuals",
        text: "Every layout, color, and asset is tied to what your audience needs to understand and do next.",
        icon: SwatchIcon,
    },
    {
        title: "Business-first thinking",
        text: "We design for the realities of launches, campaigns, payments, sales pages, and content calendars.",
        icon: PresentationChartLineIcon,
    },
    {
        title: "Built for consistency",
        text: "Your brand should feel recognizable across social media, web pages, pitch decks, and printed touchpoints.",
        icon: SparklesIcon,
    },
];

const processSteps = [
    {
        step: "01",
        title: "Discover",
        text: "We clarify your audience, goals, offer, timeline, and the problem the design needs to solve.",
        icon: LightBulbIcon,
    },
    {
        step: "02",
        title: "Design",
        text: "We translate the strategy into polished visuals, interfaces, and assets with room for focused feedback.",
        icon: ClipboardDocumentCheckIcon,
    },
    {
        step: "03",
        title: "Deliver",
        text: "You receive organized files, launch-ready pages, and the guidance needed to use the work confidently.",
        icon: RocketLaunchIcon,
    },
];

const outcomes = [
    "Brand systems",
    "Campaign creatives",
    "Responsive websites",
    "Product interfaces",
    "Launch assets",
    "Social media visuals",
];

const formatMoney = (amount, currency = "NGN") => {
    const value = Number(amount || 0);

    if (!Number.isFinite(value)) {
        return "₦0";
    }

    return new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
    }).format(value);
};

const cycleLabel = (cycle) => {
    const labels = {
        monthly: "month",
        quarterly: "quarter",
        biannually: "6 months",
        yearly: "year",
    };

    return labels[cycle] || cycle || "package";
};

export default function Welcome({ slideShows = [], featuredPlans = [] }) {
    const scrollingLogos = [...brandLogos, ...brandLogos, ...brandLogos];
    const hasFeaturedPlans = Array.isArray(featuredPlans) && featuredPlans.length > 0;

    return (
        <>
            <Head title="Welcome to #yourBestOPtion" />

            <PageTheme>
                <div className="bg-white text-gray-950">
                    <Slider slides={slideShows} />

                    <RevealSection className="border-y border-gray-100 bg-white py-10 sm:py-12 my-10">
                        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                            <div className="grid gap-6 lg:grid-cols-[220px_1fr] lg:items-center text-center">
                                <div>
                                    <p className="text-sm font-black uppercase tracking-[0.22em] text-[#000285]">
                                        Trusted By
                                    </p>
                                    <p className="mt-2 max-w-sm text-sm leading-6 text-gray-500">
                                        Growing brands, teams, and founders building stronger digital presence.
                                    </p>
                                </div>
                                <div className="overflow-hidden">
                                    <div className="flex w-max items-center gap-10 animate-scroll sm:gap-14 lg:gap-20">
                                        {scrollingLogos.map((logo, index) => (
                                            <img
                                                key={`${logo.name}-${index}`}
                                                src={logo.src}
                                                className="h-8 w-auto shrink-0 opacity-55 grayscale transition hover:opacity-100 hover:grayscale-0 sm:h-10 lg:h-12"
                                                alt={logo.name}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </RevealSection>

                    <RevealSection className="bg-gray-50 py-16 sm:py-20 lg:py-24">
                        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:px-8">
                            <div className=" text-center">
                                <h1 className="mt-6 text-4xl font-black leading-[1.05] tracking-tight text-gray-950 sm:text-5xl lg:text-6xl">
                                    We are <span className="text-[#000285]">#yourBestOption</span>
                                </h1>
                                <p className="mt-6 text-base leading-8 text-gray-600 sm:text-lg">
                                    Bellah Options transforms ideas into meaningful visual experiences. We help businesses build clarity, confidence, and consistency through purposeful brand design, graphic design, web design, and smart digital solutions.
                                </p>
                                <div className="mt-8 flex flex-col gap-3 sm:flex-row justify-center">
                                    <Link
                                        href="/about-bellah-options"
                                        className="group inline-flex items-center justify-center gap-3 rounded-md bg-[#000285] px-6 py-3 text-sm font-black text-white shadow-lg shadow-blue-900/20 transition hover:-translate-y-0.5 hover:bg-blue-800"
                                    >
                                        Learn More About Us
                                        <ArrowRightIcon className="h-4 w-4 transition group-hover:translate-x-1" />
                                    </Link>
                                    <Link
                                        href="/order/brand-design"
                                        className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-6 py-3 text-sm font-black text-gray-900 transition hover:border-[#000285] hover:text-[#000285]"
                                    >
                                        Start a Project
                                    </Link>
                                </div>
                            </div>

                            <Stagger className="grid gap-4 sm:grid-cols-2">
                                <StaggerItem className="border-l-4 border-[#000285] bg-white p-6 shadow-sm">
                                    <SwatchIcon className="mb-6 h-9 w-9 text-[#000285]" />
                                    <h2 className="text-xl font-black text-gray-950">Design With Purpose</h2>
                                    <p className="mt-3 text-sm leading-6 text-gray-600">
                                        Whether you are launching a new brand or refreshing an existing one, we design with precision and practical business context.
                                    </p>
                                </StaggerItem>
                                <StaggerItem className="bg-[#000285] p-6 text-white shadow-sm sm:translate-y-8">
                                    <p className="text-5xl font-black">4</p>
                                    <h2 className="mt-5 text-xl font-black">Core service lanes</h2>
                                    <p className="mt-3 text-sm leading-6 text-blue-100">
                                        Branding, visuals, websites, and interfaces connected into one clear creative direction.
                                    </p>
                                </StaggerItem>
                                <StaggerItem className="bg-purple-50 p-6 shadow-sm sm:-translate-y-4">
                                    <BoltIcon className="mb-6 h-9 w-9 text-blue-700" />
                                    <h2 className="text-xl font-black text-gray-950">Built to move</h2>
                                    <p className="mt-3 text-sm leading-6 text-gray-600">
                                        We create assets that help you launch, sell, communicate, and show up consistently.
                                    </p>
                                </StaggerItem>
                                <StaggerItem className="border border-gray-200 bg-white p-6 shadow-sm">
                                    <p className="text-sm font-black uppercase tracking-widest text-gray-500">Built For</p>
                                    <div className="mt-5 flex flex-wrap gap-2">
                                        {["Startups", "SMEs", "Creators", "Founders"].map((item) => (
                                            <span
                                                key={item}
                                                className="rounded-full bg-gray-100 px-3 py-1 text-sm font-bold text-gray-700"
                                            > 
                                                {item}
                                            </span>
                                        ))}
                                    </div>
                                </StaggerItem>
                            </Stagger>
                        </div>
                    </RevealSection>

                    {hasFeaturedPlans && (
                        <RevealSection className="bg-white py-16 sm:py-20 lg:py-24">
                            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                                <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
                                    <div>
                                        <p className="text-sm font-black uppercase tracking-[0.22em] text-[#000285]">
                                            Featured Plans
                                        </p>
                                        <h2 className="mt-4 max-w-xl text-3xl font-black tracking-tight text-gray-950 sm:text-4xl lg:text-5xl">
                                            Service plans worth putting in front of your next move.
                                        </h2>
                                    </div>
                                    <p className="max-w-2xl text-base leading-8 text-gray-600 lg:justify-self-end">
                                        These packages are selected by the Bellah Options team and can include active discounts, recommendations, and homepage feature status from the super-admin pricing panel.
                                    </p>
                                </div>

                                <Stagger className="mt-10 grid gap-5 lg:grid-cols-3">
                                    {featuredPlans.map((plan) => (
                                        <StaggerItem
                                            as="article"
                                            key={plan.id}
                                            className={`flex flex-col justify-between border bg-white p-6 shadow-sm ${
                                                plan.is_homepage_featured
                                                    ? "border-[#000285] shadow-blue-900/10"
                                                    : "border-gray-200"
                                            }`}
                                        >
                                            <div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    {plan.is_homepage_featured && (
                                                        <span className="rounded-full bg-[#000285] px-3 py-1 text-xs font-black uppercase tracking-wide text-white">
                                                            Featured
                                                        </span>
                                                    )}
                                                    {plan.is_recommended && (
                                                        <span className="rounded-full bg-cyan-100 px-3 py-1 text-xs font-black uppercase tracking-wide text-cyan-800">
                                                            Recommended
                                                        </span>
                                                    )}
                                                    {plan.has_discount && (
                                                        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-black uppercase tracking-wide text-blue-800">
                                                            {plan.discount_summary}
                                                        </span>
                                                    )}
                                                </div>

                                                <p className="mt-6 text-sm font-black uppercase tracking-widest text-gray-500">
                                                    {plan.service_name}
                                                </p>
                                                <h3 className="mt-2 text-2xl font-black text-gray-950">
                                                    {plan.name}
                                                </h3>
                                                <p className="mt-3 text-sm leading-6 text-gray-600">
                                                    {plan.short_description}
                                                </p>

                                                <div className="mt-6 flex items-end gap-2">
                                                    <p className="text-4xl font-black text-gray-950">
                                                        {formatMoney(plan.final_price, plan.currency)}
                                                    </p>
                                                    <p className="pb-1 text-sm font-bold text-gray-500">
                                                        / {cycleLabel(plan.billing_cycle)}
                                                    </p>
                                                </div>

                                                {plan.has_discount && (
                                                    <p className="mt-2 text-sm text-gray-500">
                                                        Was <span className="line-through">{formatMoney(plan.base_price, plan.currency)}</span>
                                                        {plan.discount_code ? ` with ${plan.discount_code}` : ""}
                                                    </p>
                                                )}

                                                <div className="mt-6 space-y-3 border-t border-gray-100 pt-5">
                                                    {[plan.package_name, "Fast checkout", "Guided project intake"].map((item) => (
                                                        <div key={item} className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                                                            <CheckCircleIcon className="h-5 w-5 text-[#000285]" />
                                                            {item}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <Link
                                                href={plan.checkout_url}
                                                className="group mt-8 inline-flex items-center justify-center gap-3 rounded-md bg-[#000285] px-5 py-3 text-sm font-black text-white transition hover:bg-blue-800"
                                            >
                                                Choose Plan
                                                <ArrowRightIcon className="h-4 w-4 transition group-hover:translate-x-1" />
                                            </Link>
                                        </StaggerItem>
                                    ))}
                                </Stagger>
                            </div>
                        </RevealSection>
                    )}

                    <RevealSection className="bg-white py-16 sm:py-20 lg:py-24">
                        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                            <div className="flex flex-col gap-8 text-center justify-center mx-auto">
                                <div>
                                    <h2 className="mt-4 max-w-4xl text-3xl font-black justify-center tracking-tight text-gray-950 sm:text-4xl lg:text-5xl mx-auto">
                                       We Clear creative systems for every place your brand shows up.
                                    </h2>
                                </div>
                                <p className="text-center max-w-3xl leading-8 text-gray-600 justify-center mx-auto">
                                    We combine strategy, visual design, and digital execution so your audience sees one confident brand across campaigns, websites, social media, and product experiences.
                                </p>
                            </div>

                            <Stagger className="mt-10 flex gap-4 flex-col md:flex-row">
                                {strengths.map((strength) => {
                                    const Icon = strength.icon;

                                    return (
                                        <StaggerItem
                                            as="article"
                                            key={strength.title}
                                            className="border border-gray-200 bg-white p-6 shadow-sm"
                                        >
                                            <Icon className="h-9 w-9 text-[#000285]" />
                                            <h3 className="mt-6 text-xl font-black text-gray-950">
                                                {strength.title}
                                            </h3>
                                            <p className="mt-3 text-sm leading-6 text-gray-600">
                                            
                                                {strength.text}
                                            </p>
                                        </StaggerItem>
                                    );
                                })}
                            </Stagger>
                        </div>
                    </RevealSection>

                    <RevealSection id="services" className="bg-white py-16 text-white sm:py-20 lg:py-24">
                        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                            <div className="flex flex-col justify-center">
                                <div>
                                    <h2 className="my-4 text-3xl text-gray-800 font-bold text-center tracking-tight sm:text-4xl lg:text-5xl">
                                        What We Do
                                    </h2>
                                </div>
                                <p className="w-2xl text-center text-gray-500 justify-center">
                                    Comprehensive creative solutions tailored to help your business look polished, communicate clearly, and move faster.
                                </p>
                            </div>

                            <Stagger className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                                {services.map((service) => {
                                    const Icon = service.icon;

                                    return (
                                        <StaggerItem
                                            key={service.title}
                                            className="h-full"
                                        >
                                            <Link
                                                href={service.href}
                                                className="group flex min-h-[290px] flex-col justify-between bg-white p-6 text-gray-950 transition hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/30"
                                            >
                                                <div>
                                                    <div className={`mb-6 inline-flex h-14 w-14 items-center justify-center text-gray-600 rounded-md ring-1 ${service.tint}`}>
                                                        <Icon className="h-7 w-7" />
                                                    </div>
                                                    <h3 className="text-2xl text-blue-600">{service.title}</h3>
                                                    <p className="mt-4 text-sm leading-6 text-gray-600">
                                                        {service.description}
                                                    </p>
                                                </div>
                                                <div className="mt-8 flex items-center justify-between border-t border-gray-100 pt-5">
                                                    <span className="text-sm font-black">Start a project</span>
                                                    <span className={`flex h-9 w-9 items-center justify-center rounded-md text-white transition group-hover:translate-x-1 ${service.accent}`}>
                                                        <ArrowRightIcon className="h-4 w-4" />
                                                    </span>
                                                </div>
                                            </Link>
                                        </StaggerItem>
                                    );
                                })}
                            </Stagger>
                        </div>
                    </RevealSection>

                    <RevealSection className="bg-gray-50 py-16 sm:py-20 lg:py-24">
                        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                            <div className="grid gap-10 lg:grid-cols-[0.75fr_1.25fr] lg:items-start">
                                <div className="lg:sticky lg:top-28">
                                    <p className="text-sm font-black uppercase tracking-[0.22em] text-[#000285]">
                                        Our Process
                                    </p>
                                    <h2 className="mt-4 text-3xl font-black tracking-tight text-gray-950 sm:text-4xl">
                                        Simple, structured, and easy to follow.
                                    </h2>
                                    <p className="mt-5 text-base leading-8 text-gray-600">
                                        Good creative work should not feel confusing. We keep the process focused so you always know what is happening and what comes next.
                                    </p>
                                </div>

                                <Stagger className="flex flex-col md:flex-row">
                                    {processSteps.map((item) => {
                                        const Icon = item.icon;

                                        return (
                                            <StaggerItem
                                                as="article"
                                                key={item.step}
                                                className="flex flex-col gap-5 border border-gray-200 bg-white p-6 shadow-sm sm:grid-cols-[72px_1fr]"
                                            >
                                                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-blue-50 text-blue-500">
                                                    <Icon className="h-7 w-7" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black uppercase tracking-widest text-cyan-700">
                                                        Step {item.step}
                                                    </p>
                                                    <h3 className="mt-2 text-2xl font-black text-gray-950">
                                                        {item.title}
                                                    </h3>
                                                    <p className="mt-3 text-sm leading-6 text-gray-600">
                                                        {item.text}
                                                    </p>
                                                </div>
                                            </StaggerItem>
                                        );
                                    })}
                                </Stagger>
                            </div>
                        </div>
                    </RevealSection>

                    <RevealSection className="bg-[#000285] py-16 sm:py-20 lg:py-24">
                        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                            <div className="grid overflow-hidden bg-[#000285] text-white lg:grid-cols-[1fr_0.85fr]">
                                <div className="p-6 sm:p-10 lg:p-12">                                    
                                    <h2 className="mt-5 max-w-2xl text-3xl font-black tracking-tight sm:text-4xl lg:text-5xl">
                                        Let us shape the visuals your business needs to launch, grow, or refresh.
                                    </h2>
                                    <p className="mt-5 max-w-2xl text-base leading-8 text-blue-100">
                                        Tell us what you are building. We will help you choose the right creative direction, service, and next step.
                                    </p>
                                    <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                                        <Link
                                            href="/order/brand-design"
                                            className="inline-flex items-center justify-center gap-3 rounded-md bg-white px-6 py-3 text-sm font-black text-[#000285] transition hover:bg-cyan-50"
                                        >
                                            Start Your Project
                                            <ArrowRightIcon className="h-4 w-4" />
                                        </Link>
                                        <Link
                                            href="/about-bellah-options"
                                            className="inline-flex items-center justify-center rounded-md border border-white/30 px-6 py-3 text-sm font-black text-white transition hover:bg-white/10"
                                        >
                                            Meet Bellah Options
                                        </Link>
                                    </div>
                                </div>
                                <div className="grid border-t border-white/15 bg-white/10 p-6 sm:grid-cols-2 sm:p-10 lg:border-l lg:border-t-0 lg:grid-cols-1 lg:p-12">
                                    <div className="flex items-start gap-4 py-5">
                                        <UserGroupIcon className="h-8 w-8 shrink-0 text-cyan-200" />
                                        <div>
                                            <h3 className="font-black">Audience-aware</h3>
                                            <p className="mt-2 text-sm leading-6 text-blue-100">
                                                Work shaped for the people you need to reach, impress, and convert.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4 border-t border-white/15 py-5 sm:border-l sm:border-t-0 sm:pl-6 lg:border-l-0 lg:border-t lg:pl-0">
                                        <DevicePhoneMobileIcon className="h-8 w-8 shrink-0 text-cyan-200" />
                                        <div>
                                            <h3 className="font-black">Responsive by default</h3>
                                            <p className="mt-2 text-sm leading-6 text-blue-100">
                                                Designed to hold up across mobile screens, social feeds, and desktop layouts.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </RevealSection>
                </div>
            </PageTheme>
        </>
    );
}
