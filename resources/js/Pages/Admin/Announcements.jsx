import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import AutosaveStatusPill from '@/Components/AutosaveStatusPill';
import { Eyebrow } from '@/Components/PublicUI';
import usePlatformSettingsAutosave from '@/hooks/use-platform-settings-autosave';
import { Head, Link, useForm } from '@inertiajs/react';
import { MegaphoneIcon } from '@heroicons/react/24/outline';

/**
 * Service announcement modal.
 *
 * This module used to live in the middle of the Platform Settings page. It is
 * the only thing that writes `service_announcement`, so it now owns that slice
 * of the settings payload and autosaves just that key.
 */
export default function Announcements({ settings = {} }) {
    const announcement = settings?.service_announcement || {};

    const { data, setData, errors, setError, clearErrors } = useForm({
        service_announcement: {
            enabled: announcement?.enabled !== false,
            badge: announcement?.badge || '',
            title: announcement?.title || '',
            body: announcement?.body || '',
            cta_label: announcement?.cta_label || '',
            cta_url: announcement?.cta_url || '',
            image: announcement?.image || '',
            dismiss_days: Number(announcement?.dismiss_days ?? 3),
        },
    });

    const { statusText, statusClassName } = usePlatformSettingsAutosave({
        data,
        setError,
        clearErrors,
    });

    const update = (field, value) => {
        setData('service_announcement', {
            ...(data.service_announcement || {}),
            [field]: value,
        });
    };

    const inputClassName =
        'w-full rounded-jv-sm border border-jv-line-strong bg-white/[0.05] px-3 py-2 text-sm text-white transition placeholder:text-white/30 focus:border-jv-accent focus:outline-none focus:ring-4 focus:ring-jv-accent/15';

    const enabled = Boolean(data.service_announcement?.enabled);

    return (
        <AuthenticatedLayout>
            <Head title="Announcements" />

            <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
                <section className="jv-card jv-card--pad">
                    <Eyebrow>Public messaging</Eyebrow>
                    <h1 className="jv-display jv-display--md mt-5">Service Announcement</h1>
                    <p className="jv-lead mt-4 max-w-2xl">
                        The modal that announces a new or featured service on public pages. It never appears
                        on account, checkout or staff screens.
                    </p>

                    <div className="mt-6 flex flex-wrap items-center gap-3">
                        <span
                            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                                enabled
                                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                                    : 'border-amber-500/30 bg-amber-500/10 text-amber-200'
                            }`}
                        >
                            <MegaphoneIcon className="h-4 w-4" />
                            {enabled ? 'Live to visitors' : 'Switched off'}
                        </span>
                        <Link
                            href="/"
                            className="text-xs font-semibold text-white/50 transition-colors hover:text-white"
                        >
                            Preview the public site
                        </Link>
                    </div>
                </section>

                <form onSubmit={(event) => event.preventDefault()} className="space-y-6">
                    <div className="jv-card jv-card--pad">
                        <h3 className="text-lg font-semibold tracking-tight text-white">
                            Announcement Modal
                        </h3>
                        <p className="mt-1 text-sm text-white/55">
                            Visitors who dismiss it stay opted out for the number of days set below.
                        </p>

                        <label className="mt-5 flex items-start gap-3 rounded-jv-sm border border-jv-line bg-white/[0.03] p-4">
                            <input
                                type="checkbox"
                                checked={enabled}
                                onChange={(event) => update('enabled', event.target.checked)}
                                className="mt-0.5 h-4 w-4 rounded border-jv-line-strong bg-white/[0.06]"
                            />
                            <span>
                                <span className="block text-sm font-semibold text-white">
                                    Show the announcement
                                </span>
                                <span className="mt-1 block text-xs text-white/55">
                                    Turn this off once the launch period is over.
                                </span>
                            </span>
                        </label>

                        <div className="mt-5 grid gap-4 md:grid-cols-2">
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-white/65">
                                    Badge
                                </label>
                                <input
                                    type="text"
                                    value={data.service_announcement?.badge || ''}
                                    onChange={(event) => update('badge', event.target.value)}
                                    placeholder="New service"
                                    className={inputClassName}
                                />
                                {errors['service_announcement.badge'] && (
                                    <p className="mt-1 text-xs text-red-300">
                                        {errors['service_announcement.badge']}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-white/65">
                                    Dismiss for (days)
                                </label>
                                <input
                                    type="number"
                                    min={0}
                                    max={365}
                                    value={data.service_announcement?.dismiss_days ?? 0}
                                    onChange={(event) =>
                                        update(
                                            'dismiss_days',
                                            event.target.value === '' ? 0 : Number(event.target.value),
                                        )
                                    }
                                    className={inputClassName}
                                />
                                {errors['service_announcement.dismiss_days'] && (
                                    <p className="mt-1 text-xs text-red-300">
                                        {errors['service_announcement.dismiss_days']}
                                    </p>
                                )}
                                <p className="mt-1 text-xs text-white/45">
                                    0 means it reappears on the next page load.
                                </p>
                            </div>

                            <div className="md:col-span-2">
                                <label className="mb-1.5 block text-sm font-medium text-white/65">
                                    Title
                                </label>
                                <input
                                    type="text"
                                    value={data.service_announcement?.title || ''}
                                    onChange={(event) => update('title', event.target.value)}
                                    placeholder="Social Media Management is here"
                                    className={inputClassName}
                                />
                                {errors['service_announcement.title'] && (
                                    <p className="mt-1 text-xs text-red-300">
                                        {errors['service_announcement.title']}
                                    </p>
                                )}
                            </div>

                            <div className="md:col-span-2">
                                <label className="mb-1.5 block text-sm font-medium text-white/65">
                                    Message
                                </label>
                                <textarea
                                    rows={3}
                                    value={data.service_announcement?.body || ''}
                                    onChange={(event) => update('body', event.target.value)}
                                    placeholder="Tell visitors what is new and why it matters."
                                    className={inputClassName}
                                />
                                {errors['service_announcement.body'] && (
                                    <p className="mt-1 text-xs text-red-300">
                                        {errors['service_announcement.body']}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-white/65">
                                    Button Label
                                </label>
                                <input
                                    type="text"
                                    value={data.service_announcement?.cta_label || ''}
                                    onChange={(event) => update('cta_label', event.target.value)}
                                    placeholder="Explore the service"
                                    className={inputClassName}
                                />
                                {errors['service_announcement.cta_label'] && (
                                    <p className="mt-1 text-xs text-red-300">
                                        {errors['service_announcement.cta_label']}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-white/65">
                                    Button Link
                                </label>
                                <input
                                    type="text"
                                    value={data.service_announcement?.cta_url || ''}
                                    onChange={(event) => update('cta_url', event.target.value)}
                                    placeholder="/services/social-media-management"
                                    className={inputClassName}
                                />
                                {errors['service_announcement.cta_url'] && (
                                    <p className="mt-1 text-xs text-red-300">
                                        {errors['service_announcement.cta_url']}
                                    </p>
                                )}
                                <p className="mt-1 text-xs text-white/45">
                                    An in-app path like /services/... or a full https:// URL.
                                </p>
                            </div>

                            <div className="md:col-span-2">
                                <p className="rounded-jv-sm border border-jv-line bg-white/[0.03] px-4 py-3 text-xs text-white/55">
                                    The modal image now lives with the other service artwork on the{' '}
                                    <Link
                                        href={route('dashboard')}
                                        className="font-semibold text-white/75 underline decoration-white/30 underline-offset-2 transition hover:text-white"
                                    >
                                        Dashboard
                                    </Link>
                                    .
                                </p>
                            </div>
                        </div>

                        {!enabled && (
                            <p className="mt-4 rounded-jv-sm border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                                The announcement is switched off and will not appear to visitors.
                            </p>
                        )}
                    </div>
                </form>
            </div>

            <AutosaveStatusPill statusText={statusText} statusClassName={statusClassName} />
        </AuthenticatedLayout>
    );
}
