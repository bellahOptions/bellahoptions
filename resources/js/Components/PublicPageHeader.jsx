import { usePage } from "@inertiajs/react";
import { RevealSection } from "@/Components/MotionReveal";
import { resolvePublicAssetUrl } from "@/lib/publicPageHeaders";

export default function PublicPageHeader({
    pageKey,
    fallbackTitle,
    fallbackText,
    eyebrow = "",
    children = null,
    className = "py-20 text-white sm:py-24 lg:py-28",
}) {
    const { publicPageHeaders = {} } = usePage().props;
    const configured = publicPageHeaders?.[pageKey];
    const pageHeader = configured && typeof configured === "object" ? configured : {};

    const title = String(pageHeader?.title || "").trim() || fallbackTitle;
    const text = String(pageHeader?.text || "").trim() || fallbackText;
    const backgroundImage = resolvePublicAssetUrl(pageHeader?.background_image);
    const hasBackgroundImage = backgroundImage.length > 0;

    return (
        <RevealSection
            className={`${hasBackgroundImage ? "bg-slate-900 bg-cover bg-center bg-no-repeat" : "bg-[#000285]"} ${className}`}
            style={hasBackgroundImage
                ? {
                    backgroundImage: `linear-gradient(rgba(2, 6, 23, 0.72), rgba(2, 6, 23, 0.68)), url("${backgroundImage}")`,
                }
                : undefined}
        >
            <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
                {eyebrow ? (
                    <p className="text-sm font-black uppercase tracking-[0.22em] text-cyan-300">{eyebrow}</p>
                ) : null}
                <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">{title}</h1>
                <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-blue-100">{text}</p>
                {children}
            </div>
        </RevealSection>
    );
}
