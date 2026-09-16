import { usePage } from "@inertiajs/react";
import { RevealSection } from "@/Components/MotionReveal";
import { Eyebrow } from "@/Components/PublicUI";
import { resolvePublicAssetUrl } from "@/lib/publicPageHeaders";

/**
 * Joyce-style page hero: soft accent glow over the dark canvas, a pill eyebrow,
 * oversized display title, and a centered lead paragraph.
 */
export default function PublicPageHeader({
    pageKey,
    fallbackTitle,
    fallbackText,
    eyebrow = "",
    children = null,
    className = "pt-16 pb-14 sm:pt-20 sm:pb-16 lg:pt-24 lg:pb-20",
}) {
    const { publicPageHeaders = {} } = usePage().props;
    const configured = publicPageHeaders?.[pageKey];
    const pageHeader = configured && typeof configured === "object" ? configured : {};

    const title = String(pageHeader?.title || "").trim() || fallbackTitle;
    const text = String(pageHeader?.text || "").trim() || fallbackText;
    const backgroundImage = resolvePublicAssetUrl(pageHeader?.background_image);
    const hasBackgroundImage = backgroundImage.length > 0;

    return (
        <RevealSection className={`jv-glow jv-grid-bg relative overflow-hidden ${className}`}>
            {hasBackgroundImage ? (
                <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-cover bg-center opacity-30"
                    style={{ backgroundImage: `url("${backgroundImage}")` }}
                />
            ) : null}
            <div
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-jv-bg"
            />

            <div className="jv-container relative">
                <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
                    {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
                    <h1 className="jv-display jv-display--xl mt-6">{title}</h1>
                    <p className="jv-lead mx-auto mt-6 max-w-2xl">{text}</p>
                    {children}
                </div>
            </div>
        </RevealSection>
    );
}
