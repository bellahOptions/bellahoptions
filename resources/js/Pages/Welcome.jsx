import { Head, Link } from "@inertiajs/react";
import { Suspense, lazy } from "react";
import PageTheme from "@/Layouts/PageTheme";
import ClientReviewsSection from "@/Components/ClientReviewsSection";
import {
    Button,
    Card,
    Display,
    Eyebrow,
    ProcessCard,
    Section,
    SectionHeading,
    Stagger,
    StaggerItem,
    Stat,
} from "@/Components/PublicUI";
import {
    ArrowRightIcon,
    BoltIcon,
    CheckBadgeIcon,
    CheckCircleIcon,
    ClipboardDocumentCheckIcon,
    CodeBracketIcon,
    DevicePhoneMobileIcon,
    LightBulbIcon,
    PaintBrushIcon,
    PresentationChartLineIcon,
    RectangleGroupIcon,
    RocketLaunchIcon,
    SparklesIcon,
    SwatchIcon,
    UserGroupIcon,
} from "@heroicons/react/24/outline";

const Slider = lazy(() => import("@/Components/Slider"));

const sliderFallbackClassName =
    "h-[min(760px,calc(100svh-84px))] min-h-[520px] w-full animate-pulse bg-[#0b0b12] sm:h-[min(800px,calc(100svh-96px))] sm:min-h-[600px]";

const brandLogos = [
    {
        name: "Wingram",
        src: "https://bellahoptions.com/images/Wingram-07.svg",
    },
    {
        name: "Lexis Group",
        src: "https://bellahoptions.com/images/lexis.svg", 
    },
    {
        name: "Velit",
        src: "https://bellahoptions.com/images/velit.svg",
    },
    {
        name: "Ziego Furnitures",
        src: "https://bellahoptions.com/images/ziego.svg",
    },
    {
        name: "Neddstech",
        src: "https://bellahoptions.com/images/neddstech.svg",
    },
    
];

const services = [
    {
        title: "Brand Design",
        description:
            "Logos, identity systems, brand guides, and launch assets that make your business easier to recognize and trust.",
        href: "/order/brand-design",
        icon: CheckBadgeIcon,
        lane: "Identity",
    },
    {
        title: "Graphic Design",
        description:
            "Social media creatives, campaign visuals, flyers, and print-ready designs for everyday business growth.",
        href: "/order/graphic-design",
        icon: PaintBrushIcon,
        lane: "Campaigns",
    },
    {
        title: "Web Design",
        description:
            "Responsive websites and landing pages shaped around clear messaging, strong visuals, and simple conversion paths.",
        href: "/order/web-design",
        icon: CodeBracketIcon,
        lane: "Websites",
    },
    {
        title: "UI/UX Design",
        description:
            "Product flows, wireframes, and interface design that help your users move with less friction and more confidence.",
        href: "/order/ui-ux",
        icon: RectangleGroupIcon,
        lane: "Products",
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

export default function Welcome({ slideShows = [], featuredPlans = [], gallerySamples = [] }) {
    const scrollingLogos = [...brandLogos, ...brandLogos, ...brandLogos];
    const hasFeaturedPlans = Array.isArray(featuredPlans) && featuredPlans.length > 0;
    const hasGallerySamples = Array.isArray(gallerySamples) && gallerySamples.length > 0;

    return (
        <>
            <Head title="Welcome to #yourBestOPtion" />

            <PageTheme>
                <Suspense fallback={<div className={sliderFallbackClassName} />}>
                    <Slider slides={slideShows} />
                </Suspense>

                {/* ── TRUSTED BY ── */}
                <Section tight reveal={false} className="border-y border-jv-line">
                    <div className="grid items-center gap-8 lg:grid-cols-[240px_1fr]">
                        <div className="text-center lg:text-left">
                            <p className="jv-mono text-white/40">Trusted By</p>
                            <p className="jv-small mt-2 max-w-xs">
                                Growing brands, teams, and founders building stronger digital presence.
                            </p>
                        </div>
                        <div className="overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
                            <div className="jv-marquee items-center gap-14 sm:gap-20">
                                {scrollingLogos.map((logo, index) => (
                                    <img
                                        key={`${logo.name}-${index}`}
                                        src={logo.src}
                                        className="h-8 w-auto shrink-0 opacity-45 grayscale transition hover:opacity-100 hover:grayscale-0 sm:h-10 lg:h-11"
                                        alt={logo.name}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </Section>

                {/* ── ABOUT ── */}
                <Section>
                    <div className="grid items-center gap-14 lg:grid-cols-[0.95fr_1.05fr] lg:gap-20">
                        <div className="jv-media jv-glow relative aspect-[4/5] w-full overflow-hidden sm:aspect-[5/4] lg:aspect-[4/5]">
                            <img
                                src="https://bellahoptions.com/images/Wingram-07.svg"
                                alt="Bellah Options creative work"
                                className="h-full w-full scale-[0.45] object-contain opacity-90"
                            />
                            <div
                                aria-hidden="true"
                                className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(0,85,255,0.28),transparent_70%)]"
                            />
                        </div>

                        <div>
                            <Eyebrow>About us</Eyebrow>
                            <Display size="lg" muted="With design that works." className="mt-6">
                                Building Stronger Brands
                            </Display>
                            <p className="jv-lead mt-6 max-w-xl">
                                Delivering high-quality, on-demand designs with precision. Elevate
                                your brand effortlessly, one project at a time.
                            </p>

                            <ul className="mt-8 space-y-4">
                                {[
                                    "Worked with clients in 10+ Countries",
                                    "Over a decade of combined experience",
                                    "50+ brands satisfied across four service lanes",
                                ].map((item) => (
                                    <li key={item} className="flex items-center gap-3">
                                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-jv-accent/15 text-jv-accent">
                                            <CheckCircleIcon className="h-4 w-4" />
                                        </span>
                                        <span className="jv-body">{item}</span>
                                    </li>
                                ))}
                            </ul>

                            <div className="mt-10 flex flex-wrap items-center gap-5">
                                <Button href="/about-bellah-options" variant="primary" icon>
                                    View About Bellah Options
                                </Button>
                                <div className="flex items-center gap-3">
                                    <span className="text-sm tracking-[0.2em] text-jv-accent">
                                        ★★★★★
                                    </span>
                                    <span className="jv-small">50+ brands satisfied</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </Section>

                {/* ── RESULTS ── */}
                <Section className="jv-glow overflow-hidden text-center">
                    <SectionHeading
                        eyebrow="Results"
                        title="Delivering Tangible Results"
                        muted="That Propel Your Success"
                        description="At the core of everything we do lies a commitment to delivering measurable outcomes that drive your success."
                        size="lg"
                    />

                    <div className="mt-10 flex justify-center">
                        <Button href="/contact-us" variant="primary" icon>
                            Book a 15-min call
                        </Button>
                    </div>

                    <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                        {[
                            { value: "10+", label: "Countries served" },
                            { value: "50+", label: "Brands satisfied" },
                            { value: "4", label: "Core service lanes" },
                            { value: "24h", label: "Typical response time" },
                        ].map((stat) => (
                            <Card key={stat.label} hover className="text-left">
                                <Stat value={stat.value} label={stat.label} />
                            </Card>
                        ))}
                    </div>
                </Section>

                {/* ── GALLERY ── */}
                {hasGallerySamples && (
                    <Section className="border-y border-jv-line">
                        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                            <div>
                                <Eyebrow>Portfolio</Eyebrow>
                                <Display size="md" muted="we are proud of." className="mt-6">
                                    Selected work
                                </Display>
                            </div>
                            <Button href="/gallery" variant="ghost" icon>
                                See all projects
                            </Button>
                        </div>

                        <Stagger className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                            {gallerySamples.map((sample) => {
                                const isExternal = sample.href.startsWith("http");
                                const card = (
                                    <Card hover pad={false} className="jv-group h-full overflow-hidden">
                                        <div className="jv-media jv-media--zoom aspect-[4/3] rounded-b-none border-0 border-b border-jv-line">
                                            <img src={sample.image} alt={sample.title} />
                                        </div>
                                        <div className="p-6">
                                            <span className="jv-mono text-jv-accent">
                                                {sample.service}
                                            </span>
                                            <h3 className="mt-3 text-lg font-semibold tracking-tight text-white">
                                                {sample.title}
                                            </h3>
                                            <p className="jv-body mt-2 line-clamp-3">
                                                {sample.summary}
                                            </p>
                                            <span className="mt-5 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/70">
                                                View sample
                                                <span className="jv-btn-arrow h-7 w-7">
                                                    <ArrowRightIcon className="h-3.5 w-3.5" />
                                                </span>
                                            </span>
                                        </div>
                                    </Card>
                                );

                                return (
                                    <StaggerItem key={sample.title} className="h-full">
                                        {isExternal ? (
                                            <a
                                                href={sample.href}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="block h-full"
                                            >
                                                {card}
                                            </a>
                                        ) : (
                                            <Link href={sample.href} className="block h-full">
                                                {card}
                                            </Link>
                                        )}
                                    </StaggerItem>
                                );
                            })}
                        </Stagger>
                    </Section>
                )}

                {/* ── PROCESS ── */}
                <Section>
                    <div className="grid gap-14 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
                        <div className="lg:sticky lg:top-28 lg:self-start">
                            <Eyebrow>How we work</Eyebrow>
                            <Display size="lg" muted="From Design To Launch." className="mt-6">
                                We Simplify The Journey
                            </Display>
                            <p className="jv-lead mt-6 max-w-md">
                                We make it easy to bring your ideas to life, guiding you from concept
                                to a fully launched brand.
                            </p>
                            <div className="mt-9">
                                <Button href="/services" variant="ghost" icon>
                                    Explore our services
                                </Button>
                            </div>
                        </div>

                        <Stagger className="grid gap-5">
                            {processSteps.map((item) => (
                                <StaggerItem key={item.step}>
                                    <ProcessCard
                                        step={item.step}
                                        title={item.title}
                                        description={item.text}
                                        icon={item.icon}
                                    />
                                </StaggerItem>
                            ))}
                        </Stagger>
                    </div>
                </Section>

                {/* ── WHY US ── */}
                <Section className="jv-glow overflow-hidden text-center">
                    <SectionHeading
                        title="Why should you choose us?"
                        description="At Bellah Options we craft creative systems that elevate brands and deliver measurable results — with a team of specialists covering every lane your brand needs."
                    />

                    <Stagger className="mt-14 grid gap-5 text-left sm:grid-cols-2 lg:grid-cols-3">
                        {[...strengths, ...strengths].slice(0, 3).map((strength) => {
                            const Icon = strength.icon;

                            return (
                                <StaggerItem key={strength.title}>
                                    <Card hover className="h-full">
                                        <span className="inline-flex h-11 w-11 items-center justify-center rounded-jv-sm border border-jv-line-strong bg-white/[0.06] text-jv-accent">
                                            <Icon className="h-5 w-5" />
                                        </span>
                                        <h3 className="mt-6 text-lg font-semibold tracking-tight text-white">
                                            {strength.title}
                                        </h3>
                                        <p className="jv-body mt-3">{strength.text}</p>
                                    </Card>
                                </StaggerItem>
                            );
                        })}
                        <StaggerItem>
                            <Card hover className="h-full">
                                <span className="inline-flex h-11 w-11 items-center justify-center rounded-jv-sm border border-jv-line-strong bg-white/[0.06] text-jv-accent">
                                    <UserGroupIcon className="h-5 w-5" />
                                </span>
                                <h3 className="mt-6 text-lg font-semibold tracking-tight text-white">
                                    A decade of mastery
                                </h3>
                                <p className="jv-body mt-3">
                                    Ten years of shaping brands across identity, campaigns, web,
                                    and product design.
                                </p>
                            </Card>
                        </StaggerItem>
                        <StaggerItem>
                            <Card hover className="h-full">
                                <span className="inline-flex h-11 w-11 items-center justify-center rounded-jv-sm border border-jv-line-strong bg-white/[0.06] text-jv-accent">
                                    <BoltIcon className="h-5 w-5" />
                                </span>
                                <h3 className="mt-6 text-lg font-semibold tracking-tight text-white">
                                    Fast & flexible delivery
                                </h3>
                                <p className="jv-body mt-3">
                                    Structured turnaround windows with room for focused rounds of
                                    feedback.
                                </p>
                            </Card>
                        </StaggerItem>
                        <StaggerItem>
                            <Card hover className="h-full">
                                <span className="inline-flex h-11 w-11 items-center justify-center rounded-jv-sm border border-jv-line-strong bg-white/[0.06] text-jv-accent">
                                    <DevicePhoneMobileIcon className="h-5 w-5" />
                                </span>
                                <h3 className="mt-6 text-lg font-semibold tracking-tight text-white">
                                    Designer engagement
                                </h3>
                                <p className="jv-body mt-3">
                                    Direct access to a senior designer throughout your project.
                                </p>
                            </Card>
                        </StaggerItem>
                    </Stagger>
                </Section>

                {/* ── SERVICES ── */}
                <Section id="services" className="border-y border-jv-line">
                    <SectionHeading
                        eyebrow="Services"
                        title="What We Do"
                        description="Comprehensive creative solutions tailored to help your business look polished, communicate clearly, and move faster."
                    />

                    <Stagger className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                        {services.map((service) => {
                            const Icon = service.icon;

                            return (
                                <StaggerItem key={service.title} className="h-full">
                                    <Link href={service.href} className="block h-full">
                                        <Card hover className="jv-group flex h-full min-h-[300px] flex-col justify-between">
                                            <div>
                                                <div className="flex items-start justify-between gap-4">
                                                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-jv-sm border border-jv-line-strong bg-white/[0.06] text-jv-accent">
                                                        <Icon className="h-5 w-5" />
                                                    </span>
                                                    <span className="jv-mono text-white/35">
                                                        {service.lane}
                                                    </span>
                                                </div>
                                                <h3 className="mt-6 text-xl font-semibold tracking-tight text-white">
                                                    {service.title}
                                                </h3>
                                                <p className="jv-body mt-4">
                                                    {service.description}
                                                </p>
                                            </div>
                                            <div className="mt-8 flex items-center justify-between border-t border-jv-line pt-5">
                                                <span className="text-xs font-semibold uppercase tracking-[0.14em] text-white/70">
                                                    Start a project
                                                </span>
                                                <span className="jv-btn-arrow h-8 w-8">
                                                    <ArrowRightIcon className="h-4 w-4" />
                                                </span>
                                            </div>
                                        </Card>
                                    </Link>
                                </StaggerItem>
                            );
                        })}
                    </Stagger>
                </Section>

                {/* ── FEATURED PLANS ── */}
                {hasFeaturedPlans && (
                    <Section>
                        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
                            <div>
                                <Eyebrow>Featured plans</Eyebrow>
                                <Display size="lg" className="mt-6">
                                    Service plans worth putting in front of your next move.
                                </Display>
                            </div>
                            <p className="jv-lead lg:justify-self-end">
                                These packages are selected by the Bellah Options team and can
                                include active discounts, recommendations, and homepage feature
                                status from the admin pricing panel.
                            </p>
                        </div>

                        <Stagger className="mt-14 grid gap-6 lg:grid-cols-3">
                            {featuredPlans.map((plan) => (
                                <StaggerItem
                                    as="article"
                                    key={plan.id}
                                    className="flex h-full flex-col"
                                >
                                    <Card
                                        hover
                                        featured={Boolean(plan.is_homepage_featured)}
                                        className="flex h-full flex-col justify-between"
                                    >
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                {plan.is_homepage_featured && (
                                                    <span className="jv-tag border-transparent bg-jv-accent text-white">
                                                        Featured
                                                    </span>
                                                )}
                                                {plan.is_recommended && (
                                                    <span className="jv-tag">Recommended</span>
                                                )}
                                                {plan.has_discount && (
                                                    <span className="jv-tag border-jv-accent-line text-[#dbe7ff]">
                                                        {plan.discount_summary}
                                                    </span>
                                                )}
                                            </div>

                                            <p className="jv-mono mt-6 text-white/35">
                                                {plan.service_name}
                                            </p>
                                            <h3 className="mt-3 text-2xl font-semibold tracking-tight text-white">
                                                {plan.name}
                                            </h3>
                                            <p className="jv-body mt-3">
                                                {plan.short_description}
                                            </p>

                                            <div className="mt-7 flex items-end gap-2">
                                                <p className="jv-display jv-display--md">
                                                    {formatMoney(plan.final_price, plan.currency)}
                                                </p>
                                                <p className="jv-small pb-1.5">
                                                    / {cycleLabel(plan.billing_cycle)}
                                                </p>
                                            </div>

                                            {plan.has_discount && (
                                                <p className="jv-small mt-2">
                                                    Was{" "}
                                                    <span className="line-through">
                                                        {formatMoney(plan.base_price, plan.currency)}
                                                    </span>
                                                    {plan.discount_code
                                                        ? ` with ${plan.discount_code}`
                                                        : ""}
                                                </p>
                                            )}

                                            <div className="mt-7 space-y-3 border-t border-jv-line pt-6">
                                                {[
                                                    plan.package_name,
                                                    "Fast checkout",
                                                    "Guided project intake",
                                                ].map((item) => (
                                                    <div key={item} className="jv-check">
                                                        <CheckCircleIcon className="h-4 w-4" />
                                                        <span>{item}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <Button
                                            href={plan.checkout_url}
                                            variant="primary"
                                            icon
                                            className="mt-9 w-full"
                                        >
                                            Choose Plan
                                        </Button>
                                    </Card>
                                </StaggerItem>
                            ))}
                        </Stagger>
                    </Section>
                )}

                <ClientReviewsSection
                    title="Verified Client Reviews"
                    subtitle="Recent client feedback with star ratings from completed Bellah Options projects."
                />

                {/* ── FINAL CTA ── */}
                <Section className="jv-section--tight">
                    <div className="jv-card jv-grid-bg relative overflow-hidden p-8 text-center sm:p-14 lg:p-20">
                        <div
                            aria-hidden="true"
                            className="pointer-events-none absolute -top-32 left-1/2 h-72 w-[min(760px,110%)] -translate-x-1/2 bg-[radial-gradient(closest-side,rgba(0,85,255,0.4),transparent_72%)]"
                        />
                        <div className="relative mx-auto flex max-w-3xl flex-col items-center">
                            <Eyebrow>Let us build together</Eyebrow>
                            <Display size="lg" className="mt-6">
                                Shaping the visuals your business needs to launch and grow.
                            </Display>
                            <p className="jv-lead mx-auto mt-6 max-w-2xl">
                                Tell us what you are building. We will help you choose the right
                                creative direction, service, and next step.
                            </p>
                            <div className="mt-9 flex flex-wrap justify-center gap-3">
                                <Button href="/order/special-service" variant="primary" size="lg" icon>
                                    Start Your Project
                                </Button>
                                <Button href="/about-bellah-options" variant="ghost" size="lg">
                                    Meet Bellah Options
                                </Button>
                            </div>
                        </div>
                    </div>
                </Section>
            </PageTheme>
        </>
    );
}
