import { Link } from "@inertiajs/react";
import { motion } from "motion/react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

const fallbackSlides = [
    {
        id: "fallback-1",
        slide_title: "Upgrade your Social Media!",
        text: "Get creative social media designs to power your online presence and drive sales.",
        slide_image:
            "https://img.freepik.com/premium-photo/abstract-dark-blue-background-silk-satin-navy-blue-color-elegant-background-with-space-design-soft-wavy-folds_728202-5520.jpg?w=360",
        slide_link: "/order/social-media-design",
        slide_link_text: "Get Started",
    },
    {
        id: "fallback-2",
        slide_title: "Automate your process",
        text: "Your website should work for you even when you are not online",
        slide_image: "https://cdn.wallpapersafari.com/10/34/xwEKsq.jpg",
        slide_link: "/order/web-design",
        slide_link_text: "Create your Website",
    },
    {
        id: "fallback-3",
        slide_title: "Your Headline Here",
        text: "Your subtext here",
        slide_image:
            "https://media.istockphoto.com/id/1807779771/vector/abstract-dark-blue-vector-background.jpg?s=612x612&w=0&k=20&c=7iEsr6VR1PwHxzQyZVUAJw9cSGPtWOcRjyXBkbH6mCI=",
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

export default function Slider({ slides = [] }) {
    const resolvedSlides = Array.isArray(slides) && slides.length > 2
        ? slides
        : fallbackSlides;

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
                        {slide.slide_image ? (
                            <img
                                src={slideImageSrc(slide.slide_image)}
                                alt={slide.slide_title || `Slide ${index + 1}`}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <MotionBackground index={index} />
                        )}
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

function MotionBackground({ index }) {
    const palettes = [
        "from-[#000285] via-[#0891b2] to-[#111827]",
        "from-[#111827] via-[#2563eb] to-[#0f766e]",
        "from-[#0f172a] via-[#7c3aed] to-[#0369a1]",
    ];

    return (
        <div className={`relative h-full w-full overflow-hidden bg-gradient-to-br ${palettes[index % palettes.length]}`}>
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
