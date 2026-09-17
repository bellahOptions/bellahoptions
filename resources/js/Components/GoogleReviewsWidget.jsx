import { useEffect, useRef } from 'react';

const WIDGET_SCRIPT_SRC = 'https://widgets.sociablekit.com/google-reviews/widget.js';
const BRANDING_TEXT_PATTERN = /sociablekit/i;

function hideBrandingLinks(root) {
    root.querySelectorAll('a').forEach((link) => {
        const isBrandingLink =
            BRANDING_TEXT_PATTERN.test(link.textContent || '') ||
            BRANDING_TEXT_PATTERN.test(link.href || '');

        if (isBrandingLink) {
            link.style.display = 'none';
        }
    });
}

/**
 * SociableKIT Google Reviews embed. Inertia navigations don't reload the
 * page, so the widget's own script must be re-inserted (not just left in
 * place) on every mount for it to initialise against the new container.
 *
 * The free-tier widget appends its own "SociableKIT Google Reviews Widget"
 * promo link after the reviews load. That markup is injected by their
 * external script, not rendered by us, so a MutationObserver is used to
 * catch and hide it whenever it appears rather than relying on a fixed
 * selector that could change between widget versions.
 */
export default function GoogleReviewsWidget({ className = '' }) {
    const containerRef = useRef(null);

    useEffect(() => {
        document
            .querySelectorAll(`script[src="${WIDGET_SCRIPT_SRC}"]`)
            .forEach((existing) => existing.remove());

        const script = document.createElement('script');
        script.src = WIDGET_SCRIPT_SRC;
        script.defer = true;
        document.body.appendChild(script);

        const container = containerRef.current;
        let observer;

        if (container) {
            hideBrandingLinks(container);
            observer = new MutationObserver(() => hideBrandingLinks(container));
            observer.observe(container, { childList: true, subtree: true });
        }

        return () => {
            observer?.disconnect();
            script.remove();
        };
    }, []);

    return (
        <div
            ref={containerRef}
            className={`sk-ww-google-reviews ${className}`}
            data-embed-id="25714513"
        />
    );
}
