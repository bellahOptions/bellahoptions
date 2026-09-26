import { usePage } from "@inertiajs/react";

/**
 * Where a generic "start a project" call to action should send the visitor.
 *
 * Hard-coding `/order/special-service` everywhere meant the footer and homepage
 * CTAs always opened the Special Service form, even on a page about a specific
 * service. This resolves the most specific intent available, in order:
 *
 *  1. an explicit `orderUrl` prop (used by the service landing pages);
 *  2. the service the visitor is currently reading about, taken from the URL;
 *  3. the services index, where they can pick a lane.
 *
 * Account, checkout and brief screens fall back to the services index so a CTA
 * never drops someone back into a form they are already filling in.
 */
const ORDERABLE_PATH = /^\/services\/([a-z0-9-]+)\/?$/i;

const NON_ORDER_PATHS = [
    /^\/order\//i,
    /^\/orders\//i,
    /^\/brief\//i,
    /^\/admin/i,
    /^\/staff/i,
    /^\/dashboard/i,
];

export default function useStartProjectUrl(explicitUrl = "") {
    const { url = "/" } = usePage();

    if (explicitUrl) {
        return explicitUrl;
    }

    const path = String(url).split("?")[0];

    if (NON_ORDER_PATHS.some((pattern) => pattern.test(path))) {
        return "/services";
    }

    const match = path.match(ORDERABLE_PATH);

    if (match) {
        return `/services/${match[1]}`;
    }

    return "/services";
}
