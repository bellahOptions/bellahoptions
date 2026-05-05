function slugify(value) {
    return String(value || "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") || "section";
}

function normalizeSection(section, index) {
    const title = String(section?.title || `Section ${index + 1}`).trim() || `Section ${index + 1}`;
    const id = String(section?.id || slugify(title) || `section-${index + 1}`).trim() || `section-${index + 1}`;
    const body = Array.isArray(section?.body)
        ? section.body.map((item) => String(item || "").trim()).filter(Boolean)
        : [];
    const bullets = Array.isArray(section?.bullets)
        ? section.bullets.map((item) => String(item || "").trim()).filter(Boolean)
        : [];

    return { id, title, body, bullets };
}

function normalizeSections(rawSections = []) {
    if (!Array.isArray(rawSections)) {
        return [];
    }

    return rawSections
        .map((section, index) => normalizeSection(section, index))
        .filter((section) => section.title || section.body.length > 0 || section.bullets.length > 0);
}

function parsePlainText(content) {
    const normalizedText = String(content || "").replace(/<[^>]+>/g, " ");
    const paragraphs = normalizedText
        .split(/\n{2,}/)
        .map((item) => item.trim())
        .filter(Boolean);

    if (paragraphs.length === 0) {
        return [];
    }

    return [
        {
            id: "policy-content",
            title: "Policy Content",
            body: paragraphs,
            bullets: [],
        },
    ];
}

function parseHtmlContent(content) {
    if (typeof window === "undefined" || typeof window.DOMParser === "undefined") {
        return parsePlainText(content);
    }

    const doc = new window.DOMParser().parseFromString(String(content || ""), "text/html");
    const nodes = Array.from(doc.body?.children || []);

    if (nodes.length === 0) {
        return parsePlainText(content);
    }

    const sections = [];
    let currentSection = {
        id: "policy-content",
        title: "Policy Content",
        body: [],
        bullets: [],
    };
    let sectionIndex = 0;

    const pushSection = () => {
        const hasContent = currentSection.title || currentSection.body.length > 0 || currentSection.bullets.length > 0;

        if (!hasContent) {
            return;
        }

        sections.push({
            ...currentSection,
            id: currentSection.id || `section-${sectionIndex + 1}`,
        });
    };

    nodes.forEach((node) => {
        const tag = String(node.tagName || "").toLowerCase();
        const text = String(node.textContent || "").replace(/\s+/g, " ").trim();

        if (/^h[1-6]$/.test(tag)) {
            if (currentSection.body.length > 0 || currentSection.bullets.length > 0) {
                pushSection();
                sectionIndex += 1;
            }

            const heading = text || `Section ${sectionIndex + 1}`;
            currentSection = {
                id: slugify(heading),
                title: heading,
                body: [],
                bullets: [],
            };

            return;
        }

        if (tag === "ul" || tag === "ol") {
            const bullets = Array.from(node.querySelectorAll(":scope > li"))
                .map((item) => String(item.textContent || "").replace(/\s+/g, " ").trim())
                .filter(Boolean);

            currentSection.bullets = [...currentSection.bullets, ...bullets];

            return;
        }

        if (tag === "li") {
            if (text) {
                currentSection.bullets.push(text);
            }

            return;
        }

        if (text) {
            currentSection.body.push(text);
        }
    });

    pushSection();

    return normalizeSections(sections);
}

export function resolvePolicySections(termContent, fallbackSections = []) {
    const fallback = normalizeSections(fallbackSections);
    const content = String(termContent || "").trim();

    if (content === "") {
        return fallback;
    }

    try {
        const parsed = JSON.parse(content);

        if (Array.isArray(parsed)) {
            const normalized = normalizeSections(parsed);

            return normalized.length > 0 ? normalized : fallback;
        }

        if (Array.isArray(parsed?.sections)) {
            const normalized = normalizeSections(parsed.sections);

            return normalized.length > 0 ? normalized : fallback;
        }
    } catch {
        if (content.includes("<") && content.includes(">")) {
            const htmlSections = parseHtmlContent(content);

            return htmlSections.length > 0 ? htmlSections : fallback;
        }

        const plainTextSections = parsePlainText(content);

        return plainTextSections.length > 0 ? plainTextSections : fallback;
    }

    const plainTextSections = parsePlainText(content);

    return plainTextSections.length > 0 ? plainTextSections : fallback;
}
