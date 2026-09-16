import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Modal from '@/Components/Modal';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';

function toPrice(value) {
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? n : '';
}

function buildInitialPackageOverrides(packages = [], existing = {}) {
    const mapped = {};

    packages.forEach((pack) => {
        const current = existing?.[pack.code] || {};

        mapped[pack.code] = {
            price: toPrice(current.price ?? pack.price),
            discount_price: toPrice(current.discount_price ?? pack.discount_price),
            is_recommended: Boolean(current.is_recommended ?? pack.is_recommended),
            features_text: Array.isArray(current.features ?? pack.features)
                ? (current.features ?? pack.features).join('\n')
                : '',
            description: String(current.description ?? pack.description ?? ''),
        };
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

export default function ServicePricingShow({
    serviceSlug,
    services = [],
    service = null,
    packageOverrides = {},
    graphicDesignItems = null,
    socialGraphicTrialFeeNgn = null,
}) {
    const { flash } = usePage().props;
    const isGraphicDesign = serviceSlug === 'graphic-design';
    const showsTrialFee = socialGraphicTrialFeeNgn !== null;
    const packages = service?.packages || [];

    const form = useForm({
        package_overrides: isGraphicDesign ? {} : buildInitialPackageOverrides(packages, packageOverrides),
        graphic_design_items: isGraphicDesign ? normalizeGraphicItems(graphicDesignItems) : [],
        social_graphic_trial_fee_ngn: showsTrialFee ? toPrice(socialGraphicTrialFeeNgn) : '',
    });

    const [selectorOpen, setSelectorOpen] = useState(false);
    const [selectorFiles, setSelectorFiles] = useState([]);
    const [selectorLoading, setSelectorLoading] = useState(false);
    const [selectorError, setSelectorError] = useState('');
    const [selectorTargetIndex, setSelectorTargetIndex] = useState(null);

    const setPackageField = (packageCode, field, value) => {
        form.setData('package_overrides', {
            ...(form.data.package_overrides || {}),
            [packageCode]: {
                ...((form.data.package_overrides || {})[packageCode] || {}),
                [field]: value,
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
            const response = await window.axios.get(route('admin.gallery.media.index'));
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
            const response = await window.axios.post(route('admin.gallery.media.upload'), body, {
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

    const saveAll = (event) => {
        event.preventDefault();

        const payload = {};

        if (!isGraphicDesign) {
            payload.package_overrides = Object.fromEntries(
                Object.entries(form.data.package_overrides || {}).map(([packageCode, value]) => [
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
            );
        }

        if (isGraphicDesign) {
            payload.graphic_design_items = (form.data.graphic_design_items || [])
                .map((item) => ({
                    id: item.id || '',
                    title: String(item.title || '').trim(),
                    description: String(item.description || '').trim(),
                    image_path: String(item.image_path || '').trim(),
                    unit_price: item.unit_price === '' ? 0 : Number(item.unit_price),
                }))
                .filter((item) => item.title !== '' && item.unit_price > 0);
        }

        if (showsTrialFee) {
            payload.social_graphic_trial_fee_ngn = form.data.social_graphic_trial_fee_ngn === ''
                ? 0
                : Number(form.data.social_graphic_trial_fee_ngn);
        }

        form.transform(() => payload);
        form.patch(route('admin.service-pricing.update', serviceSlug), {
            preserveScroll: true,
        });
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold leading-tight text-white/90">Service Pricing — {service?.name || serviceSlug}</h2>}
        >
            <Head title={`Service Pricing - ${service?.name || serviceSlug}`} />

            <div className="py-10">
                <div className="mx-auto max-w-6xl space-y-6 px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-wrap gap-2 rounded-2xl border border-jv-line bg-white/[0.04] p-4 ">
                        {services.map((entry) => (
                            <Link
                                key={entry.slug}
                                href={route('admin.service-pricing.edit', entry.slug)}
                                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
 entry.slug === serviceSlug
 ? 'bg-jv-accent text-white'
 : 'border border-jv-line text-white/75 hover:bg-white/[0.04]'
 }`}
                            >
                                {entry.name}
                            </Link>
                        ))}
                    </div>

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
                        {!isGraphicDesign && (
                            <div className="rounded-2xl border border-jv-line bg-white/[0.04] p-6 ">
                                <h3 className="text-lg font-semibold text-white">{service?.name} Packages</h3>
                                <p className="mt-1 text-sm text-white/65">
                                    Set plan price, discount price, recommended toggle, description, and feature bullets.
                                </p>

                                <div className="mt-6 space-y-4">
                                    {packages.map((pack) => {
                                        const state = form.data.package_overrides?.[pack.code] || {};

                                        return (
                                            <div key={pack.code} className="rounded-lg border border-jv-line p-4">
                                                <p className="text-sm font-semibold text-white">{pack.name}</p>
                                                <p className="text-xs text-white/50">{pack.code}</p>

                                                <div className="mt-3 grid gap-3 md:grid-cols-3">
                                                    <div>
                                                        <label className="mb-1 block text-sm font-medium text-white/75">Price</label>
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            min="0.01"
                                                            value={state.price ?? ''}
                                                            onChange={(event) => setPackageField(pack.code, 'price', event.target.value)}
                                                            className="w-full rounded-md border border-jv-line-strong px-3 py-2 text-sm focus:border-jv-accent focus:outline-none focus:ring-2 focus:ring-jv-accent/20"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="mb-1 block text-sm font-medium text-white/75">Discount Price</label>
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            min="0.01"
                                                            value={state.discount_price ?? ''}
                                                            onChange={(event) => setPackageField(pack.code, 'discount_price', event.target.value)}
                                                            className="w-full rounded-md border border-jv-line-strong px-3 py-2 text-sm focus:border-jv-accent focus:outline-none focus:ring-2 focus:ring-jv-accent/20"
                                                        />
                                                    </div>
                                                    <label className="flex items-center gap-2 rounded-md border border-jv-line px-3 py-2 text-sm font-medium text-white/75">
                                                        <input
                                                            type="checkbox"
                                                            checked={Boolean(state.is_recommended)}
                                                            onChange={(event) => setPackageField(pack.code, 'is_recommended', event.target.checked)}
                                                            className="h-4 w-4 rounded border-jv-line-strong text-jv-accent focus:ring-jv-accent"
                                                        />
                                                        Recommended plan/pack
                                                    </label>
                                                </div>

                                                <div className="mt-3 grid gap-3 md:grid-cols-2">
                                                    <div>
                                                        <label className="mb-1 block text-sm font-medium text-white/75">Short Description</label>
                                                        <textarea
                                                            rows={2}
                                                            value={state.description ?? ''}
                                                            onChange={(event) => setPackageField(pack.code, 'description', event.target.value)}
                                                            className="w-full rounded-md border border-jv-line-strong px-3 py-2 text-sm focus:border-jv-accent focus:outline-none focus:ring-2 focus:ring-jv-accent/20"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="mb-1 block text-sm font-medium text-white/75">Features (one per line)</label>
                                                        <textarea
                                                            rows={4}
                                                            value={state.features_text ?? ''}
                                                            onChange={(event) => setPackageField(pack.code, 'features_text', event.target.value)}
                                                            className="w-full rounded-md border border-jv-line-strong px-3 py-2 text-sm focus:border-jv-accent focus:outline-none focus:ring-2 focus:ring-jv-accent/20"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {packages.length === 0 && (
                                        <p className="text-sm text-white/50">This service has no packages configured.</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {showsTrialFee && (
                            <div className="rounded-2xl border border-jv-line bg-white/[0.04] p-6 ">
                                <h3 className="text-lg font-semibold text-white">Trial Request Fee</h3>
                                <p className="mt-1 text-sm text-white/65">
                                    Set the fixed fee used when clients choose the trial request option outside regular plans/packs. This fee is shared between Social Media Design and Graphic Design.
                                </p>
                                <div className="mt-4 max-w-sm">
                                    <label className="mb-1 block text-sm font-medium text-white/75">Trial Fee (NGN)</label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={form.data.social_graphic_trial_fee_ngn ?? ''}
                                        onChange={(event) => form.setData('social_graphic_trial_fee_ngn', event.target.value)}
                                        className="w-full rounded-md border border-jv-line-strong px-3 py-2 text-sm focus:border-jv-accent focus:outline-none focus:ring-2 focus:ring-jv-accent/20"
                                    />
                                    <p className="mt-2 text-xs text-white/50">
                                        Set to 0 to disable the trial option on the public order form.
                                    </p>
                                </div>
                            </div>
                        )}

                        {isGraphicDesign && (
                            <div className="rounded-2xl border border-jv-line bg-white/[0.04] p-6 ">
                                <h3 className="text-lg font-semibold text-white">Graphic Design Items</h3>
                                <p className="mt-1 text-sm text-white/65">
                                    Add design items with description, image sample, and unit price.
                                </p>

                                <div className="mt-5 space-y-4">
                                    {(form.data.graphic_design_items || []).map((item, index) => (
                                        <div key={`graphic-item-${index}`} className="rounded-lg border border-jv-line p-4">
                                            <div className="mb-2 flex items-center justify-between">
                                                <p className="text-sm font-semibold text-white">Item {index + 1}</p>
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
                                                    <label className="mb-1 block text-sm font-medium text-white/75">Design Item</label>
                                                    <input
                                                        type="text"
                                                        value={item.title || ''}
                                                        onChange={(event) => setGraphicItem(index, 'title', event.target.value)}
                                                        className="w-full rounded-md border border-jv-line-strong px-3 py-2 text-sm focus:border-jv-accent focus:outline-none focus:ring-2 focus:ring-jv-accent/20"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="mb-1 block text-sm font-medium text-white/75">Unit Price</label>
                                                    <input
                                                        type="number"
                                                        min="0.01"
                                                        step="0.01"
                                                        value={item.unit_price || ''}
                                                        onChange={(event) => setGraphicItem(index, 'unit_price', event.target.value)}
                                                        className="w-full rounded-md border border-jv-line-strong px-3 py-2 text-sm focus:border-jv-accent focus:outline-none focus:ring-2 focus:ring-jv-accent/20"
                                                    />
                                                </div>
                                                <div className="md:col-span-2">
                                                    <label className="mb-1 block text-sm font-medium text-white/75">Description</label>
                                                    <textarea
                                                        rows={3}
                                                        value={item.description || ''}
                                                        onChange={(event) => setGraphicItem(index, 'description', event.target.value)}
                                                        className="w-full rounded-md border border-jv-line-strong px-3 py-2 text-sm focus:border-jv-accent focus:outline-none focus:ring-2 focus:ring-jv-accent/20"
                                                    />
                                                </div>
                                                <div className="md:col-span-2">
                                                    <label className="mb-1 block text-sm font-medium text-white/75">Image Sample Path</label>
                                                    <input
                                                        type="text"
                                                        value={item.image_path || ''}
                                                        onChange={(event) => setGraphicItem(index, 'image_path', event.target.value)}
                                                        className="w-full rounded-md border border-jv-line-strong px-3 py-2 text-sm focus:border-jv-accent focus:outline-none focus:ring-2 focus:ring-jv-accent/20"
                                                    />
                                                    <div className="mt-2 flex flex-wrap gap-2">
                                                        <label className="rounded-md border border-jv-accent/30 px-3 py-2 text-xs font-semibold text-jv-accent hover:bg-jv-accent/15">
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
                                                            className="rounded-md border border-jv-line-strong px-3 py-2 text-xs font-semibold text-white/75 hover:bg-white/[0.04]"
                                                        >
                                                            Media Selector
                                                        </button>
                                                    </div>
                                                    {item.image_path && (
                                                        <img
                                                            src={imageSrc(item.image_path)}
                                                            alt={item.title || 'Sample'}
                                                            className="mt-3 h-24 w-24 rounded-md border border-jv-line object-cover"
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
                                    className="mt-3 rounded-md border border-jv-accent/30 bg-jv-accent/15 px-3 py-1.5 text-xs font-semibold text-jv-accent hover:bg-jv-accent/15"
                                >
                                    Add Graphic Design Item
                                </button>
                            </div>
                        )}

                        <div>
                            <button
                                type="submit"
                                disabled={form.processing}
                                className="inline-flex items-center rounded-lg bg-jv-accent px-4 py-2 text-sm font-semibold text-white hover:bg-jv-accent-dark disabled:cursor-not-allowed disabled:opacity-60"
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
                        <h3 className="text-lg font-semibold text-white">Select Media File</h3>
                        <button
                            type="button"
                            onClick={closeSelector}
                            className="rounded-md border border-jv-line-strong px-3 py-2 text-sm font-semibold text-white/75 hover:bg-white/[0.04]"
                        >
                            Close
                        </button>
                    </div>

                    {selectorLoading && <p className="text-sm text-white/65">Loading media...</p>}
                    {selectorError && <p className="text-sm text-red-600">{selectorError}</p>}

                    {!selectorLoading && !selectorError && (
                        <div className="max-h-[60vh] overflow-y-auto rounded-md border border-jv-line p-3">
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {selectorFiles.map((file) => (
                                    <button
                                        key={file.path}
                                        type="button"
                                        onClick={() => selectGraphicImage(file.path)}
                                        className="overflow-hidden rounded-md border border-jv-line text-left transition hover:border-jv-accent hover:"
                                    >
                                        <div className="h-24 w-full overflow-hidden bg-white/[0.04]">
                                            <img
                                                src={imageSrc(file.preview_url || file.path)}
                                                alt={file.name || file.path}
                                                className="h-full w-full object-cover"
                                            />
                                        </div>
                                        <div className="space-y-1 p-2">
                                            <p className="truncate text-xs font-semibold text-white">{file.name}</p>
                                            <p className="truncate text-[11px] text-white/50">{file.path}</p>
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
