import { Head, usePage } from "@inertiajs/react";
import { useState } from "react";
import PageTheme from "@/Layouts/PageTheme";
import GoogleReviewsWidget from "@/Components/GoogleReviewsWidget";
import { resolvePublicAssetUrl } from "@/lib/publicPageHeaders";
import {
    Button,
    Card,
    CheckItem,
    Display,
    Eyebrow,
    Section,
    SectionHeading,
    Stagger,
    StaggerItem,
} from "@/Components/PublicUI";
import {
    ArrowRightIcon,
    BanknotesIcon,
    BoltIcon,
    ChatBubbleLeftRightIcon,
    CheckBadgeIcon,
    ClipboardDocumentCheckIcon,
    CodeBracketIcon,
    CubeIcon,
    DevicePhoneMobileIcon,
    EnvelopeIcon,
    FingerPrintIcon,
    MinusIcon,
    PaintBrushIcon,
    PlusIcon,
    RectangleGroupIcon,
    ShieldCheckIcon,
    Squares2X2Icon,
    SwatchIcon,
    UserGroupIcon,
} from "@heroicons/react/24/outline";

/* --------------------------------------------------------------------------
 * Service presentation metadata.
 * Pricing, package names and descriptions all come from the server; this map
 * only adds the human framing the catalogue does not carry (icon, category
 * label, billing period, and the feature bullets shown on each card).
 * ------------------------------------------------------------------------ */

const SERVICE_META = {
    "social-media-design": {
        icon: PaintBrushIcon,
        category: "Design",
        period: "Month",
        image: "/sa1.jpeg",
        bullets: {
            starter: [
                "8 custom post or carousel designs",
                "Content development for each post",
                "Copywriting for captions and hooks",
                "Up to 5 revision rounds included",
                "Delivery in optimised, ready-to-post formats",
            ],
            standard: [
                "15 custom post or carousel designs",
                "Everything included in the Starter Plan",
                "Platform-tailored sizing and safe areas",
                "Content calendar guidance each month",
                "Up to 5 revision rounds included",
            ],
            business: [
                "20 custom post or carousel designs",
                "Everything in Starter and Standard",
                "Story and highlight cover design set",
                "Priority scheduling and turnaround",
                "Monthly performance-driven refreshes",
            ],
        },
    },
    "graphic-design": {
        icon: SwatchIcon,
        category: "Design",
        period: "Project",
        image: "/a4.jpeg",
        bullets: {
            "custom-quote": [
                "Print, campaign, outdoor and merchandise work",
                "Print-ready files built to your printer's spec",
                "Accurate sizing for every placement",
                "Proofing before anything goes to production",
                "Scope and price confirmed before we start",
            ],
        },
    },
    "brand-design": {
        icon: FingerPrintIcon,
        category: "Identity",
        period: "Project",
        image: "/so1.jpeg",
        bullets: {
            "logo-design": [
                "3 distinct logo concepts to choose from",
                "Two refinement rounds on your pick",
                "Final lockups and clear-space rules",
                "Full colour, black and white variants",
                "Vector, PNG and favicon exports",
            ],
            "brand-system": [
                "Logo suite and responsive lockups",
                "Typography and type-scale system",
                "Colour palette with accessible pairings",
                "Layout, spacing and grid principles",
                "Documented brand guidelines you can hand over",
            ],
            "full-identity": [
                "Positioning, audience and messaging strategy",
                "Complete visual identity and logo system",
                "Stationery, social kit and collateral design",
                "Launch asset pack for day-one rollout",
                "Brand guidelines plus editable source files",
            ],
        },
    },
    "web-design": {
        icon: CodeBracketIcon,
        category: "Development",
        period: "Project",
        image: "/si1.jpeg",
        bullets: {
            "landing-page": [
                "2 pages including a working contact form",
                "Conversion-focused structure and copy support",
                "Technical SEO and AI-search foundations",
                "Editable content so you can update it yourself",
                "Annual hosting and domain setup handled",
            ],
            "full-website": [
                "Up to 10 fully designed and built pages",
                "Blog module you can publish to yourself",
                "Appointment booking for qualified leads",
                "Customer login and CRM connection",
                "Full social media integration throughout",
            ],
            ecommerce: [
                "Everything in the Full Website package",
                "Secure payment gateway integration",
                "Product, order and inventory management",
                "Automated order confirmation emails",
                "Checkout tuned to reduce abandoned carts",
            ],
            "custom-web-app": [
                "Discovery workshop to map requirements",
                "User flows, data model and technical scope",
                "Phased build plan with clear milestones",
                "Integration with the tools you already run",
                "Fixed quote issued before development",
            ],
        },
    },
    "mobile-app-development": {
        icon: DevicePhoneMobileIcon,
        category: "Development",
        period: "Project",
        image: "/si2.jpeg",
        bullets: {
            mvp: [
                "Core feature set built for real validation",
                "Intuitive onboarding and first-run experience",
                "Secure authentication and user accounts",
                "Android and iOS release preparation",
                "Store submission support and guidance",
            ],
            growth: [
                "Everything in the MVP Build package",
                "Push notifications and in-app messaging",
                "Analytics wired to the metrics that matter",
                "Stronger backend and API infrastructure",
                "Scalable architecture for a growing user base",
            ],
            scale: [
                "Everything in the Growth Build package",
                "High-traffic architecture and load planning",
                "Advanced security and compliance hardening",
                "Automated testing and release pipelines",
                "Ongoing performance optimisation",
            ],
        },
    },
    "ui-ux": {
        icon: RectangleGroupIcon,
        category: "Design",
        period: "Project",
        image: "/so2.jpeg",
        bullets: {
            sprint: [
                "One critical user flow taken end to end",
                "Research, wireframes and clickable prototype",
                "High-fidelity screens for every key state",
                "Usability review with prioritised fixes",
                "Handoff files your developers can build from",
            ],
            product: [
                "Multiple flows mapped and designed",
                "Information architecture and journey mapping",
                "Complete component library and states",
                "Design tokens ready for engineering",
                "Developer handoff and QA support",
            ],
            comprehensive: [
                "Deep user research and competitor analysis",
                "End-to-end product experience design",
                "Full design system and documentation",
                "Accessibility and inclusive design pass",
                "Team training and adoption enablement",
            ],
        },
    },
    "manage-hires": {
        icon: UserGroupIcon,
        category: "Retainer",
        period: "Month",
        image: "/t1.jpeg",
        bullets: {
            hatchling: [
                "20 design requests handled every month",
                "One brand covered across all requests",
                "A dedicated designer who learns your brand",
                "Predictable turnaround on every request",
                "Pause or cancel your retainer any month",
            ],
            "business-plan": [
                "Unlimited design requests each month",
                "Up to 3 brands covered on one plan",
                "Dedicated designer plus backup cover",
                "Priority queue with faster turnaround",
                "Quarterly brand review with our team",
            ],
        },
    },
    "special-service": {
        icon: CubeIcon,
        category: "Consultation",
        period: "Project",
        image: "/so3.jpeg",
        bullets: {
            consultation: [
                "Mixed-scope and unusual briefs welcome",
                "Direct conversation about what you need",
                "Scope, timeline and quote in writing",
                "One team across every discipline involved",
                "No commitment until you approve the plan",
            ],
        },
    },
};

const FALLBACK_META = {
    icon: Squares2X2Icon,
    category: "Service",
    period: "Project",
    image: "/bellah.jpg",
    bullets: {},
};

const revealServices = [
    "social-media-design",
    "graphic-design",
    "brand-design",
    "web-design",
    "ui-ux",
];

const standaloneCopy = {
    "social-media-design":
        "Always-on social design that keeps your feed active, consistent and on-brand every week.",
    "graphic-design":
        "Print and campaign artwork produced to exact specification and press-ready output.",
    "brand-design":
        "Identity systems built so your business looks the same everywhere it shows up.",
    "web-design":
        "Sites structured to explain the offer clearly and turn visitors into enquiries.",
    "ui-ux":
        "Product flows and interfaces designed to remove friction at every step.",
    "mobile-app-development":
        "App builds taken from validated idea to store-ready release.",
    "manage-hires":
        "A dedicated design team on retainer for teams with a constant stream of requests.",
    "special-service":
        "Mixed-scope work and unusual briefs, scoped properly before anything begins.",
};

const orderSteps = [
    {
        icon: ClipboardDocumentCheckIcon,
        title: "Choose your service and package",
        text: "Pick the lane that matches what you need. If two look close, send the brief anyway and we will tell you which one fits.",
    },
    {
        icon: ChatBubbleLeftRightIcon,
        title: "Answer a short project brief",
        text: "A few questions about your brand, the audience and the deadline. It takes minutes and removes almost every round of back-and-forth later.",
    },
    {
        icon: BanknotesIcon,
        title: "Confirm scope and pay securely",
        text: "You get the final scope, price and timeline in writing. Payment is handled over secure Nigerian gateways before work is scheduled.",
    },
    {
        icon: BoltIcon,
        title: "Receive, review and launch",
        text: "We deliver on schedule. You review, request revisions, and then take full ownership of every source file.",
    },
];

const detailPoints = [
    "All prices are quoted in Nigerian Naira (NGN) and are non-refundable once a project has started.",
    "Retainer packages are billed monthly and can be paused, upgraded or cancelled at any time.",
    "Project timelines begin on the working day we receive your deposit and your completed brief.",
    "Source files, editable assets and documentation are handed over in full on completion.",
    "Third-party costs such as domains, hosting, stock assets and paid plugins are billed separately.",
    "Every scope is confirmed in writing before work is scheduled, so nothing is assumed.",
];

const serviceFaqs = [
    {
        q: "How long does a typical project take?",
        a: "A landing page usually takes 1–2 weeks, a full website 3–6 weeks, brand identity 2–4 weeks, and mobile app builds start at 8 weeks depending on scope. Retainer work runs on a rolling monthly schedule. You receive a dated delivery plan before we begin.",
    },
    {
        q: "What exactly is included in a package?",
        a: "Every package lists its deliverables on this page. In short, you get the design work, the revision rounds stated, the source and export files, and the documentation needed for your team or printer to use the work without us.",
    },
    {
        q: "Can I request changes after delivery?",
        a: "Yes. Each package includes its stated revision rounds. Send all feedback in one consolidated round per revision — this keeps the timeline tight and the version history clean. Additional rounds are quoted separately.",
    },
    {
        q: "Do you offer payment plans?",
        a: "For projects above ₦150,000 we split payment: 60% to schedule the work and 40% on delivery. Larger website and app builds can be split across clear milestones. Retainers are billed at the start of each month.",
    },
    {
        q: "What do I need to get started?",
        a: "Your logo and existing brand assets if you have them, any copy or product details you want used, examples of work you like, and the deadline you are working towards. If you have none of that, we can start from scratch.",
    },
    {
        q: "Do you work with clients outside Nigeria?",
        a: "Yes. We work with clients across Africa, Europe, the UK and North America. Remote delivery is our default, timelines are agreed in your timezone, and we handle the handover asynchronously so nothing depends on a single call.",
    },
    {
        q: "How do I book a project?",
        a: "Choose a package on this page and complete the short brief. If you would rather talk first, book a 15-minute call or send us a message — we will confirm the right scope and give you a written quote.",
    },
];

const formatMoney = (amount) =>
    new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: "NGN",
        maximumFractionDigits: 0,
    }).format(Number(amount || 0));

const displayPrice = (plan) => {
    const discount = Number(plan.discount_price || 0);
    const original = Number(plan.original_price || 0);
    const base = Number(plan.price || 0);

    if (discount > 0 && original > discount) {
        return { main: discount, was: original, isDiscounted: true };
    }

    return { main: base, was: null, isDiscounted: false };
};

function PackageCard({ service, plan, meta }) {
    const price = displayPrice(plan);
    const bullets = (
        meta.bullets?.[plan.code] ||
        (plan.description ? [plan.description] : [])
    ).slice(0, 4);
    const isQuote = price.main <= 0;

    return (
        <Card
            hover
            featured={Boolean(plan.is_recommended)}
            className="flex h-full flex-col"
        >
            <div className="flex items-start gap-3.5">
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-jv-sm border border-jv-line-strong bg-white/[0.06] text-jv-accent">
                    <meta.icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                        <h3 className="min-w-0 break-words text-xl font-semibold tracking-tight text-white">
                            {plan.name}
                        </h3>
                        {plan.is_recommended ? (
                            <span className="jv-tag border-transparent bg-jv-accent text-white">
                                Most popular
                            </span>
                        ) : null}
                    </div>
                    {plan.description ? (
                        <p className="jv-small mt-2">{plan.description}</p>
                    ) : null}
                </div>
            </div>

            <p className="jv-mono mt-6 text-white/35">{meta.category}</p>

            <div className="mt-2.5 flex flex-wrap items-end gap-3">
                {isQuote ? (
                    <p className="jv-display jv-display--md">Custom quote</p>
                ) : (
                    <>
                        <p className="jv-display jv-display--md">
                            {formatMoney(price.main)}
                        </p>
                        <span className="jv-small pb-1.5">/ {meta.period}</span>
                    </>
                )}
                {price.isDiscounted ? (
                    <span className="jv-small pb-2 line-through">
                        {formatMoney(price.was)}
                    </span>
                ) : null}
            </div>

            {bullets.length > 0 ? (
                <ul className="mt-6 flex-1 space-y-3 border-t border-jv-line pt-6">
                    {bullets.map((bullet) => (
                        <CheckItem key={`${plan.code}-${bullet}`}>
                            {bullet}
                        </CheckItem>
                    ))}
                </ul>
            ) : (
                <div className="flex-1" />
            )}

            <div className="mt-7 flex flex-wrap items-center gap-3 border-t border-jv-line pt-6">
                <Button
                    href={`/order/${service.slug}?package=${plan.code}`}
                    variant="primary"
                    icon
                >
                    {isQuote ? "Request a quote" : "Subscribe now"}
                </Button>
                <Button href="/gallery" variant="ghost">
                    See samples
                </Button>
            </div>
        </Card>
    );
}

function ServiceBlock({ service, index }) {
    const meta = SERVICE_META[service.slug] || FALLBACK_META;
    const packages = Array.isArray(service.packages) ? service.packages : [];
    const Icon = meta.icon;

    return (
        <article id={service.slug} className="scroll-mt-32">
            <div className="flex flex-col gap-5 border-b border-jv-line pb-7 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex items-start gap-4">
                    <span className="jv-mono pt-1.5 text-white/30">
                        {String(index + 1).padStart(2, "0")}
                    </span>
                    <div>
                        <h3 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                            {service.name}
                        </h3>
                        <p className="jv-body mt-2 max-w-2xl">
                            {service.description}
                        </p>
                    </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                    <span className="jv-mono rounded-full border border-jv-line bg-white/[0.05] px-3 py-1.5 text-white/45">
                        {meta.category}
                    </span>
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-jv-sm border border-jv-line-strong bg-white/[0.06] text-jv-accent">
                        <Icon className="h-5 w-5" />
                    </span>
                </div>
            </div>

            <div className="mt-7 grid gap-5 md:grid-cols-2">
                {packages.map((plan) => (
                    <PackageCard
                        key={`${service.slug}-${plan.code}`}
                        service={service}
                        plan={plan}
                        meta={meta}
                    />
                ))}
            </div>
        </article>
    );
}

function FaqRow({ faq, isOpen, onToggle }) {
    return (
        <div
            className={`jv-card overflow-hidden transition-colors ${
                isOpen ? "border-jv-line-strong bg-white/[0.07]" : ""
            }`}
        >
            <button
                type="button"
                onClick={onToggle}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-5 px-5 py-5 text-left"
            >
                <span className="text-base font-semibold tracking-tight text-white">
                    {faq.q}
                </span>
                <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition ${
                        isOpen
                            ? "border-transparent bg-jv-accent text-white"
                            : "border-jv-line-strong bg-white/[0.06] text-white/70"
                    }`}
                >
                    {isOpen ? (
                        <MinusIcon className="h-4 w-4" />
                    ) : (
                        <PlusIcon className="h-4 w-4" />
                    )}
                </span>
            </button>
            <div hidden={!isOpen} className="px-5 pb-6">
                <p className="jv-body max-w-3xl">{faq.a}</p>
            </div>
        </div>
    );
}

export default function Services({ services = [] }) {
    const [openFaq, setOpenFaq] = useState(0);
    const { publicPageHeaders = {} } = usePage().props;

    // The hero copy stays admin-editable through the same page-header setting the
    // rest of the site uses; the markup below is only the fallback.
    const configuredHeader =
        publicPageHeaders?.services && typeof publicPageHeaders.services === "object"
            ? publicPageHeaders.services
            : {};
    const heroTitle =
        String(configuredHeader.title || "").trim() ||
        "Excited to work with you";
    const heroTitleSecond =
        String(configuredHeader.subtitle || "").trim() ||
        "and bring your vision to life.";
    const heroText =
        String(configuredHeader.text || "").trim() ||
        "If you need a service you cannot find listed here, email us and we will tell you honestly whether we can help. All services are confirmed in writing and are non-refundable once work begins.";
    const heroEyebrow =
        String(configuredHeader.eyebrow || "").trim() || "Your Design Solution";
    const heroImage = resolvePublicAssetUrl(configuredHeader.background_image);

    const ordered = Array.isArray(services) ? services : [];
    const featured = revealServices
        .map((slug) => ordered.find((service) => service.slug === slug))
        .filter(Boolean)
        .slice(0, 5);
    const packageServices = ordered.filter(
        (service) =>
            Array.isArray(service.packages) && service.packages.length > 0,
    );
    const packageCount = packageServices.reduce(
        (total, service) => total + service.packages.length,
        0,
    );

    return (
        <>
            <Head title="Services" />
            <PageTheme>
                <main className="text-white">
                    {/* ── HERO ── */}
                    <section className="jv-glow relative overflow-hidden pt-16 pb-14 sm:pt-20 lg:pt-24 lg:pb-16">
                        {heroImage ? (
                            <div
                                aria-hidden="true"
                                className="absolute inset-0 bg-cover bg-center opacity-25"
                                style={{ backgroundImage: `url("${heroImage}")` }}
                            />
                        ) : null}
                        <div className="jv-container relative">
                            <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
                                <Eyebrow>{heroEyebrow}</Eyebrow>
                                <h1 className="jv-display jv-display--xl mt-6">
                                    {heroTitle}
                                    <br />
                                    <span className="jv-muted">{heroTitleSecond}</span>
                                </h1>
                                <p className="jv-lead mx-auto mt-6 max-w-2xl">
                                    {heroText}
                                </p>
                                <div className="mt-9 flex flex-wrap justify-center gap-3">
                                    <Button href="/gallery" variant="primary" icon>
                                        See Previous Projects
                                    </Button>
                                    <Button href="/contact-us" variant="ghost">
                                        Book a 15-min call
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ── PACKAGES ── */}
                    <Section className="border-t border-jv-line">
                        <div className="grid gap-12 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1fr)] lg:gap-16">
                            {/* Sticky visual, as on the reference layout */}
                            <div className="lg:sticky lg:top-28 lg:self-start">
                                <div className="jv-media jv-glow relative aspect-[4/5] w-full">
                                    <img
                                        src="/bo.png"
                                        alt="Bellah Options design work"
                                        loading="lazy"
                                    />
                                    <div
                                        aria-hidden="true"
                                        className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"
                                    />
                                    <div className="absolute inset-x-5 bottom-5 flex items-center justify-between gap-4">
                                        <p className="jv-mono text-white/70">
                                            Real client work
                                        </p>
                                        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur">
                                            <ArrowRightIcon className="h-4 w-4" />
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-6 grid grid-cols-3 gap-4">
                                    {[
                                        { value: `${packageServices.length}`, label: "Service lanes" },
                                        { value: `${packageCount}`, label: "Packages" },
                                        { value: "24h", label: "Reply time" },
                                    ].map((stat) => (
                                        <div
                                            key={stat.label}
                                            className="rounded-jv border border-jv-line bg-white/[0.04] px-4 py-3"
                                        >
                                            <p className="jv-display jv-display--sm">
                                                {stat.value}
                                            </p>
                                            <p className="jv-small mt-1">
                                                {stat.label}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <Eyebrow>Our packages</Eyebrow>
                                <Display
                                    size="lg"
                                    muted="Clear Services Remotely."
                                    className="mt-6"
                                >
                                    Get High-Quality
                                </Display>
                                <p className="jv-lead mt-6 max-w-xl">
                                    We offer a range of services designed to elevate your
                                    brand&apos;s identity — delivered remotely, with real
                                    people, and priced upfront so there are no surprises.
                                </p>

                                <div className="mt-12 space-y-14">
                                    {packageServices.map((service, index) => (
                                        <ServiceBlock
                                            key={service.slug}
                                            service={service}
                                            index={index}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </Section>

                    {/* ── WORK / VALIDATION ── */}
                    {featured.length > 0 ? (
                        <Section className="jv-glow overflow-hidden border-t border-jv-line">
                            <SectionHeading
                                eyebrow="Our work"
                                title="Explore the work behind"
                                muted="every service lane."
                                description="Selected deliverables from recent client projects. Same team, same standards, same attention to detail on yours."
                            />

                            <Stagger className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                                {featured.map((service) => {
                                    const meta =
                                        SERVICE_META[service.slug] || FALLBACK_META;

                                    return (
                                        <StaggerItem
                                            key={service.slug}
                                            className="h-full"
                                        >
                                            <a
                                                href={`#${service.slug}`}
                                                className="jv-group block h-full"
                                            >
                                                <Card
                                                    hover
                                                    pad={false}
                                                    className="flex h-full flex-col overflow-hidden"
                                                >
                                                    <div className="relative aspect-[4/3] overflow-hidden border-b border-jv-line bg-white/[0.03]">
                                                        <img
                                                            src={meta.image}
                                                            alt={`${service.name} work sample`}
                                                            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                                                            loading="lazy"
                                                        />
                                                        <span className="jv-mono absolute left-3 top-3 rounded-full border border-jv-line-strong bg-black/60 px-2.5 py-1 text-white/70 backdrop-blur">
                                                            {meta.category}
                                                        </span>
                                                    </div>

                                                    <div className="flex flex-1 flex-col p-6">
                                                        <h3 className="text-lg font-semibold tracking-tight text-white">
                                                            {service.name}
                                                        </h3>
                                                        <p className="jv-body mt-2 flex-1">
                                                            {standaloneCopy[
                                                                service.slug
                                                            ] || service.description}
                                                        </p>
                                                        <span className="mt-5 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/70">
                                                            View packages
                                                            <span className="jv-btn-arrow h-7 w-7">
                                                                <ArrowRightIcon className="h-3.5 w-3.5" />
                                                            </span>
                                                        </span>
                                                    </div>
                                                </Card>
                                            </a>
                                        </StaggerItem>
                                    );
                                })}
                            </Stagger>
                        </Section>
                    ) : null}

                    {/* ── DETAILS + HOW TO ORDER ── */}
                    <Section className="border-t border-jv-line">
                        <div className="grid gap-12 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
                            <div className="lg:sticky lg:top-28 lg:self-start">
                                <Eyebrow>Important details</Eyebrow>
                                <Display
                                    size="md"
                                    muted="before you order."
                                    className="mt-6"
                                >
                                    The practical bits
                                </Display>
                                <p className="jv-lead mt-5">
                                    Everything about how we quote, bill and deliver —
                                    stated upfront so you can plan with confidence.
                                </p>
                                <ul className="mt-8 space-y-3.5">
                                    {detailPoints.map((point) => (
                                        <CheckItem
                                            key={point}
                                            icon={ShieldCheckIcon}
                                        >
                                            {point}
                                        </CheckItem>
                                    ))}
                                </ul>
                            </div>

                            <div>
                                <Eyebrow>How to order</Eyebrow>
                                <Display size="md" className="mt-6">
                                    Four steps from brief to launch.
                                </Display>
                                <Stagger className="mt-10 grid gap-4">
                                    {orderSteps.map((step, index) => (
                                        <StaggerItem key={step.title}>
                                            <Card hover className="flex gap-5">
                                                <div className="flex flex-col items-center gap-3">
                                                    <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-jv-sm border border-jv-line-strong bg-white/[0.06] text-jv-accent">
                                                        <step.icon className="h-5 w-5" />
                                                    </span>
                                                    {index < orderSteps.length - 1 ? (
                                                        <span className="hidden w-px flex-1 bg-jv-line sm:block" />
                                                    ) : null}
                                                </div>
                                                <div>
                                                    <p className="jv-mono text-white/35">
                                                        Step {String(index + 1).padStart(2, "0")}
                                                    </p>
                                                    <h3 className="mt-2 text-lg font-semibold tracking-tight text-white">
                                                        {step.title}
                                                    </h3>
                                                    <p className="jv-body mt-2">
                                                        {step.text}
                                                    </p>
                                                </div>
                                            </Card>
                                        </StaggerItem>
                                    ))}
                                </Stagger>

                                <div className="jv-card mt-6 flex flex-wrap items-center justify-between gap-5 p-6">
                                    <div className="flex items-start gap-3.5">
                                        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-jv-sm border border-jv-line-strong bg-white/[0.06] text-jv-accent">
                                            <EnvelopeIcon className="h-5 w-5" />
                                        </span>
                                        <div>
                                            <p className="font-semibold text-white">
                                                Not listed what you need?
                                            </p>
                                            <p className="jv-small mt-1">
                                                Email us and we will confirm whether we
                                                can help.
                                            </p>
                                        </div>
                                    </div>
                                    <Button href="/contact-us" variant="ghost">
                                        Email us
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </Section>

                    {/* ── FAQ ── */}
                    <Section className="border-t border-jv-line">
                        <div className="grid gap-12 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1fr)] lg:gap-16">
                            <div className="lg:sticky lg:top-28 lg:self-start">
                                <Eyebrow>FAQ</Eyebrow>
                                <Display
                                    size="lg"
                                    muted="Asked Questions"
                                    className="mt-6"
                                >
                                    Frequently
                                </Display>
                                <p className="jv-lead mt-5 max-w-md">
                                    Have questions? Our FAQ section has you covered with
                                    quick answers to the most common enquiries about
                                    scope, timing and payment.
                                </p>
                                <div className="mt-8">
                                    <Button href="/contact-us" variant="ghost" icon>
                                        Ask us anything
                                    </Button>
                                </div>
                            </div>

                            <div className="grid gap-3">
                                {serviceFaqs.map((faq, index) => (
                                    <FaqRow
                                        key={faq.q}
                                        faq={faq}
                                        isOpen={openFaq === index}
                                        onToggle={() =>
                                            setOpenFaq(
                                                openFaq === index ? -1 : index,
                                            )
                                        }
                                    />
                                ))}
                            </div>
                        </div>
                    </Section>

                    {/* ── GOOGLE REVIEWS ── */}
                    <Section className="border-t border-jv-line">
                        <SectionHeading
                            eyebrow="Reviews"
                            title="What clients say about"
                            muted="working with us."
                        />
                        <div className="mt-12">
                            <GoogleReviewsWidget />
                        </div>
                    </Section>

                    {/* ── CLOSING CTA ── */}
                    <Section className="jv-section--tight">
                        <div className="jv-card jv-grid-bg relative overflow-hidden p-8 text-center sm:p-14 lg:p-20">
                            <div
                                aria-hidden="true"
                                className="pointer-events-none absolute -top-32 left-1/2 h-72 w-[min(760px,110%)] -translate-x-1/2 bg-[radial-gradient(closest-side,rgba(0,85,255,0.4),transparent_72%)]"
                            />
                            <div className="relative mx-auto flex max-w-2xl flex-col items-center">
                                <Eyebrow>Let us begin</Eyebrow>
                                <Display size="lg" className="mt-6">
                                    Each project we undertake is a unique opportunity.
                                </Display>
                                <p className="jv-lead mx-auto mt-6">
                                    We invest the time to understand your brand and
                                    produce designs that genuinely move your business
                                    forward. Not template work — carefully made work.
                                </p>
                                <div className="mt-9 flex flex-wrap justify-center gap-3">
                                    <Button
                                        href="/order/special-service"
                                        variant="primary"
                                        size="lg"
                                        icon
                                    >
                                        Book a call
                                    </Button>
                                    <Button
                                        href="/gallery"
                                        variant="ghost"
                                        size="lg"
                                    >
                                        See our work
                                    </Button>
                                </div>
                                <div className="mt-7 flex flex-wrap items-center justify-center gap-x-7 gap-y-3">
                                    {[
                                        { icon: CheckBadgeIcon, text: "Scope confirmed in writing" },
                                        { icon: ShieldCheckIcon, text: "Secure Nigerian payments" },
                                        { icon: UserGroupIcon, text: "Real people, real deadlines" },
                                    ].map((item) => (
                                        <span
                                            key={item.text}
                                            className="jv-check text-white/55"
                                        >
                                            <item.icon className="h-4 w-4" />
                                            {item.text}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </Section>
                </main>
            </PageTheme>
        </>
    );
}
