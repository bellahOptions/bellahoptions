import { Head, usePage } from "@inertiajs/react";
import PageTheme from "@/Layouts/PageTheme";
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
    Stat,
} from "@/Components/PublicUI";
import {
    BoltIcon,
    BriefcaseIcon,
    ChartPieIcon,
    ChatBubbleBottomCenterTextIcon,
    CheckCircleIcon,
    ComputerDesktopIcon,
    DevicePhoneMobileIcon,
    PaintBrushIcon,
    PhotoIcon,
    RocketLaunchIcon,
    SwatchIcon,
    WrenchScrewdriverIcon,
} from "@heroicons/react/24/outline";

const pitchItems = [
    {
        title: "Strategic Brand Design",
        text: "Recognition, consistency, and clarity across every place your audience meets your business.",
        icon: CheckCircleIcon,
    },
    {
        title: "Social Media Content",
        text: "Campaign visuals and everyday content designed to engage, convert, and stay memorable.",
        icon: ChatBubbleBottomCenterTextIcon,
    },
    {
        title: "Conversion-Ready Websites",
        text: "Digital experiences shaped around performance, scalability, and measurable business results.",
        icon: BoltIcon,
    },
];

const offers = [
    {
        title: "Branding & Design",
        text: "Logos, visual identity, and marketing assets that make your brand easier to trust.",
        icon: PaintBrushIcon,
        href: "/order/brand-design",
    },
    {
        title: "Social Media Design",
        text: "Scroll-stopping visuals for campaigns, launches, content calendars, and promotions.",
        icon: WrenchScrewdriverIcon,
        href: "/order/social-media-design",
    },
    {
        title: "UI/UX Design",
        text: "Product flows and interfaces that help users move with less friction and more confidence.",
        icon: ComputerDesktopIcon,
        href: "/order/ui-ux",
    },
    {
        title: "Website Design (BOSS)",
        text: "Responsive websites built for business growth, clear messaging, and conversion.",
        icon: DevicePhoneMobileIcon,
        href: "/order/web-design",
    },
];

const team = [
    {
        name: "Ahmed Bello",
        role: "Creative Director",
        image: "https://bellahoptions.com/images/bellah.jpg",
        icon: BriefcaseIcon,
        bio: "Ahmed Bello leads design strategy and creative direction, turning bold ideas into memorable visual experiences that support business growth.",
    },
    {
        name: "Oluseye Mistura Olamide",
        role: "Marketing Head",
        image: "https://bellahoptions.com/images/ola.jpeg",
        icon: ChartPieIcon,
        bio: "Oluseye Mistura Olamide leads growth, client relationships, and creative strategy so every project reflects quality and direction.",
    },
    {
        name: "Anuoluwapo Kunle",
        role: "Graphic Designer",
        image: null,
        icon: PhotoIcon,
        bio: "Anuoluwapo Kunle creates visual assets that capture attention and communicate brand messages across social, digital, and identity systems.",
    },
];

const stats = [
    { value: "4", label: "Creative service lanes" },
    { value: "3", label: "Focused team leads" },
    { value: "1", label: "Brand growth partner" },
];

const values = [
    "Brand systems",
    "Social campaigns",
    "Responsive websites",
    "Product interfaces",
    "Launch assets",
    "Content direction",
];

const builtFor = ["Startups", "SMEs", "Creators", "Founders"];

export default function About() {
    const { publicPageHeaders = {} } = usePage().props;
    const headerConfig = publicPageHeaders?.about && typeof publicPageHeaders.about === "object"
        ? publicPageHeaders.about
        : {};
    const headerTitle = String(headerConfig?.title || "").trim() || "We are a creative tech agency built for ambitious brands.";
    const headerText = String(headerConfig?.text || "").trim() || "Bellah Options helps businesses grow faster through brand identity, graphic design, social media content, websites, and product experiences that look polished and work clearly.";
    const headerBackgroundImage = resolvePublicAssetUrl(headerConfig?.background_image);

    return (
        <>
            <Head title="About Bellah Options" />

            <PageTheme>
                <main className="text-white">
                    {/* ── HERO ── */}
                    <section className="jv-glow jv-grid-bg relative overflow-hidden pt-16 pb-14 sm:pt-20 sm:pb-16 lg:pt-24 lg:pb-20">
                        {headerBackgroundImage ? (
                            <div
                                aria-hidden="true"
                                className="absolute inset-0 bg-cover bg-center opacity-25"
                                style={{ backgroundImage: `url("${headerBackgroundImage}")` }}
                            />
                        ) : null}
                        <div
                            aria-hidden="true"
                            className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-jv-bg"
                        />

                        <div className="jv-container relative">
                            <div className="grid gap-14 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:gap-16">
                                <div className="text-center lg:text-left">
                                    <Eyebrow>About us</Eyebrow>
                                    <h1 className="jv-display jv-display--xl mt-6">
                                        {headerTitle}
                                    </h1>
                                    <p className="jv-lead mx-auto mt-6 max-w-xl lg:mx-0">
                                        {headerText}
                                    </p>

                                    <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
                                        <Button href="/contact-us" variant="primary" icon>
                                            Work With Us
                                        </Button>
                                        <Button href="/services" variant="ghost">
                                            Explore Services
                                        </Button>
                                    </div>
                                </div>

                                <Stagger className="grid gap-4 sm:grid-cols-2">
                                    <StaggerItem className="h-full">
                                        <Card hover className="h-full">
                                            <span className="inline-flex h-11 w-11 items-center justify-center rounded-jv-sm border border-jv-line-strong bg-white/[0.06] text-jv-accent">
                                                <SwatchIcon className="h-5 w-5" />
                                            </span>
                                            <h2 className="mt-6 text-lg font-semibold tracking-tight text-white">
                                                Design With Purpose
                                            </h2>
                                            <p className="jv-body mt-3">
                                                Every visual choice is tied to clarity,
                                                recognition, and what your audience needs to do
                                                next.
                                            </p>
                                        </Card>
                                    </StaggerItem>

                                    <StaggerItem className="h-full sm:translate-y-8">
                                        <Card featured className="h-full">
                                            <p className="jv-display jv-display--md">BOSS</p>
                                            <h2 className="mt-5 text-lg font-semibold tracking-tight text-white">
                                                A scalable future
                                            </h2>
                                            <p className="jv-body mt-3">
                                                Our subscription-based web platform helps SMEs
                                                and startups move online with less friction.
                                            </p>
                                        </Card>
                                    </StaggerItem>

                                    <StaggerItem className="h-full sm:-translate-y-4">
                                        <Card hover className="h-full">
                                            <span className="inline-flex h-11 w-11 items-center justify-center rounded-jv-sm border border-jv-line-strong bg-white/[0.06] text-jv-accent">
                                                <RocketLaunchIcon className="h-5 w-5" />
                                            </span>
                                            <h2 className="mt-6 text-lg font-semibold tracking-tight text-white">
                                                Built to launch
                                            </h2>
                                            <p className="jv-body mt-3">
                                                We create the assets founders need to show up,
                                                sell, and stay consistent.
                                            </p>
                                        </Card>
                                    </StaggerItem>

                                    <StaggerItem className="h-full">
                                        <Card hover className="h-full">
                                            <p className="jv-mono text-white/40">Built For</p>
                                            <div className="mt-5 flex flex-wrap gap-2">
                                                {builtFor.map((item) => (
                                                    <span key={item} className="jv-tag">
                                                        {item}
                                                    </span>
                                                ))}
                                            </div>
                                        </Card>
                                    </StaggerItem>
                                </Stagger>
                            </div>
                        </div>
                    </section>

                    {/* ── WHY WE EXIST ── */}
                    <Section className="border-y border-jv-line jv-glow overflow-hidden text-center">
                        <SectionHeading
                            eyebrow="Why we exist"
                            title="Because great brands do not"
                            muted="happen by accident."
                            description="Attention is currency. Brands that look good, speak clearly, and connect instantly win. We give businesses the systems, content, and platforms they need to stand out and scale."
                        />

                        <Stagger className="mt-14 grid gap-5 text-left md:grid-cols-3">
                            {pitchItems.map((item) => {
                                const Icon = item.icon;

                                return (
                                    <StaggerItem as="article" key={item.title} className="h-full">
                                        <Card hover className="h-full">
                                            <span className="inline-flex h-11 w-11 items-center justify-center rounded-jv-sm border border-jv-line-strong bg-white/[0.06] text-jv-accent">
                                                <Icon className="h-5 w-5" />
                                            </span>
                                            <h3 className="mt-6 text-lg font-semibold tracking-tight text-white">
                                                {item.title}
                                            </h3>
                                            <p className="jv-body mt-3">{item.text}</p>
                                        </Card>
                                    </StaggerItem>
                                );
                            })}
                        </Stagger>
                    </Section>

                    {/* ── WHAT WE OFFER ── */}
                    <Section>
                        <div className="grid gap-12 lg:grid-cols-[1fr_1fr] lg:items-center lg:gap-16">
                            <div className="jv-media jv-glow overflow-hidden">
                                <img
                                    src="https://bellahoptions.com/images/Bellah.gif"
                                    alt="Bellah Options creative work"
                                />
                            </div>

                            <div>
                                <Eyebrow>What we offer</Eyebrow>
                                <Display size="lg" className="mt-6">
                                    Creative work designed for impact, scalability, and
                                    measurable ROI.
                                </Display>
                                <p className="jv-lead mt-6 max-w-xl">
                                    We build visual clarity and digital tools that help teams
                                    launch, sell, communicate, and grow with confidence.
                                </p>

                                <Stagger className="mt-9 grid gap-4 sm:grid-cols-2">
                                    {offers.map((offer) => {
                                        const Icon = offer.icon;

                                        return (
                                            <StaggerItem key={offer.title} className="h-full">
                                                <a
                                                    href={offer.href}
                                                    className="jv-group block h-full"
                                                >
                                                    <Card hover className="h-full">
                                                        <span className="inline-flex h-11 w-11 items-center justify-center rounded-jv-sm border border-jv-line-strong bg-white/[0.06] text-jv-accent">
                                                            <Icon className="h-5 w-5" />
                                                        </span>
                                                        <h3 className="mt-5 text-base font-semibold tracking-tight text-white">
                                                            {offer.title}
                                                        </h3>
                                                        <p className="jv-body mt-2">
                                                            {offer.text}
                                                        </p>
                                                    </Card>
                                                </a>
                                            </StaggerItem>
                                        );
                                    })}
                                </Stagger>
                            </div>
                        </div>
                    </Section>

                    {/* ── STATS ── */}
                    <Section tight className="border-y border-jv-line">
                        <Stagger className="grid gap-5 sm:grid-cols-3">
                            {stats.map((stat) => (
                                <StaggerItem key={stat.label}>
                                    <Card hover className="text-center">
                                        <Stat value={stat.value} label={stat.label} />
                                    </Card>
                                </StaggerItem>
                            ))}
                        </Stagger>
                    </Section>

                    {/* ── TEAM ── */}
                    <Section>
                        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
                            <div>
                                <Eyebrow>Our team</Eyebrow>
                                <Display size="lg" className="mt-6">
                                    Meet the creative minds behind Bellah Options.
                                </Display>
                            </div>
                            <p className="jv-lead lg:justify-self-end">
                                A focused team of strategists, designers, and builders
                                dedicated to bringing your brand vision to life.
                            </p>
                        </div>

                        <Stagger className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {team.map((member) => {
                                const RoleIcon = member.icon;

                                return (
                                    <StaggerItem as="article" key={member.name} className="h-full">
                                        <Card
                                            hover
                                            pad={false}
                                            className="jv-group flex h-full flex-col overflow-hidden"
                                        >
                                            <div className="jv-media jv-media--zoom aspect-[4/5] rounded-b-none border-0 border-b border-jv-line">
                                                {member.image ? (
                                                    <img src={member.image} alt={member.name} />
                                                ) : (
                                                    <div className="flex h-full w-full items-center justify-center bg-white/[0.03] text-white/25">
                                                        <PhotoIcon className="h-16 w-16" />
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex flex-1 flex-col p-6">
                                                <h3 className="text-xl font-semibold tracking-tight text-white">
                                                    {member.name}
                                                </h3>
                                                <p className="mt-2 flex items-center gap-2 text-sm font-medium text-jv-accent">
                                                    <RoleIcon className="h-4 w-4" />
                                                    {member.role}
                                                </p>
                                                <p className="jv-body mt-4">{member.bio}</p>
                                            </div>
                                        </Card>
                                    </StaggerItem>
                                );
                            })}
                        </Stagger>
                    </Section>

                    {/* ── VISION ── */}
                    <Section className="border-t border-jv-line">
                        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-16">
                            <div>
                                <Eyebrow>Our vision</Eyebrow>
                                <Display size="lg" className="mt-6">
                                    A creative-tech brand with a scalable future.
                                </Display>
                                <p className="jv-lead mt-6 max-w-xl">
                                    Bellah Options is building an ecosystem where creativity
                                    meets technology and sustainable growth. With BOSS, we are
                                    opening a recurring model that empowers SMEs and startups.
                                </p>
                                <div className="mt-9">
                                    <Button href="/manage-your-hires" variant="ghost" icon>
                                        See retainer plans
                                    </Button>
                                </div>
                            </div>

                            <Stagger className="grid gap-4 sm:grid-cols-2">
                                {values.map((value) => (
                                    <StaggerItem key={value}>
                                        <Card flat className="h-full">
                                            <ul>
                                                <CheckItem>{value}</CheckItem>
                                            </ul>
                                        </Card>
                                    </StaggerItem>
                                ))}
                            </Stagger>
                        </div>
                    </Section>

                    {/* ── FINAL CTA ── */}
                    <Section tight>
                        <div className="jv-card jv-grid-bg relative overflow-hidden p-8 text-center sm:p-14 lg:p-20">
                            <div
                                aria-hidden="true"
                                className="pointer-events-none absolute -top-32 left-1/2 h-72 w-[min(760px,110%)] -translate-x-1/2 bg-[radial-gradient(closest-side,rgba(0,85,255,0.4),transparent_72%)]"
                            />
                            <div className="relative mx-auto flex max-w-3xl flex-col items-center">
                                <Eyebrow>Ready when you are</Eyebrow>
                                <Display size="lg" className="mt-6">
                                    Whether you are ready to build your brand or invest in
                                    ours, let&apos;s talk.
                                </Display>
                                <p className="jv-lead mx-auto mt-6 max-w-2xl">
                                    Tell us what you are building and we will map the right
                                    creative direction, service lane, and next step.
                                </p>
                                <div className="mt-9 flex flex-wrap justify-center gap-3">
                                    <Button href="/contact-us" variant="primary" size="lg" icon>
                                        Work With Us
                                    </Button>
                                    <Button href="/services" variant="ghost" size="lg">
                                        Explore Services
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
