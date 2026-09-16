import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { MobileCard, MobileCardActions, MobileCardList } from '@/Components/ui/mobile-cards';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useMemo } from 'react';

function SubscriptionPlanPaystackStatus({ plan, onSync }) {
    if (plan.is_quantity_priced) {
        return <p className="text-xs text-white/50">Recurring billing not available for quantity-priced packages.</p>;
    }

    if (plan.paystack_plan_code) {
        return (
            <p className="text-xs font-semibold text-emerald-700">
                Paystack synced ({plan.paystack_plan_code})
            </p>
        );
    }

    return (
        <div className="flex items-center gap-2">
            <p className="text-xs font-semibold text-amber-700" title={plan.paystack_sync_error || ''}>
                {plan.paystack_sync_error ? `Sync failed: ${plan.paystack_sync_error}` : 'Not synced to Paystack yet'}
            </p>
            <button
                type="button"
                onClick={() => onSync(plan)}
                className="rounded-md border border-amber-300 px-2 py-0.5 text-xs font-semibold text-amber-800 hover:bg-amber-50"
            >
                Retry sync
            </button>
        </div>
    );
}

export default function SubscriptionPlansIndex({ serviceCatalog = {}, subscriptionPlans = [] }) {
    const { flash } = usePage().props;

    const serviceEntries = useMemo(() => Object.entries(serviceCatalog || {}), [serviceCatalog]);
    const firstServiceSlug = serviceEntries[0]?.[0] ?? 'social-media-design';

    const subscriptionPlanForm = useForm({
        name: '',
        service_slug: firstServiceSlug,
        package_code: '',
        image_path: '',
        short_description: '',
        long_description: '',
        billing_cycle: 'monthly',
        position: 0,
        is_active: true,
        show_on_homepage: true,
        is_homepage_featured: false,
        is_recommended: false,
    });

    const selectedPlanPackages = serviceCatalog?.[subscriptionPlanForm.data.service_slug]?.packages || {};

    const submitSubscriptionPlan = (event) => {
        event.preventDefault();

        subscriptionPlanForm.post(route('admin.subscription-plans.store'), {
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
                subscriptionPlanForm.setData('image_path', '');
                subscriptionPlanForm.setData('short_description', '');
                subscriptionPlanForm.setData('long_description', '');
            },
        });
    };

    const updateSubscriptionPlan = (subscriptionPlan, updates) => {
        router.patch(
            route('admin.subscription-plans.update', subscriptionPlan.id),
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

        router.delete(route('admin.subscription-plans.destroy', subscriptionPlan.id), {
            preserveScroll: true,
        });
    };

    const syncSubscriptionPlanPaystack = (subscriptionPlan) => {
        router.post(route('admin.subscription-plans.sync-paystack', subscriptionPlan.id), {}, {
            preserveScroll: true,
        });
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold leading-tight text-white/90">Subscription Plans</h2>}
        >
            <Head title="Subscription Plans" />

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
                        <h3 className="text-lg font-semibold text-white">Subscription Plans</h3>
                        <p className="mt-1 text-sm text-white/65">
                            Create and market service subscription plans, then control what gets highlighted on the homepage.
                        </p>

                        <form onSubmit={submitSubscriptionPlan} className="mt-5 grid gap-4 lg:grid-cols-2">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-white/75">Plan Name</label>
                                <input
                                    type="text"
                                    value={subscriptionPlanForm.data.name}
                                    onChange={(event) => subscriptionPlanForm.setData('name', event.target.value)}
                                    placeholder="Growth Design Plan"
                                    className="w-full rounded-md border border-jv-line-strong px-3 py-2 text-sm focus:border-jv-accent focus:outline-none focus:ring-2 focus:ring-jv-accent/20"
                                />
                                {subscriptionPlanForm.errors.name && <p className="mt-1 text-xs text-red-600">{subscriptionPlanForm.errors.name}</p>}
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-white/75">Billing Cycle</label>
                                <select
                                    value={subscriptionPlanForm.data.billing_cycle}
                                    onChange={(event) => subscriptionPlanForm.setData('billing_cycle', event.target.value)}
                                    className="w-full rounded-md border border-jv-line-strong px-3 py-2 text-sm focus:border-jv-accent focus:outline-none focus:ring-2 focus:ring-jv-accent/20"
                                >
                                    <option value="monthly">Monthly</option>
                                    <option value="quarterly">Quarterly</option>
                                    <option value="biannually">Biannually</option>
                                    <option value="yearly">Yearly</option>
                                </select>
                                {subscriptionPlanForm.errors.billing_cycle && <p className="mt-1 text-xs text-red-600">{subscriptionPlanForm.errors.billing_cycle}</p>}
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-white/75">Service Type</label>
                                <select
                                    value={subscriptionPlanForm.data.service_slug}
                                    onChange={(event) => {
                                        subscriptionPlanForm.setData('service_slug', event.target.value);
                                        subscriptionPlanForm.setData('package_code', '');
                                    }}
                                    className="w-full rounded-md border border-jv-line-strong px-3 py-2 text-sm focus:border-jv-accent focus:outline-none focus:ring-2 focus:ring-jv-accent/20"
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
                                <label className="mb-1 block text-sm font-medium text-white/75">Package/Plan Name</label>
                                <select
                                    value={subscriptionPlanForm.data.package_code}
                                    onChange={(event) => subscriptionPlanForm.setData('package_code', event.target.value)}
                                    className="w-full rounded-md border border-jv-line-strong px-3 py-2 text-sm focus:border-jv-accent focus:outline-none focus:ring-2 focus:ring-jv-accent/20"
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
                                <label className="mb-1 block text-sm font-medium text-white/75">Image (optional)</label>
                                <input
                                    type="text"
                                    value={subscriptionPlanForm.data.image_path}
                                    onChange={(event) => subscriptionPlanForm.setData('image_path', event.target.value)}
                                    placeholder="/storage/subscription-plans/plan.webp"
                                    className="w-full rounded-md border border-jv-line-strong px-3 py-2 text-sm focus:border-jv-accent focus:outline-none focus:ring-2 focus:ring-jv-accent/20"
                                />
                                {subscriptionPlanForm.errors.image_path && <p className="mt-1 text-xs text-red-600">{subscriptionPlanForm.errors.image_path}</p>}
                            </div>

                            <div className="lg:col-span-2">
                                <label className="mb-1 block text-sm font-medium text-white/75">Short Description (optional)</label>
                                <textarea
                                    rows={2}
                                    value={subscriptionPlanForm.data.short_description}
                                    onChange={(event) => subscriptionPlanForm.setData('short_description', event.target.value)}
                                    className="w-full rounded-md border border-jv-line-strong px-3 py-2 text-sm focus:border-jv-accent focus:outline-none focus:ring-2 focus:ring-jv-accent/20"
                                />
                                {subscriptionPlanForm.errors.short_description && <p className="mt-1 text-xs text-red-600">{subscriptionPlanForm.errors.short_description}</p>}
                            </div>

                            <div className="lg:col-span-2">
                                <label className="mb-1 block text-sm font-medium text-white/75">Long Description (optional)</label>
                                <textarea
                                    rows={4}
                                    value={subscriptionPlanForm.data.long_description}
                                    onChange={(event) => subscriptionPlanForm.setData('long_description', event.target.value)}
                                    className="w-full rounded-md border border-jv-line-strong px-3 py-2 text-sm focus:border-jv-accent focus:outline-none focus:ring-2 focus:ring-jv-accent/20"
                                />
                                {subscriptionPlanForm.errors.long_description && <p className="mt-1 text-xs text-red-600">{subscriptionPlanForm.errors.long_description}</p>}
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-white/75">Display Position</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={subscriptionPlanForm.data.position}
                                    onChange={(event) => subscriptionPlanForm.setData('position', event.target.value)}
                                    className="w-full rounded-md border border-jv-line-strong px-3 py-2 text-sm focus:border-jv-accent focus:outline-none focus:ring-2 focus:ring-jv-accent/20"
                                />
                                {subscriptionPlanForm.errors.position && <p className="mt-1 text-xs text-red-600">{subscriptionPlanForm.errors.position}</p>}
                            </div>

                            <div className="grid gap-2 rounded-lg border border-jv-line p-3">
                                <label className="flex items-center gap-2 text-sm font-medium text-white/75">
                                    <input
                                        type="checkbox"
                                        checked={Boolean(subscriptionPlanForm.data.is_active)}
                                        onChange={(event) => subscriptionPlanForm.setData('is_active', event.target.checked)}
                                        className="h-4 w-4 rounded border-jv-line-strong text-jv-accent focus:ring-jv-accent"
                                    />
                                    Active
                                </label>
                                <label className="flex items-center gap-2 text-sm font-medium text-white/75">
                                    <input
                                        type="checkbox"
                                        checked={Boolean(subscriptionPlanForm.data.show_on_homepage)}
                                        onChange={(event) => subscriptionPlanForm.setData('show_on_homepage', event.target.checked)}
                                        className="h-4 w-4 rounded border-jv-line-strong text-jv-accent focus:ring-jv-accent"
                                    />
                                    Show on homepage
                                </label>
                                <label className="flex items-center gap-2 text-sm font-medium text-white/75">
                                    <input
                                        type="checkbox"
                                        checked={Boolean(subscriptionPlanForm.data.is_homepage_featured)}
                                        onChange={(event) => subscriptionPlanForm.setData('is_homepage_featured', event.target.checked)}
                                        className="h-4 w-4 rounded border-jv-line-strong text-jv-accent focus:ring-jv-accent"
                                    />
                                    Featured on homepage
                                </label>
                                <label className="flex items-center gap-2 text-sm font-medium text-white/75">
                                    <input
                                        type="checkbox"
                                        checked={Boolean(subscriptionPlanForm.data.is_recommended)}
                                        onChange={(event) => subscriptionPlanForm.setData('is_recommended', event.target.checked)}
                                        className="h-4 w-4 rounded border-jv-line-strong text-jv-accent focus:ring-jv-accent"
                                    />
                                    Recommended
                                </label>
                            </div>

                            <div className="lg:col-span-2">
                                <button
                                    type="submit"
                                    disabled={subscriptionPlanForm.processing}
                                    className="inline-flex items-center rounded-lg bg-jv-accent px-4 py-2 text-sm font-semibold text-white hover:bg-jv-accent-dark disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {subscriptionPlanForm.processing ? 'Creating...' : 'Create Subscription Plan'}
                                </button>
                            </div>
                        </form>

                        <div className="mt-6 hidden overflow-x-auto md:block">
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                                <thead className="bg-white/[0.04] text-xs uppercase tracking-wide text-white/65">
                                    <tr>
                                        <th className="px-3 py-2 text-left">Plan</th>
                                        <th className="px-3 py-2 text-left">Scope</th>
                                        <th className="px-3 py-2 text-left">Marketing Signals</th>
                                        <th className="px-3 py-2 text-left">Checkout Link</th>
                                        <th className="px-3 py-2 text-left">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 bg-white/[0.04] text-white/75">
                                    {subscriptionPlans.length === 0 && (
                                        <tr>
                                            <td className="px-3 py-4 text-sm text-white/50" colSpan={5}>
                                                No subscription plans created yet.
                                            </td>
                                        </tr>
                                    )}

                                    {subscriptionPlans.map((subscriptionPlan) => (
                                        <tr key={`subscription-plan-${subscriptionPlan.id}`}>
                                            <td className="px-3 py-3">
                                                <p className="font-semibold text-white">{subscriptionPlan.name}</p>
                                                <p className="text-xs text-white/50">{subscriptionPlan.billing_cycle}</p>
                                                <p className="text-xs text-white/50">Position: {subscriptionPlan.position}</p>
                                                <div className="mt-2">
                                                    <SubscriptionPlanPaystackStatus plan={subscriptionPlan} onSync={syncSubscriptionPlanPaystack} />
                                                </div>
                                            </td>
                                            <td className="px-3 py-3">
                                                <p>{subscriptionPlan.service_name}</p>
                                                <p className="text-xs text-white/50">{subscriptionPlan.package_name}</p>
                                                <p className="mt-1 text-xs text-white/50">{subscriptionPlan.short_description || 'No custom description'}</p>
                                                {subscriptionPlan.long_description && (
                                                    <p className="mt-1 text-xs text-white/50">{subscriptionPlan.long_description}</p>
                                                )}
                                                {subscriptionPlan.image_path && (
                                                    <img
                                                        src={String(subscriptionPlan.image_path).startsWith('/') || /^https?:\/\//i.test(String(subscriptionPlan.image_path))
                                                            ? String(subscriptionPlan.image_path)
                                                            : `/${String(subscriptionPlan.image_path)}`}
                                                        alt={subscriptionPlan.name}
                                                        className="mt-2 h-12 w-12 rounded object-cover"
                                                    />
                                                )}
                                            </td>
                                            <td className="px-3 py-3">
                                                <p className="text-xs text-white/75">Paid subscriptions: {subscriptionPlan.paid_subscriptions}</p>
                                                <p className="text-xs text-white/75">
                                                    Discount: {subscriptionPlan.active_discount_code ? `${subscriptionPlan.active_discount_code} (${subscriptionPlan.active_discount_summary})` : 'None'}
                                                </p>
                                                <p className="text-xs text-white/75">
                                                    Status: {subscriptionPlan.is_active ? 'Active' : 'Inactive'} | Homepage: {subscriptionPlan.show_on_homepage ? 'Shown' : 'Hidden'}
                                                </p>
                                                <p className="text-xs text-white/75">
                                                    Featured: {subscriptionPlan.is_homepage_featured ? 'Yes' : 'No'} | Recommended: {subscriptionPlan.is_recommended ? 'Yes' : 'No'}
                                                </p>
                                            </td>
                                            <td className="px-3 py-3">
                                                <a
                                                    href={subscriptionPlan.checkout_link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="break-all text-xs text-jv-accent hover:text-jv-accent-dark"
                                                >
                                                    {subscriptionPlan.checkout_link}
                                                </a>
                                            </td>
                                            <td className="px-3 py-3">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => updateSubscriptionPlan(subscriptionPlan, { is_active: !subscriptionPlan.is_active })}
                                                        className="rounded-md border border-jv-line px-2.5 py-1 text-xs font-semibold text-white/75 hover:bg-white/[0.04]"
                                                    >
                                                        {subscriptionPlan.is_active ? 'Deactivate' : 'Activate'}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => updateSubscriptionPlan(subscriptionPlan, { show_on_homepage: !subscriptionPlan.show_on_homepage })}
                                                        className="rounded-md border border-jv-accent/30 px-2.5 py-1 text-xs font-semibold text-jv-accent hover:bg-jv-accent/15"
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

                        {subscriptionPlans.length === 0 ? (
                            <p className="mt-6 text-sm text-white/50 md:hidden">No subscription plans created yet.</p>
                        ) : (
                            <MobileCardList className="mt-6">
                                {subscriptionPlans.map((subscriptionPlan, index) => (
                                    <MobileCard key={`subscription-plan-mobile-${subscriptionPlan.id}`} index={index}>
                                        <div className="flex items-start gap-3">
                                            {subscriptionPlan.image_path && (
                                                <img
                                                    src={String(subscriptionPlan.image_path).startsWith('/') || /^https?:\/\//i.test(String(subscriptionPlan.image_path))
                                                        ? String(subscriptionPlan.image_path)
                                                        : `/${String(subscriptionPlan.image_path)}`}
                                                    alt={subscriptionPlan.name}
                                                    className="h-12 w-12 shrink-0 rounded object-cover"
                                                />
                                            )}
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-semibold text-white">{subscriptionPlan.name}</p>
                                                <p className="text-xs text-white/50">
                                                    {subscriptionPlan.billing_cycle} · Position {subscriptionPlan.position}
                                                </p>
                                                <div className="mt-1">
                                                    <SubscriptionPlanPaystackStatus plan={subscriptionPlan} onSync={syncSubscriptionPlanPaystack} />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-3 space-y-1 text-xs text-white/65">
                                            <p className="text-sm text-white/75">
                                                {subscriptionPlan.service_name}
                                                <span className="text-white/50"> · {subscriptionPlan.package_name}</span>
                                            </p>
                                            {subscriptionPlan.short_description && <p>{subscriptionPlan.short_description}</p>}
                                            <p>Paid subscriptions: {subscriptionPlan.paid_subscriptions}</p>
                                            <p>
                                                Discount: {subscriptionPlan.active_discount_code
                                                    ? `${subscriptionPlan.active_discount_code} (${subscriptionPlan.active_discount_summary})`
                                                    : 'None'}
                                            </p>
                                            <a
                                                href={subscriptionPlan.checkout_link}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="block break-all text-xs text-jv-accent hover:text-jv-accent-dark"
                                            >
                                                {subscriptionPlan.checkout_link}
                                            </a>
                                        </div>

                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {subscriptionPlan.is_homepage_featured && (
                                                <span className="rounded-full bg-jv-accent/15 px-2 py-1 text-xs font-semibold text-jv-accent">
                                                    Featured
                                                </span>
                                            )}
                                            {subscriptionPlan.is_recommended && (
                                                <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
                                                    Recommended
                                                </span>
                                            )}
                                        </div>

                                        <MobileCardActions>
                                            <button
                                                type="button"
                                                onClick={() => updateSubscriptionPlan(subscriptionPlan, { is_active: !subscriptionPlan.is_active })}
                                                className="rounded-md border border-jv-line px-2.5 py-1.5 text-xs font-semibold text-white/75 hover:bg-white/[0.04]"
                                            >
                                                {subscriptionPlan.is_active ? 'Deactivate' : 'Activate'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => updateSubscriptionPlan(subscriptionPlan, { show_on_homepage: !subscriptionPlan.show_on_homepage })}
                                                className="rounded-md border border-jv-accent/30 px-2.5 py-1.5 text-xs font-semibold text-jv-accent hover:bg-jv-accent/15"
                                            >
                                                {subscriptionPlan.show_on_homepage ? 'Hide Homepage' : 'Show Homepage'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => updateSubscriptionPlan(subscriptionPlan, { is_homepage_featured: !subscriptionPlan.is_homepage_featured })}
                                                className="rounded-md border border-amber-200 px-2.5 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-50"
                                            >
                                                {subscriptionPlan.is_homepage_featured ? 'Unfeature' : 'Feature'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => updateSubscriptionPlan(subscriptionPlan, { is_recommended: !subscriptionPlan.is_recommended })}
                                                className="rounded-md border border-emerald-200 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                                            >
                                                {subscriptionPlan.is_recommended ? 'Unrecommend' : 'Recommend'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => deleteSubscriptionPlan(subscriptionPlan)}
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
