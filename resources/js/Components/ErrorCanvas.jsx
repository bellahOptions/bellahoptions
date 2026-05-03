import { Link } from "@inertiajs/react";
import { motion } from "motion/react";
import { useEffect, useMemo, useRef } from "react";
import {
    ArrowPathIcon,
    ArrowRightIcon,
    BoltIcon,
    ExclamationTriangleIcon,
    HomeIcon,
    ShieldExclamationIcon,
    WifiIcon,
} from "@heroicons/react/24/outline";

const errorCopy = {
    400: {
        eyebrow: "Bad request",
        title: "That request got tangled.",
        message: "The page received something it could not understand. Try again from a fresh link.",
        icon: ExclamationTriangleIcon,
    },
    401: {
        eyebrow: "Authentication required",
        title: "You need to sign in first.",
        message: "This part of Bellah Options is protected. Sign in and you should be good to go.",
        icon: ShieldExclamationIcon,
    },
    403: {
        eyebrow: "Access denied",
        title: "This room has a velvet rope.",
        message: "Your account does not have permission to view this page.",
        icon: ShieldExclamationIcon,
    },
    404: {
        eyebrow: "Page missing",
        title: "This page slipped off the map.",
        message: "The link may be old, moved, or typed a little too creatively.",
        icon: ExclamationTriangleIcon,
    },
    419: {
        eyebrow: "Session expired",
        title: "Your session needs a refresh.",
        message: "For security, the page token expired. Refresh and try the action again.",
        icon: ArrowPathIcon,
    },
    429: {
        eyebrow: "Too many requests",
        title: "Give it a small breather.",
        message: "Too many actions landed too quickly. Wait a moment, then try again.",
        icon: BoltIcon,
    },
    500: {
        eyebrow: "Server error",
        title: "Something broke behind the curtain.",
        message: "The team has a trail to follow. Try again shortly or return home.",
        icon: BoltIcon,
    },
    503: {
        eyebrow: "Service unavailable",
        title: "We are tuning the engine.",
        message: "Bellah Options is temporarily unavailable. Please check back soon.",
        icon: WifiIcon,
    },
    client: {
        eyebrow: "App error",
        title: "The interface hit a snag.",
        message: "A browser-side error interrupted the page. Refreshing usually resets the flow.",
        icon: ExclamationTriangleIcon,
    },
};

export default function ErrorCanvas({
    status = 500,
    title,
    message,
    canGoBack = true,
}) {
    const canvasRef = useRef(null);
    const normalizedStatus = String(status || "500").toLowerCase();
    const copy = errorCopy[normalizedStatus] || errorCopy[Number(status)] || errorCopy[500];
    const Icon = copy.icon;

    const orbits = useMemo(() => Array.from({ length: 4 }, (_, index) => index), []);

    useEffect(() => {
        const canvas = canvasRef.current;
        const context = canvas?.getContext("2d");

        if (!canvas || !context) {
            return undefined;
        }

        let animationFrame = 0;
        let width = 0;
        let height = 0;
        const particles = Array.from({ length: 64 }, () => ({
            x: Math.random(),
            y: Math.random(),
            radius: Math.random() * 2.6 + 0.8,
            speed: Math.random() * 0.35 + 0.12,
            alpha: Math.random() * 0.35 + 0.15,
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
            gradient.addColorStop(0, "#02083f");
            gradient.addColorStop(0.45, "#000285");
            gradient.addColorStop(1, "#042f5f");
            context.fillStyle = gradient;
            context.fillRect(0, 0, width, height);

            for (const particle of particles) {
                particle.y -= particle.speed / height;

                if (particle.y < -0.02) {
                    particle.y = 1.02;
                    particle.x = Math.random();
                }

                context.beginPath();
                context.arc(particle.x * width, particle.y * height, particle.radius, 0, Math.PI * 2);
                context.fillStyle = `rgba(125, 211, 252, ${particle.alpha})`;
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
        <main className="relative min-h-screen overflow-hidden bg-[#02083f] text-white">
            <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" aria-hidden="true" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(34,211,238,0.16),transparent_36%),linear-gradient(180deg,rgba(2,8,63,0.06),rgba(2,8,63,0.72))]" />

            <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
                <motion.section
                    className="mx-auto max-w-4xl text-center"
                    initial={{ opacity: 0, y: 28 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                >
                    <div className="relative mx-auto mb-8 flex h-36 w-36 items-center justify-center">
                        {orbits.map((orbit) => (
                            <motion.span
                                key={orbit}
                                className="absolute rounded-full border border-cyan-200/20"
                                style={{
                                    inset: `${orbit * 10}px`,
                                }}
                                animate={{ rotate: orbit % 2 === 0 ? 360 : -360, scale: [1, 1.04, 1] }}
                                transition={{
                                    rotate: { duration: 12 + orbit * 4, repeat: Infinity, ease: "linear" },
                                    scale: { duration: 2.6 + orbit * 0.4, repeat: Infinity, ease: "easeInOut" },
                                }}
                            />
                        ))}
                        <motion.div
                            className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-white text-[#000285] shadow-2xl shadow-cyan-500/25"
                            animate={{ y: [0, -8, 0], rotate: [-2, 2, -2] }}
                            transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
                        >
                            <Icon className="h-12 w-12" />
                        </motion.div>
                    </div>

                    <motion.p
                        className="text-sm font-black uppercase tracking-[0.25em] text-cyan-200"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.12, duration: 0.45 }}
                    >
                        {copy.eyebrow}
                    </motion.p>

                    <motion.h1
                        className="mt-5 text-5xl font-black tracking-tight sm:text-7xl lg:text-8xl"
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                    >
                        {normalizedStatus === "client" ? "Oops" : status}
                    </motion.h1>

                    <motion.h2
                        className="mx-auto mt-6 max-w-3xl text-3xl font-black tracking-tight sm:text-5xl"
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.28, duration: 0.5 }}
                    >
                        {title || copy.title}
                    </motion.h2>

                    <motion.p
                        className="mx-auto mt-5 max-w-2xl text-base leading-8 text-blue-100 sm:text-lg"
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.36, duration: 0.5 }}
                    >
                        {message || copy.message}
                    </motion.p>

                    <motion.div
                        className="mt-9 flex flex-col justify-center gap-3 sm:flex-row"
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.46, duration: 0.45 }}
                    >
                        <Link
                            href="/"
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-black text-[#000285] transition hover:bg-cyan-50"
                        >
                            <HomeIcon className="h-5 w-5" />
                            Back Home
                        </Link>
                        {canGoBack && (
                            <button
                                type="button"
                                onClick={() => window.history.back()}
                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/25 bg-white/10 px-6 py-3 text-sm font-black text-white backdrop-blur transition hover:bg-white/15"
                            >
                                Try Previous Page
                                <ArrowRightIcon className="h-5 w-5" />
                            </button>
                        )}
                    </motion.div>
                </motion.section>
            </div>
        </main>
    );
}
