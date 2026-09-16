import { Link } from "@inertiajs/react";
import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

const BACKGROUND_THEMES = {
    "particles-ocean": {
        gradient: "from-[#050508] via-[#0a1a4d] to-[#050508]",
        particleColors: ["#ffffff", "#4d8bff", "#0055ff"],
    },
    "particles-aurora": {
        gradient: "from-[#050508] via-[#0b2280] to-[#050508]",
        particleColors: ["#bfdbfe", "#6d9bff", "#0055ff"],
    },
    "particles-cosmic": {
        gradient: "from-[#050508] via-[#101a5c] to-[#050508]",
        particleColors: ["#ffffff", "#93b4ff", "#4d8bff"],
    },
    "particles-sunset": {
        gradient: "from-[#050508] via-[#0d2fa8] to-[#050508]",
        particleColors: ["#dbe7ff", "#79a6ff", "#0055ff"],
    },
    "particles-nebula": {
        gradient: "from-[#050508] via-[#131a6e] to-[#050508]",
        particleColors: ["#e0e8ff", "#a8c0ff", "#6d9bff"],
    },
    "particles-forest": {
        gradient: "from-[#050508] via-[#062a5c] to-[#050508]",
        particleColors: ["#d1fae5", "#7cc4ff", "#0055ff"],
    },
    "particles-midnight": {
        gradient: "from-[#020205] via-[#0a1c66] to-[#050508]",
        particleColors: ["#dbeafe", "#93c5fd", "#0055ff"],
    },
    "particles-ember": {
        gradient: "from-[#050508] via-[#1b2bb0] to-[#050508]",
        particleColors: ["#e8eeff", "#8fb2ff", "#3d78ff"],
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
        content_media_position: "center",
        content_media_alignment: "center",
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
        content_media_position: "center",
        content_media_alignment: "center",
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
        content_media_position: "center",
        content_media_alignment: "center",
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

function normalizeContentMediaPosition(value) {
    const candidate = String(value || "").trim().toLowerCase();

    return ["top", "center", "bottom"].includes(candidate) ? candidate : "center";
}

function normalizeContentMediaAlignment(value) {
    const candidate = String(value || "").trim().toLowerCase();

    return ["left", "center", "right"].includes(candidate) ? candidate : "center";
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

    const className =
        "jv-btn jv-btn--primary jv-btn--lg jv-group mt-9";

    if (isExternalUrl(slide.slide_link)) {
        return (
            <a
                href={slide.slide_link}
                target="_blank"
                rel="noopener noreferrer"
                className={className}
            >
                {children}
                <span className="jv-btn-arrow h-7 w-7">
                    <ArrowRightIcon className="h-3.5 w-3.5" />
                </span>
            </a>
        );
    }

    return (
        <Link href={slide.slide_link} className={className}>
            {children}
            <span className="jv-btn-arrow h-7 w-7">
                <ArrowRightIcon className="h-3.5 w-3.5" />
            </span>
        </Link>
    );
}

function ForegroundMedia({ slide, mediaAnimation, mediaPosition = "center", mediaAlignment = "center" }) {
    const path = slideImageSrc(slide?.content_media_path);
    if (!path) {
        return null;
    }

    const mediaType = normalizeContentMediaType(slide?.content_media_type, path);
    const positionClass = mediaPosition === "top"
        ? "object-top"
        : mediaPosition === "bottom"
            ? "object-bottom"
            : "object-center";
    const alignmentClass = mediaAlignment === "left"
        ? "object-left"
        : mediaAlignment === "right"
            ? "object-right"
            : "object-center";

    return (
        <motion.div
            className="jv-media relative overflow-hidden"
            initial={resolveAnimationVariant(mediaAnimation).hidden}
            animate={resolveAnimationVariant(mediaAnimation).visible}
            transition={{ duration: 0.55, delay: 0.2, ease: "easeOut" }}
        >
            {mediaType === "video" ? (
                <video
                    src={path}
                    className={`h-[260px] w-full object-cover ${positionClass} ${alignmentClass} sm:h-[320px] lg:h-[360px]`}
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
                    className={`h-[260px] w-full object-cover ${positionClass} ${alignmentClass} sm:h-[320px] lg:h-[360px]`}
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
    const mediaPosition = normalizeContentMediaPosition(slide?.content_media_position);
    const mediaAlignment = normalizeContentMediaAlignment(slide?.content_media_alignment);

    const hasForegroundMedia = Boolean(slideImageSrc(slide?.content_media_path));
    const useSplitLayout = hasForegroundMedia && layoutStyle !== "center";
    const mediaFirst = useSplitLayout && layoutStyle === "split-left";

    const textAlignClass = contentAlignment === "left" ? "text-left" : "text-center";
    const textContainerAlignmentClass = contentAlignment === "left" ? "items-start" : "items-center";

    if (useSplitLayout) {
        return (
            <motion.div
                className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/55 to-black/75 px-4 py-20 text-white sm:px-6 lg:px-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.45 }}
            >
                <div className="jv-container grid h-full w-full items-center gap-10 lg:grid-cols-2">
                    <div className={`flex flex-col ${textContainerAlignmentClass} ${textAlignClass} ${mediaFirst ? 'order-2 lg:order-2' : 'order-1'}`}>
                        <motion.h2
                            className="jv-display jv-display--xl max-w-3xl"
                            initial={resolveAnimationVariant(titleAnimation).hidden}
                            animate={resolveAnimationVariant(titleAnimation).visible}
                            transition={{ duration: 0.58, delay: 0.1, ease: "easeOut" }}
                        >
                            {slide.slide_title}
                        </motion.h2>
                        <motion.p
                            className="jv-lead mt-6 max-w-2xl"
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
                        <ForegroundMedia
                            slide={slide}
                            mediaAnimation={mediaAnimation}
                            mediaPosition={mediaPosition}
                            mediaAlignment={mediaAlignment}
                        />
                    </div>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-black/65 via-black/50 to-black/75 px-4 py-20 text-center text-white sm:px-6 lg:px-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.45 }}
        >
            <motion.h2
                className="jv-display jv-display--xl max-w-4xl"
                initial={resolveAnimationVariant(titleAnimation).hidden}
                animate={resolveAnimationVariant(titleAnimation).visible}
                transition={{ duration: 0.55, delay: 0.12, ease: "easeOut" }}
            >
                {slide.slide_title}
            </motion.h2>
            <motion.p
                className="jv-lead mt-6 max-w-2xl"
                initial={resolveAnimationVariant(textAnimation).hidden}
                animate={resolveAnimationVariant(textAnimation).visible}
                transition={{ duration: 0.5, delay: 0.22, ease: "easeOut" }}
            >
                {slide.text}
            </motion.p>

            {hasForegroundMedia && (
                <div className="mt-9 w-full max-w-3xl">
                    <ForegroundMedia
                        slide={slide}
                        mediaAnimation={mediaAnimation}
                        mediaPosition={mediaPosition}
                        mediaAlignment={mediaAlignment}
                    />
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
    const hasRealSlides = Array.isArray(slides) && slides.length > 0;
    const resolvedSlides = hasRealSlides ? slides : fallbackSlides;
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

    const heightClass =
        "h-[min(760px,calc(100svh-84px))] min-h-[520px] w-full sm:h-[min(800px,calc(100svh-96px))] sm:min-h-[600px]";

    // With no admin-authored slides we render one branded hero rather than an
    // empty carousel, so the homepage always opens with a real statement.
    if (!hasRealSlides) {
        return (
            <section className={`relative overflow-hidden ${heightClass}`}>
                <SlideVisual slide={{ slide_background: "particles-midnight" }} index={0} particlesReady={particlesReady} />
                <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/45 to-jv-bg" />
                {/* absolute inset-0 rather than h-full: percentage heights do not
                    resolve against the arbitrary-value section height, which would
                    drop this block into flow *below* the absolute siblings. */}
                <div className="jv-container absolute inset-0 flex flex-col items-center justify-center text-center">
                    <motion.span
                        className="jv-kicker jv-kicker--center jv-kicker--strong"
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                    >
                        Your creative partner
                    </motion.span>

                    <motion.h1
                        className="jv-display jv-display--xl mt-7 max-w-4xl"
                        initial={{ opacity: 0, y: 22 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.08, ease: "easeOut" }}
                    >
                        Ideas Are Visions.
                        <br />
                        <span className="jv-muted">Design Is How We Deliver Them.</span>
                    </motion.h1>

                    <motion.p
                        className="jv-lead mx-auto mt-7 max-w-2xl"
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.55, delay: 0.18, ease: "easeOut" }}
                    >
                        At Bellah Options, we turn ideas into experiences — building brands that
                        are seen, felt, and remembered. We make it easy to bring your ideas to
                        life, guiding you from concept to fully launched brand.
                    </motion.p>

                    <motion.div
                        className="mt-10 flex flex-wrap items-center justify-center gap-3"
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
                    >
                        <Link href="/gallery" className="jv-btn jv-btn--primary jv-btn--lg jv-group">
                            See Our Work
                            <span className="jv-btn-arrow h-7 w-7">
                                <ArrowRightIcon className="h-3.5 w-3.5" />
                            </span>
                        </Link>
                        <Link href="/contact-us" className="jv-btn jv-btn--ghost jv-btn--lg">
                            Book a call
                        </Link>
                    </motion.div>
                </div>

                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-jv-bg" />
            </section>
        );
    }

    return (
        <Swiper
            className={heightClass}
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
                className="absolute -left-24 top-12 h-28 w-[70vw] rotate-[-18deg] bg-jv-accent/20 blur-2xl"
                animate={{ x: ["-12%", "18%", "-12%"], opacity: [0.25, 0.45, 0.25] }}
                transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
                className="absolute bottom-12 right-[-10%] h-36 w-[80vw] rotate-[-18deg] bg-[#4d8bff]/20 blur-2xl"
                animate={{ x: ["12%", "-16%", "12%"], opacity: [0.2, 0.5, 0.2] }}
                transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
                className="absolute inset-0 opacity-20"
                style={{
                    backgroundImage: "linear-gradient(rgba(255,255,255,0.14) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.14) 1px, transparent 1px)",
                    backgroundSize: "56px 56px",
                }}
                animate={{ backgroundPosition: ["0px 0px", "56px 56px"] }}
                transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
            />
        </div>
    );
}
