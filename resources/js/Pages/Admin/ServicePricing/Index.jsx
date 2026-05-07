import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Modal from '@/Components/Modal';
import { Head, useForm, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';

const TARGET_SERVICES = [
    'social-media-design',
    'brand-design',
    'web-design',
    'mobile-app-development',
    'ui-ux',
];

function toPrice(value) {
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? n : '';
}

function buildInitialPackageOverrides(services = [], existing = {}) {
    const mapped = {};

    services.forEach((service) => {
        if (!TARGET_SERVICES.includes(service.slug)) {
            return;
        }

        const servicePayload = {};
        (service.packages || []).forEach((pack) => {
            const current = existing?.[service.slug]?.[pack.code] || {};

            servicePayload[pack.code] = {
                price: toPrice(current.price ?? pack.price),
                discount_price: toPrice(current.discount_price ?? pack.discount_price),
                is_recommended: Boolean(current.is_recommended ?? pack.is_recommended),
                features_text: Array.isArray(current.features ?? pack.features)
                    ? (current.features ?? pack.features).join('\n')
                    : '',
                description: String(current.description ?? pack.description ?? ''),
            };
        });

        mapped[service.slug] = servicePayload;
    });

    return mapped;
}

function normalizeGraphicItems(items = []) {
    if (!Array.isArray(items) || items.length === 0) {
        return [
            {
                id: '',
                title: '',
                description: '',
                image_path: '',
                unit_price: '',
            },
        ];
    }

    return items.map((item) => ({
        id: item?.id || '',
        title: item?.title || '',
        description: item?.description || '',
        image_path: item?.image_path || '',
        unit_price: toPrice(item?.unit_price),
    }));
}

function imageSrc(path) {
    if (!path) {
        return '';
    }

    return /^https?:\/\//i.test(path) ? path : path.startsWith('/') ? path : `/${path}`;
}

export default function ServicePricing({
    services = [],
    packageOverrides = {},
    graphicDesignItems = [],
    socialGraphicTrialFeeNgn = 0,
}) {
    const { flash } = usePage().props;

    const editableServices = useMemo(
        () => services.filter((service) => TARGET_SERVICES.includes(service.slug)),
        [services],
    );

    const form = useForm({
        package_overrides: buildInitialPackageOverrides(services, packageOverrides),
        graphic_design_items: normalizeGraphicItems(graphicDesignItems),
        social_graphic_trial_fee_ngn: toPrice(socialGraphicTrialFeeNgn),
    });

    const [selectorOpen, setSelectorOpen] = useState(false);
    const [selectorFiles, setSelectorFiles] = useState([]);
    const [selectorLoading, setSelectorLoading] = useState(false);
    const [selectorError, setSelectorError] = useState('');
    const [selectorTargetIndex, setSelectorTargetIndex] = useState(null);

    const saveAll = (event) => {
        event.preventDefault();

        const payload = {
            package_overrides: Object.fromEntries(
                Object.entries(form.data.package_overrides || {}).map(([serviceSlug, packages]) => [
                    serviceSlug,
                    Object.fromEntries(
                        Object.entries(packages || {}).map(([packageCode, value]) => [
                            packageCode,
                            {
                                price: value.price === '' ? null : Number(value.price),
                                discount_price: value.discount_price === '' ? null : Number(value.discount_price),
                                is_recommended: Boolean(value.is_recommended),
                                features: String(value.features_text || '')
                                    .split(/\r?\n/)
                                    .map((line) => line.trim())
                                    .filter(Boolean),
                                description: String(value.description || '').trim(),
                            },
                        ]),
                    ),
                ]),
            ),
            graphic_design_items: (form.data.graphic_design_items || [])
                .map((item) => ({
                    id: item.id || '',
                    title: String(item.title || '').trim(),
                    description: String(item.description || '').trim(),
                    image_path: String(item.image_path || '').trim(),
                    unit_price: item.unit_price === '' ? 0 : Number(item.unit_price),
                }))
                .filter((item) => item.title !== '' && item.unit_price > 0),
            social_graphic_trial_fee_ngn: form.data.social_graphic_trial_fee_ngn === ''
                ? 0
                : Number(form.data.social_graphic_trial_fee_ngn),
        };

        form.transform(() => payload).patch(route('admin.service-pricing.update'), {
            preserveScroll: true,
        });
    };

    const setPackageField = (serviceSlug, packageCode, field, value) => {
        form.setData('package_overrides', {
            ...(form.data.package_overrides || {}),
            [serviceSlug]: {
                ...((form.data.package_overrides || {})[serviceSlug] || {}),
                [packageCode]: {
                    ...((form.data.package_overrides || {})[serviceSlug]?.[packageCode] || {}),
                    [field]: value,
                },
            },
        });
    };

    const setGraphicItem = (index, field, value) => {
        const next = [...(form.data.graphic_design_items || [])];
        next[index] = {
            ...(next[index] || {}),
            [field]: value,
        };

        form.setData('graphic_design_items', next);
    };

    const addGraphicItem = () => {
        form.setData('graphic_design_items', [
            ...(form.data.graphic_design_items || []),
            {
                id: '',
                title: '',
                description: '',
                image_path: '',
                unit_price: '',
            },
        ]);
    };

    const removeGraphicItem = (index) => {
        const next = [...(form.data.graphic_design_items || [])].filter((_, current) => current !== index);
        form.setData('graphic_design_items', next.length > 0 ? next : [{ id: '', title: '', description: '', image_path: '', unit_price: '' }]);
    };

    const openMediaSelector = async (index) => {
        setSelectorTargetIndex(index);
        setSelectorOpen(true);
        setSelectorLoading(true);
        setSelectorError('');

        try {
            const response = await window.axios.get(route('admin.slides.media.index'));
            setSelectorFiles(Array.isArray(response?.data?.files) ? response.data.files : []);
        } catch (error) {
            setSelectorError('Unable to load media files right now.');
        } finally {
            setSelectorLoading(false);
        }
    };

    const closeSelector = () => {
        setSelectorOpen(false);
        setSelectorTargetIndex(null);
    };

    const selectGraphicImage = (path) => {
        if (selectorTargetIndex === null) {
            return;
        }

        setGraphicItem(selectorTargetIndex, 'image_path', path);
        closeSelector();
    };

    const uploadGraphicImage = async (index, file) => {
        if (!file) {
            return;
        }

        const body = new FormData();
        body.append('file', file);

        try {
            const response = await window.axios.post(route('admin.slides.media.upload'), body, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            const path = String(response?.data?.path || '');
            if (path !== '') {
                setGraphicItem(index, 'image_path', path);
            }
        } catch (error) {
            window.alert('Image upload failed. Try another file.');
        }
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Service Pricing</h2>}
        >
            <Head title="Service Pricing" />

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

                    <form onSubmit={saveAll} className="space-y-6">
                        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                            <h3 className="text-lg font-semibold text-gray-900">Service Plans / Packages</h3>
                            <p className="mt-1 text-sm text-gray-600">
                                Set plan price, discount price, recommended toggle, description, and feature bullets.
                            </p>

                            <div className="mt-6 space-y-6">
                                {editableServices.map((service) => (
                                    <div key={service.slug} className="rounded-xl border border-gray-200 p-4">
                                        <h4 className="text-base font-semibold text-gray-900">{service.name}</h4>
                                        <p className="mt-1 text-sm text-gray-600">{service.description}</p>

                                        <div className="mt-4 grid gap-4">
                                            {(service.packages || []).map((pack) => {
                                                const state = form.data.package_overrides?.[service.slug]?.[pack.code] || {};

                                                return (
                                                    <div key={`${service.slug}-${pack.code}`} className="rounded-lg border border-gray-200 p-4">
                                                        <p className="text-sm font-semibold text-gray-900">{pack.name}</p>
                                                        <p className="text-xs text-gray-500">{pack.code}</p>

                                                        <div className="mt-3 grid gap-3 md:grid-cols-3">
                                                            <div>
                                                                <label className="mb-1 block text-sm font-medium text-gray-700">Price</label>
                                                                <input
                                                                    type="number"
                                                                    step="0.01"
                                                                    min="0.01"
                                                                    value={state.price ?? ''}
                                                                    onChange={(event) => setPackageField(service.slug, pack.code, 'price', event.target.value)}
                                                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="mb-1 block text-sm font-medium text-gray-700">Discount Price</label>
                                                                <input
                                                                    type="number"
                                                                    step="0.01"
                                                                    min="0.01"
                                                                    value={state.discount_price ?? ''}
                                                                    onChange={(event) => setPackageField(service.slug, pack.code, 'discount_price', event.target.value)}
                                                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                                                                />
                                                            </div>
                                                            <label className="flex items-center gap-2 rounded-md border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={Boolean(state.is_recommended)}
                                                                    onChange={(event) => setPackageField(service.slug, pack.code, 'is_recommended', event.target.checked)}
                                                                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                                                />
                                                                Recommended plan/pack
                                                            </label>
                                                        </div>

                                                        <div className="mt-3 grid gap-3 md:grid-cols-2">
                                                            <div>
                                                                <label className="mb-1 block text-sm font-medium text-gray-700">Short Description</label>
                                                                <textarea
                                                                    rows={2}
                                                                    value={state.description ?? ''}
                                                                    onChange={(event) => setPackageField(service.slug, pack.code, 'description', event.target.value)}
                                                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="mb-1 block text-sm font-medium text-gray-700">Features (one per line)</label>
                                                                <textarea
                                                                    rows={4}
                                                                    value={state.features_text ?? ''}
                                                                    onChange={(event) => setPackageField(service.slug, pack.code, 'features_text', event.target.value)}
                                                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                            <h3 className="text-lg font-semibold text-gray-900">Social & Graphic Trial Fee</h3>
                            <p className="mt-1 text-sm text-gray-600">
                                Set the fixed fee used when clients choose the trial request option outside regular plans/packs.
                            </p>
                            <div className="mt-4 max-w-sm">
                                <label className="mb-1 block text-sm font-medium text-gray-700">Trial Fee (NGN)</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={form.data.social_graphic_trial_fee_ngn ?? ''}
                                    onChange={(event) => form.setData('social_graphic_trial_fee_ngn', event.target.value)}
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                                />
                                <p className="mt-2 text-xs text-gray-500">
                                    Set to 0 to disable the trial option on the public order form.
                                </p>
                            </div>
                        </div>

                        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                            <h3 className="text-lg font-semibold text-gray-900">Graphic Design Items</h3>
                            <p className="mt-1 text-sm text-gray-600">
                                Add design items with description, image sample, and unit price.
                            </p>

                            <div className="mt-5 space-y-4">
                                {(form.data.graphic_design_items || []).map((item, index) => (
                                    <div key={`graphic-item-${index}`} className="rounded-lg border border-gray-200 p-4">
                                        <div className="mb-2 flex items-center justify-between">
                                            <p className="text-sm font-semibold text-gray-900">Item {index + 1}</p>
                                            <button
                                                type="button"
                                                onClick={() => removeGraphicItem(index)}
                                                className="rounded-md border border-red-200 px-2.5 py-1 text-xs font-semibold text-red-700 hover:bg-red-50"
                                            >
                                                Remove
                                            </button>
                                        </div>

                                        <div className="grid gap-3 md:grid-cols-2">
                                            <div>
                                                <label className="mb-1 block text-sm font-medium text-gray-700">Design Item</label>
                                                <input
                                                    type="text"
                                                    value={item.title || ''}
                                                    onChange={(event) => setGraphicItem(index, 'title', event.target.value)}
                                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                                                />
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-sm font-medium text-gray-700">Unit Price</label>
                                                <input
                                                    type="number"
                                                    min="0.01"
                                                    step="0.01"
                                                    value={item.unit_price || ''}
                                                    onChange={(event) => setGraphicItem(index, 'unit_price', event.target.value)}
                                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                                                />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
                                                <textarea
                                                    rows={3}
                                                    value={item.description || ''}
                                                    onChange={(event) => setGraphicItem(index, 'description', event.target.value)}
                                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                                                />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="mb-1 block text-sm font-medium text-gray-700">Image Sample Path</label>
                                                <input
                                                    type="text"
                                                    value={item.image_path || ''}
                                                    onChange={(event) => setGraphicItem(index, 'image_path', event.target.value)}
                                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                                                />
                                                <div className="mt-2 flex flex-wrap gap-2">
                                                    <label className="rounded-md border border-indigo-200 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-50">
                                                        Upload Image
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            className="hidden"
                                                            onChange={(event) => {
                                                                const file = event.target.files?.[0];
                                                                if (file) {
                                                                    uploadGraphicImage(index, file);
                                                                }
                                                                event.target.value = '';
                                                            }}
                                                        />
                                                    </label>
                                                    <button
                                                        type="button"
                                                        onClick={() => openMediaSelector(index)}
                                                        className="rounded-md border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                                                    >
                                                        Media Selector
                                                    </button>
                                                </div>
                                                {item.image_path && (
                                                    <img
                                                        src={imageSrc(item.image_path)}
                                                        alt={item.title || 'Sample'}
                                                        className="mt-3 h-24 w-24 rounded-md border border-gray-200 object-cover"
                                                    />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button
                                type="button"
                                onClick={addGraphicItem}
                                className="mt-3 rounded-md border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
                            >
                                Add Graphic Design Item
                            </button>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={form.processing}
                                className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {form.processing ? 'Saving...' : 'Save Service Pricing'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <Modal show={selectorOpen} maxWidth="2xl" onClose={closeSelector}>
                <div className="space-y-4 p-5 sm:p-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">Select Media File</h3>
                        <button
                            type="button"
                            onClick={closeSelector}
                            className="rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                        >
                            Close
                        </button>
                    </div>

                    {selectorLoading && <p className="text-sm text-gray-600">Loading media...</p>}
                    {selectorError && <p className="text-sm text-red-600">{selectorError}</p>}

                    {!selectorLoading && !selectorError && (
                        <div className="max-h-[60vh] overflow-y-auto rounded-md border border-gray-200 p-3">
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {selectorFiles.map((file) => (
                                    <button
                                        key={file.path}
                                        type="button"
                                        onClick={() => selectGraphicImage(file.path)}
                                        className="overflow-hidden rounded-md border border-gray-200 text-left transition hover:border-indigo-400 hover:shadow-sm"
                                    >
                                        <div className="h-24 w-full overflow-hidden bg-gray-50">
                                            <img
                                                src={imageSrc(file.preview_url || file.path)}
                                                alt={file.name || file.path}
                                                className="h-full w-full object-cover"
                                            />
                                        </div>
                                        <div className="space-y-1 p-2">
                                            <p className="truncate text-xs font-semibold text-gray-900">{file.name}</p>
                                            <p className="truncate text-[11px] text-gray-500">{file.path}</p>
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
