import { Head } from "@inertiajs/react";
import { useEffect, useRef } from "react";
import PageTheme from "@/Layouts/PageTheme";
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
    ChatBubbleLeftRightIcon,
    SparklesIcon,
    UserGroupIcon,
} from "@heroicons/react/24/outline";

const formatNaira = (amount) => new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
}).format(Number(amount || 0));

function ParticleCanvas() {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const context = canvas?.getContext("2d");

        if (!canvas || !context) {
            return undefined;
        }

        let animationFrame = 0;
        let width = 0;
        let height = 0;
        const particles = Array.from({ length: 70 }, () => ({
            x: Math.random(),
            y: Math.random(),
            radius: Math.random() * 2.2 + 0.5,
            speed: Math.random() * 0.3 + 0.08,
            drift: (Math.random() - 0.5) * 0.06,
            alpha: Math.random() * 0.35 + 0.1,
        }));

        const resize = () => {
            const ratio = window.devicePixelRatio || 1;
            width = canvas.offsetWidth;
            height = canvas.offsetHeight;
            canvas.width = width * ratio;
            canvas.height = height * ratio;
            context.setTransform(ratio, 0, 0, ratio, 0, 0);
        };

        const draw = () => {
            context.clearRect(0, 0, width, height);

            for (const particle of particles) {
                particle.y -= particle.speed / height;
                particle.x += particle.drift / width;

                if (particle.y < -0.02) {
                    particle.y = 1.02;
                    particle.x = Math.random();
                }

                if (particle.x < -0.02 || particle.x > 1.02) {
                    particle.x = Math.random();
                }

                context.beginPath();
                context.arc(particle.x * width, particle.y * height, particle.radius, 0, Math.PI * 2);
                context.fillStyle = `rgba(120, 165, 255, ${particle.alpha})`;
                context.fill();
            }

            animationFrame = window.requestAnimationFrame(draw);
        };

        resize();
        draw();
        window.addEventListener("resize", resize);

        return () => {
            window.cancelAnimationFrame(animationFrame);
            window.removeEventListener("resize", resize);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 h-full w-full opacity-70"
            aria-hidden="true"
        />
    );
}

export default function ManageHires({ whatsappUrl = "", packages = {} }) {
    const planEntries = Object.entries(packages || {});

    return (
        <>
            <Head title="Manage Your Hires" />

            <PageTheme>
                <main className="text-white">
                    {/* ── HERO ── */}
                    <section className="jv-glow relative isolate overflow-hidden pt-16 pb-14 sm:pt-20 sm:pb-16 lg:pt-24 lg:pb-20">
                        <ParticleCanvas />
                        <div
                            aria-hidden="true"
                            className="absolute inset-0 bg-gradient-to-b from-transparent via-[#08080c]/60 to-jv-bg"
                        />
                        <div
                            aria-hidden="true"
                            className="pointer-events-none absolute -top-32 left-1/2 h-72 w-[min(760px,110%)] -translate-x-1/2 bg-[radial-gradient(closest-side,rgba(0,85,255,0.45),transparent_72%)]"
                        />

                        <div className="jv-container relative">
                            <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
                                <Eyebrow>
                                    <SparklesIcon className="h-3.5 w-3.5" />
                                    Dedicated Design Retainer
                                </Eyebrow>
                                <h1 className="jv-display jv-display--xl mt-6">
                                    Manage Your Hires
                                </h1>
                                <p className="jv-lead mx-auto mt-6 max-w-2xl">
                                    Unlimited design requests managed by a dedicated Bellah
                                    Options creative team — no full-time hires, no hiring
                                    headaches.
                                </p>

                                <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
                                    <Button href="#plans" variant="primary" size="lg" icon>
                                        View Plans
                                    </Button>
                                    {whatsappUrl ? (
                                        <Button
                                            href={whatsappUrl}
                                            external
                                            variant="ghost"
                                            size="lg"
                                        >
                                            <ChatBubbleLeftRightIcon className="h-4 w-4" />
                                            Discuss Scope
                                        </Button>
                                    ) : null}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ── PLANS ── */}
                    <Section id="plans" className="border-t border-jv-line">
                        <SectionHeading
                            eyebrow="Monthly plans"
                            title="Pick the coverage"
                            muted="your brand needs."
                            description="Both plans cover design services only and exclude UI/UX. Cancel or change plans anytime."
                        />

                        <Stagger className="mx-auto mt-14 grid max-w-4xl gap-6 sm:grid-cols-2">
                            {planEntries.map(([code, pack]) => {
                                const isFeatured = Boolean(pack?.is_recommended);
                                const features = Array.isArray(pack?.features)
                                    ? pack.features
                                    : [];

                                return (
                                    <StaggerItem
                                        key={code}
                                        as="article"
                                        className="relative flex h-full flex-col"
                                    >
                                        <Card
                                            hover
                                            featured={isFeatured}
                                            className="flex h-full flex-col"
                                        >
                                            {isFeatured && (
                                                <span className="jv-tag mb-6 self-start border-transparent bg-jv-accent text-white">
                                                    Most Popular
                                                </span>
                                            )}

                                            <div className="flex items-center gap-2.5">
                                                <span className="inline-flex h-10 w-10 items-center justify-center rounded-jv-sm border border-jv-line-strong bg-white/[0.06] text-jv-accent">
                                                    <UserGroupIcon className="h-5 w-5" />
                                                </span>
                                                <h3 className="text-xl font-semibold tracking-tight text-white">
                                                    {pack?.name || code}
                                                </h3>
                                            </div>

                                            <div className="mt-7 flex items-end gap-2">
                                                <p className="jv-display jv-display--md">
                                                    {formatNaira(pack?.price)}
                                                </p>
                                                <p className="jv-small pb-1.5">/ month</p>
                                            </div>

                                            {pack?.description ? (
                                                <p className="jv-body mt-4">
                                                    {pack.description}
                                                </p>
                                            ) : null}

                                            {features.length > 0 ? (
                                                <ul className="mt-7 flex-1 space-y-3 border-t border-jv-line pt-6">
                                                    {features.map((feature) => (
                                                        <CheckItem key={feature}>{feature}</CheckItem>
                                                    ))}
                                                </ul>
                                            ) : null}

                                            <Button
                                                href={`${route("orders.create", "manage-hires")}?package=${code}`}
                                                variant={isFeatured ? "primary" : "outline"}
                                                icon
                                                className="mt-9 w-full"
                                            >
                                                Start This Plan
                                            </Button>
                                        </Card>
                                    </StaggerItem>
                                );
                            })}
                        </Stagger>

                        <div className="mx-auto mt-8 max-w-2xl">
                            <div className="jv-card flex items-start gap-3 border-jv-line-strong bg-jv-accent/[0.08] px-5 py-4">
                                <SparklesIcon className="mt-0.5 h-4 w-4 shrink-0 text-jv-accent" />
                                <p className="jv-body">
                                    UI/UX design is excluded from both plans.
                                </p>
                            </div>
                        </div>

                        {whatsappUrl ? (
                            <div className="mt-8 flex justify-center">
                                <Button href={whatsappUrl} external variant="ghost" size="lg">
                                    <ChatBubbleLeftRightIcon className="h-4 w-4" />
                                    Not sure which plan fits? Discuss scope on WhatsApp
                                </Button>
                            </div>
                        ) : null}
                    </Section>

                    {/* ── CLOSING ── */}
                    <Section tight>
                        <div className="jv-card jv-grid-bg relative overflow-hidden p-8 text-center sm:p-12">
                            <div
                                aria-hidden="true"
                                className="pointer-events-none absolute -top-28 left-1/2 h-64 w-[min(680px,110%)] -translate-x-1/2 bg-[radial-gradient(closest-side,rgba(0,85,255,0.35),transparent_72%)]"
                            />
                            <div className="relative mx-auto flex max-w-2xl flex-col items-center">
                                <Eyebrow>Why a retainer</Eyebrow>
                                <Display size="md" className="mt-6">
                                    Steady design output without the hiring overhead.
                                </Display>
                                <p className="jv-lead mt-5">
                                    Queue requests, keep one consistent visual voice, and scale
                                    the volume up or down as your calendar changes.
                                </p>
                                <div className="mt-8 flex flex-wrap justify-center gap-3">
                                    <Button href="/contact-us" variant="primary" icon>
                                        Talk to us
                                    </Button>
                                    <Button href="/gallery" variant="ghost">
                                        See our work
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
