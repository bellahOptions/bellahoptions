import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Modal from '@/Components/Modal';
import { Eyebrow } from '@/Components/PublicUI';
import RichTextEditor from '@/Components/RichTextEditor';
import { Badge } from '@/Components/ui/badge';
import { MobileCard, MobileCardActions, MobileCardList } from '@/Components/ui/mobile-cards';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useRef, useState } from 'react';

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

const createDefaultPublicSeo = () => ({
    global: {
        default_title: 'Bellah Options | Creative Branding, Design, and Digital Solutions',
        default_description: 'Bellah Options helps businesses grow with branding, graphic design, social media design, websites, and digital product experiences.',
        default_keywords: 'branding agency, graphic design, web design, ui ux, nigeria creative agency',
        default_robots: 'index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1',
        default_og_image: '/images/og-image.jpg',
        default_twitter_image: '/images/og-image.jpg',
        twitter_card: 'summary_large_image',
        twitter_site: '@bellahoptions',
    },
    pages: {
        home: { path: '/', meta_title: 'Bellah Options | Creative Branding, Design, and Digital Solutions', meta_description: 'Bellah Options is a creative design and technology agency helping businesses scale with brand design, graphic design, web design, and UI/UX services.', canonical_url: '', keywords: '', robots: '', og_image: '', twitter_image: '', og_type: 'website' },
        about: { path: '/about-bellah-options', meta_title: 'About Bellah Options | Creative Brand and Digital Agency', meta_description: 'Learn about Bellah Options, our creative process, and how we help startups and businesses build clear digital presence.', canonical_url: '', keywords: '', robots: '', og_image: '', twitter_image: '', og_type: 'website' },
        services: { path: '/services', meta_title: 'Services | Bellah Options', meta_description: 'Explore Bellah Options services for branding, graphic design, social media content, websites, and product interface design.', canonical_url: '', keywords: '', robots: '', og_image: '', twitter_image: '', og_type: 'website' },
        gallery: { path: '/gallery', meta_title: 'Gallery | Bellah Options', meta_description: 'See portfolio projects and published client work from Bellah Options across branding, marketing visuals, and digital experiences.', canonical_url: '', keywords: '', robots: '', og_image: '', twitter_image: '', og_type: 'website' },
        blog: { path: '/blog', meta_title: 'Blog | Bellah Options', meta_description: 'Read practical insights from Bellah Options on branding, design systems, content strategy, and business growth.', canonical_url: '', keywords: '', robots: '', og_image: '', twitter_image: '', og_type: 'website' },
        blog_post: { path: '/blog/*', meta_title: 'Bellah Options Blog Article', meta_description: 'Read this Bellah Options article for practical branding, design, and digital growth insights.', canonical_url: '', keywords: '', robots: '', og_image: '', twitter_image: '', og_type: 'article' },
        events: { path: '/events', meta_title: 'Events | Bellah Options', meta_description: 'View Bellah Options events, workshops, and creative sessions for founders, teams, and growing brands.', canonical_url: '', keywords: '', robots: '', og_image: '', twitter_image: '', og_type: 'website' },
        reviews: { path: '/reviews', meta_title: 'Reviews | Bellah Options', meta_description: 'Read verified Bellah Options client reviews, ratings, and Google feedback from completed projects.', canonical_url: '', keywords: '', robots: '', og_image: '', twitter_image: '', og_type: 'website' },
        faqs: { path: '/faqs', meta_title: 'FAQs | Bellah Options', meta_description: 'Find clear answers to frequently asked questions about Bellah Options services, delivery, timelines, and process.', canonical_url: '', keywords: '', robots: '', og_image: '', twitter_image: '', og_type: 'website' },
        contact: { path: '/contact-us', meta_title: 'Contact Bellah Options', meta_description: 'Contact Bellah Options to discuss your brand, design, or digital project and get a tailored next step.', canonical_url: '', keywords: '', robots: '', og_image: '', twitter_image: '', og_type: 'website' },
        web_design_samples: { path: '/web-design-samples', meta_title: 'Web Design Samples | Bellah Options', meta_description: 'Browse web design samples and live website experiences delivered by Bellah Options.', canonical_url: '', keywords: '', robots: '', og_image: '', twitter_image: '', og_type: 'website' },
        manage_hires: { path: '/manage-your-hires', meta_title: 'Manage Your Hires | Bellah Options', meta_description: 'Dedicated unlimited design support for growth-stage teams with one retained creative partner.', canonical_url: '', keywords: '', robots: '', og_image: '', twitter_image: '', og_type: 'website' },
        seo_modules_functions: { path: '/seo-modules-and-functions', meta_title: 'SEO Modules and Functions | Bellah Options', meta_description: 'Explore Bellah Options SEO modules and core functions for technical health, content visibility, and search growth.', canonical_url: '', keywords: '', robots: '', og_image: '', twitter_image: '', og_type: 'website' },
        order: { path: '/order/*', meta_title: 'Start a Service Request | Bellah Options', meta_description: 'Start your Bellah Options service request and submit your project details for branding, design, or web delivery.', canonical_url: '', keywords: '', robots: '', og_image: '', twitter_image: '', og_type: 'website' },
        terms: { path: '/terms-of-service', meta_title: 'Terms of Service | Bellah Options', meta_description: 'Review Bellah Options terms of service, billing policies, and delivery conditions.', canonical_url: '', keywords: '', robots: '', og_image: '', twitter_image: '', og_type: 'article' },
        privacy: { path: '/privacy-policy', meta_title: 'Privacy Policy | Bellah Options', meta_description: 'Understand how Bellah Options collects, uses, and protects your personal data.', canonical_url: '', keywords: '', robots: '', og_image: '', twitter_image: '', og_type: 'article' },
        cookie: { path: '/cookie-policy', meta_title: 'Cookie Policy | Bellah Options', meta_description: 'Learn how Bellah Options uses cookies and tracking technologies across public pages.', canonical_url: '', keywords: '', robots: '', og_image: '', twitter_image: '', og_type: 'article' },
    },
});

const normalizePublicSeo = (payload) => {
    const defaults = createDefaultPublicSeo();
    const source = payload && typeof payload === 'object' ? payload : {};
    const sourceGlobal = source?.global && typeof source.global === 'object' ? source.global : {};
    const sourcePages = source?.pages && typeof source.pages === 'object' ? source.pages : {};

    const normalizedPages = Object.fromEntries(
        Object.entries(defaults.pages).map(([key, fallback]) => {
            const candidate = sourcePages?.[key] && typeof sourcePages[key] === 'object' ? sourcePages[key] : {};
            return [key, {
                path: String(candidate?.path || fallback.path),
                meta_title: String(candidate?.meta_title || fallback.meta_title),
                meta_description: String(candidate?.meta_description || fallback.meta_description),
                canonical_url: String(candidate?.canonical_url || ''),
                keywords: String(candidate?.keywords || ''),
                robots: String(candidate?.robots || ''),
                og_image: String(candidate?.og_image || ''),
                twitter_image: String(candidate?.twitter_image || ''),
                og_type: String(candidate?.og_type || fallback.og_type),
            }];
        }),
    );

    return {
        global: {
            default_title: String(sourceGlobal?.default_title || defaults.global.default_title),
            default_description: String(sourceGlobal?.default_description || defaults.global.default_description),
            default_keywords: String(sourceGlobal?.default_keywords || defaults.global.default_keywords),
            default_robots: String(sourceGlobal?.default_robots || defaults.global.default_robots),
            default_og_image: String(sourceGlobal?.default_og_image || defaults.global.default_og_image),
            default_twitter_image: String(sourceGlobal?.default_twitter_image || defaults.global.default_twitter_image),
            twitter_card: String(sourceGlobal?.twitter_card || defaults.global.twitter_card),
            twitter_site: String(sourceGlobal?.twitter_site || defaults.global.twitter_site),
        },
        pages: normalizedPages,
    };
};

const quillModules = {
    toolbar: [
        [{ header: [2, 3, 4, false] }],
        ['bold', 'italic', 'underline'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['blockquote', 'link'],
        ['clean'],
    ],
};

const quillFormats = [
    'header',
    'bold',
    'italic',
    'underline',
    'list',
    'bullet',
    'blockquote',
    'link',
];

const googleReviewDateFormatter = new Intl.DateTimeFormat('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
});

const formatGoogleReviewDate = (value) => {
    if (!value) {
        return '';
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : googleReviewDateFormatter.format(date);
};

function TermsEditor({ label, value, onChange, error }) {
    return (
        <div>
            <label className="mb-1.5 block text-sm font-medium text-white/65">{label}</label>
            <div className="overflow-hidden rounded-jv-sm border border-jv-line-strong bg-white/[0.05] focus-within:border-jv-accent">
                <RichTextEditor
                    value={value}
                    onChange={onChange}
                    modules={quillModules}
                    formats={quillFormats}
                    placeholder="Write policy content here..."
                    className="min-h-[280px]"
                />
            </div>
            {error && <p className="mt-1 text-xs text-red-300">{error}</p>}
        </div>
    );
}

export default function Settings({
    settings = {},
    clientReviews = [],
}) {
    const { flash } = usePage().props;

    const {
        data,
        setData,
        errors,
        setError,
        clearErrors,
    } = useForm({
        maintenance_mode: Boolean(settings?.maintenance_mode),
        website_uri: settings?.website_uri || '',
        contact_phone: settings?.contact_phone || '',
        contact_email: settings?.contact_email || '',
        contact_location: settings?.contact_location || '',
        contact_whatsapp_url: settings?.contact_whatsapp_url || '',
        contact_behance_url: settings?.contact_behance_url || '',
        contact_map_embed_url: settings?.contact_map_embed_url || '',
        logo_path: settings?.logo_path || '/logo-06.svg',
        favicon_path: settings?.favicon_path || '/favicon.ico',
        public_seo: normalizePublicSeo(settings?.public_seo),
        terms: {
            terms_of_service: settings?.terms?.terms_of_service || '',
            privacy_policy: settings?.terms?.privacy_policy || '',
            cookie_policy: settings?.terms?.cookie_policy || '',
        },
    });

    const reviewForm = useForm({
        reviewer_name: '',
        reviewer_email: '',
        rating: 5,
        comment: '',
        screenshot_path: '',
        is_public: true,
        is_featured: false,
    });
    const [reviewScreenshotUploading, setReviewScreenshotUploading] = useState(false);

    const [autoSaveState, setAutoSaveState] = useState('idle');
    const autoSaveTimer = useRef(null);
    const autoSaveLastSavedSignature = useRef('');
    const autoSaveRequestId = useRef(0);
    const [autoSaveUpdatedAt, setAutoSaveUpdatedAt] = useState(null);
    const [autoSaveErrorDetail, setAutoSaveErrorDetail] = useState('');
    const [selectorOpen, setSelectorOpen] = useState(false);
    const [selectorTarget, setSelectorTarget] = useState('logo_path');
    const [selectorFiles, setSelectorFiles] = useState([]);
    const [selectorLoading, setSelectorLoading] = useState(false);
    const [selectorError, setSelectorError] = useState('');

    const autoSaveSignature = useMemo(() => JSON.stringify(data), [data]);

    useEffect(() => {
        if (autoSaveLastSavedSignature.current === '') {
            autoSaveLastSavedSignature.current = autoSaveSignature;
            return;
        }

        if (autoSaveSignature === autoSaveLastSavedSignature.current) {
            return;
        }

        if (autoSaveTimer.current) {
            window.clearTimeout(autoSaveTimer.current);
        }

        setAutoSaveState('saving');
        const requestId = autoSaveRequestId.current + 1;
        autoSaveRequestId.current = requestId;

        autoSaveTimer.current = window.setTimeout(() => {
            const payload = JSON.parse(autoSaveSignature);
            const csrfToken = document
                ?.querySelector('meta[name="csrf-token"]')
                ?.getAttribute('content');

            window.axios.patch(route('admin.settings.update'), payload, {
                headers: {
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
                },
            })
                .then(() => {
                    if (requestId !== autoSaveRequestId.current) {
                        return;
                    }

                    clearErrors();
                    setAutoSaveErrorDetail('');
                    autoSaveLastSavedSignature.current = autoSaveSignature;
                    setAutoSaveState('saved');
                    setAutoSaveUpdatedAt(new Date());
                })
                .catch((error) => {
                    if (requestId !== autoSaveRequestId.current) {
                        return;
                    }

                    const responseErrors = error?.response?.data?.errors;
                    let detail = String(error?.response?.data?.message || error?.message || 'Unknown error.');

                    if (responseErrors && typeof responseErrors === 'object') {
                        const normalizedErrors = Object.fromEntries(
                            Object.entries(responseErrors).map(([field, messages]) => [
                                field,
                                Array.isArray(messages) ? String(messages[0] ?? '') : String(messages ?? ''),
                            ]),
                        );

                        setError(normalizedErrors);

                        const [firstField, firstMessage] = Object.entries(normalizedErrors)[0] || [];
                        if (firstField) {
                            detail = `${firstField}: ${firstMessage}`;
                        }
                    }

                    setAutoSaveErrorDetail(detail);
                    setAutoSaveState('error');
                });
        }, 900);

        return () => {
            if (autoSaveTimer.current) {
                window.clearTimeout(autoSaveTimer.current);
            }
        };
    }, [autoSaveSignature, clearErrors, setError]);

    const autoSaveStatusText = useMemo(() => {
        if (autoSaveState === 'saving') {
            return 'Autosave: saving changes...';
        }

        if (autoSaveState === 'saved') {
            if (!autoSaveUpdatedAt) {
                return 'Autosave: all changes saved.';
            }

            return `Autosave: saved at ${autoSaveUpdatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
        }

        if (autoSaveState === 'error') {
            return autoSaveErrorDetail
                ? `Autosave failed: ${autoSaveErrorDetail}`
                : 'Autosave failed. Fix the highlighted field to retry.';
        }

        return 'Autosave: ready.';
    }, [autoSaveState, autoSaveUpdatedAt, autoSaveErrorDetail]);

    const autoSaveStatusClassName = useMemo(() => {
        if (autoSaveState === 'saving') {
            return 'border-jv-accent-line bg-jv-accent/10 text-[#a9c4ff]';
        }

        if (autoSaveState === 'saved') {
            return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300';
        }

        if (autoSaveState === 'error') {
            return 'border-red-500/30 bg-red-500/10 text-red-300';
        }

        return 'border-jv-line bg-white/[0.06] text-white/70';
    }, [autoSaveState]);

    const updateTermContent = (field, value) => {
        setData('terms', {
            ...(data.terms || {}),
            [field]: value,
        });
    };

    const updatePublicSeoGlobal = (field, value) => {
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

    const updatePublicSeoPage = (pageKey, field, value) => {
        setData('public_seo', {
            ...(data.public_seo || createDefaultPublicSeo()),
            global: {
                ...(data.public_seo?.global || createDefaultPublicSeo().global),
            },
            pages: {
                ...(data.public_seo?.pages || createDefaultPublicSeo().pages),
                [pageKey]: {
                    ...(data.public_seo?.pages?.[pageKey] || createDefaultPublicSeo().pages?.[pageKey] || {}),
                    [field]: value,
                },
            },
        });
    };

    const applySelectorValue = (target, value) => {
        if (target.startsWith('public_seo.pages.')) {
            const [, , pageKey, field] = target.split('.');
            if (pageKey && field) {
                updatePublicSeoPage(pageKey, field, value);
            }
            return;
        }

        if (target.startsWith('public_seo.global.')) {
            const [, , field] = target.split('.');
            if (field) {
                updatePublicSeoGlobal(field, value);
            }
            return;
        }

        setData(target, value);
    };

    const refreshMediaLibrary = async () => {
        setSelectorLoading(true);
        setSelectorError('');

        try {
            const response = await window.axios.get(route('admin.gallery.media.index'));
            setSelectorFiles(Array.isArray(response?.data?.files) ? response.data.files : []);
        } catch (error) {
            setSelectorError('Unable to load media files right now.');
        } finally {
            setSelectorLoading(false);
        }
    };

    const openSelector = async (target) => {
        setSelectorTarget(target);
        setSelectorOpen(true);
        await refreshMediaLibrary();
    };

    const closeSelector = () => {
        setSelectorOpen(false);
    };

    const chooseMediaFile = (path) => {
        applySelectorValue(selectorTarget, path);
        closeSelector();
    };

    const uploadBrandAsset = async (target, file) => {
        if (!file) {
            return;
        }

        const body = new FormData();
        body.append('file', file);

        try {
            const response = await window.axios.post(route('admin.gallery.media.upload'), body, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            const uploadedPath = String(response?.data?.path || '');
            if (uploadedPath !== '') {
                applySelectorValue(target, uploadedPath);
            }
        } catch (error) {
            window.alert('Upload failed. Please try another file.');
        }
    };

    const uploadReviewScreenshot = async (file) => {
        if (!file) {
            return;
        }

        const body = new FormData();
        body.append('file', file);

        setReviewScreenshotUploading(true);

        try {
            const response = await window.axios.post(route('admin.gallery.media.upload'), body, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            const uploadedPath = String(response?.data?.path || '');
            if (uploadedPath !== '') {
                reviewForm.setData('screenshot_path', uploadedPath);
            }
        } catch (error) {
            window.alert('Screenshot upload failed. Please try another image.');
        } finally {
            setReviewScreenshotUploading(false);
        }
    };

    const submitClientReview = (event) => {
        event.preventDefault();

        reviewForm.post(route('admin.client-reviews.store'), {
            preserveScroll: true,
            onSuccess: () => {
                reviewForm.reset();
                reviewForm.setData('rating', 5);
                reviewForm.setData('is_public', true);
                reviewForm.setData('is_featured', false);
            },
        });
    };

    const toggleClientReviewVisibility = (review) => {
        router.patch(
            route('admin.client-reviews.update', review.id),
            {
                is_public: !Boolean(review.is_public),
            },
            {
                preserveScroll: true,
            },
        );
    };

    const toggleClientReviewFeatured = (review) => {
        router.patch(
            route('admin.client-reviews.update', review.id),
            {
                is_featured: !Boolean(review.is_featured),
            },
            {
                preserveScroll: true,
            },
        );
    };

    const deleteClientReview = (review) => {
        if (!window.confirm('Delete this review?')) {
            return;
        }

        router.delete(route('admin.client-reviews.destroy', review.id), {
            preserveScroll: true,
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Platform Settings" />

            <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
                <section className="jv-card jv-card--pad">
                    <Eyebrow>Configuration</Eyebrow>
                    <h1 className="jv-display jv-display--md mt-5">Platform Settings</h1>
                    <p className="jv-lead mt-4 max-w-2xl">
                        Control access modes, branding, contact details, public SEO metadata, client reviews, and legal content.
                    </p>
                </section>

                {flash?.success && (
                    <div className="rounded-jv-sm border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                        {flash.success}
                    </div>
                )}

                {flash?.error && (
                    <div className="rounded-jv-sm border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                        {flash.error}
                    </div>
                )}

                    <form onSubmit={(event) => event.preventDefault()} className="space-y-6">
                        <div className="jv-card jv-card--pad">
                            <h3 className="text-lg font-semibold tracking-tight text-white">
                                Access Control Modes
                            </h3>

                            <div className="mt-5 space-y-4">
                                <label className="flex items-start gap-3 rounded-jv-sm border border-jv-line bg-white/[0.03] p-4">
                                    <input
                                        type="checkbox"
                                        checked={data.maintenance_mode}
                                        onChange={(event) => setData('maintenance_mode', event.target.checked)}
                                        className="mt-1 h-4 w-4 rounded border-jv-line-strong bg-white/[0.06] text-jv-accent focus:ring-jv-accent/30"
                                    />
                                    <span>
                                        <span className="block text-sm font-semibold text-white">Maintenance Mode</span>
                                        <span className="mt-1 block text-sm text-white/55">Blocks all public routes while maintenance is active. Staff can still access the staff portal.</span>
                                    </span>
                                </label>
                            </div>
                        </div>

                        <div className="jv-card jv-card--pad">
                            <h3 className="text-lg font-semibold tracking-tight text-white">
                                Branding
                            </h3>
                            <p className="mt-1 text-sm text-white/55">
                                Update the main website logo and favicon.
                            </p>

                            <div className="mt-5 grid gap-4 md:grid-cols-2">
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-white/65">Logo Path</label>
                                    <input
                                        type="text"
                                        value={data.logo_path}
                                        onChange={(event) => setData('logo_path', event.target.value)}
                                        className="w-full rounded-jv-sm border border-jv-line-strong bg-white/[0.05] px-3 py-2 text-sm text-white transition placeholder:text-white/30 focus:border-jv-accent focus:outline-none focus:ring-4 focus:ring-jv-accent/15"
                                    />
                                    {errors.logo_path && <p className="mt-1 text-xs text-red-300">{errors.logo_path}</p>}
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        <label className="rounded-full border border-jv-accent-line bg-jv-accent/10 px-3 py-1.5 text-xs font-semibold text-[#a9c4ff] transition hover:bg-jv-accent/20 hover:text-white">
                                            Upload Logo
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={(event) => {
                                                    const file = event.target.files?.[0];
                                                    if (file) {
                                                        uploadBrandAsset('logo_path', file);
                                                    }
                                                    event.target.value = '';
                                                }}
                                            />
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => openSelector('logo_path')}
                                            className="rounded-full border border-jv-line-strong bg-white/[0.05] px-3 py-1.5 text-xs font-semibold text-white/70 transition hover:bg-white/[0.12] hover:text-white"
                                        >
                                            Media Selector
                                        </button>
                                    </div>
                                    {data.logo_path && (
                                        <img
                                            src={/^https?:\/\//i.test(data.logo_path) ? data.logo_path : data.logo_path.startsWith('/') ? data.logo_path : `/${data.logo_path}`}
                                            alt="Website logo preview"
                                            className="mt-3 h-12 w-auto rounded border border-jv-line bg-white/[0.06] px-2 py-1"
                                        />
                                    )}
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-white/65">Favicon Path</label>
                                    <input
                                        type="text"
                                        value={data.favicon_path}
                                        onChange={(event) => setData('favicon_path', event.target.value)}
                                        className="w-full rounded-jv-sm border border-jv-line-strong bg-white/[0.05] px-3 py-2 text-sm text-white transition placeholder:text-white/30 focus:border-jv-accent focus:outline-none focus:ring-4 focus:ring-jv-accent/15"
                                    />
                                    {errors.favicon_path && <p className="mt-1 text-xs text-red-300">{errors.favicon_path}</p>}
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        <label className="rounded-full border border-jv-accent-line bg-jv-accent/10 px-3 py-1.5 text-xs font-semibold text-[#a9c4ff] transition hover:bg-jv-accent/20 hover:text-white">
                                            Upload Favicon
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={(event) => {
                                                    const file = event.target.files?.[0];
                                                    if (file) {
                                                        uploadBrandAsset('favicon_path', file);
                                                    }
                                                    event.target.value = '';
                                                }}
                                            />
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => openSelector('favicon_path')}
                                            className="rounded-full border border-jv-line-strong bg-white/[0.05] px-3 py-1.5 text-xs font-semibold text-white/70 transition hover:bg-white/[0.12] hover:text-white"
                                        >
                                            Media Selector
                                        </button>
                                    </div>
                                    {data.favicon_path && (
                                        <img
                                            src={/^https?:\/\//i.test(data.favicon_path) ? data.favicon_path : data.favicon_path.startsWith('/') ? data.favicon_path : `/${data.favicon_path}`}
                                            alt="Favicon preview"
                                            className="mt-3 h-10 w-10 rounded border border-jv-line bg-white/[0.06] p-1"
                                        />
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="jv-card jv-card--pad">
                            <h3 className="text-lg font-semibold tracking-tight text-white">
                                Default Contact Information
                            </h3>
                            <p className="mt-1 text-sm text-white/55">
                                This information is used across contact pages and website footer sections.
                            </p>

                            <div className="mt-5 grid gap-4 md:grid-cols-2">
                                <div className="md:col-span-2">
                                    <label className="mb-1.5 block text-sm font-medium text-white/65">Main Website URL</label>
                                    <input
                                        type="url"
                                        value={data.website_uri}
                                        onChange={(event) => setData('website_uri', event.target.value)}
                                        placeholder="https://bellahoptions.com"
                                        className="w-full rounded-jv-sm border border-jv-line-strong bg-white/[0.05] px-3 py-2 text-sm text-white transition placeholder:text-white/30 focus:border-jv-accent focus:outline-none focus:ring-4 focus:ring-jv-accent/15"
                                    />
                                    {errors.website_uri && <p className="mt-1 text-xs text-red-300">{errors.website_uri}</p>}
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-white/65">Phone</label>
                                    <input
                                        type="text"
                                        value={data.contact_phone}
                                        onChange={(event) => setData('contact_phone', event.target.value)}
                                        className="w-full rounded-jv-sm border border-jv-line-strong bg-white/[0.05] px-3 py-2 text-sm text-white transition placeholder:text-white/30 focus:border-jv-accent focus:outline-none focus:ring-4 focus:ring-jv-accent/15"
                                    />
                                    {errors.contact_phone && <p className="mt-1 text-xs text-red-300">{errors.contact_phone}</p>}
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-white/65">Email</label>
                                    <input
                                        type="email"
                                        value={data.contact_email}
                                        onChange={(event) => setData('contact_email', event.target.value)}
                                        className="w-full rounded-jv-sm border border-jv-line-strong bg-white/[0.05] px-3 py-2 text-sm text-white transition placeholder:text-white/30 focus:border-jv-accent focus:outline-none focus:ring-4 focus:ring-jv-accent/15"
                                    />
                                    {errors.contact_email && <p className="mt-1 text-xs text-red-300">{errors.contact_email}</p>}
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-white/65">Location</label>
                                    <input
                                        type="text"
                                        value={data.contact_location}
                                        onChange={(event) => setData('contact_location', event.target.value)}
                                        className="w-full rounded-jv-sm border border-jv-line-strong bg-white/[0.05] px-3 py-2 text-sm text-white transition placeholder:text-white/30 focus:border-jv-accent focus:outline-none focus:ring-4 focus:ring-jv-accent/15"
                                    />
                                    {errors.contact_location && <p className="mt-1 text-xs text-red-300">{errors.contact_location}</p>}
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-white/65">WhatsApp URL</label>
                                    <input
                                        type="url"
                                        value={data.contact_whatsapp_url}
                                        onChange={(event) => setData('contact_whatsapp_url', event.target.value)}
                                        className="w-full rounded-jv-sm border border-jv-line-strong bg-white/[0.05] px-3 py-2 text-sm text-white transition placeholder:text-white/30 focus:border-jv-accent focus:outline-none focus:ring-4 focus:ring-jv-accent/15"
                                    />
                                    {errors.contact_whatsapp_url && <p className="mt-1 text-xs text-red-300">{errors.contact_whatsapp_url}</p>}
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-white/65">Behance URL</label>
                                    <input
                                        type="url"
                                        value={data.contact_behance_url}
                                        onChange={(event) => setData('contact_behance_url', event.target.value)}
                                        className="w-full rounded-jv-sm border border-jv-line-strong bg-white/[0.05] px-3 py-2 text-sm text-white transition placeholder:text-white/30 focus:border-jv-accent focus:outline-none focus:ring-4 focus:ring-jv-accent/15"
                                    />
                                    {errors.contact_behance_url && <p className="mt-1 text-xs text-red-300">{errors.contact_behance_url}</p>}
                                </div>

                                <div className="md:col-span-2">
                                    <label className="mb-1.5 block text-sm font-medium text-white/65">Google Map Embed URL</label>
                                    <input
                                        type="url"
                                        value={data.contact_map_embed_url}
                                        onChange={(event) => setData('contact_map_embed_url', event.target.value)}
                                        className="w-full rounded-jv-sm border border-jv-line-strong bg-white/[0.05] px-3 py-2 text-sm text-white transition placeholder:text-white/30 focus:border-jv-accent focus:outline-none focus:ring-4 focus:ring-jv-accent/15"
                                    />
                                    {errors.contact_map_embed_url && <p className="mt-1 text-xs text-red-300">{errors.contact_map_embed_url}</p>}
                                </div>
                            </div>
                        </div>

                        <div className="jv-card jv-card--pad">
                            <h3 className="text-lg font-semibold tracking-tight text-white">Public SEO Meta</h3>
                            <p className="mt-1 text-sm text-white/55">
                                Configure canonical links, meta descriptions, robots directives, social tags, and SEO images for all public routes.
                            </p>

                            <div className="mt-5 rounded-jv-sm border border-jv-line bg-white/[0.03] p-4">
                                <h4 className="text-sm font-semibold text-white">Global SEO Defaults</h4>
                                <div className="mt-3 grid gap-3 md:grid-cols-2">
                                    <div className="md:col-span-2">
                                        <label className="mb-1.5 block text-sm font-medium text-white/65">Default Meta Title</label>
                                        <input
                                            type="text"
                                            value={data.public_seo?.global?.default_title || ''}
                                            onChange={(event) => updatePublicSeoGlobal('default_title', event.target.value)}
                                            className="w-full rounded-jv-sm border border-jv-line-strong bg-white/[0.05] px-3 py-2 text-sm text-white transition placeholder:text-white/30 focus:border-jv-accent focus:outline-none focus:ring-4 focus:ring-jv-accent/15"
                                        />
                                        {errors['public_seo.global.default_title'] && <p className="mt-1 text-xs text-red-300">{errors['public_seo.global.default_title']}</p>}
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="mb-1.5 block text-sm font-medium text-white/65">Default Meta Description</label>
                                        <textarea
                                            rows="3"
                                            value={data.public_seo?.global?.default_description || ''}
                                            onChange={(event) => updatePublicSeoGlobal('default_description', event.target.value)}
                                            className="w-full rounded-jv-sm border border-jv-line-strong bg-white/[0.05] px-3 py-2 text-sm text-white transition placeholder:text-white/30 focus:border-jv-accent focus:outline-none focus:ring-4 focus:ring-jv-accent/15"
                                        />
                                        {errors['public_seo.global.default_description'] && <p className="mt-1 text-xs text-red-300">{errors['public_seo.global.default_description']}</p>}
                                    </div>

                                    <div>
                                        <label className="mb-1.5 block text-sm font-medium text-white/65">Default Keywords</label>
                                        <input
                                            type="text"
                                            value={data.public_seo?.global?.default_keywords || ''}
                                            onChange={(event) => updatePublicSeoGlobal('default_keywords', event.target.value)}
                                            className="w-full rounded-jv-sm border border-jv-line-strong bg-white/[0.05] px-3 py-2 text-sm text-white transition placeholder:text-white/30 focus:border-jv-accent focus:outline-none focus:ring-4 focus:ring-jv-accent/15"
                                        />
                                        {errors['public_seo.global.default_keywords'] && <p className="mt-1 text-xs text-red-300">{errors['public_seo.global.default_keywords']}</p>}
                                    </div>

                                    <div>
                                        <label className="mb-1.5 block text-sm font-medium text-white/65">Default Robots</label>
                                        <input
                                            type="text"
                                            value={data.public_seo?.global?.default_robots || ''}
                                            onChange={(event) => updatePublicSeoGlobal('default_robots', event.target.value)}
                                            className="w-full rounded-jv-sm border border-jv-line-strong bg-white/[0.05] px-3 py-2 text-sm text-white transition placeholder:text-white/30 focus:border-jv-accent focus:outline-none focus:ring-4 focus:ring-jv-accent/15"
                                        />
                                        {errors['public_seo.global.default_robots'] && <p className="mt-1 text-xs text-red-300">{errors['public_seo.global.default_robots']}</p>}
                                    </div>

                                    <div>
                                        <label className="mb-1.5 block text-sm font-medium text-white/65">Twitter Card Type</label>
                                        <select
                                            value={data.public_seo?.global?.twitter_card || 'summary_large_image'}
                                            onChange={(event) => updatePublicSeoGlobal('twitter_card', event.target.value)}
                                            className="w-full rounded-jv-sm border border-jv-line-strong bg-white/[0.05] px-3 py-2 text-sm text-white transition placeholder:text-white/30 focus:border-jv-accent focus:outline-none focus:ring-4 focus:ring-jv-accent/15"
                                        >
                                            <option value="summary_large_image">summary_large_image</option>
                                            <option value="summary">summary</option>
                                        </select>
                                        {errors['public_seo.global.twitter_card'] && <p className="mt-1 text-xs text-red-300">{errors['public_seo.global.twitter_card']}</p>}
                                    </div>

                                    <div>
                                        <label className="mb-1.5 block text-sm font-medium text-white/65">Twitter Site Handle</label>
                                        <input
                                            type="text"
                                            value={data.public_seo?.global?.twitter_site || ''}
                                            onChange={(event) => updatePublicSeoGlobal('twitter_site', event.target.value)}
                                            className="w-full rounded-jv-sm border border-jv-line-strong bg-white/[0.05] px-3 py-2 text-sm text-white transition placeholder:text-white/30 focus:border-jv-accent focus:outline-none focus:ring-4 focus:ring-jv-accent/15"
                                        />
                                        {errors['public_seo.global.twitter_site'] && <p className="mt-1 text-xs text-red-300">{errors['public_seo.global.twitter_site']}</p>}
                                    </div>

                                    {[
                                        { field: 'default_og_image', label: 'Default OG Image' },
                                        { field: 'default_twitter_image', label: 'Default Twitter Image' },
                                    ].map((fieldMeta) => {
                                        const fieldKey = `public_seo.global.${fieldMeta.field}`;
                                        const value = data.public_seo?.global?.[fieldMeta.field] || '';
                                        const preview = /^https?:\/\//i.test(value)
                                            ? value
                                            : value.startsWith('/')
                                                ? value
                                                : value
                                                    ? `/${value}`
                                                    : '';

                                        return (
                                            <div key={`seo-global-${fieldMeta.field}`} className="md:col-span-2">
                                                <label className="mb-1.5 block text-sm font-medium text-white/65">{fieldMeta.label}</label>
                                                <input
                                                    type="text"
                                                    value={value}
                                                    onChange={(event) => updatePublicSeoGlobal(fieldMeta.field, event.target.value)}
                                                    className="w-full rounded-jv-sm border border-jv-line-strong bg-white/[0.05] px-3 py-2 text-sm text-white transition placeholder:text-white/30 focus:border-jv-accent focus:outline-none focus:ring-4 focus:ring-jv-accent/15"
                                                />
                                                {errors[fieldKey] && <p className="mt-1 text-xs text-red-300">{errors[fieldKey]}</p>}
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
                                                                    uploadBrandAsset(fieldKey, file);
                                                                }
                                                                event.target.value = '';
                                                            }}
                                                        />
                                                    </label>
                                                    <button
                                                        type="button"
                                                        onClick={() => openSelector(fieldKey)}
                                                        className="rounded-full border border-jv-line-strong bg-white/[0.05] px-3 py-1.5 text-xs font-semibold text-white/70 transition hover:bg-white/[0.12] hover:text-white"
                                                    >
                                                        Media Selector
                                                    </button>
                                                </div>
                                                {preview && (
                                                    <img
                                                        src={preview}
                                                        alt={`${fieldMeta.label} preview`}
                                                        className="mt-3 h-20 w-full rounded border border-jv-line object-cover"
                                                    />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="mt-5 space-y-4">
                                {SEO_PUBLIC_PAGES.map((page) => {
                                    const seo = data.public_seo?.pages?.[page.key] || {};
                                    const baseError = `public_seo.pages.${page.key}`;
                                    const ogImageValue = String(seo.og_image || '');
                                    const twitterImageValue = String(seo.twitter_image || '');
                                    const ogImagePreview = /^https?:\/\//i.test(ogImageValue) ? ogImageValue : ogImageValue.startsWith('/') ? ogImageValue : ogImageValue ? `/${ogImageValue}` : '';
                                    const twitterImagePreview = /^https?:\/\//i.test(twitterImageValue) ? twitterImageValue : twitterImageValue.startsWith('/') ? twitterImageValue : twitterImageValue ? `/${twitterImageValue}` : '';

                                    return (
                                        <div key={`seo-page-${page.key}`} className="rounded-jv-sm border border-jv-line bg-white/[0.03] p-4">
                                            <h4 className="text-sm font-semibold text-white">{page.label}</h4>
                                            <div className="mt-3 grid gap-3 md:grid-cols-2">
                                                <div>
                                                    <label className="mb-1.5 block text-sm font-medium text-white/65">Path</label>
                                                    <input
                                                        type="text"
                                                        value={seo.path || ''}
                                                        onChange={(event) => updatePublicSeoPage(page.key, 'path', event.target.value)}
                                                        className="w-full rounded-jv-sm border border-jv-line-strong bg-white/[0.05] px-3 py-2 text-sm text-white transition placeholder:text-white/30 focus:border-jv-accent focus:outline-none focus:ring-4 focus:ring-jv-accent/15"
                                                    />
                                                    {errors[`${baseError}.path`] && <p className="mt-1 text-xs text-red-300">{errors[`${baseError}.path`]}</p>}
                                                </div>

                                                <div>
                                                    <label className="mb-1.5 block text-sm font-medium text-white/65">Canonical URL (optional)</label>
                                                    <input
                                                        type="text"
                                                        value={seo.canonical_url || ''}
                                                        onChange={(event) => updatePublicSeoPage(page.key, 'canonical_url', event.target.value)}
                                                        className="w-full rounded-jv-sm border border-jv-line-strong bg-white/[0.05] px-3 py-2 text-sm text-white transition placeholder:text-white/30 focus:border-jv-accent focus:outline-none focus:ring-4 focus:ring-jv-accent/15"
                                                    />
                                                    {errors[`${baseError}.canonical_url`] && <p className="mt-1 text-xs text-red-300">{errors[`${baseError}.canonical_url`]}</p>}
                                                </div>

                                                <div className="md:col-span-2">
                                                    <label className="mb-1.5 block text-sm font-medium text-white/65">Meta Title</label>
                                                    <input
                                                        type="text"
                                                        value={seo.meta_title || ''}
                                                        onChange={(event) => updatePublicSeoPage(page.key, 'meta_title', event.target.value)}
                                                        className="w-full rounded-jv-sm border border-jv-line-strong bg-white/[0.05] px-3 py-2 text-sm text-white transition placeholder:text-white/30 focus:border-jv-accent focus:outline-none focus:ring-4 focus:ring-jv-accent/15"
                                                    />
                                                    {errors[`${baseError}.meta_title`] && <p className="mt-1 text-xs text-red-300">{errors[`${baseError}.meta_title`]}</p>}
                                                </div>

                                                <div className="md:col-span-2">
                                                    <label className="mb-1.5 block text-sm font-medium text-white/65">Meta Description</label>
                                                    <textarea
                                                        rows="3"
                                                        value={seo.meta_description || ''}
                                                        onChange={(event) => updatePublicSeoPage(page.key, 'meta_description', event.target.value)}
                                                        className="w-full rounded-jv-sm border border-jv-line-strong bg-white/[0.05] px-3 py-2 text-sm text-white transition placeholder:text-white/30 focus:border-jv-accent focus:outline-none focus:ring-4 focus:ring-jv-accent/15"
                                                    />
                                                    {errors[`${baseError}.meta_description`] && <p className="mt-1 text-xs text-red-300">{errors[`${baseError}.meta_description`]}</p>}
                                                </div>

                                                <div>
                                                    <label className="mb-1.5 block text-sm font-medium text-white/65">Keywords (optional)</label>
                                                    <input
                                                        type="text"
                                                        value={seo.keywords || ''}
                                                        onChange={(event) => updatePublicSeoPage(page.key, 'keywords', event.target.value)}
                                                        className="w-full rounded-jv-sm border border-jv-line-strong bg-white/[0.05] px-3 py-2 text-sm text-white transition placeholder:text-white/30 focus:border-jv-accent focus:outline-none focus:ring-4 focus:ring-jv-accent/15"
                                                    />
                                                    {errors[`${baseError}.keywords`] && <p className="mt-1 text-xs text-red-300">{errors[`${baseError}.keywords`]}</p>}
                                                </div>

                                                <div>
                                                    <label className="mb-1.5 block text-sm font-medium text-white/65">Robots (optional)</label>
                                                    <input
                                                        type="text"
                                                        value={seo.robots || ''}
                                                        onChange={(event) => updatePublicSeoPage(page.key, 'robots', event.target.value)}
                                                        className="w-full rounded-jv-sm border border-jv-line-strong bg-white/[0.05] px-3 py-2 text-sm text-white transition placeholder:text-white/30 focus:border-jv-accent focus:outline-none focus:ring-4 focus:ring-jv-accent/15"
                                                    />
                                                    {errors[`${baseError}.robots`] && <p className="mt-1 text-xs text-red-300">{errors[`${baseError}.robots`]}</p>}
                                                </div>

                                                <div>
                                                    <label className="mb-1.5 block text-sm font-medium text-white/65">OG Type</label>
                                                    <select
                                                        value={seo.og_type || 'website'}
                                                        onChange={(event) => updatePublicSeoPage(page.key, 'og_type', event.target.value)}
                                                        className="w-full rounded-jv-sm border border-jv-line-strong bg-white/[0.05] px-3 py-2 text-sm text-white transition placeholder:text-white/30 focus:border-jv-accent focus:outline-none focus:ring-4 focus:ring-jv-accent/15"
                                                    >
                                                        <option value="website">website</option>
                                                        <option value="article">article</option>
                                                    </select>
                                                    {errors[`${baseError}.og_type`] && <p className="mt-1 text-xs text-red-300">{errors[`${baseError}.og_type`]}</p>}
                                                </div>

                                                <div />

                                                {[
                                                    { field: 'og_image', label: 'OG Image', preview: ogImagePreview },
                                                    { field: 'twitter_image', label: 'Twitter Image', preview: twitterImagePreview },
                                                ].map((imageMeta) => {
                                                    const fieldKey = `${baseError}.${imageMeta.field}`;
                                                    const fieldValue = String(seo?.[imageMeta.field] || '');

                                                    return (
                                                        <div key={`${page.key}-${imageMeta.field}`} className="md:col-span-2">
                                                            <label className="mb-1.5 block text-sm font-medium text-white/65">{imageMeta.label}</label>
                                                            <input
                                                                type="text"
                                                                value={fieldValue}
                                                                onChange={(event) => updatePublicSeoPage(page.key, imageMeta.field, event.target.value)}
                                                                className="w-full rounded-jv-sm border border-jv-line-strong bg-white/[0.05] px-3 py-2 text-sm text-white transition placeholder:text-white/30 focus:border-jv-accent focus:outline-none focus:ring-4 focus:ring-jv-accent/15"
                                                            />
                                                            {errors[fieldKey] && <p className="mt-1 text-xs text-red-300">{errors[fieldKey]}</p>}
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
                                                                                uploadBrandAsset(fieldKey, file);
                                                                            }
                                                                            event.target.value = '';
                                                                        }}
                                                                    />
                                                                </label>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => openSelector(fieldKey)}
                                                                    className="rounded-full border border-jv-line-strong bg-white/[0.05] px-3 py-1.5 text-xs font-semibold text-white/70 transition hover:bg-white/[0.12] hover:text-white"
                                                                >
                                                                    Media Selector
                                                                </button>
                                                            </div>
                                                            {imageMeta.preview && (
                                                                <img
                                                                    src={imageMeta.preview}
                                                                    alt={`${page.label} ${imageMeta.label} preview`}
                                                                    className="mt-3 h-20 w-full rounded border border-jv-line object-cover"
                                                                />
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="jv-card jv-card--pad">
                            <h3 className="text-lg font-semibold tracking-tight text-white">Client Reviews Manager</h3>
                            <p className="mt-1 text-sm text-white/55">
                                Add internal reviews with star ratings and control which ones appear publicly. Reviews rated below 4.0 stay private automatically.
                            </p>

                            <form onSubmit={submitClientReview} className="mt-5 grid gap-4 md:grid-cols-2">
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-white/65">Reviewer Name</label>
                                    <input
                                        type="text"
                                        value={reviewForm.data.reviewer_name}
                                        onChange={(event) => reviewForm.setData('reviewer_name', event.target.value)}
                                        className="w-full rounded-jv-sm border border-jv-line-strong bg-white/[0.05] px-3 py-2 text-sm text-white transition placeholder:text-white/30 focus:border-jv-accent focus:outline-none focus:ring-4 focus:ring-jv-accent/15"
                                    />
                                    {reviewForm.errors.reviewer_name && <p className="mt-1 text-xs text-red-300">{reviewForm.errors.reviewer_name}</p>}
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-white/65">Reviewer Email (optional)</label>
                                    <input
                                        type="email"
                                        value={reviewForm.data.reviewer_email}
                                        onChange={(event) => reviewForm.setData('reviewer_email', event.target.value)}
                                        className="w-full rounded-jv-sm border border-jv-line-strong bg-white/[0.05] px-3 py-2 text-sm text-white transition placeholder:text-white/30 focus:border-jv-accent focus:outline-none focus:ring-4 focus:ring-jv-accent/15"
                                    />
                                    {reviewForm.errors.reviewer_email && <p className="mt-1 text-xs text-red-300">{reviewForm.errors.reviewer_email}</p>}
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-white/65">Star Rating</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="5"
                                        step="0.1"
                                        value={reviewForm.data.rating}
                                        onChange={(event) => reviewForm.setData('rating', event.target.value)}
                                        className="w-full rounded-jv-sm border border-jv-line-strong bg-white/[0.05] px-3 py-2 text-sm text-white transition placeholder:text-white/30 focus:border-jv-accent focus:outline-none focus:ring-4 focus:ring-jv-accent/15"
                                    />
                                    {reviewForm.errors.rating && <p className="mt-1 text-xs text-red-300">{reviewForm.errors.rating}</p>}
                                </div>

                                <div className="flex flex-wrap items-center gap-4">
                                    <label className="inline-flex items-center gap-2 text-sm text-white/70">
                                        <input
                                            type="checkbox"
                                            checked={Boolean(reviewForm.data.is_public)}
                                            onChange={(event) => reviewForm.setData('is_public', event.target.checked)}
                                            className="h-4 w-4 rounded border-jv-line-strong bg-white/[0.06] text-jv-accent focus:ring-jv-accent/30"
                                        />
                                        Public
                                    </label>
                                    <label className="inline-flex items-center gap-2 text-sm text-white/70">
                                        <input
                                            type="checkbox"
                                            checked={Boolean(reviewForm.data.is_featured)}
                                            onChange={(event) => reviewForm.setData('is_featured', event.target.checked)}
                                            className="h-4 w-4 rounded border-jv-line-strong bg-white/[0.06] text-jv-accent focus:ring-jv-accent/30"
                                        />
                                        Featured
                                    </label>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="mb-1.5 block text-sm font-medium text-white/65">
                                        Review Comment {reviewForm.data.screenshot_path ? '(optional — a screenshot is attached)' : ''}
                                    </label>
                                    <textarea
                                        rows="4"
                                        value={reviewForm.data.comment}
                                        onChange={(event) => reviewForm.setData('comment', event.target.value)}
                                        className="w-full rounded-jv-sm border border-jv-line-strong bg-white/[0.05] px-3 py-2 text-sm text-white transition placeholder:text-white/30 focus:border-jv-accent focus:outline-none focus:ring-4 focus:ring-jv-accent/15"
                                    />
                                    {reviewForm.errors.comment && <p className="mt-1 text-xs text-red-300">{reviewForm.errors.comment}</p>}
                                </div>

                                <div className="md:col-span-2">
                                    <label className="mb-1.5 block text-sm font-medium text-white/65">WhatsApp Screenshot (optional)</label>
                                    <p className="mb-2 text-xs text-white/45">
                                        Provide a comment, a screenshot, or both. Upload a screenshot of a WhatsApp testimonial to show it as the review.
                                    </p>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <label className="jv-btn jv-btn--ghost cursor-pointer">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={(event) => uploadReviewScreenshot(event.target.files?.[0] ?? null)}
                                            />
                                            {reviewScreenshotUploading ? 'Uploading...' : 'Choose Screenshot'}
                                        </label>
                                        {reviewForm.data.screenshot_path && (
                                            <div className="flex items-center gap-2">
                                                <img
                                                    src={reviewForm.data.screenshot_path}
                                                    alt="Review screenshot preview"
                                                    className="h-16 w-16 rounded-md border border-jv-line object-cover"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => reviewForm.setData('screenshot_path', '')}
                                                    className="text-xs font-semibold text-red-300 transition hover:text-red-200 hover:underline"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    {reviewForm.errors.screenshot_path && <p className="mt-1 text-xs text-red-300">{reviewForm.errors.screenshot_path}</p>}
                                </div>

                                <div className="md:col-span-2">
                                    <button
                                        type="submit"
                                        disabled={reviewForm.processing || reviewScreenshotUploading}
                                        className="jv-btn jv-btn--primary disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {reviewForm.processing ? 'Saving...' : 'Add Review'}
                                    </button>
                                </div>
                            </form>

                            <div className="mt-6 hidden overflow-x-auto md:block">
                                <table className="min-w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-jv-line text-left text-xs uppercase tracking-wide text-white/45">
                                            <th className="px-3 py-3 font-medium">Reviewer</th>
                                            <th className="px-3 py-3 font-medium">Rating</th>
                                            <th className="px-3 py-3 font-medium">Source</th>
                                            <th className="px-3 py-3 font-medium">Status</th>
                                            <th className="px-3 py-3 font-medium">Review</th>
                                            <th className="px-3 py-3 font-medium">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {clientReviews.length === 0 && (
                                            <tr>
                                                <td className="px-3 py-4 text-sm text-white/45" colSpan={6}>
                                                    No client reviews yet.
                                                </td>
                                            </tr>
                                        )}

                                        {clientReviews.map((review) => (
                                            <tr key={`client-review-${review.id}`} className="border-b border-jv-line/70 transition hover:bg-white/[0.04]">
                                                <td className="px-3 py-3">
                                                    <p className="font-semibold text-white">{review.reviewer_name || 'Anonymous'}</p>
                                                    <p className="text-xs text-white/45">{review.reviewer_email || 'No email'}</p>
                                                </td>
                                                <td className="px-3 py-3">
                                                    <p className="text-amber-300">{'★'.repeat(Math.max(1, Math.min(5, Math.round(Number(review.rating || 0)))))}</p>
                                                    <p className="text-xs text-white/45">{Number(review.rating || 0).toFixed(1)}/5</p>
                                                </td>
                                                <td className="px-3 py-3">
                                                    <Badge variant={review.source === 'admin' ? 'default' : 'secondary'}>
                                                        {review.source === 'admin' ? 'Admin' : 'Client'}
                                                    </Badge>
                                                </td>
                                                <td className="px-3 py-3">
                                                    <div className="flex flex-wrap gap-1.5">
                                                        <Badge variant={review.is_public ? 'success' : 'warning'}>
                                                            {review.is_public ? 'Public' : 'Private'}
                                                        </Badge>
                                                        <Badge variant={review.is_featured ? 'default' : 'secondary'}>
                                                            {review.is_featured ? 'Featured' : 'Not Featured'}
                                                        </Badge>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-3 text-xs leading-6 text-white/55">
                                                    {review.screenshot_path && (
                                                        <img
                                                            src={review.screenshot_path}
                                                            alt="Review screenshot"
                                                            className="mb-1 h-12 w-12 rounded-jv-sm border border-jv-line object-cover"
                                                        />
                                                    )}
                                                    {String(review.comment || '').slice(0, 140)}
                                                    {String(review.comment || '').length > 140 ? '...' : ''}
                                                </td>
                                                <td className="px-3 py-3">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleClientReviewVisibility(review)}
                                                            className="jv-btn jv-btn--ghost jv-btn--sm"
                                                        >
                                                            {review.is_public ? 'Make Private' : 'Make Public'}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleClientReviewFeatured(review)}
                                                            className="jv-btn jv-btn--sm border border-jv-accent-line bg-jv-accent/10 text-[#a9c4ff] hover:bg-jv-accent/20 hover:text-white"
                                                        >
                                                            {review.is_featured ? 'Unfeature' : 'Feature'}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => deleteClientReview(review)}
                                                            className="jv-btn jv-btn--sm border border-red-500/40 bg-red-500/10 text-red-300 hover:bg-red-500/20"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {clientReviews.length === 0 ? (
                                <p className="mt-6 text-sm text-white/45 md:hidden">No client reviews yet.</p>
                            ) : (
                                <MobileCardList className="mt-6">
                                    {clientReviews.map((review, index) => (
                                        <MobileCard key={`client-review-mobile-${review.id}`} index={index}>
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-semibold text-white">
                                                        {review.reviewer_name || 'Anonymous'}
                                                    </p>
                                                    <p className="truncate text-xs text-white/45">{review.reviewer_email || 'No email'}</p>
                                                </div>
                                                <Badge variant={review.source === 'admin' ? 'default' : 'secondary'} className="shrink-0">
                                                    {review.source === 'admin' ? 'Admin' : 'Client'}
                                                </Badge>
                                            </div>

                                            <p className="mt-2 text-amber-300">
                                                {'★'.repeat(Math.max(1, Math.min(5, Math.round(Number(review.rating || 0)))))}
                                                <span className="ml-1 text-xs text-white/45">{Number(review.rating || 0).toFixed(1)}/5</span>
                                            </p>

                                            <div className="mt-2 flex flex-wrap gap-1.5">
                                                <Badge variant={review.is_public ? 'success' : 'warning'}>
                                                    {review.is_public ? 'Public' : 'Private'}
                                                </Badge>
                                                <Badge variant={review.is_featured ? 'default' : 'secondary'}>
                                                    {review.is_featured ? 'Featured' : 'Not Featured'}
                                                </Badge>
                                            </div>

                                            {review.screenshot_path && (
                                                <img
                                                    src={review.screenshot_path}
                                                    alt="Review screenshot"
                                                    className="mt-3 h-20 w-20 rounded-jv-sm border border-jv-line object-cover"
                                                />
                                            )}
                                            <p className="mt-3 text-xs leading-6 text-white/55">
                                                {String(review.comment || '').slice(0, 140)}
                                                {String(review.comment || '').length > 140 ? '...' : ''}
                                            </p>

                                            <MobileCardActions>
                                                <button
                                                    type="button"
                                                    onClick={() => toggleClientReviewVisibility(review)}
                                                    className="jv-btn jv-btn--ghost jv-btn--sm"
                                                >
                                                    {review.is_public ? 'Make Private' : 'Make Public'}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => toggleClientReviewFeatured(review)}
                                                    className="jv-btn jv-btn--sm border border-jv-accent-line bg-jv-accent/10 text-[#a9c4ff] hover:bg-jv-accent/20 hover:text-white"
                                                >
                                                    {review.is_featured ? 'Unfeature' : 'Feature'}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => deleteClientReview(review)}
                                                    className="jv-btn jv-btn--sm border border-red-500/40 bg-red-500/10 text-red-300 hover:bg-red-500/20"
                                                >
                                                    Delete
                                                </button>
                                            </MobileCardActions>
                                        </MobileCard>
                                    ))}
                                </MobileCardList>
                            )}
                        </div>

                        <div className="jv-card jv-card--pad">
                            <h3 className="text-lg font-semibold tracking-tight text-white">Legal Terms Manager</h3>
                            <p className="mt-1 text-sm text-white/55">
                                Admins can update the Terms of Service, Privacy Policy, and Cookie Policy directly from this dashboard.
                            </p>
                            <p className="mt-1 text-xs text-white/45">
                                Use the Quill editor to format headings, paragraphs, lists, and links.
                            </p>

                            <div className="mt-5 grid gap-4">
                                <TermsEditor
                                    label="Terms of Service Content"
                                    value={data.terms?.terms_of_service || ''}
                                    onChange={(value) => updateTermContent('terms_of_service', value)}
                                    error={errors['terms.terms_of_service']}
                                />

                                <TermsEditor
                                    label="Privacy Policy Content"
                                    value={data.terms?.privacy_policy || ''}
                                    onChange={(value) => updateTermContent('privacy_policy', value)}
                                    error={errors['terms.privacy_policy']}
                                />

                                <TermsEditor
                                    label="Cookie Policy Content"
                                    value={data.terms?.cookie_policy || ''}
                                    onChange={(value) => updateTermContent('cookie_policy', value)}
                                    error={errors['terms.cookie_policy']}
                                />
                            </div>
                        </div>

                    </form>

            </div>
            <div className="pointer-events-none fixed right-4 top-20 z-[90]">
                <div className={`rounded-full border px-3.5 py-2 text-xs font-semibold backdrop-blur-xl ${autoSaveStatusClassName}`}>
                    {autoSaveStatusText}
                </div>
            </div>

            <Modal show={selectorOpen} maxWidth="2xl" onClose={closeSelector}>
                <div className="space-y-4 p-5 sm:p-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold tracking-tight text-white">Select Media File</h3>
                        <button
                            type="button"
                            onClick={closeSelector}
                            className="jv-btn jv-btn--ghost jv-btn--sm"
                        >
                            Close
                        </button>
                    </div>

                    {selectorLoading && <p className="text-sm text-white/55">Loading media...</p>}
                    {selectorError && <p className="text-sm text-red-300">{selectorError}</p>}

                    {!selectorLoading && !selectorError && (
                        <div className="max-h-[60vh] overflow-y-auto rounded-jv-sm border border-jv-line p-3">
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {selectorFiles.map((file) => (
                                    <button
                                        key={file.path}
                                        type="button"
                                        onClick={() => chooseMediaFile(file.path)}
                                        className="overflow-hidden rounded-jv-sm border border-jv-line text-left transition hover:border-jv-accent-line"
                                    >
                                        <div className="h-24 w-full overflow-hidden bg-white/[0.06]">
                                            <img
                                                src={/^https?:\/\//i.test(file.preview_url || file.path)
                                                    ? (file.preview_url || file.path)
                                                    : (file.preview_url || file.path).startsWith('/')
                                                        ? (file.preview_url || file.path)
                                                        : `/${file.preview_url || file.path}`}
                                                alt={file.name || file.path}
                                                className="h-full w-full object-cover"
                                            />
                                        </div>
                                        <div className="space-y-1 p-2">
                                            <p className="truncate text-xs font-semibold text-white">{file.name}</p>
                                            <p className="truncate text-[11px] text-white/45">{file.path}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}
