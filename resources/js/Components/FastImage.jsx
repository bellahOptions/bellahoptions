import { useState } from "react";

/**
 * Responsive image with the layout-stability and loading behaviour we want
 * everywhere, so no page has to hand-roll `<img>` attributes again.
 *
 * Why this matters for speed:
 *
 *  - `srcset` + `sizes` lets the browser pick a file near the real render width
 *    instead of downloading the full-size original. This is the single biggest
 *    win on the service pages, where a 3000px upload was being sent to a 390px
 *    viewport.
 *  - `width`/`height` (or `aspectRatio`) reserve the space before the bytes
 *    arrive, so the layout does not shift and the page stops "jumping" as
 *    images land.
 *  - `loading="lazy"` and `decoding="async"` keep offscreen images out of the
 *    critical path.
 *
 * `variants` is the array the server sends (`[{ width, url }, …]`, ascending).
 * When it is empty the component degrades to a plain `<img>` with the single
 * source, which is what legacy `/images/...` and Cloudinary URLs get.
 */
export default function FastImage({
    src,
    variants = [],
    alt = "",
    sizes = "100vw",
    className = "",
    width = 0,
    height = 0,
    priority = false,
    fallbackSrc = "",
    ...props
}) {
    const [failed, setFailed] = useState(false);

    const resolvedSrc = failed && fallbackSrc ? fallbackSrc : src;

    if (!resolvedSrc) {
        return null;
    }

    const usableVariants = Array.isArray(variants) ? variants.filter((variant) => variant?.url && variant?.width) : [];

    // Only build a srcset when there is a real choice to make. A one-entry
    // srcset is noise the browser has to parse for nothing.
    const srcSet =
        !failed && usableVariants.length > 1
            ? [...usableVariants.map((variant) => `${variant.url} ${variant.width}w`), `${src} ${Math.max(width, usableVariants[usableVariants.length - 1].width * 1.5)}w`].join(", ")
            : undefined;

    // Only one entry means there is nothing to choose between, so prefer the
    // variant (it is the optimised encoding).
    const effectiveSrc = !failed && usableVariants.length === 1 ? usableVariants[0].url : resolvedSrc;

    const dimensionProps =
        width > 0 && height > 0
            ? { width, height }
            : width > 0
              ? { width }
              : {};

    return (
        <img
            src={effectiveSrc}
            srcSet={srcSet}
            sizes={srcSet ? sizes : undefined}
            alt={alt}
            className={className}
            loading={priority ? "eager" : "lazy"}
            decoding={priority ? "sync" : "async"}
            fetchPriority={priority ? "high" : undefined}
            onError={() => {
                if (!failed && fallbackSrc) {
                    setFailed(true);
                }
            }}
            {...dimensionProps}
            {...props}
        />
    );
}
