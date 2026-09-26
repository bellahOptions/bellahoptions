import { Head, Link, usePage } from "@inertiajs/react";
import { useState } from "react";
import PageTheme from "@/Layouts/PageTheme";
import FastImage from "@/Components/FastImage";
import GoogleReviewsWidget from "@/Components/GoogleReviewsWidget";
import ServiceProjectGallery from "@/Components/ServiceProjectGallery";
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
    ChevronDownIcon,
    ClipboardDocumentCheckIcon,
    EnvelopeIcon,
    ShieldCheckIcon,
    UserGroupIcon,
} from "@heroicons/react/24/outline";

const formatMoney = (amount) =>
    new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: "NGN",
        maximumFractionDigits: 0,
    }).format(Number(amount || 0));

/**
 * The price a visitor will actually pay, preferring a live discount.
 */
const displayPrice = (plan) => {
    const discount = Number(plan.discount_price || 0);
    const price = Number(plan.price || 0);
    const was = Number(plan.original_price || 0);

    if (discount > 0 && discount < price) {
        return { main: discount, was: price, isDiscounted: true };
    }

    if (was > price && price > 0) {
        return { main: price, was, isDiscounted: true };
    }

    return { main: price, was: 0, isDiscounted: false };
};

const processIcons = [
    ClipboardDocumentCheckIcon,
    ChatBubbleLeftRightIcon,
    BanknotesIcon,
    BoltIcon,
];

export default function ServiceDetail({
    service = {},
    content = {},
    relatedServices = [],
    projects = [],
    orderUrl = "/services",
    paymentReadiness = {},
}) {
    const { flash } = usePage().props;
    const [openFaq, setOpenFaq] = useState(0);

    const packages = Array.isArray(service.packages) ? service.packages : [];
    const heroPoints = Array.isArray(content.hero_points) ? content.hero_points : [];
    const outcomes = Array.isArray(content.outcomes) ? content.outcomes : [];
    const deliverables = Array.isArray(content.deliverables) ? content.deliverables : [];
    const process = Array.isArray(content.process) ? content.process : [];
    const faqs = Array.isArray(content.faqs) ? content.faqs : [];

    // A landing page must agree with the order form about whether online
    // payment can start; the server sends the same readiness payload to both.
    const gatewayIssue = String(paymentReadiness?.paystack?.message || "").trim();
    const onlinePaymentReady = Boolean(paymentReadiness?.paystack?.available);
    const bankTransfer = paymentReadiness?.bank_transfer || null;
    const fallbackAccounts = bankTransfer?.available ? (bankTransfer.accounts || []) : [];
    const processorLabel =
        String(paymentReadiness?.preferred_provider || "paystack").toLowerCase() === "flutterwave"
            ? "Flutterwave"
            : "Paystack";

    const hasPackages = packages.length > 0;
    const period = String(content.period || "Project");

    const packageHref = (planCode) =>
        planCode ? `${orderUrl}?package=${encodeURIComponent(planCode)}` : orderUrl;

    return (
        <>
            <Head title={`${content.headline || service.name} | Bellah Options`} />

            <PageTheme>
                <main className="text-white">
                    {/* ── HERO ── */}
                    <section className="jv-glow relative overflow-hidden pt-16 pb-14 sm:pt-20 lg:pt-24">
                        <div className="jv-container relative">
                            <nav aria-label="Breadcrumb" className="jv-mono text-white/40">
                                <Link href="/" className="transition-colors hover:text-white">
                                    Home
                                </Link>
                                <span className="mx-2">/</span>
                                <Link href="/services" className="transition-colors hover:text-white">
                                    Services
                                </Link>
                                <span className="mx-2">/</span>
                                <span className="text-white/70">{content.headline || service.name}</span>
                            </nav>

                            <div className="mt-10 grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
                                <div>
                                    <Eyebrow>{content.eyebrow || "Service"}</Eyebrow>
                                    <h1 className="jv-display jv-display--xl mt-6">
                                        {content.headline || service.name}
                                    </h1>
                                    <p className="jv-lead mt-6 max-w-xl">
                                        {content.subheadline || service.description}
                                    </p>

                                    {heroPoints.length > 0 ? (
                                        <ul className="mt-8 grid gap-3 sm:grid-cols-2">
                                            {heroPoints.map((point) => (
                                                <CheckItem key={point}>{point}</CheckItem>
                                            ))}
                                        </ul>
                                    ) : null}

                                    <div className="mt-9 flex flex-wrap gap-3">
                                        <Button href={orderUrl} variant="primary" size="lg" icon>
                                            {hasPackages ? "Start your order" : "Request a quote"}
                                        </Button>
                                        <Button href="/contact-us" variant="ghost" size="lg">
                                            Ask a question first
                                        </Button>
                                    </div>
                                </div>

                                <div className="jv-media jv-glow relative aspect-[4/5] w-full">
                                    <FastImage
                                        src={content.image || "/bo.png"}
                                        variants={content.image_variants}
                                        alt={`${content.headline || service.name} work by Bellah Options`}
                                        priority
                                        sizes="(min-width: 1024px) 45vw, 100vw"
                                        width={1600}
                                        height={2000}
                                        className="h-full w-full object-cover"
                                    />
                                    <div
                                        aria-hidden="true"
                                        className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"
                                    />
                                    <div className="absolute inset-x-5 bottom-5">
                                        <p className="jv-mono text-white/70">{content.category || "Service"}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ── PAYMENT NOTICE ── */}
                    {!onlinePaymentReady ? (
                        <Section className="jv-section--tight">
                            <div className="rounded-jv border border-amber-500/30 bg-amber-500/10 p-6 text-amber-100">
                                <p className="jv-mono text-amber-300">Payment Update</p>
                                <p className="mt-2 text-sm leading-7">
                                    Online {processorLabel} checkout is not available right now.
                                    {gatewayIssue ? ` ${gatewayIssue}` : ""}
                                </p>
                                {fallbackAccounts.length > 0 ? (
                                    <div className="mt-4 space-y-3 text-xs leading-6 text-amber-100/80">
                                        {fallbackAccounts.map((account, index) => (
                                            <div key={`fallback-account-${index}`} className="space-y-1">
                                                {fallbackAccounts.length > 1 && (
                                                    <p className="font-semibold text-amber-100">
                                                        Account {index + 1}
                                                    </p>
                                                )}
                                                <p><strong>Bank:</strong> {account.bank_name}</p>
                                                <p><strong>Account Name:</strong> {account.account_name}</p>
                                                <p><strong>Account Number:</strong> {account.account_number}</p>
                                            </div>
                                        ))}
                                        {bankTransfer?.reference_hint ? (
                                            <p><strong>Reference:</strong> {bankTransfer.reference_hint}</p>
                                        ) : null}
                                        {bankTransfer?.instructions ? (
                                            <p><strong>Instructions:</strong> {bankTransfer.instructions}</p>
                                        ) : null}
                                        {bankTransfer?.support_email ? (
                                            <p><strong>Support:</strong> {bankTransfer.support_email}</p>
                                        ) : null}
                                    </div>
                                ) : null}
                            </div>
                        </Section>
                    ) : null}

                    {/* ── SUMMARY ── */}
                    {content.summary ? (
                        <Section className="border-t border-jv-line">
                            <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
                                <div className="lg:sticky lg:top-28 lg:self-start">
                                    <Display size="md" muted="in practice.">
                                        What this actually means
                                    </Display>
                                </div>
                                <div>
                                    <p className="jv-lead">{content.summary}</p>

                                    {outcomes.length > 0 ? (
                                        <Stagger className="mt-10 grid gap-5 sm:grid-cols-2">
                                            {outcomes.map((outcome) => (
                                                <StaggerItem key={outcome.title} className="h-full">
                                                    <Card className="h-full p-6">
                                                        <h3 className="text-lg font-semibold tracking-tight text-white">
                                                            {outcome.title}
                                                        </h3>
                                                        <p className="jv-body mt-2">{outcome.text}</p>
                                                    </Card>
                                                </StaggerItem>
                                            ))}
                                        </Stagger>
                                    ) : null}
                                </div>
                            </div>
                        </Section>
                    ) : null}

                    {/* ── PACKAGES ── */}
                    {hasPackages ? (
                        <Section className="border-t border-jv-line">
                            <SectionHeading
                                eyebrow="Packages"
                                title="Choose the scope that"
                                muted="matches your goal."
                                description="Prices below are exactly what the order form charges. Every package lists its deliverables before you commit."
                            />

                            <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                                {packages.map((plan) => {
                                    const price = displayPrice(plan);
                                    const isQuote = Number(plan.price || 0) <= 0 && !price.isDiscounted;
                                    const bullets = Array.isArray(plan.features) ? plan.features : [];

                                    return (
                                        <Card
                                            key={plan.code}
                                            featured={Boolean(plan.is_recommended)}
                                            className="flex h-full flex-col p-7"
                                        >
                                            {plan.is_recommended ? (
                                                <span className="jv-mono mb-4 inline-flex w-fit rounded-full border border-jv-accent-line bg-jv-accent/15 px-3 py-1 text-jv-accent">
                                                    Most chosen
                                                </span>
                                            ) : null}

                                            <h3 className="text-xl font-semibold tracking-tight text-white">
                                                {plan.name}
                                            </h3>
                                            {plan.description ? (
                                                <p className="jv-small mt-2">{plan.description}</p>
                                            ) : null}

                                            <div className="mt-6 flex flex-wrap items-end gap-3">
                                                {isQuote ? (
                                                    <p className="jv-display jv-display--md">Custom quote</p>
                                                ) : (
                                                    <>
                                                        <p className="jv-display jv-display--md">
                                                            {formatMoney(price.main)}
                                                        </p>
                                                        <span className="jv-small pb-1.5">/ {period}</span>
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
                                                        <CheckItem key={`${plan.code}-${bullet}`}>{bullet}</CheckItem>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <div className="flex-1" />
                                            )}

                                            <div className="mt-7 border-t border-jv-line pt-6">
                                                <Button href={packageHref(plan.code)} variant="primary" icon className="w-full justify-center">
                                                    {isQuote ? "Request a quote" : "Start this package"}
                                                </Button>
                                            </div>
                                        </Card>
                                    );
                                })}
                            </div>
                        </Section>
                    ) : null}

                    {/* ── DELIVERABLES ── */}
                    {deliverables.length > 0 ? (
                        <Section className="border-t border-jv-line">
                            <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
                                <div className="lg:sticky lg:top-28 lg:self-start">
                                    <Eyebrow>What you receive</Eyebrow>
                                    <Display size="lg" muted="every time." className="mt-6">
                                        Deliverables
                                    </Display>
                                    <p className="jv-lead mt-5 max-w-md">
                                        Not a promise list. These are the outputs that leave our studio
                                        on a {String(content.headline || service.name).toLowerCase()} project.
                                    </p>
                                </div>

                                <Card className="p-7">
                                    <ul className="space-y-4">
                                        {deliverables.map((item) => (
                                            <CheckItem key={item} icon={CheckBadgeIcon}>
                                                {item}
                                            </CheckItem>
                                        ))}
                                    </ul>
                                </Card>
                            </div>
                        </Section>
                    ) : null}

                    {/* ── PROJECTS ── */}
                    <ServiceProjectGallery projects={projects} serviceName={service.name} />

                    {/* ── PROCESS ── */}
                    {process.length > 0 ? (
                        <Section className="border-t border-jv-line">
                            <SectionHeading
                                eyebrow="How it works"
                                title="Four steps from brief"
                                muted="to delivery."
                            />

                            <Stagger className="mt-12 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                                {process.map((step, index) => {
                                    const Icon = processIcons[index % processIcons.length];

                                    return (
                                        <StaggerItem key={step.title} className="h-full">
                                            <Card className="flex h-full flex-col p-6">
                                                <span className="inline-flex h-10 w-10 items-center justify-center rounded-jv-sm border border-jv-line-strong bg-white/[0.06] text-jv-accent">
                                                    <Icon className="h-5 w-5" />
                                                </span>
                                                <p className="jv-mono mt-4 text-white/35">
                                                    Step {String(index + 1).padStart(2, "0")}
                                                </p>
                                                <h3 className="mt-2 text-lg font-semibold tracking-tight text-white">
                                                    {step.title}
                                                </h3>
                                                <p className="jv-body mt-2">{step.text}</p>
                                            </Card>
                                        </StaggerItem>
                                    );
                                })}
                            </Stagger>
                        </Section>
                    ) : null}

                    {/* ── FAQ ── */}
                    {faqs.length > 0 ? (
                        <Section className="border-t border-jv-line">
                            <div className="grid gap-12 lg:grid-cols-[0.72fr_1fr] lg:gap-16">
                                <div className="lg:sticky lg:top-28 lg:self-start">
                                    <Eyebrow>FAQ</Eyebrow>
                                    <Display size="lg" muted="Asked Questions" className="mt-6">
                                        Frequently
                                    </Display>
                                    <p className="jv-lead mt-5 max-w-md">
                                        The questions we get asked most about this service. If yours
                                        is not here, ask us directly.
                                    </p>
                                    <div className="mt-8 flex flex-wrap gap-3">
                                        <Button href="/contact-us" variant="ghost" icon>
                                            Ask us anything
                                        </Button>
                                        <Button href="/faqs" variant="ghost">
                                            All FAQs
                                        </Button>
                                    </div>
                                </div>

                                <div className="grid gap-3">
                                    {faqs.map((faq, index) => (
                                        <div
                                            key={faq.q}
                                            className="jv-card overflow-hidden"
                                        >
                                            <button
                                                type="button"
                                                onClick={() => setOpenFaq(openFaq === index ? -1 : index)}
                                                aria-expanded={openFaq === index}
                                                className="flex w-full items-start justify-between gap-4 p-5 text-left"
                                            >
                                                <span className="text-base font-semibold text-white">
                                                    {faq.q}
                                                </span>
                                                <ChevronDownIcon
                                                    className={`mt-0.5 h-5 w-5 shrink-0 text-jv-accent transition-transform ${
                                                        openFaq === index ? "rotate-180" : ""
                                                    }`}
                                                />
                                            </button>
                                            {openFaq === index ? (
                                                <div className="px-5 pb-5">
                                                    <p className="jv-body">{faq.a}</p>
                                                </div>
                                            ) : null}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </Section>
                    ) : null}

                    {/* ── REVIEWS ── */}
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

                    {/* ── RELATED ── */}
                    {relatedServices.length > 0 ? (
                        <Section className="border-t border-jv-line">
                            <SectionHeading
                                eyebrow="Also available"
                                title="Other services"
                                muted="you may need."
                            />

                            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                                {relatedServices.map((related) => (
                                    <Link
                                        key={related.slug}
                                        href={`/services/${related.slug}`}
                                        className="jv-group block h-full"
                                    >
                                        <Card hover className="flex h-full flex-col p-6">
                                            <h3 className="text-base font-semibold tracking-tight text-white">
                                                {related.name}
                                            </h3>
                                            <p className="jv-small mt-2 flex-1">{related.description}</p>
                                            <span className="mt-4 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-white/60">
                                                View service
                                                <ArrowRightIcon className="h-3.5 w-3.5" />
                                            </span>
                                        </Card>
                                    </Link>
                                ))}
                            </div>
                        </Section>
                    ) : null}

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
                                    Ready to start your {content.headline || service.name} project?
                                </Display>
                                <p className="jv-lead mx-auto mt-6">
                                    Complete the short brief and we will confirm scope, price and
                                    timeline in writing before any work is scheduled.
                                </p>
                                <div className="mt-9 flex flex-wrap justify-center gap-3">
                                    <Button href={orderUrl} variant="primary" size="lg" icon>
                                        {hasPackages ? "Start your order" : "Request a quote"}
                                    </Button>
                                    <Button href="/gallery" variant="ghost" size="lg">
                                        See our work
                                    </Button>
                                </div>
                                <div className="mt-7 flex flex-wrap items-center justify-center gap-x-7 gap-y-3">
                                    {[
                                        { icon: CheckBadgeIcon, text: "Scope confirmed in writing" },
                                        { icon: ShieldCheckIcon, text: "Secure Nigerian payments" },
                                        { icon: UserGroupIcon, text: "Real people, real deadlines" },
                                    ].map((item) => (
                                        <span key={item.text} className="jv-check text-white/55">
                                            <item.icon className="h-4 w-4 text-jv-accent" />
                                            {item.text}
                                        </span>
                                    ))}
                                </div>
                                <p className="jv-small mt-6 flex items-center gap-2">
                                    <EnvelopeIcon className="h-4 w-4 text-jv-accent" />
                                    Prefer to talk first?{" "}
                                    <Link href="/contact-us" className="text-[#a9c4ff] underline underline-offset-2">
                                        Book a 15-minute call
                                    </Link>
                                </p>
                                {flash?.error ? (
                                    <p className="mt-6 text-sm text-red-300">{flash.error}</p>
                                ) : null}
                            </div>
                        </div>
                    </Section>
                </main>
            </PageTheme>
        </>
    );
}
