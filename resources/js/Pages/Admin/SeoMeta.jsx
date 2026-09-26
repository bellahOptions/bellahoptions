import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import AutosaveStatusPill from '@/Components/AutosaveStatusPill';
import MediaSelectorModal, { mediaPreviewUrl, useMediaSelector } from '@/Components/MediaSelectorModal';
import { Eyebrow } from '@/Components/PublicUI';
import usePlatformSettingsAutosave from '@/hooks/use-platform-settings-autosave';
import { Head, useForm } from '@inertiajs/react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

/**
 * Public SEO metadata.
 *
 * Extracted from the Platform Settings page, which had grown into a single
 * screen holding every unrelated setting. This page owns the `public_seo` slice
 * and is the only thing that writes it.
 */

const SEO_PUBLIC_PAGES = [
    { key: 'home', label: 'Home' },
    { key: 'about', label: 'About' },
    { key: 'services', label: 'Services' },
    { key: 'gallery', label: 'Gallery' },
    { key: 'blog', label: 'Blog Listing' },
    { key: 'blog_post', label: 'Blog Article (Wildcard)' },
    { key: 'events', label: 'Events' },
    { key: 'reviews', label: 'Reviews' },
    { key: 'faqs', label: 'FAQs' },
    { key: 'contact', label: 'Contact' },
    { key: 'web_design_samples', label: 'Web Design Samples' },
    { key: 'manage_hires', label: 'Manage Hires' },
    { key: 'seo_modules_functions', label: 'SEO Modules and Functions' },
    { key: 'order', label: 'Order Page (Wildcard)' },
    { key: 'terms', label: 'Terms of Service' },
    { key: 'privacy', label: 'Privacy Policy' },
    { key: 'cookie', label: 'Cookie Policy' },
];

/**
 * Mirrors App\Support\PlatformSettings::defaultPublicSeoSettings() so the form
 * always has a complete shape to render and submit, even on a fresh install
 * where no SEO settings row exists yet.
 */
export const createDefaultPublicSeo = () => ({
    global: {
        default_title: 'Bellah Options | Creative Branding, Design, and Digital Solutions',
        default_description:
            'Bellah Options helps businesses grow with branding, graphic design, social media design, websites, and digital product experiences.',
        default_keywords:
            'branding agency, graphic design, web design, ui ux, nigeria creative agency',
        default_robots:
            'index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1',
        default_og_image: '/images/og-image.jpg',
        default_twitter_image: '/images/og-image.jpg',
        twitter_card: 'summary_large_image',
        twitter_site: '@bellahoptions',
    },
    pages: {
        home: {
            path: '/',
            meta_title: 'Bellah Options | Creative Branding, Design, and Digital Solutions',
            meta_description:
                'Bellah Options is a creative design and technology agency helping businesses scale with brand design, graphic design, web design, and UI/UX services.',
            canonical_url: '',
            keywords: '',
            robots: '',
            og_image: '',
            twitter_image: '',
            og_type: 'website',
        },
        about: {
            path: '/about-bellah-options',
            meta_title: 'About Bellah Options | Creative Brand and Digital Agency',
            meta_description:
                'Learn about Bellah Options, our creative process, and how we help startups and businesses build clear digital presence.',
            canonical_url: '',
            keywords: '',
            robots: '',
            og_image: '',
            twitter_image: '',
            og_type: 'website',
        },
        services: {
            path: '/services',
            meta_title: 'Services | Bellah Options',
            meta_description:
                'Explore Bellah Options services for branding, graphic design, social media content, websites, and product interface design.',
            canonical_url: '',
            keywords: '',
            robots: '',
            og_image: '',
            twitter_image: '',
            og_type: 'website',
        },
        gallery: {
            path: '/gallery',
            meta_title: 'Gallery | Bellah Options',
            meta_description:
                'See portfolio projects and published client work from Bellah Options across branding, marketing visuals, and digital experiences.',
            canonical_url: '',
            keywords: '',
            robots: '',
            og_image: '',
            twitter_image: '',
            og_type: 'website',
        },
        blog: {
            path: '/blog',
            meta_title: 'Blog | Bellah Options',
            meta_description:
                'Read practical insights from Bellah Options on branding, design systems, content strategy, and business growth.',
            canonical_url: '',
            keywords: '',
            robots: '',
            og_image: '',
            twitter_image: '',
            og_type: 'website',
        },
        blog_post: {
            path: '/blog/*',
            meta_title: 'Bellah Options Blog Article',
            meta_description:
                'Read this Bellah Options article for practical branding, design, and digital growth insights.',
            canonical_url: '',
            keywords: '',
            robots: '',
            og_image: '',
            twitter_image: '',
            og_type: 'article',
        },
        events: {
            path: '/events',
            meta_title: 'Events | Bellah Options',
            meta_description:
                'View Bellah Options events, workshops, and creative sessions for founders, teams, and growing brands.',
            canonical_url: '',
            keywords: '',
            robots: '',
            og_image: '',
            twitter_image: '',
            og_type: 'website',
        },
        reviews: {
            path: '/reviews',
            meta_title: 'Reviews | Bellah Options',
            meta_description:
                'Read verified Bellah Options client reviews, ratings, and Google feedback from completed projects.',
            canonical_url: '',
            keywords: '',
            robots: '',
            og_image: '',
            twitter_image: '',
            og_type: 'website',
        },
        faqs: {
            path: '/faqs',
            meta_title: 'FAQs | Bellah Options',
            meta_description:
                'Find clear answers to frequently asked questions about Bellah Options services, delivery, timelines, and process.',
            canonical_url: '',
            keywords: '',
            robots: '',
            og_image: '',
            twitter_image: '',
            og_type: 'website',
        },
        contact: {
            path: '/contact-us',
            meta_title: 'Contact Bellah Options',
            meta_description:
                'Contact Bellah Options to discuss your brand, design, or digital project and get a tailored next step.',
            canonical_url: '',
            keywords: '',
            robots: '',
            og_image: '',
            twitter_image: '',
            og_type: 'website',
        },
        web_design_samples: {
            path: '/web-design-samples',
            meta_title: 'Web Design Samples | Bellah Options',
            meta_description:
                'Browse web design samples and live website experiences delivered by Bellah Options.',
            canonical_url: '',
            keywords: '',
            robots: '',
            og_image: '',
            twitter_image: '',
            og_type: 'website',
        },
        manage_hires: {
            path: '/manage-your-hires',
            meta_title: 'Manage Your Hires | Bellah Options',
            meta_description:
                'Dedicated unlimited design support for growth-stage teams with one retained creative partner.',
            canonical_url: '',
            keywords: '',
            robots: '',
            og_image: '',
            twitter_image: '',
            og_type: 'website',
        },
        seo_modules_functions: {
            path: '/seo-modules-and-functions',
            meta_title: 'SEO Modules and Functions | Bellah Options',
            meta_description:
                'Explore Bellah Options SEO modules and core functions for technical health, content visibility, and search growth.',
            canonical_url: '',
            keywords: '',
            robots: '',
            og_image: '',
            twitter_image: '',
            og_type: 'website',
        },
        order: {
            path: '/order/*',
            meta_title: 'Start a Service Request | Bellah Options',
            meta_description:
                'Start your Bellah Options service request and submit your project details for branding, design, or web delivery.',
            canonical_url: '',
            keywords: '',
            robots: '',
            og_image: '',
            twitter_image: '',
            og_type: 'website',
        },
        terms: {
            path: '/terms-of-service',
            meta_title: 'Terms of Service | Bellah Options',
            meta_description:
                'Review Bellah Options terms of service, billing policies, and delivery conditions.',
            canonical_url: '',
            keywords: '',
            robots: '',
            og_image: '',
            twitter_image: '',
            og_type: 'article',
        },
        privacy: {
            path: '/privacy-policy',
            meta_title: 'Privacy Policy | Bellah Options',
            meta_description:
                'Understand how Bellah Options collects, uses, and protects your personal data.',
            canonical_url: '',
            keywords: '',
            robots: '',
            og_image: '',
            twitter_image: '',
            og_type: 'article',
        },
        cookie: {
            path: '/cookie-policy',
            meta_title: 'Cookie Policy | Bellah Options',
            meta_description:
                'Learn how Bellah Options uses cookies and tracking technologies across public pages.',
            canonical_url: '',
            keywords: '',
            robots: '',
            og_image: '',
            twitter_image: '',
            og_type: 'article',
        },
    },
});

export const normalizePublicSeo = (payload) => {
    const defaults = createDefaultPublicSeo();
    const source = payload && typeof payload === 'object' ? payload : {};
    const sourceGlobal = source?.global && typeof source.global === 'object' ? source.global : {};
    const sourcePages = source?.pages && typeof source.pages === 'object' ? source.pages : {};

    const normalizedPages = Object.fromEntries(
        Object.entries(defaults.pages).map(([key, fallback]) => {
            const candidate =
                sourcePages?.[key] && typeof sourcePages[key] === 'object' ? sourcePages[key] : {};

            return [
                key,
                {
                    path: String(candidate?.path || fallback.path),
                    meta_title: String(candidate?.meta_title || fallback.meta_title),
                    meta_description: String(
                        candidate?.meta_description || fallback.meta_description,
                    ),
                    canonical_url: String(candidate?.canonical_url || ''),
                    keywords: String(candidate?.keywords || ''),
                    robots: String(candidate?.robots || ''),
                    og_image: String(candidate?.og_image || ''),
                    twitter_image: String(candidate?.twitter_image || ''),
                    og_type: String(candidate?.og_type || fallback.og_type),
                },
            ];
        }),
    );

    return {
        global: {
            default_title: String(sourceGlobal?.default_title || defaults.global.default_title),
            default_description: String(
                sourceGlobal?.default_description || defaults.global.default_description,
            ),
            default_keywords: String(
                sourceGlobal?.default_keywords || defaults.global.default_keywords,
            ),
            default_robots: String(sourceGlobal?.default_robots || defaults.global.default_robots),
            default_og_image: String(
                sourceGlobal?.default_og_image || defaults.global.default_og_image,
            ),
            default_twitter_image: String(
                sourceGlobal?.default_twitter_image || defaults.global.default_twitter_image,
            ),
            twitter_card: String(sourceGlobal?.twitter_card || defaults.global.twitter_card),
            twitter_site: String(sourceGlobal?.twitter_site || defaults.global.twitter_site),
        },
        pages: normalizedPages,
    };
};

const inputClassName =
    'w-full rounded-jv-sm border border-jv-line-strong bg-white/[0.05] px-3 py-2 text-sm text-white transition placeholder:text-white/30 focus:border-jv-accent focus:outline-none focus:ring-4 focus:ring-jv-accent/15';

export default function SeoMeta({ settings = {} }) {
    const { data, setData, errors, setError, clearErrors } = useForm({
        public_seo: normalizePublicSeo(settings?.public_seo),
    });

    const { statusText, statusClassName } = usePlatformSettingsAutosave({
        data,
        setError,
        clearErrors,
    });

    const selector = useMediaSelector();

    const updateGlobal = (field, value) => {
        setData('public_seo', {
            ...(data.public_seo || createDefaultPublicSeo()),
            global: {
                ...(data.public_seo?.global || createDefaultPublicSeo().global),
                [field]: value,
            },
            pages: {
                ...(data.public_seo?.pages || createDefaultPublicSeo().pages),
            },
        });
    };

    const updatePage = (pageKey, field, value) => {
        setData('public_seo', {
            ...(data.public_seo || createDefaultPublicSeo()),
            global: {
                ...(data.public_seo?.global || createDefaultPublicSeo().global),
            },
            pages: {
                ...(data.public_seo?.pages || createDefaultPublicSeo().pages),
                [pageKey]: {
                    ...(data.public_seo?.pages?.[pageKey] ||
                        createDefaultPublicSeo().pages?.[pageKey] ||
                        {}),
                    [field]: value,
                },
            },
        });
    };

    /**
     * Media targets are dotted paths so one picker can serve both the global
     * defaults and every per-page image without a separate handler each.
     */
    const applyMediaTarget = (target, value) => {
        if (target.startsWith('public_seo.pages.')) {
            const [, , pageKey, field] = target.split('.');
            if (pageKey && field) {
                updatePage(pageKey, field, value);
            }

            return;
        }

        if (target.startsWith('public_seo.global.')) {
            const [, , field] = target.split('.');
            if (field) {
                updateGlobal(field, value);
            }
        }
    };

    const pickImage = async (target) => {
        const path = await selector.pick(target);
        if (path) {
            applyMediaTarget(target, path);
        }
    };

    const uploadImage = async (target, file) => {
        const path = await selector.upload(file);
        if (path) {
            applyMediaTarget(target, path);
        }
    };

    const renderImageField = ({ target, label, value, error, previewAlt }) => (
        <div className="md:col-span-2">
            <label className="mb-1.5 block text-sm font-medium text-white/65">{label}</label>
            <input
                type="text"
                value={value}
                onChange={(event) => applyMediaTarget(target, event.target.value)}
                className={inputClassName}
            />
            {error && <p className="mt-1 text-xs text-red-300">{error}</p>}
            <div className="mt-2 flex flex-wrap gap-2">
                <label className="rounded-full border border-jv-accent-line bg-jv-accent/10 px-3 py-1.5 text-xs font-semibold text-[#a9c4ff] transition hover:bg-jv-accent/20 hover:text-white">
                    Upload Image
                    <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file) {
                                uploadImage(target, file);
                            }
                            event.target.value = '';
                        }}
                    />
                </label>
                <button
                    type="button"
                    onClick={() => pickImage(target)}
                    className="rounded-full border border-jv-line-strong bg-white/[0.05] px-3 py-1.5 text-xs font-semibold text-white/70 transition hover:bg-white/[0.12] hover:text-white"
                >
                    Media Selector
                </button>
            </div>
            {value && (
                <img
                    src={mediaPreviewUrl(value)}
                    alt={previewAlt}
                    className="mt-3 h-20 w-full rounded border border-jv-line object-cover"
                />
            )}
        </div>
    );

    const globalSeo = data.public_seo?.global || {};

    return (
        <AuthenticatedLayout>
            <Head title="SEO Meta" />

            <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
                <section className="jv-card jv-card--pad">
                    <Eyebrow>Search &amp; social</Eyebrow>
                    <h1 className="jv-display jv-display--md mt-5">Public SEO Meta</h1>
                    <p className="jv-lead mt-4 max-w-2xl">
                        Configure canonical links, meta descriptions, robots directives, social tags,
                        and SEO images for all public routes.
                    </p>
                    <p className="mt-4 inline-flex items-center gap-2 text-xs text-white/45">
                        <MagnifyingGlassIcon className="h-4 w-4 text-jv-accent" />
                        {SEO_PUBLIC_PAGES.length} public routes configured
                    </p>
                </section>

                <form onSubmit={(event) => event.preventDefault()} className="space-y-6">
                    <div className="jv-card jv-card--pad">
                        <h3 className="text-lg font-semibold tracking-tight text-white">
                            Global SEO Defaults
                        </h3>
                        <p className="mt-1 text-sm text-white/55">
                            Used whenever a page below leaves a field blank.
                        </p>

                        <div className="mt-5 grid gap-3 md:grid-cols-2">
                            <div className="md:col-span-2">
                                <label className="mb-1.5 block text-sm font-medium text-white/65">
                                    Default Meta Title
                                </label>
                                <input
                                    type="text"
                                    value={globalSeo.default_title || ''}
                                    onChange={(event) =>
                                        updateGlobal('default_title', event.target.value)
                                    }
                                    className={inputClassName}
                                />
                                {errors['public_seo.global.default_title'] && (
                                    <p className="mt-1 text-xs text-red-300">
                                        {errors['public_seo.global.default_title']}
                                    </p>
                                )}
                            </div>

                            <div className="md:col-span-2">
                                <label className="mb-1.5 block text-sm font-medium text-white/65">
                                    Default Meta Description
                                </label>
                                <textarea
                                    rows="3"
                                    value={globalSeo.default_description || ''}
                                    onChange={(event) =>
                                        updateGlobal('default_description', event.target.value)
                                    }
                                    className={inputClassName}
                                />
                                {errors['public_seo.global.default_description'] && (
                                    <p className="mt-1 text-xs text-red-300">
                                        {errors['public_seo.global.default_description']}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-white/65">
                                    Default Keywords
                                </label>
                                <input
                                    type="text"
                                    value={globalSeo.default_keywords || ''}
                                    onChange={(event) =>
                                        updateGlobal('default_keywords', event.target.value)
                                    }
                                    className={inputClassName}
                                />
                                {errors['public_seo.global.default_keywords'] && (
                                    <p className="mt-1 text-xs text-red-300">
                                        {errors['public_seo.global.default_keywords']}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-white/65">
                                    Default Robots
                                </label>
                                <input
                                    type="text"
                                    value={globalSeo.default_robots || ''}
                                    onChange={(event) =>
                                        updateGlobal('default_robots', event.target.value)
                                    }
                                    className={inputClassName}
                                />
                                {errors['public_seo.global.default_robots'] && (
                                    <p className="mt-1 text-xs text-red-300">
                                        {errors['public_seo.global.default_robots']}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-white/65">
                                    Twitter Card Type
                                </label>
                                <select
                                    value={globalSeo.twitter_card || 'summary_large_image'}
                                    onChange={(event) =>
                                        updateGlobal('twitter_card', event.target.value)
                                    }
                                    className={inputClassName}
                                >
                                    <option value="summary_large_image">summary_large_image</option>
                                    <option value="summary">summary</option>
                                </select>
                                {errors['public_seo.global.twitter_card'] && (
                                    <p className="mt-1 text-xs text-red-300">
                                        {errors['public_seo.global.twitter_card']}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-white/65">
                                    Twitter Site Handle
                                </label>
                                <input
                                    type="text"
                                    value={globalSeo.twitter_site || ''}
                                    onChange={(event) =>
                                        updateGlobal('twitter_site', event.target.value)
                                    }
                                    className={inputClassName}
                                />
                                {errors['public_seo.global.twitter_site'] && (
                                    <p className="mt-1 text-xs text-red-300">
                                        {errors['public_seo.global.twitter_site']}
                                    </p>
                                )}
                            </div>

                            {renderImageField({
                                target: 'public_seo.global.default_og_image',
                                label: 'Default OG Image',
                                value: globalSeo.default_og_image || '',
                                error: errors['public_seo.global.default_og_image'],
                                previewAlt: 'Default OG image preview',
                            })}

                            {renderImageField({
                                target: 'public_seo.global.default_twitter_image',
                                label: 'Default Twitter Image',
                                value: globalSeo.default_twitter_image || '',
                                error: errors['public_seo.global.default_twitter_image'],
                                previewAlt: 'Default Twitter image preview',
                            })}
                        </div>
                    </div>

                    <div className="jv-card jv-card--pad">
                        <h3 className="text-lg font-semibold tracking-tight text-white">
                            Per-Page Metadata
                        </h3>
                        <p className="mt-1 text-sm text-white/55">
                            Blank fields fall back to the global defaults above.
                        </p>

                        <div className="mt-5 space-y-4">
                            {SEO_PUBLIC_PAGES.map((page) => {
                                const seo = data.public_seo?.pages?.[page.key] || {};
                                const baseError = `public_seo.pages.${page.key}`;

                                return (
                                    <div
                                        key={`seo-page-${page.key}`}
                                        className="rounded-jv-sm border border-jv-line bg-white/[0.03] p-4"
                                    >
                                        <h4 className="text-sm font-semibold text-white">
                                            {page.label}
                                        </h4>
                                        <div className="mt-3 grid gap-3 md:grid-cols-2">
                                            <div>
                                                <label className="mb-1.5 block text-sm font-medium text-white/65">
                                                    Path
                                                </label>
                                                <input
                                                    type="text"
                                                    value={seo.path || ''}
                                                    onChange={(event) =>
                                                        updatePage(
                                                            page.key,
                                                            'path',
                                                            event.target.value,
                                                        )
                                                    }
                                                    className={inputClassName}
                                                />
                                                {errors[`${baseError}.path`] && (
                                                    <p className="mt-1 text-xs text-red-300">
                                                        {errors[`${baseError}.path`]}
                                                    </p>
                                                )}
                                            </div>

                                            <div>
                                                <label className="mb-1.5 block text-sm font-medium text-white/65">
                                                    Canonical URL (optional)
                                                </label>
                                                <input
                                                    type="text"
                                                    value={seo.canonical_url || ''}
                                                    onChange={(event) =>
                                                        updatePage(
                                                            page.key,
                                                            'canonical_url',
                                                            event.target.value,
                                                        )
                                                    }
                                                    className={inputClassName}
                                                />
                                                {errors[`${baseError}.canonical_url`] && (
                                                    <p className="mt-1 text-xs text-red-300">
                                                        {errors[`${baseError}.canonical_url`]}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="md:col-span-2">
                                                <label className="mb-1.5 block text-sm font-medium text-white/65">
                                                    Meta Title
                                                </label>
                                                <input
                                                    type="text"
                                                    value={seo.meta_title || ''}
                                                    onChange={(event) =>
                                                        updatePage(
                                                            page.key,
                                                            'meta_title',
                                                            event.target.value,
                                                        )
                                                    }
                                                    className={inputClassName}
                                                />
                                                {errors[`${baseError}.meta_title`] && (
                                                    <p className="mt-1 text-xs text-red-300">
                                                        {errors[`${baseError}.meta_title`]}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="md:col-span-2">
                                                <label className="mb-1.5 block text-sm font-medium text-white/65">
                                                    Meta Description
                                                </label>
                                                <textarea
                                                    rows="3"
                                                    value={seo.meta_description || ''}
                                                    onChange={(event) =>
                                                        updatePage(
                                                            page.key,
                                                            'meta_description',
                                                            event.target.value,
                                                        )
                                                    }
                                                    className={inputClassName}
                                                />
                                                {errors[`${baseError}.meta_description`] && (
                                                    <p className="mt-1 text-xs text-red-300">
                                                        {errors[`${baseError}.meta_description`]}
                                                    </p>
                                                )}
                                            </div>

                                            <div>
                                                <label className="mb-1.5 block text-sm font-medium text-white/65">
                                                    Keywords (optional)
                                                </label>
                                                <input
                                                    type="text"
                                                    value={seo.keywords || ''}
                                                    onChange={(event) =>
                                                        updatePage(
                                                            page.key,
                                                            'keywords',
                                                            event.target.value,
                                                        )
                                                    }
                                                    className={inputClassName}
                                                />
                                                {errors[`${baseError}.keywords`] && (
                                                    <p className="mt-1 text-xs text-red-300">
                                                        {errors[`${baseError}.keywords`]}
                                                    </p>
                                                )}
                                            </div>

                                            <div>
                                                <label className="mb-1.5 block text-sm font-medium text-white/65">
                                                    Robots (optional)
                                                </label>
                                                <input
                                                    type="text"
                                                    value={seo.robots || ''}
                                                    onChange={(event) =>
                                                        updatePage(
                                                            page.key,
                                                            'robots',
                                                            event.target.value,
                                                        )
                                                    }
                                                    className={inputClassName}
                                                />
                                                {errors[`${baseError}.robots`] && (
                                                    <p className="mt-1 text-xs text-red-300">
                                                        {errors[`${baseError}.robots`]}
                                                    </p>
                                                )}
                                            </div>

                                            <div>
                                                <label className="mb-1.5 block text-sm font-medium text-white/65">
                                                    OG Type
                                                </label>
                                                <select
                                                    value={seo.og_type || 'website'}
                                                    onChange={(event) =>
                                                        updatePage(
                                                            page.key,
                                                            'og_type',
                                                            event.target.value,
                                                        )
                                                    }
                                                    className={inputClassName}
                                                >
                                                    <option value="website">website</option>
                                                    <option value="article">article</option>
                                                </select>
                                                {errors[`${baseError}.og_type`] && (
                                                    <p className="mt-1 text-xs text-red-300">
                                                        {errors[`${baseError}.og_type`]}
                                                    </p>
                                                )}
                                            </div>

                                            <div />

                                            {renderImageField({
                                                target: `${baseError}.og_image`,
                                                label: 'OG Image',
                                                value: String(seo.og_image || ''),
                                                error: errors[`${baseError}.og_image`],
                                                previewAlt: `${page.label} OG image preview`,
                                            })}

                                            {renderImageField({
                                                target: `${baseError}.twitter_image`,
                                                label: 'Twitter Image',
                                                value: String(seo.twitter_image || ''),
                                                error: errors[`${baseError}.twitter_image`],
                                                previewAlt: `${page.label} Twitter image preview`,
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </form>
            </div>

            <AutosaveStatusPill statusText={statusText} statusClassName={statusClassName} />
            <MediaSelectorModal controller={selector} />
        </AuthenticatedLayout>
    );
}
