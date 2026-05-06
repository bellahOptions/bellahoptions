import { Head, Link, usePage } from "@inertiajs/react";
import PageTheme from "@/Layouts/PageTheme";
import { RevealSection, Stagger, StaggerItem } from "@/Components/MotionReveal";
import { resolvePublicAssetUrl } from "@/lib/publicPageHeaders";
import {
    ArrowRightIcon,
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
    SparklesIcon,
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
                <main className="min-h-screen overflow-x-hidden bg-white text-gray-950">
                    <RevealSection
                        className={`${headerBackgroundImage ? "bg-cover bg-center bg-no-repeat" : "bg-gray-50"} py-16 sm:py-20 lg:py-24`}
                        style={headerBackgroundImage
                            ? {
                                backgroundImage: `linear-gradient(rgba(249, 250, 251, 0.96), rgba(249, 250, 251, 0.94)), url("${headerBackgroundImage}")`,
                            }
                            : undefined}
                    >
                        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:px-8">
                            <div className="text-center lg:text-left">
                                <h1 className="mt-6 text-4xl font-black leading-[1.05] tracking-tight text-gray-950 sm:text-5xl lg:text-6xl">
                                    {headerTitle}
                                </h1>

                                <p className="mt-6 text-base leading-8 text-gray-600 sm:text-lg">
                                    {headerText}
                                </p>

                                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
                                    <Link
                                        href="/contact-us"
                                        className="group inline-flex items-center justify-center gap-3 rounded-md bg-[#000285] px-6 py-3 text-sm font-black text-white shadow-lg shadow-blue-900/20 transition hover:-translate-y-0.5 hover:bg-blue-800"
                                    >
                                        Work With Us
                                        <ArrowRightIcon className="h-4 w-4 transition group-hover:translate-x-1" />
                                    </Link>
                                    <Link
                                        href="/services"
                                        className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-6 py-3 text-sm font-black text-gray-900 transition hover:border-[#000285] hover:text-[#000285]"
                                    >
                                        Explore Services
                                    </Link>
                                </div>
                            </div>

                            <Stagger className="grid gap-4 sm:grid-cols-2">
                                <StaggerItem className="border-l-4 border-[#000285] bg-white p-6 shadow-sm">
                                    <SwatchIcon className="mb-6 h-9 w-9 text-[#000285]" />
                                    <h2 className="text-xl font-black text-gray-950">Design With Purpose</h2>
                                    <p className="mt-3 text-sm leading-6 text-gray-600">
                                        Every visual choice is tied to clarity, recognition, and what your audience needs to do next.
                                    </p>
                                </StaggerItem>

                                <StaggerItem className="bg-[#000285] p-6 text-white shadow-sm sm:translate-y-8">
                                    <p className="text-5xl font-black">BOSS</p>
                                    <h2 className="mt-5 text-xl font-black">A scalable future</h2>
                                    <p className="mt-3 text-sm leading-6 text-blue-100">
                                        Our subscription-based web platform helps SMEs and startups move online with less friction.
                                    </p>
                                </StaggerItem>

                                <StaggerItem className="bg-blue-50 p-6 shadow-sm sm:-translate-y-4">
                                    <RocketLaunchIcon className="mb-6 h-9 w-9 text-blue-700" />
                                    <h2 className="text-xl font-black text-gray-950">Built to launch</h2>
                                    <p className="mt-3 text-sm leading-6 text-gray-600">
                                        We create the assets founders need to show up, sell, and stay consistent.
                                    </p>
                                </StaggerItem>

                                <StaggerItem className="border border-gray-200 bg-white p-6 shadow-sm">
                                    <p className="text-sm font-black uppercase tracking-widest text-gray-500">Built For</p>
                                    <div className="mt-5 flex flex-wrap gap-2">
                                        {["Startups", "SMEs", "Creators", "Founders"].map((item) => (
                                            <span key={item} className="rounded-full bg-gray-100 px-3 py-1 text-sm font-bold text-gray-700">
                                                {item}
                                            </span>
                                        ))}
                                    </div>
                                </StaggerItem>
                            </Stagger>
                        </div>
                    </RevealSection>

                    <RevealSection className="bg-white py-16 sm:py-20 lg:py-24">
                        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                            <div className="mx-auto max-w-3xl text-center">
                                <p className="text-sm font-black uppercase tracking-[0.22em] text-[#000285]">
                                    Why We Exist
                                </p>
                                <h2 className="mt-4 text-3xl font-black tracking-tight text-gray-950 sm:text-5xl">
                                    Because great brands do not happen by accident.
                                </h2>
                                <p className="mt-5 text-base leading-8 text-gray-600 sm:text-lg">
                                    Attention is currency. Brands that look good, speak clearly, and connect instantly win. We give businesses the systems, content, and platforms they need to stand out and scale.
                                </p>
                            </div>

                            <Stagger className="mt-10 grid gap-5 md:grid-cols-3">
                                {pitchItems.map((item) => {
                                    const Icon = item.icon;

                                    return (
                                        <StaggerItem as="article" key={item.title} className="border border-gray-200 bg-white p-6 shadow-sm">
                                            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-md bg-blue-50 text-[#000285]">
                                                <Icon className="h-7 w-7" />
                                            </div>
                                            <h3 className="text-xl font-black text-gray-950">{item.title}</h3>
                                            <p className="mt-3 text-sm leading-6 text-gray-600">{item.text}</p>
                                        </StaggerItem>
                                    );
                                })}
                            </Stagger>
                        </div>
                    </RevealSection>

                    <RevealSection className="bg-gray-50 py-16 sm:py-20 lg:py-24">
                        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8">
                            <div className="overflow-hidden rounded-2xl bg-blue-50 shadow-sm">
                                <img
                                    src="https://bellahoptions.com/images/Bellah.gif"
                                    className="w-full"
                                    alt="Bellah Options creative work"
                                />
                            </div>

                            <div>
                                <p className="text-sm font-black uppercase tracking-[0.22em] text-[#000285]">
                                    What We Offer
                                </p>
                                <h2 className="mt-4 text-3xl font-black tracking-tight text-gray-950 sm:text-5xl">
                                    Creative work designed for impact, scalability, and measurable ROI.
                                </h2>
                                <p className="mt-5 text-base leading-8 text-gray-600">
                                    We build visual clarity and digital tools that help teams launch, sell, communicate, and grow with confidence.
                                </p>

                                <Stagger className="mt-8 grid gap-4 sm:grid-cols-2">
                                    {offers.map((offer) => {
                                        const Icon = offer.icon;

                                        return (
                                            <StaggerItem key={offer.title}>
                                                <Link
                                                    href={offer.href}
                                                    className="group block h-full border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
                                                >
                                                    <Icon className="h-8 w-8 text-[#000285]" />
                                                    <h3 className="mt-4 font-black text-gray-950">{offer.title}</h3>
                                                    <p className="mt-2 text-sm leading-6 text-gray-600">{offer.text}</p>
                                                </Link>
                                            </StaggerItem>
                                        );
                                    })}
                                </Stagger>
                            </div>
                        </div>
                    </RevealSection>

                    <RevealSection className="bg-white py-16 sm:py-20">
                        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                            <div className="grid gap-5 sm:grid-cols-3">
                                {stats.map((stat) => (
                                    <div key={stat.label} className="border border-gray-200 bg-white p-8 text-center shadow-sm">
                                        <p className="text-5xl font-black text-[#000285]">{stat.value}</p>
                                        <p className="mt-3 text-sm font-bold uppercase tracking-widest text-gray-500">{stat.label}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </RevealSection>

                    <RevealSection className="bg-gray-50 py-16 sm:py-20 lg:py-24">
                        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                            <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
                                <div>
                                    <p className="text-sm font-black uppercase tracking-[0.22em] text-[#000285]">Our Team</p>
                                    <h2 className="mt-4 text-3xl font-black tracking-tight text-gray-950 sm:text-5xl">
                                        Meet the creative minds behind Bellah Options.
                                    </h2>
                                </div>
                                <p className="max-w-2xl text-base leading-8 text-gray-600 lg:justify-self-end">
                                    A focused team of strategists, designers, and builders dedicated to bringing your brand vision to life.
                                </p>
                            </div>

                            <Stagger className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                {team.map((member) => {
                                    const RoleIcon = member.icon;

                                    return (
                                        <StaggerItem as="article" key={member.name} className="overflow-hidden bg-white shadow-sm ring-1 ring-gray-200">
                                            <div className="relative h-80 overflow-hidden bg-blue-50">
                                                {member.image ? (
                                                    <img
                                                        src={member.image}
                                                        alt={member.name}
                                                        className="absolute inset-0 h-full w-full object-cover transition duration-500 hover:scale-105"
                                                    />
                                                ) : (
                                                    <div className="absolute inset-0 flex items-center justify-center bg-[#000285]">
                                                        <PhotoIcon className="h-24 w-24 text-white" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="p-6">
                                                <h3 className="text-2xl font-black text-gray-950">{member.name}</h3>
                                                <p className="mt-2 flex items-center gap-2 font-semibold text-[#000285]">
                                                    <RoleIcon className="h-5 w-5" />
                                                    {member.role}
                                                </p>
                                                <p className="mt-4 text-sm leading-6 text-gray-600">{member.bio}</p>
                                            </div>
                                        </StaggerItem>
                                    );
                                })}
                            </Stagger>
                        </div>
                    </RevealSection>

                    <RevealSection className="bg-white py-16 sm:py-20 lg:py-24">
                        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:px-8">
                            <div>
                                <p className="text-sm font-black uppercase tracking-[0.22em] text-[#000285]">Our Vision</p>
                                <h2 className="mt-4 text-3xl font-black tracking-tight text-gray-950 sm:text-5xl">
                                    A creative-tech brand with a scalable future.
                                </h2>
                                <p className="mt-5 text-base leading-8 text-gray-600">
                                    Bellah Options is building an ecosystem where creativity meets technology and sustainable growth. With BOSS, we are opening a recurring model that empowers SMEs and startups.
                                </p>
                            </div>

                            <Stagger className="grid gap-3 sm:grid-cols-2">
                                {values.map((value) => (
                                    <StaggerItem key={value} className="flex items-center gap-3 border border-gray-200 bg-gray-50 p-4">
                                        <CheckCircleIcon className="h-5 w-5 shrink-0 text-[#000285]" />
                                        <span className="text-sm font-black text-gray-800">{value}</span>
                                    </StaggerItem>
                                ))}
                            </Stagger>
                        </div>
                    </RevealSection>

                    <RevealSection className="bg-[#000285] py-16 text-white sm:py-20 lg:py-24">
                        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_auto] lg:items-center lg:px-8">
                            <div>
                                <p className="text-sm font-black uppercase tracking-[0.22em] text-cyan-300">Ready when you are</p>
                                <h2 className="mt-5 max-w-3xl text-3xl font-black tracking-tight sm:text-5xl">
                                    Whether you are ready to build your brand or invest in ours, let's talk.
                                </h2>
                            </div>

                            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                                <Link
                                    href="/contact-us"
                                    className="group inline-flex items-center justify-center gap-3 rounded-md bg-white px-6 py-3 text-sm font-black text-[#000285] transition hover:bg-cyan-50"
                                >
                                    Work With Us
                                    <ArrowRightIcon className="h-4 w-4 transition group-hover:translate-x-1" />
                                </Link>
                                <Link
                                    href="/services"
                                    className="inline-flex items-center justify-center rounded-md border border-white/30 px-6 py-3 text-sm font-black text-white transition hover:bg-white/10"
                                >
                                    Explore Services
                                </Link>
                            </div>
                        </div>
                    </RevealSection>
                </main>
            </PageTheme>
        </>
    );
}
