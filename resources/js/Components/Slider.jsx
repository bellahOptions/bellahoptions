import { Link } from "@inertiajs/react";
import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

const BACKGROUND_THEMES = {
    "particles-ocean": {
        gradient: "from-[#000285] via-[#0891b2] to-[#111827]",
        particleColors: ["#ffffff", "#67e8f9", "#c4b5fd"],
    },
    "particles-aurora": {
        gradient: "from-[#111827] via-[#2563eb] to-[#0f766e]",
        particleColors: ["#bfdbfe", "#67e8f9", "#93c5fd"],
    },
    "particles-cosmic": {
        gradient: "from-[#0f172a] via-[#7c3aed] to-[#0369a1]",
        particleColors: ["#ffffff", "#a78bfa", "#38bdf8"],
    },
};

const fallbackSlides = [
    {
        id: "fallback-1",
        slide_title: "Upgrade your Social Media!",
        text: "Get creative social media designs to power your online presence and drive sales.",
        slide_image: "",
        slide_background: "particles-ocean",
        slide_link: "/order/social-media-design",
        slide_link_text: "Get Started",
    },
    {
        id: "fallback-2",
        slide_title: "Automate your process",
        text: "Your website should work for you even when you are not online",
        slide_image: "",
        slide_background: "particles-aurora",
        slide_link: "/order/web-design",
        slide_link_text: "Create your Website",
    },
    {
        id: "fallback-3",
        slide_title: "Plan your app before launch",
        text: "A good creative strategy is the foundation of any successful project launch",
        slide_image: "",
        slide_background: "particles-cosmic",
        slide_link: "/order/brand-design",
        slide_link_text: "Start a Project",
    },
];

function slideImageSrc(path) {
    if (!path) {
        return "";
    }

    if (/^https?:\/\//i.test(path)) {
        return path;
    }

    return path.startsWith("/") ? path : `/${path}`;
}

function isExternalUrl(url) {
    return /^https?:\/\//i.test(url || "");
}

function normalizeBackgroundId(backgroundId) {
    if (!backgroundId) {
        return null;
    }

    const candidate = String(backgroundId).trim();

    return Object.prototype.hasOwnProperty.call(BACKGROUND_THEMES, candidate) ? candidate : null;
}

function resolveBackgroundTheme(backgroundId, index) {
    const validId = normalizeBackgroundId(backgroundId);
    if (validId) {
        return BACKGROUND_THEMES[validId];
    }

    const themes = Object.values(BACKGROUND_THEMES);

    return themes[index % themes.length];
}

export default function Slider({ slides = [] }) {
    const resolvedSlides = Array.isArray(slides) && slides.length > 2
        ? slides
        : fallbackSlides;
    const [particlesReady, setParticlesReady] = useState(false);

    useEffect(() => {
        let isMounted = true;

        initParticlesEngine(async (engine) => {
            await loadSlim(engine);
        }).then(() => {
            if (isMounted) {
                setParticlesReady(true);
            }
        });

        return () => {
            isMounted = false;
        };
    }, []);

    return (
        <Swiper
            className="h-[min(760px,calc(100svh-84px))] min-h-[520px] w-full sm:h-[min(800px,calc(100svh-96px))] sm:min-h-[600px]"
            modules={[Navigation, Pagination, Autoplay]}
            loop
            navigation
            pagination={{ type: "progressbar" }}
            autoplay={{ disableOnInteraction: true }}
        >
            {resolvedSlides.map((slide, index) => (
                <SwiperSlide key={slide.id ?? `${slide.slide_title}-${index}`}>
                    <div className="relative h-full">
                        <SlideVisual
                            slide={slide}
                            index={index}
                            particlesReady={particlesReady}
                        />
                        <motion.div
                            className="absolute inset-0 flex flex-col items-center justify-center bg-black/45 px-4 py-16 text-center text-white sm:px-6 lg:px-8"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5 }}
                        >
                            <motion.h2
                                className="max-w-4xl text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-7xl"
                                initial={{ opacity: 0, y: 24 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.55, delay: 0.12 }}
                            >
                                {slide.slide_title}
                            </motion.h2>
                            <motion.p
                                className="mt-5 max-w-2xl text-base leading-7 text-gray-100 sm:text-lg"
                                initial={{ opacity: 0, y: 18 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, delay: 0.22 }}
                            >
                                {slide.text}
                            </motion.p>
                            {slide.slide_link && (
                                <motion.div
                                    initial={{ opacity: 0, y: 14 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.45, delay: 0.32 }}
                                >
                                    {isExternalUrl(slide.slide_link) ? (
                                        <a
                                            href={slide.slide_link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="mt-8 inline-flex items-center justify-center rounded-md bg-white px-6 py-3 text-sm font-black text-[#000285] transition hover:bg-cyan-50"
                                        >
                                            {slide.slide_link_text || "Learn More"}
                                        </a>
                                    ) : (
                                        <Link
                                            href={slide.slide_link}
                                            className="mt-8 inline-flex items-center justify-center rounded-md bg-white px-6 py-3 text-sm font-black text-[#000285] transition hover:bg-cyan-50"
                                        >
                                            {slide.slide_link_text || "Learn More"}
                                        </Link>
                                    )}
                                </motion.div>
                            )}
                        </motion.div>
                    </div>
                </SwiperSlide>
            ))}
        </Swiper>
    );
}

function SlideVisual({ slide, index, particlesReady }) {
    const imageSrc = slideImageSrc(slide?.slide_image);
    const backgroundId = normalizeBackgroundId(slide?.slide_background);
    const [useFallback, setUseFallback] = useState(imageSrc === "");

    useEffect(() => {
        setUseFallback(imageSrc === "");
    }, [imageSrc]);

    if (useFallback) {
        return (
            <AnimatedParticlesBackground
                backgroundId={backgroundId}
                index={index}
                particlesReady={particlesReady}
            />
        );
    }

    return (
        <img
            src={imageSrc}
            alt={slide?.slide_title || `Slide ${index + 1}`}
            className="h-full w-full object-cover"
            onError={() => setUseFallback(true)}
        />
    );
}

function AnimatedParticlesBackground({ backgroundId, index, particlesReady }) {
    const options = useMemo(() => {
        const theme = resolveBackgroundTheme(backgroundId, index);

        return {
            fullScreen: { enable: false },
            fpsLimit: 120,
            particles: {
                number: {
                    value: 70,
                    density: { enable: true, area: 800 },
                },
                color: { value: theme.particleColors },
                links: {
                    enable: true,
                    color: "#ffffff",
                    opacity: 0.2,
                    distance: 140,
                    width: 1,
                },
                move: {
                    enable: true,
                    speed: 1.1,
                    outModes: { default: "out" },
                },
                opacity: { value: { min: 0.15, max: 0.6 } },
                size: { value: { min: 1, max: 3 } },
            },
            interactivity: {
                events: {
                    onHover: { enable: true, mode: "grab" },
                },
                modes: {
                    grab: {
                        distance: 160,
                        links: { opacity: 0.45 },
                    },
                },
            },
            detectRetina: true,
        };
    }, [backgroundId, index]);

    const theme = resolveBackgroundTheme(backgroundId, index);

    return (
        <div className={`relative h-full w-full overflow-hidden bg-gradient-to-br ${theme.gradient}`}>
            {particlesReady && (
                <Particles
                    id={`slide-particles-${index}`}
                    className="absolute inset-0 h-full w-full"
                    options={options}
                />
            )}
            <motion.div
                className="absolute -left-24 top-12 h-28 w-[70vw] rotate-[-18deg] bg-white/15 blur-2xl"
                animate={{ x: ["-12%", "18%", "-12%"], opacity: [0.25, 0.45, 0.25] }}
                transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
                className="absolute bottom-12 right-[-10%] h-36 w-[80vw] rotate-[-18deg] bg-cyan-200/20 blur-2xl"
                animate={{ x: ["12%", "-16%", "12%"], opacity: [0.2, 0.5, 0.2] }}
                transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
                className="absolute inset-0 opacity-30"
                style={{
                    backgroundImage: "linear-gradient(rgba(255,255,255,0.22) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.22) 1px, transparent 1px)",
                    backgroundSize: "56px 56px",
                }}
                animate={{ backgroundPosition: ["0px 0px", "56px 56px"] }}
                transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
            />
        </div>
    );
}
