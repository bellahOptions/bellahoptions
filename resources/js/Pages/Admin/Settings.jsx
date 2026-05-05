import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const createEmptySlide = () => ({
    title: '',
    subtitle: '',
    image: '',
    cta_label: '',
    cta_url: '',
});

const formatMoney = (amount) => {
    const value = Number(amount || 0);

    return Number.isFinite(value)
        ? new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            maximumFractionDigits: 2,
        }).format(value)
        : '₦0.00';
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

function TermsEditor({ label, value, onChange, error }) {
    return (
        <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
            <div className="overflow-hidden rounded-md border border-gray-300 bg-white focus-within:border-indigo-500">
                <ReactQuill
                    theme="snow"
                    value={value}
                    onChange={onChange}
                    modules={quillModules}
                    formats={quillFormats}
                    placeholder="Write policy content here..."
                    className="min-h-[280px]"
                />
            </div>
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
    );
}

export default function Settings({
    settings = {},
    serviceCatalog = {},
    servicePrices = {},
    discountCodes = [],
    subscriptionPlans = [],
}) {
    const { flash } = usePage().props;

    const serviceEntries = useMemo(() => Object.entries(serviceCatalog || {}), [serviceCatalog]);
    const firstServiceSlug = serviceEntries[0]?.[0] ?? 'social-media-design';

    const {
        data,
        setData,
        patch,
        processing,
        errors,
    } = useForm({
        maintenance_mode: Boolean(settings?.maintenance_mode),
        website_uri: settings?.website_uri || '',
        contact_phone: settings?.contact_phone || '',
        contact_email: settings?.contact_email || '',
        contact_location: settings?.contact_location || '',
        contact_whatsapp_url: settings?.contact_whatsapp_url || '',
        contact_behance_url: settings?.contact_behance_url || '',
        contact_map_embed_url: settings?.contact_map_embed_url || '',
        home_slides: Array.isArray(settings?.home_slides) && settings.home_slides.length > 0
            ? settings.home_slides
            : [createEmptySlide()],
        service_prices: servicePrices || {},
        terms: {
            terms_of_service: settings?.terms?.terms_of_service || '',
            privacy_policy: settings?.terms?.privacy_policy || '',
            cookie_policy: settings?.terms?.cookie_policy || '',
        },
    });

    const discountForm = useForm({
        name: '',
        code: '',
        discount_type: 'percentage',
        discount_value: '',
        currency: 'NGN',
        is_active: true,
        service_slug: firstServiceSlug,
        package_code: '',
        starts_at: '',
        ends_at: '',
        max_redemptions: '',
    });

    const subscriptionPlanForm = useForm({
        name: '',
        service_slug: firstServiceSlug,
        package_code: '',
        short_description: '',
        billing_cycle: 'monthly',
        position: 0,
        is_active: true,
        show_on_homepage: true,
        is_homepage_featured: false,
        is_recommended: false,
    });

    const [copiedLinkId, setCopiedLinkId] = useState(null);

    const selectedServicePackages = serviceCatalog?.[discountForm.data.service_slug]?.packages || {};
    const selectedPlanPackages = serviceCatalog?.[subscriptionPlanForm.data.service_slug]?.packages || {};

    const submitSettings = (event) => {
        event.preventDefault();

        patch(route('admin.settings.update'), {
            preserveScroll: true,
        });
    };

    const updateServicePrice = (serviceSlug, packageCode, value) => {
        setData('service_prices', {
            ...(data.service_prices || {}),
            [serviceSlug]: {
                ...((data.service_prices || {})[serviceSlug] || {}),
                [packageCode]: value,
            },
        });
    };

    const updateSlide = (index, field, value) => {
        const nextSlides = [...(data.home_slides || [])];
        nextSlides[index] = {
            ...(nextSlides[index] || createEmptySlide()),
            [field]: value,
        };

        setData('home_slides', nextSlides);
    };

    const addSlide = () => {
        setData('home_slides', [...(data.home_slides || []), createEmptySlide()]);
    };

    const removeSlide = (index) => {
        const nextSlides = [...(data.home_slides || [])].filter((_, currentIndex) => currentIndex !== index);
        setData('home_slides', nextSlides.length > 0 ? nextSlides : [createEmptySlide()]);
    };

    const updateTermContent = (field, value) => {
        setData('terms', {
            ...(data.terms || {}),
            [field]: value,
        });
    };

    const submitDiscountCode = (event) => {
        event.preventDefault();

        discountForm.post(route('admin.settings.discounts.store'), {
            preserveScroll: true,
            onSuccess: () => {
                discountForm.reset();
                discountForm.setData('discount_type', 'percentage');
                discountForm.setData('currency', 'NGN');
                discountForm.setData('is_active', true);
                discountForm.setData('service_slug', firstServiceSlug);
            },
        });
    };

    const toggleDiscountStatus = (discountCode) => {
        router.patch(
            route('admin.settings.discounts.status', discountCode.id),
            {
                is_active: !discountCode.is_active,
            },
            {
                preserveScroll: true,
            },
        );
    };

    const deleteDiscountCode = (discountCode) => {
        if (!window.confirm(`Delete discount code ${discountCode.code}?`)) {
            return;
        }

        router.delete(route('admin.settings.discounts.destroy', discountCode.id), {
            preserveScroll: true,
        });
    };

    const copyDiscountLink = async (discountCode) => {
        if (!discountCode?.discount_link || !navigator?.clipboard?.writeText) {
            return;
        }

        await navigator.clipboard.writeText(discountCode.discount_link);
        setCopiedLinkId(discountCode.id);
        window.setTimeout(() => setCopiedLinkId(null), 2000);
    };

    const submitSubscriptionPlan = (event) => {
        event.preventDefault();

        subscriptionPlanForm.post(route('admin.settings.subscription-plans.store'), {
            preserveScroll: true,
            onSuccess: () => {
                subscriptionPlanForm.reset();
                subscriptionPlanForm.setData('service_slug', firstServiceSlug);
                subscriptionPlanForm.setData('billing_cycle', 'monthly');
                subscriptionPlanForm.setData('position', 0);
                subscriptionPlanForm.setData('is_active', true);
                subscriptionPlanForm.setData('show_on_homepage', true);
                subscriptionPlanForm.setData('is_homepage_featured', false);
                subscriptionPlanForm.setData('is_recommended', false);
            },
        });
    };

    const updateSubscriptionPlan = (subscriptionPlan, updates) => {
        router.patch(
            route('admin.settings.subscription-plans.update', subscriptionPlan.id),
            updates,
            {
                preserveScroll: true,
            },
        );
    };

    const deleteSubscriptionPlan = (subscriptionPlan) => {
        if (!window.confirm(`Delete subscription plan ${subscriptionPlan.name}?`)) {
            return;
        }

        router.delete(route('admin.settings.subscription-plans.destroy', subscriptionPlan.id), {
            preserveScroll: true,
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Platform Settings
                </h2>
            }
        >
            <Head title="Platform Settings" />

            <div className="py-10">
                <div className="mx-auto max-w-6xl space-y-6 px-4 sm:px-6 lg:px-8">
                    {flash?.success && (
                        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                            {flash.success}
                        </div>
                    )}

                    {flash?.error && (
                        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {flash.error}
                        </div>
                    )}

                    <form onSubmit={submitSettings} className="space-y-6">
                        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                            <h3 className="text-lg font-semibold text-gray-900">
                                Access Control Modes
                            </h3>

                            <div className="mt-5 space-y-4">
                                <label className="flex items-start gap-3 rounded-lg border border-gray-200 p-4">
                                    <input
                                        type="checkbox"
                                        checked={data.maintenance_mode}
                                        onChange={(event) => setData('maintenance_mode', event.target.checked)}
                                        className="mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <span>
                                        <span className="block text-sm font-semibold text-gray-900">Maintenance Mode</span>
                                        <span className="mt-1 block text-sm text-gray-600">Blocks all public routes while maintenance is active. Staff can still access the staff portal.</span>
                                    </span>
                                </label>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                            <h3 className="text-lg font-semibold text-gray-900">
                                Default Contact Information
                            </h3>
                            <p className="mt-1 text-sm text-gray-600">
                                This information is used across contact pages and website footer sections.
                            </p>

                            <div className="mt-5 grid gap-4 md:grid-cols-2">
                                <div className="md:col-span-2">
                                    <label className="mb-1 block text-sm font-medium text-gray-700">Main Website URL</label>
                                    <input
                                        type="url"
                                        value={data.website_uri}
                                        onChange={(event) => setData('website_uri', event.target.value)}
                                        placeholder="https://bellahoptions.com"
                                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                                    />
                                    {errors.website_uri && <p className="mt-1 text-xs text-red-600">{errors.website_uri}</p>}
                                </div>

                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">Phone</label>
                                    <input
                                        type="text"
                                        value={data.contact_phone}
                                        onChange={(event) => setData('contact_phone', event.target.value)}
                                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                                    />
                                    {errors.contact_phone && <p className="mt-1 text-xs text-red-600">{errors.contact_phone}</p>}
                                </div>

                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
                                    <input
                                        type="email"
                                        value={data.contact_email}
                                        onChange={(event) => setData('contact_email', event.target.value)}
                                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                                    />
                                    {errors.contact_email && <p className="mt-1 text-xs text-red-600">{errors.contact_email}</p>}
                                </div>

                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">Location</label>
                                    <input
                                        type="text"
                                        value={data.contact_location}
                                        onChange={(event) => setData('contact_location', event.target.value)}
                                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                                    />
                                    {errors.contact_location && <p className="mt-1 text-xs text-red-600">{errors.contact_location}</p>}
                                </div>

                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">WhatsApp URL</label>
                                    <input
                                        type="url"
                                        value={data.contact_whatsapp_url}
                                        onChange={(event) => setData('contact_whatsapp_url', event.target.value)}
                                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                                    />
                                    {errors.contact_whatsapp_url && <p className="mt-1 text-xs text-red-600">{errors.contact_whatsapp_url}</p>}
                                </div>

                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">Behance URL</label>
                                    <input
                                        type="url"
                                        value={data.contact_behance_url}
                                        onChange={(event) => setData('contact_behance_url', event.target.value)}
                                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                                    />
                                    {errors.contact_behance_url && <p className="mt-1 text-xs text-red-600">{errors.contact_behance_url}</p>}
                                </div>

                                <div className="md:col-span-2">
                                    <label className="mb-1 block text-sm font-medium text-gray-700">Google Map Embed URL</label>
                                    <input
                                        type="url"
                                        value={data.contact_map_embed_url}
                                        onChange={(event) => setData('contact_map_embed_url', event.target.value)}
                                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                                    />
                                    {errors.contact_map_embed_url && <p className="mt-1 text-xs text-red-600">{errors.contact_map_embed_url}</p>}
                                </div>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                            <h3 className="text-lg font-semibold text-gray-900">Service Pricing</h3>
                            <p className="mt-1 text-sm text-gray-600">
                                Update package pricing for checkout forms across all services.
                            </p>

                            <div className="mt-5 space-y-5">
                                {serviceEntries.map(([serviceSlug, service]) => (
                                    <div key={serviceSlug} className="rounded-xl border border-gray-200 p-4">
                                        <h4 className="text-base font-semibold text-gray-900">{service?.name || serviceSlug}</h4>
                                        <p className="mt-1 text-sm text-gray-600">{service?.description || ''}</p>

                                        <div className="mt-4 grid gap-3 md:grid-cols-2">
                                            {Object.entries(service?.packages || {}).map(([packageCode, packageMeta]) => (
                                                <div key={`${serviceSlug}-${packageCode}`}>
                                                    <label className="mb-1 block text-sm font-medium text-gray-700">
                                                        {packageMeta?.name || packageCode}
                                                    </label>
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        step="0.01"
                                                        value={data.service_prices?.[serviceSlug]?.[packageCode] ?? ''}
                                                        onChange={(event) => updateServicePrice(serviceSlug, packageCode, event.target.value)}
                                                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                                                    />
                                                    <p className="mt-1 text-xs text-gray-500">
                                                        {formatMoney(data.service_prices?.[serviceSlug]?.[packageCode])}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            {errors.service_prices && <p className="mt-2 text-xs text-red-600">{errors.service_prices}</p>}
                        </div>

                        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                            <h3 className="text-lg font-semibold text-gray-900">Homepage Slideshow</h3>
                            <p className="mt-1 text-sm text-gray-600">
                                Each slide uses an image path from your public assets (for example: <code>3.png</code> or <code>optimized/slide.webp</code>).
                            </p>

                            <div className="mt-5 space-y-4">
                                {(data.home_slides || []).map((slide, index) => (
                                    <div key={`slide-${index}`} className="rounded-xl border border-gray-200 p-4">
                                        <div className="mb-3 flex items-center justify-between">
                                            <h4 className="text-sm font-semibold text-gray-900">Slide {index + 1}</h4>
                                            <button
                                                type="button"
                                                onClick={() => removeSlide(index)}
                                                className="rounded-md border border-red-200 px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                                            >
                                                Remove
                                            </button>
                                        </div>

                                        <div className="grid gap-3 md:grid-cols-2">
                                            <div>
                                                <label className="mb-1 block text-sm font-medium text-gray-700">Title</label>
                                                <input
                                                    type="text"
                                                    value={slide.title || ''}
                                                    onChange={(event) => updateSlide(index, 'title', event.target.value)}
                                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                                                />
                                                {errors[`home_slides.${index}.title`] && (
                                                    <p className="mt-1 text-xs text-red-600">{errors[`home_slides.${index}.title`]}</p>
                                                )}
                                            </div>

                                            <div>
                                                <label className="mb-1 block text-sm font-medium text-gray-700">Image Path</label>
                                                <input
                                                    type="text"
                                                    value={slide.image || ''}
                                                    onChange={(event) => updateSlide(index, 'image', event.target.value)}
                                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                                                />
                                                {errors[`home_slides.${index}.image`] && (
                                                    <p className="mt-1 text-xs text-red-600">{errors[`home_slides.${index}.image`]}</p>
                                                )}
                                            </div>

                                            <div className="md:col-span-2">
                                                <label className="mb-1 block text-sm font-medium text-gray-700">Subtitle</label>
                                                <textarea
                                                    rows="2"
                                                    value={slide.subtitle || ''}
                                                    onChange={(event) => updateSlide(index, 'subtitle', event.target.value)}
                                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                                                />
                                            </div>

                                            <div>
                                                <label className="mb-1 block text-sm font-medium text-gray-700">CTA Label</label>
                                                <input
                                                    type="text"
                                                    value={slide.cta_label || ''}
                                                    onChange={(event) => updateSlide(index, 'cta_label', event.target.value)}
                                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                                                />
                                            </div>

                                            <div>
                                                <label className="mb-1 block text-sm font-medium text-gray-700">CTA URL</label>
                                                <input
                                                    type="text"
                                                    value={slide.cta_url || ''}
                                                    onChange={(event) => updateSlide(index, 'cta_url', event.target.value)}
                                                    placeholder="/order/brand-design"
                                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                                                />
                                                {errors[`home_slides.${index}.cta_url`] && (
                                                    <p className="mt-1 text-xs text-red-600">{errors[`home_slides.${index}.cta_url`]}</p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button
                                type="button"
                                onClick={addSlide}
                                className="mt-3 rounded-md border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
                            >
                                Add Slide
                            </button>
                        </div>

                        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                            <h3 className="text-lg font-semibold text-gray-900">Legal Terms Manager</h3>
                            <p className="mt-1 text-sm text-gray-600">
                                Super admins can update the Terms of Service, Privacy Policy, and Cookie Policy directly from this dashboard.
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
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

                        <div>
                            <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {processing ? 'Saving...' : 'Save Settings'}
                            </button>
                        </div>
                    </form>

                    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                        <h3 className="text-lg font-semibold text-gray-900">Discount Codes & Links</h3>
                        <p className="mt-1 text-sm text-gray-600">
                            Create service-specific discount links that auto-apply on checkout.
                        </p>

                        <form onSubmit={submitDiscountCode} className="mt-5 grid gap-4 lg:grid-cols-2">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Name (optional)</label>
                                <input
                                    type="text"
                                    value={discountForm.data.name}
                                    onChange={(event) => discountForm.setData('name', event.target.value)}
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Code</label>
                                <input
                                    type="text"
                                    value={discountForm.data.code}
                                    onChange={(event) => discountForm.setData('code', event.target.value)}
                                    placeholder="PROMO20"
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm uppercase focus:border-indigo-500 focus:outline-none"
                                />
                                {discountForm.errors.code && <p className="mt-1 text-xs text-red-600">{discountForm.errors.code}</p>}
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Discount Type</label>
                                <select
                                    value={discountForm.data.discount_type}
                                    onChange={(event) => discountForm.setData('discount_type', event.target.value)}
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                                >
                                    <option value="percentage">Percentage</option>
                                    <option value="fixed">Fixed Amount</option>
                                </select>
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Discount Value</label>
                                <input
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    value={discountForm.data.discount_value}
                                    onChange={(event) => discountForm.setData('discount_value', event.target.value)}
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                                />
                                {discountForm.errors.discount_value && <p className="mt-1 text-xs text-red-600">{discountForm.errors.discount_value}</p>}
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Service</label>
                                <select
                                    value={discountForm.data.service_slug}
                                    onChange={(event) => {
                                        discountForm.setData('service_slug', event.target.value);
                                        discountForm.setData('package_code', '');
                                    }}
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                                >
                                    {serviceEntries.map(([serviceSlug, service]) => (
                                        <option key={`discount-service-${serviceSlug}`} value={serviceSlug}>
                                            {service?.name || serviceSlug}
                                        </option>
                                    ))}
                                </select>
                                {discountForm.errors.service_slug && <p className="mt-1 text-xs text-red-600">{discountForm.errors.service_slug}</p>}
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Package (optional)</label>
                                <select
                                    value={discountForm.data.package_code}
                                    onChange={(event) => discountForm.setData('package_code', event.target.value)}
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                                >
                                    <option value="">All packages in this service</option>
                                    {Object.entries(selectedServicePackages).map(([packageCode, packageMeta]) => (
                                        <option key={`discount-package-${packageCode}`} value={packageCode}>
                                            {packageMeta?.name || packageCode}
                                        </option>
                                    ))}
                                </select>
                                {discountForm.errors.package_code && <p className="mt-1 text-xs text-red-600">{discountForm.errors.package_code}</p>}
                            </div>

                            {discountForm.data.discount_type === 'fixed' && (
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">Currency</label>
                                    <input
                                        type="text"
                                        value={discountForm.data.currency}
                                        onChange={(event) => discountForm.setData('currency', event.target.value.toUpperCase())}
                                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm uppercase focus:border-indigo-500 focus:outline-none"
                                    />
                                    {discountForm.errors.currency && <p className="mt-1 text-xs text-red-600">{discountForm.errors.currency}</p>}
                                </div>
                            )}

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Starts At (optional)</label>
                                <input
                                    type="date"
                                    value={discountForm.data.starts_at}
                                    onChange={(event) => discountForm.setData('starts_at', event.target.value)}
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Ends At (optional)</label>
                                <input
                                    type="date"
                                    value={discountForm.data.ends_at}
                                    onChange={(event) => discountForm.setData('ends_at', event.target.value)}
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Max Redemptions (optional)</label>
                                <input
                                    type="number"
                                    min="1"
                                    step="1"
                                    value={discountForm.data.max_redemptions}
                                    onChange={(event) => discountForm.setData('max_redemptions', event.target.value)}
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                                />
                            </div>

                            <div className="flex items-center gap-2 lg:col-span-2">
                                <input
                                    id="discount_is_active"
                                    type="checkbox"
                                    checked={Boolean(discountForm.data.is_active)}
                                    onChange={(event) => discountForm.setData('is_active', event.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <label htmlFor="discount_is_active" className="text-sm font-medium text-gray-700">Active immediately</label>
                            </div>

                            {(discountForm.errors.discount_type || discountForm.errors.starts_at || discountForm.errors.ends_at || discountForm.errors.max_redemptions) && (
                                <p className="text-xs text-red-600 lg:col-span-2">
                                    {discountForm.errors.discount_type || discountForm.errors.starts_at || discountForm.errors.ends_at || discountForm.errors.max_redemptions}
                                </p>
                            )}

                            <div className="lg:col-span-2">
                                <button
                                    type="submit"
                                    disabled={discountForm.processing}
                                    className="inline-flex items-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {discountForm.processing ? 'Creating...' : 'Create Discount Code'}
                                </button>
                            </div>
                        </form>

                        <div className="mt-6 overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-600">
                                    <tr>
                                        <th className="px-3 py-2 text-left">Code</th>
                                        <th className="px-3 py-2 text-left">Scope</th>
                                        <th className="px-3 py-2 text-left">Value</th>
                                        <th className="px-3 py-2 text-left">Usage</th>
                                        <th className="px-3 py-2 text-left">Status</th>
                                        <th className="px-3 py-2 text-left">Discount Link</th>
                                        <th className="px-3 py-2 text-left">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 bg-white text-gray-700">
                                    {discountCodes.length === 0 && (
                                        <tr>
                                            <td className="px-3 py-4 text-sm text-gray-500" colSpan={7}>
                                                No discount codes yet.
                                            </td>
                                        </tr>
                                    )}

                                    {discountCodes.map((discountCode) => (
                                        <tr key={`discount-${discountCode.id}`}>
                                            <td className="px-3 py-3">
                                                <p className="font-semibold text-gray-900">{discountCode.code}</p>
                                                <p className="text-xs text-gray-500">{discountCode.name || 'Unnamed discount'}</p>
                                            </td>
                                            <td className="px-3 py-3">
                                                <p>{serviceCatalog?.[discountCode.service_slug]?.name || discountCode.service_slug}</p>
                                                <p className="text-xs text-gray-500">{discountCode.package_code || 'All service packages'}</p>
                                            </td>
                                            <td className="px-3 py-3">
                                                {discountCode.discount_type === 'percentage'
                                                    ? `${discountCode.discount_value}%`
                                                    : `${discountCode.currency || 'NGN'} ${discountCode.discount_value}`}
                                            </td>
                                            <td className="px-3 py-3">
                                                <p>{discountCode.total_redemptions} redeemed</p>
                                                <p className="text-xs text-gray-500">
                                                    {discountCode.max_redemptions ? `Limit: ${discountCode.max_redemptions}` : 'No limit'}
                                                </p>
                                            </td>
                                            <td className="px-3 py-3">
                                                <span className={`rounded-full px-2 py-1 text-xs font-semibold ${
                                                    discountCode.is_active
                                                        ? 'bg-emerald-100 text-emerald-700'
                                                        : 'bg-gray-100 text-gray-600'
                                                }`}>
                                                    {discountCode.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-3 py-3">
                                                <a
                                                    href={discountCode.discount_link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="break-all text-xs text-indigo-600 hover:text-indigo-800"
                                                >
                                                    {discountCode.discount_link}
                                                </a>
                                            </td>
                                            <td className="px-3 py-3">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleDiscountStatus(discountCode)}
                                                        className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                                    >
                                                        {discountCode.is_active ? 'Deactivate' : 'Activate'}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => copyDiscountLink(discountCode)}
                                                        className="rounded-md border border-indigo-200 px-2.5 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-50"
                                                    >
                                                        {copiedLinkId === discountCode.id ? 'Copied' : 'Copy Link'}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => deleteDiscountCode(discountCode)}
                                                        className="rounded-md border border-red-200 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-50"
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
                    </div>

                    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                        <h3 className="text-lg font-semibold text-gray-900">Subscription Plans</h3>
                        <p className="mt-1 text-sm text-gray-600">
                            Create and market service subscription plans, then control what gets highlighted on the homepage.
                        </p>

                        <form onSubmit={submitSubscriptionPlan} className="mt-5 grid gap-4 lg:grid-cols-2">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Plan Name</label>
                                <input
                                    type="text"
                                    value={subscriptionPlanForm.data.name}
                                    onChange={(event) => subscriptionPlanForm.setData('name', event.target.value)}
                                    placeholder="Growth Design Plan"
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                                />
                                {subscriptionPlanForm.errors.name && <p className="mt-1 text-xs text-red-600">{subscriptionPlanForm.errors.name}</p>}
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Billing Cycle</label>
                                <select
                                    value={subscriptionPlanForm.data.billing_cycle}
                                    onChange={(event) => subscriptionPlanForm.setData('billing_cycle', event.target.value)}
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                                >
                                    <option value="monthly">Monthly</option>
                                    <option value="quarterly">Quarterly</option>
                                    <option value="biannually">Biannually</option>
                                    <option value="yearly">Yearly</option>
                                </select>
                                {subscriptionPlanForm.errors.billing_cycle && <p className="mt-1 text-xs text-red-600">{subscriptionPlanForm.errors.billing_cycle}</p>}
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Service</label>
                                <select
                                    value={subscriptionPlanForm.data.service_slug}
                                    onChange={(event) => {
                                        subscriptionPlanForm.setData('service_slug', event.target.value);
                                        subscriptionPlanForm.setData('package_code', '');
                                    }}
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                                >
                                    {serviceEntries.map(([serviceSlug, service]) => (
                                        <option key={`plan-service-${serviceSlug}`} value={serviceSlug}>
                                            {service?.name || serviceSlug}
                                        </option>
                                    ))}
                                </select>
                                {subscriptionPlanForm.errors.service_slug && <p className="mt-1 text-xs text-red-600">{subscriptionPlanForm.errors.service_slug}</p>}
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Package</label>
                                <select
                                    value={subscriptionPlanForm.data.package_code}
                                    onChange={(event) => subscriptionPlanForm.setData('package_code', event.target.value)}
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                                >
                                    <option value="">Select package</option>
                                    {Object.entries(selectedPlanPackages).map(([packageCode, packageMeta]) => (
                                        <option key={`plan-package-${packageCode}`} value={packageCode}>
                                            {packageMeta?.name || packageCode}
                                        </option>
                                    ))}
                                </select>
                                {subscriptionPlanForm.errors.package_code && <p className="mt-1 text-xs text-red-600">{subscriptionPlanForm.errors.package_code}</p>}
                            </div>

                            <div className="lg:col-span-2">
                                <label className="mb-1 block text-sm font-medium text-gray-700">Short Description (optional)</label>
                                <textarea
                                    rows={2}
                                    value={subscriptionPlanForm.data.short_description}
                                    onChange={(event) => subscriptionPlanForm.setData('short_description', event.target.value)}
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                                />
                                {subscriptionPlanForm.errors.short_description && <p className="mt-1 text-xs text-red-600">{subscriptionPlanForm.errors.short_description}</p>}
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Display Position</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={subscriptionPlanForm.data.position}
                                    onChange={(event) => subscriptionPlanForm.setData('position', event.target.value)}
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                                />
                                {subscriptionPlanForm.errors.position && <p className="mt-1 text-xs text-red-600">{subscriptionPlanForm.errors.position}</p>}
                            </div>

                            <div className="grid gap-2 rounded-lg border border-gray-200 p-3">
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                    <input
                                        type="checkbox"
                                        checked={Boolean(subscriptionPlanForm.data.is_active)}
                                        onChange={(event) => subscriptionPlanForm.setData('is_active', event.target.checked)}
                                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    Active
                                </label>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                    <input
                                        type="checkbox"
                                        checked={Boolean(subscriptionPlanForm.data.show_on_homepage)}
                                        onChange={(event) => subscriptionPlanForm.setData('show_on_homepage', event.target.checked)}
                                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    Show on homepage
                                </label>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                    <input
                                        type="checkbox"
                                        checked={Boolean(subscriptionPlanForm.data.is_homepage_featured)}
                                        onChange={(event) => subscriptionPlanForm.setData('is_homepage_featured', event.target.checked)}
                                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    Featured on homepage
                                </label>
                                <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                    <input
                                        type="checkbox"
                                        checked={Boolean(subscriptionPlanForm.data.is_recommended)}
                                        onChange={(event) => subscriptionPlanForm.setData('is_recommended', event.target.checked)}
                                        className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    Recommended
                                </label>
                            </div>

                            <div className="lg:col-span-2">
                                <button
                                    type="submit"
                                    disabled={subscriptionPlanForm.processing}
                                    className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {subscriptionPlanForm.processing ? 'Creating...' : 'Create Subscription Plan'}
                                </button>
                            </div>
                        </form>

                        <div className="mt-6 overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                                <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-600">
                                    <tr>
                                        <th className="px-3 py-2 text-left">Plan</th>
                                        <th className="px-3 py-2 text-left">Scope</th>
                                        <th className="px-3 py-2 text-left">Marketing Signals</th>
                                        <th className="px-3 py-2 text-left">Checkout Link</th>
                                        <th className="px-3 py-2 text-left">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 bg-white text-gray-700">
                                    {subscriptionPlans.length === 0 && (
                                        <tr>
                                            <td className="px-3 py-4 text-sm text-gray-500" colSpan={5}>
                                                No subscription plans created yet.
                                            </td>
                                        </tr>
                                    )}

                                    {subscriptionPlans.map((subscriptionPlan) => (
                                        <tr key={`subscription-plan-${subscriptionPlan.id}`}>
                                            <td className="px-3 py-3">
                                                <p className="font-semibold text-gray-900">{subscriptionPlan.name}</p>
                                                <p className="text-xs text-gray-500">{subscriptionPlan.billing_cycle}</p>
                                                <p className="text-xs text-gray-500">Position: {subscriptionPlan.position}</p>
                                            </td>
                                            <td className="px-3 py-3">
                                                <p>{subscriptionPlan.service_name}</p>
                                                <p className="text-xs text-gray-500">{subscriptionPlan.package_name}</p>
                                                <p className="mt-1 text-xs text-gray-500">{subscriptionPlan.short_description || 'No custom description'}</p>
                                            </td>
                                            <td className="px-3 py-3">
                                                <p className="text-xs text-gray-700">Paid subscriptions: {subscriptionPlan.paid_subscriptions}</p>
                                                <p className="text-xs text-gray-700">
                                                    Discount: {subscriptionPlan.active_discount_code ? `${subscriptionPlan.active_discount_code} (${subscriptionPlan.active_discount_summary})` : 'None'}
                                                </p>
                                                <p className="text-xs text-gray-700">
                                                    Status: {subscriptionPlan.is_active ? 'Active' : 'Inactive'} | Homepage: {subscriptionPlan.show_on_homepage ? 'Shown' : 'Hidden'}
                                                </p>
                                                <p className="text-xs text-gray-700">
                                                    Featured: {subscriptionPlan.is_homepage_featured ? 'Yes' : 'No'} | Recommended: {subscriptionPlan.is_recommended ? 'Yes' : 'No'}
                                                </p>
                                            </td>
                                            <td className="px-3 py-3">
                                                <a
                                                    href={subscriptionPlan.checkout_link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="break-all text-xs text-indigo-600 hover:text-indigo-800"
                                                >
                                                    {subscriptionPlan.checkout_link}
                                                </a>
                                            </td>
                                            <td className="px-3 py-3">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => updateSubscriptionPlan(subscriptionPlan, { is_active: !subscriptionPlan.is_active })}
                                                        className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                                    >
                                                        {subscriptionPlan.is_active ? 'Deactivate' : 'Activate'}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => updateSubscriptionPlan(subscriptionPlan, { show_on_homepage: !subscriptionPlan.show_on_homepage })}
                                                        className="rounded-md border border-indigo-200 px-2.5 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-50"
                                                    >
                                                        {subscriptionPlan.show_on_homepage ? 'Hide Homepage' : 'Show Homepage'}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => updateSubscriptionPlan(subscriptionPlan, { is_homepage_featured: !subscriptionPlan.is_homepage_featured })}
                                                        className="rounded-md border border-amber-200 px-2.5 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-50"
                                                    >
                                                        {subscriptionPlan.is_homepage_featured ? 'Unfeature' : 'Feature'}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => updateSubscriptionPlan(subscriptionPlan, { is_recommended: !subscriptionPlan.is_recommended })}
                                                        className="rounded-md border border-emerald-200 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                                                    >
                                                        {subscriptionPlan.is_recommended ? 'Unrecommend' : 'Recommend'}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => deleteSubscriptionPlan(subscriptionPlan)}
                                                        className="rounded-md border border-red-200 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-50"
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
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
