export function resolvePublicAssetUrl(path) {
    const normalized = String(path || "").trim();

    if (!normalized) {
        return "";
    }

    if (/^https?:\/\//i.test(normalized) || normalized.startsWith("/")) {
        return normalized;
    }

    return `/${normalized}`;
}
