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
        content_media_type: "",
        content_media_path: "",
        layout_style: "center",
        content_alignment: "center",
        title_animation: "fade-up",
        text_animation: "fade-up",
        media_animation: "zoom-in",
        button_animation: "fade-up",
        slide_link: "/order/social-media-design",
        slide_link_text: "Get Started",
    },
    {
        id: "fallback-2",
        slide_title: "Automate your process",
        text: "Your website should work for you even when you are not online",
        slide_image: "",
        slide_background: "particles-aurora",
        content_media_type: "",
        content_media_path: "",
        layout_style: "center",
        content_alignment: "center",
        title_animation: "fade-up",
        text_animation: "fade-up",
        media_animation: "zoom-in",
        button_animation: "fade-up",
        slide_link: "/order/web-design",
        slide_link_text: "Create your Website",
    },
    {
        id: "fallback-3",
        slide_title: "Plan your app before launch",
        text: "A good creative strategy is the foundation of any successful project launch",
        slide_image: "",
        slide_background: "particles-cosmic",
        content_media_type: "",
        content_media_path: "",
        layout_style: "center",
        content_alignment: "center",
        title_animation: "fade-up",
        text_animation: "fade-up",
        media_animation: "zoom-in",
        button_animation: "fade-up",
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

function normalizeLayoutStyle(value) {
    const candidate = String(value || "").trim().toLowerCase();

    return ["center", "split-left", "split-right"].includes(candidate) ? candidate : "center";
}

function normalizeContentAlignment(value) {
    const candidate = String(value || "").trim().toLowerCase();

    return ["left", "center"].includes(candidate) ? candidate : "center";
}

function normalizeAnimation(value, fallback = "fade-up") {
    const candidate = String(value || "").trim().toLowerCase();

    return ["fade-up", "fade-down", "slide-left", "slide-right", "zoom-in", "none"].includes(candidate)
        ? candidate
        : fallback;
}

function normalizeContentMediaType(value, path) {
    const candidate = String(value || "").trim().toLowerCase();
    if (["image", "video"].includes(candidate)) {
        return candidate;
    }

    const normalizedPath = String(path || "").split(/[?#]/)[0] || "";
    const extension = normalizedPath.includes(".") ? normalizedPath.split(".").pop()?.toLowerCase() : "";

    return ["mp4", "webm", "ogg", "mov"].includes(extension || "") ? "video" : "image";
}

function resolveBackgroundTheme(backgroundId, index) {
    const validId = normalizeBackgroundId(backgroundId);
    if (validId) {
        return BACKGROUND_THEMES[validId];
    }

    const themes = Object.values(BACKGROUND_THEMES);

    return themes[index % themes.length];
}

function resolveAnimationVariant(style) {
    const animation = normalizeAnimation(style);

    const presets = {
        "fade-up": {
            hidden: { opacity: 0, y: 26 },
            visible: { opacity: 1, y: 0 },
        },
        "fade-down": {
            hidden: { opacity: 0, y: -26 },
            visible: { opacity: 1, y: 0 },
        },
        "slide-left": {
            hidden: { opacity: 0, x: 34 },
            visible: { opacity: 1, x: 0 },
        },
        "slide-right": {
            hidden: { opacity: 0, x: -34 },
            visible: { opacity: 1, x: 0 },
        },
        "zoom-in": {
            hidden: { opacity: 0, scale: 0.92 },
            visible: { opacity: 1, scale: 1 },
        },
        none: {
            hidden: { opacity: 1, x: 0, y: 0, scale: 1 },
            visible: { opacity: 1, x: 0, y: 0, scale: 1 },
        },
    };

    return presets[animation] || presets["fade-up"];
}

function SlideCallToAction({ slide, children }) {
    if (!slide.slide_link) {
        return null;
    }

    if (isExternalUrl(slide.slide_link)) {
        return (
            <a
                href={slide.slide_link}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 inline-flex items-center justify-center rounded-md bg-white px-6 py-3 text-sm font-black text-[#000285] transition hover:bg-cyan-50"
            >
                {children}
            </a>
        );
    }

    return (
        <Link
            href={slide.slide_link}
            className="mt-8 inline-flex items-center justify-center rounded-md bg-white px-6 py-3 text-sm font-black text-[#000285] transition hover:bg-cyan-50"
        >
            {children}
        </Link>
    );
}

function ForegroundMedia({ slide, mediaAnimation }) {
    const path = slideImageSrc(slide?.content_media_path);
    if (!path) {
        return null;
    }

    const mediaType = normalizeContentMediaType(slide?.content_media_type, path);

    return (
        <motion.div
            className="relative overflow-hidden rounded-2xl border border-white/25 bg-white/10 shadow-2xl backdrop-blur-sm"
            initial={resolveAnimationVariant(mediaAnimation).hidden}
            animate={resolveAnimationVariant(mediaAnimation).visible}
            transition={{ duration: 0.55, delay: 0.2, ease: "easeOut" }}
        >
            {mediaType === "video" ? (
                <video
                    src={path}
                    className="h-[260px] w-full object-cover sm:h-[320px] lg:h-[360px]"
                    autoPlay
                    loop
                    muted
                    playsInline
                    controls
                />
            ) : (
                <img
                    src={path}
                    alt={slide?.slide_title || "Slide media"}
                    className="h-[260px] w-full object-cover sm:h-[320px] lg:h-[360px]"
                />
            )}
        </motion.div>
    );
}

function SlideContent({ slide, index }) {
    const layoutStyle = normalizeLayoutStyle(slide?.layout_style);
    const contentAlignment = normalizeContentAlignment(slide?.content_alignment);
    const titleAnimation = normalizeAnimation(slide?.title_animation, "fade-up");
    const textAnimation = normalizeAnimation(slide?.text_animation, "fade-up");
    const mediaAnimation = normalizeAnimation(slide?.media_animation, "zoom-in");
    const buttonAnimation = normalizeAnimation(slide?.button_animation, "fade-up");

    const hasForegroundMedia = Boolean(slideImageSrc(slide?.content_media_path));
    const useSplitLayout = hasForegroundMedia && layoutStyle !== "center";
    const mediaFirst = useSplitLayout && layoutStyle === "split-left";

    const textAlignClass = contentAlignment === "left" ? "text-left" : "text-center";
    const textContainerAlignmentClass = contentAlignment === "left" ? "items-start" : "items-center";

    if (useSplitLayout) {
        return (
            <motion.div
                className="absolute inset-0 bg-black/50 px-4 py-16 text-white sm:px-6 lg:px-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.45 }}
            >
                <div className="mx-auto grid h-full w-full max-w-7xl items-center gap-8 lg:grid-cols-2">
                    <div className={`flex flex-col ${textContainerAlignmentClass} ${textAlignClass} ${mediaFirst ? 'order-2 lg:order-2' : 'order-1'}`}>
                        <motion.h2
                            className="max-w-3xl text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl"
                            initial={resolveAnimationVariant(titleAnimation).hidden}
                            animate={resolveAnimationVariant(titleAnimation).visible}
                            transition={{ duration: 0.58, delay: 0.1, ease: "easeOut" }}
                        >
                            {slide.slide_title}
                        </motion.h2>
                        <motion.p
                            className="mt-5 max-w-2xl text-base leading-7 text-gray-100 sm:text-lg"
                            initial={resolveAnimationVariant(textAnimation).hidden}
                            animate={resolveAnimationVariant(textAnimation).visible}
                            transition={{ duration: 0.54, delay: 0.2, ease: "easeOut" }}
                        >
                            {slide.text}
                        </motion.p>
                        {slide.slide_link && (
                            <motion.div
                                initial={resolveAnimationVariant(buttonAnimation).hidden}
                                animate={resolveAnimationVariant(buttonAnimation).visible}
                                transition={{ duration: 0.5, delay: 0.32, ease: "easeOut" }}
                            >
                                <SlideCallToAction slide={slide}>
                                    {slide.slide_link_text || "Learn More"}
                                </SlideCallToAction>
                            </motion.div>
                        )}
                    </div>

                    <div className={`${mediaFirst ? 'order-1 lg:order-1' : 'order-2'} w-full`}>
                        <ForegroundMedia slide={slide} mediaAnimation={mediaAnimation} />
                    </div>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center bg-black/45 px-4 py-16 text-center text-white sm:px-6 lg:px-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.45 }}
        >
            <motion.h2
                className="max-w-4xl text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-7xl"
                initial={resolveAnimationVariant(titleAnimation).hidden}
                animate={resolveAnimationVariant(titleAnimation).visible}
                transition={{ duration: 0.55, delay: 0.12, ease: "easeOut" }}
            >
                {slide.slide_title}
            </motion.h2>
            <motion.p
                className="mt-5 max-w-2xl text-base leading-7 text-gray-100 sm:text-lg"
                initial={resolveAnimationVariant(textAnimation).hidden}
                animate={resolveAnimationVariant(textAnimation).visible}
                transition={{ duration: 0.5, delay: 0.22, ease: "easeOut" }}
            >
                {slide.text}
            </motion.p>

            {hasForegroundMedia && (
                <div className="mt-8 w-full max-w-3xl">
                    <ForegroundMedia slide={slide} mediaAnimation={mediaAnimation} />
                </div>
            )}

            {slide.slide_link && (
                <motion.div
                    initial={resolveAnimationVariant(buttonAnimation).hidden}
                    animate={resolveAnimationVariant(buttonAnimation).visible}
                    transition={{ duration: 0.45, delay: hasForegroundMedia ? 0.4 : 0.32, ease: "easeOut" }}
                >
                    <SlideCallToAction slide={slide}>
                        {slide.slide_link_text || "Learn More"}
                    </SlideCallToAction>
                </motion.div>
            )}
        </motion.div>
    );
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
                        <SlideContent slide={slide} index={index} />
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
