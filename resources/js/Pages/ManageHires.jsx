import { Head, Link } from "@inertiajs/react";
import { useEffect, useRef } from "react";
import PageTheme from "@/Layouts/PageTheme";
import { RevealSection, Stagger, StaggerItem } from "@/Components/MotionReveal";
import {
    CheckCircleIcon,
    ChatBubbleLeftRightIcon,
    SparklesIcon,
    UserGroupIcon,
} from "@heroicons/react/24/outline";

const formatNaira = (amount) => new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
}).format(Number(amount || 0));

function CanvasHero({ eyebrow, title, description, whatsappUrl }) {
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
            radius: Math.random() * 2.4 + 0.6,
            speed: Math.random() * 0.3 + 0.08,
            drift: (Math.random() - 0.5) * 0.06,
            alpha: Math.random() * 0.35 + 0.12,
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

            const gradient = context.createLinearGradient(0, 0, width, height);
            gradient.addColorStop(0, "#02063f");
            gradient.addColorStop(0.5, "#050a80");
            gradient.addColorStop(1, "#0b1a8f");
            context.fillStyle = gradient;
            context.fillRect(0, 0, width, height);

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
                context.fillStyle = `rgba(186, 210, 255, ${particle.alpha})`;
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
        <div className="relative isolate overflow-hidden">
            <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden="true" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(125,211,252,0.16),transparent_38%),linear-gradient(180deg,rgba(2,6,63,0.05),rgba(2,6,63,0.55))]" />

            <div className="relative z-10 mx-auto max-w-5xl px-4 py-24 text-center sm:px-6 sm:py-32 lg:px-8">
                <RevealSection>
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-black uppercase tracking-[0.2em] text-cyan-100 backdrop-blur-sm">
                        <SparklesIcon className="h-4 w-4" />
                        {eyebrow}
                    </span>
                    <h1 className="mt-6 text-4xl font-black leading-[1.05] tracking-tight text-white sm:text-5xl lg:text-6xl">
                        {title}
                    </h1>
                    <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-blue-100 sm:text-lg">
                        {description}
                    </p>

                    <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
                        <a
                            href="#plans"
                            className="inline-flex items-center justify-center gap-2 rounded-md bg-white px-6 py-3 text-sm font-black text-brand transition hover:-translate-y-0.5 hover:bg-cyan-50"
                        >
                            View Plans
                        </a>
                        {whatsappUrl ? (
                            <a
                                href={whatsappUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center gap-2 rounded-md border border-white/30 px-6 py-3 text-sm font-black text-white transition hover:bg-white/10"
                            >
                                <ChatBubbleLeftRightIcon className="h-4 w-4" />
                                Discuss Scope
                            </a>
                        ) : null}
                    </div>
                </RevealSection>
            </div>
        </div>
    );
}

export default function ManageHires({ whatsappUrl = "", packages = {} }) {
    const planEntries = Object.entries(packages || {});

    return (
        <>
            <Head title="Manage Your Hires" />

            <PageTheme>
                <main className="bg-white text-gray-950">
                    <CanvasHero
                        eyebrow="Dedicated Design Retainer"
                        title="Manage Your Hires"
                        description="Unlimited design requests managed by a dedicated Bellah Options creative team — no full-time hires, no hiring headaches."
                        whatsappUrl={whatsappUrl}
                    />

                    <RevealSection id="plans" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
                        <div className="mx-auto max-w-2xl text-center">
                            <p className="text-sm font-black uppercase tracking-[0.22em] text-brand">Monthly Plans</p>
                            <h2 className="mt-3 text-3xl font-black tracking-tight text-gray-950 sm:text-4xl">
                                Pick the coverage your brand needs.
                            </h2>
                            <p className="mt-4 text-sm leading-7 text-gray-600">
                                Both plans cover design services only and exclude UI/UX. Cancel or change plans anytime.
                            </p>
                        </div>

                        <Stagger className="mx-auto mt-12 grid max-w-4xl gap-6 sm:grid-cols-2">
                            {planEntries.map(([code, pack]) => {
                                const isFeatured = Boolean(pack?.is_recommended);
                                const features = Array.isArray(pack?.features) ? pack.features : [];

                                return (
                                    <StaggerItem
                                        key={code}
                                        as="article"
                                        className={`relative flex flex-col rounded-2xl border p-8 shadow-sm ${
                                            isFeatured
                                                ? "border-brand bg-brand text-white shadow-lg shadow-brand/20"
                                                : "border-gray-200 bg-white"
                                        }`}
                                    >
                                        {isFeatured && (
                                            <span className="absolute -top-3 left-8 rounded-full bg-white px-3 py-1 text-xs font-black uppercase tracking-wide text-brand">
                                                Most Popular
                                            </span>
                                        )}

                                        <div className="flex items-center gap-2">
                                            <UserGroupIcon className={`h-6 w-6 ${isFeatured ? "text-cyan-200" : "text-brand"}`} />
                                            <h3 className={`text-xl font-black ${isFeatured ? "text-white" : "text-gray-950"}`}>
                                                {pack?.name || code}
                                            </h3>
                                        </div>

                                        <p className={`mt-4 text-3xl font-black ${isFeatured ? "text-white" : "text-gray-950"}`}>
                                            {formatNaira(pack?.price)}
                                            <span className={`text-sm font-semibold ${isFeatured ? "text-blue-100" : "text-gray-500"}`}> / month</span>
                                        </p>

                                        <p className={`mt-2 text-sm leading-6 ${isFeatured ? "text-blue-100" : "text-gray-600"}`}>
                                            {pack?.description}
                                        </p>

                                        <ul className="mt-6 flex-1 space-y-3">
                                            {features.map((feature) => (
                                                <li key={feature} className="flex items-start gap-2">
                                                    <CheckCircleIcon className={`mt-0.5 h-5 w-5 shrink-0 ${isFeatured ? "text-cyan-200" : "text-brand"}`} />
                                                    <span className={`text-sm font-semibold ${isFeatured ? "text-white" : "text-gray-800"}`}>
                                                        {feature}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>

                                        <Link
                                            href={`${route("orders.create", "manage-hires")}?package=${code}`}
                                            className={`mt-8 inline-flex items-center justify-center rounded-md px-5 py-3 text-sm font-black transition ${
                                                isFeatured
                                                    ? "bg-white text-brand hover:bg-cyan-50"
                                                    : "bg-brand text-white hover:bg-brand-dark"
                                            }`}
                                        >
                                            Start This Plan
                                        </Link>
                                    </StaggerItem>
                                );
                            })}
                        </Stagger>

                        <p className="mx-auto mt-8 max-w-2xl rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm font-semibold text-amber-900">
                            UI/UX design is excluded from both plans.
                        </p>

                        {whatsappUrl ? (
                            <div className="mt-6 text-center">
                                <a
                                    href={whatsappUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center gap-2 text-sm font-black text-brand hover:text-brand-dark"
                                >
                                    <ChatBubbleLeftRightIcon className="h-4 w-4" />
                                    Not sure which plan fits? Discuss scope with us on WhatsApp.
                                </a>
                            </div>
                        ) : null}
                    </RevealSection>
                </main>
            </PageTheme>
        </>
    );
}
