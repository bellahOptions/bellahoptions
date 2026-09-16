import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { MobileCard, MobileCardActions, MobileCardList } from '@/Components/ui/mobile-cards';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';

export default function DiscountCodesIndex({ serviceCatalog = {}, discountCodes = [] }) {
    const { flash } = usePage().props;

    const serviceEntries = useMemo(() => Object.entries(serviceCatalog || {}), [serviceCatalog]);
    const firstServiceSlug = serviceEntries[0]?.[0] ?? 'social-media-design';

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

    const [copiedLinkId, setCopiedLinkId] = useState(null);

    const selectedServicePackages = serviceCatalog?.[discountForm.data.service_slug]?.packages || {};

    const submitDiscountCode = (event) => {
        event.preventDefault();

        discountForm.post(route('admin.discount-codes.store'), {
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
            route('admin.discount-codes.status', discountCode.id),
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

        router.delete(route('admin.discount-codes.destroy', discountCode.id), {
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

    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold leading-tight text-white/90">Discount Codes</h2>}
        >
            <Head title="Discount Codes" />

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

                    <div className="rounded-2xl border border-jv-line bg-white/[0.04] p-6 ">
                        <h3 className="text-lg font-semibold text-white">Discount Codes & Links</h3>
                        <p className="mt-1 text-sm text-white/65">
                            Create service-specific discount links that auto-apply on checkout.
                        </p>

                        <form onSubmit={submitDiscountCode} className="mt-5 grid gap-4 lg:grid-cols-2">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-white/75">Name (optional)</label>
                                <input
                                    type="text"
                                    value={discountForm.data.name}
                                    onChange={(event) => discountForm.setData('name', event.target.value)}
                                    className="w-full rounded-md border border-jv-line-strong px-3 py-2 text-sm focus:border-jv-accent focus:outline-none focus:ring-2 focus:ring-jv-accent/20"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-white/75">Code</label>
                                <input
                                    type="text"
                                    value={discountForm.data.code}
                                    onChange={(event) => discountForm.setData('code', event.target.value)}
                                    placeholder="PROMO20"
                                    className="w-full rounded-md border border-jv-line-strong px-3 py-2 text-sm uppercase focus:border-jv-accent focus:outline-none focus:ring-2 focus:ring-jv-accent/20"
                                />
                                {discountForm.errors.code && <p className="mt-1 text-xs text-red-600">{discountForm.errors.code}</p>}
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-white/75">Discount Type</label>
                                <select
                                    value={discountForm.data.discount_type}
                                    onChange={(event) => discountForm.setData('discount_type', event.target.value)}
                                    className="w-full rounded-md border border-jv-line-strong px-3 py-2 text-sm focus:border-jv-accent focus:outline-none focus:ring-2 focus:ring-jv-accent/20"
                                >
                                    <option value="percentage">Percentage</option>
                                    <option value="fixed">Fixed Amount</option>
                                </select>
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-white/75">Discount Value</label>
                                <input
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    value={discountForm.data.discount_value}
                                    onChange={(event) => discountForm.setData('discount_value', event.target.value)}
                                    className="w-full rounded-md border border-jv-line-strong px-3 py-2 text-sm focus:border-jv-accent focus:outline-none focus:ring-2 focus:ring-jv-accent/20"
                                />
                                {discountForm.errors.discount_value && <p className="mt-1 text-xs text-red-600">{discountForm.errors.discount_value}</p>}
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-white/75">Service</label>
                                <select
                                    value={discountForm.data.service_slug}
                                    onChange={(event) => {
                                        discountForm.setData('service_slug', event.target.value);
                                        discountForm.setData('package_code', '');
                                    }}
                                    className="w-full rounded-md border border-jv-line-strong px-3 py-2 text-sm focus:border-jv-accent focus:outline-none focus:ring-2 focus:ring-jv-accent/20"
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
                                <label className="mb-1 block text-sm font-medium text-white/75">Package (optional)</label>
                                <select
                                    value={discountForm.data.package_code}
                                    onChange={(event) => discountForm.setData('package_code', event.target.value)}
                                    className="w-full rounded-md border border-jv-line-strong px-3 py-2 text-sm focus:border-jv-accent focus:outline-none focus:ring-2 focus:ring-jv-accent/20"
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
                                    <label className="mb-1 block text-sm font-medium text-white/75">Currency</label>
                                    <input
                                        type="text"
                                        value={discountForm.data.currency}
                                        onChange={(event) => discountForm.setData('currency', event.target.value.toUpperCase())}
                                        className="w-full rounded-md border border-jv-line-strong px-3 py-2 text-sm uppercase focus:border-jv-accent focus:outline-none focus:ring-2 focus:ring-jv-accent/20"
                                    />
                                    {discountForm.errors.currency && <p className="mt-1 text-xs text-red-600">{discountForm.errors.currency}</p>}
                                </div>
                            )}

                            <div>
                                <label className="mb-1 block text-sm font-medium text-white/75">Starts At (optional)</label>
                                <input
                                    type="date"
                                    value={discountForm.data.starts_at}
                                    onChange={(event) => discountForm.setData('starts_at', event.target.value)}
                                    className="w-full rounded-md border border-jv-line-strong px-3 py-2 text-sm focus:border-jv-accent focus:outline-none focus:ring-2 focus:ring-jv-accent/20"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-white/75">Ends At (optional)</label>
                                <input
                                    type="date"
                                    value={discountForm.data.ends_at}
                                    onChange={(event) => discountForm.setData('ends_at', event.target.value)}
                                    className="w-full rounded-md border border-jv-line-strong px-3 py-2 text-sm focus:border-jv-accent focus:outline-none focus:ring-2 focus:ring-jv-accent/20"
                                />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-white/75">Max Redemptions (optional)</label>
                                <input
                                    type="number"
                                    min="1"
                                    step="1"
                                    value={discountForm.data.max_redemptions}
                                    onChange={(event) => discountForm.setData('max_redemptions', event.target.value)}
                                    className="w-full rounded-md border border-jv-line-strong px-3 py-2 text-sm focus:border-jv-accent focus:outline-none focus:ring-2 focus:ring-jv-accent/20"
                                />
                            </div>

                            <div className="flex items-center gap-2 lg:col-span-2">
                                <input
                                    id="discount_is_active"
                                    type="checkbox"
                                    checked={Boolean(discountForm.data.is_active)}
                                    onChange={(event) => discountForm.setData('is_active', event.target.checked)}
                                    className="h-4 w-4 rounded border-jv-line-strong text-jv-accent focus:ring-jv-accent"
                                />
                                <label htmlFor="discount_is_active" className="text-sm font-medium text-white/75">Active immediately</label>
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

                        <div className="mt-6 hidden overflow-x-auto md:block">
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                                <thead className="bg-white/[0.04] text-xs uppercase tracking-wide text-white/65">
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
                                <tbody className="divide-y divide-gray-100 bg-white/[0.04] text-white/75">
                                    {discountCodes.length === 0 && (
                                        <tr>
                                            <td className="px-3 py-4 text-sm text-white/50" colSpan={7}>
                                                No discount codes yet.
                                            </td>
                                        </tr>
                                    )}

                                    {discountCodes.map((discountCode) => (
                                        <tr key={`discount-${discountCode.id}`}>
                                            <td className="px-3 py-3">
                                                <p className="font-semibold text-white">{discountCode.code}</p>
                                                <p className="text-xs text-white/50">{discountCode.name || 'Unnamed discount'}</p>
                                            </td>
                                            <td className="px-3 py-3">
                                                <p>{serviceCatalog?.[discountCode.service_slug]?.name || discountCode.service_slug}</p>
                                                <p className="text-xs text-white/50">{discountCode.package_code || 'All service packages'}</p>
                                            </td>
                                            <td className="px-3 py-3">
                                                {discountCode.discount_type === 'percentage'
                                                    ? `${discountCode.discount_value}%`
                                                    : `${discountCode.currency || 'NGN'} ${discountCode.discount_value}`}
                                            </td>
                                            <td className="px-3 py-3">
                                                <p>{discountCode.total_redemptions} redeemed</p>
                                                <p className="text-xs text-white/50">
                                                    {discountCode.max_redemptions ? `Limit: ${discountCode.max_redemptions}` : 'No limit'}
                                                </p>
                                            </td>
                                            <td className="px-3 py-3">
                                                <span className={`rounded-full px-2 py-1 text-xs font-semibold ${
 discountCode.is_active
 ? 'bg-emerald-100 text-emerald-700'
 : 'bg-white/[0.06] text-white/65'
 }`}>
                                                    {discountCode.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-3 py-3">
                                                <a
                                                    href={discountCode.discount_link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="break-all text-xs text-jv-accent hover:text-jv-accent-dark"
                                                >
                                                    {discountCode.discount_link}
                                                </a>
                                            </td>
                                            <td className="px-3 py-3">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleDiscountStatus(discountCode)}
                                                        className="rounded-md border border-jv-line px-2.5 py-1 text-xs font-semibold text-white/75 hover:bg-white/[0.04]"
                                                    >
                                                        {discountCode.is_active ? 'Deactivate' : 'Activate'}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => copyDiscountLink(discountCode)}
                                                        className="rounded-md border border-jv-accent/30 px-2.5 py-1 text-xs font-semibold text-jv-accent hover:bg-jv-accent/15"
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

                        {discountCodes.length === 0 ? (
                            <p className="mt-6 text-sm text-white/50 md:hidden">No discount codes yet.</p>
                        ) : (
                            <MobileCardList className="mt-6">
                                {discountCodes.map((discountCode, index) => (
                                    <MobileCard key={`discount-mobile-${discountCode.id}`} index={index}>
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-semibold text-white">{discountCode.code}</p>
                                                <p className="truncate text-xs text-white/50">{discountCode.name || 'Unnamed discount'}</p>
                                            </div>
                                            <span className={`shrink-0 rounded-full px-2 py-1 text-xs font-semibold ${
 discountCode.is_active
 ? 'bg-emerald-100 text-emerald-700'
 : 'bg-white/[0.06] text-white/65'
 }`}>
                                                {discountCode.is_active ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>

                                        <div className="mt-3 space-y-1.5 text-sm">
                                            <p className="text-white/75">
                                                {serviceCatalog?.[discountCode.service_slug]?.name || discountCode.service_slug}
                                                <span className="text-white/50"> · {discountCode.package_code || 'All service packages'}</span>
                                            </p>
                                            <p className="text-white/75">
                                                {discountCode.discount_type === 'percentage'
                                                    ? `${discountCode.discount_value}% off`
                                                    : `${discountCode.currency || 'NGN'} ${discountCode.discount_value} off`}
                                            </p>
                                            <p className="text-xs text-white/50">
                                                {discountCode.total_redemptions} redeemed
                                                {discountCode.max_redemptions ? ` · Limit: ${discountCode.max_redemptions}` : ' · No limit'}
                                            </p>
                                            <a
                                                href={discountCode.discount_link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="block break-all text-xs text-jv-accent hover:text-jv-accent-dark"
                                            >
                                                {discountCode.discount_link}
                                            </a>
                                        </div>

                                        <MobileCardActions>
                                            <button
                                                type="button"
                                                onClick={() => toggleDiscountStatus(discountCode)}
                                                className="rounded-md border border-jv-line px-2.5 py-1.5 text-xs font-semibold text-white/75 hover:bg-white/[0.04]"
                                            >
                                                {discountCode.is_active ? 'Deactivate' : 'Activate'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => copyDiscountLink(discountCode)}
                                                className="rounded-md border border-jv-accent/30 px-2.5 py-1.5 text-xs font-semibold text-jv-accent hover:bg-jv-accent/15"
                                            >
                                                {copiedLinkId === discountCode.id ? 'Copied' : 'Copy Link'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => deleteDiscountCode(discountCode)}
                                                className="rounded-md border border-red-200 px-2.5 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
                                            >
                                                Delete
                                            </button>
                                        </MobileCardActions>
                                    </MobileCard>
                                ))}
                            </MobileCardList>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
