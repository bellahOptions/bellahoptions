import ImagePickerField from '@/Components/ImagePickerField';
import AutosaveStatusPill from '@/Components/AutosaveStatusPill';
import usePlatformSettingsAutosave from '@/hooks/use-platform-settings-autosave';
import { useForm } from '@inertiajs/react';

/**
 * Service landing artwork and the announcement modal image.
 *
 * This module was moved out of Platform Settings onto the dashboard, where the
 * people who change service imagery already spend their time. It keeps its own
 * autosave of the `service_images` slice, so editing artwork here cannot
 * overwrite the unrelated settings on the Settings page.
 *
 * Leaving a field empty falls back to the artwork the page ships with, which is
 * surfaced in the hint so it is obvious what the public page currently shows.
 */
export default function ServiceImagesManager({ serviceImages = {}, serviceImageDefaults = {} }) {
    const { data, setData, errors, setError, clearErrors } = useForm({
        service_images: { ...(serviceImages || {}) },
    });

    const { statusText, statusClassName } = usePlatformSettingsAutosave({
        data,
        setError,
        clearErrors,
    });

    const update = (key, value) => {
        setData('service_images', {
            ...(data.service_images || {}),
            [key]: value,
        });
    };

    const labelFor = (slug) =>
        String(slug)
            .replace(/-/g, ' ')
            .replace(/\b\w/g, (character) => character.toUpperCase());

    const defaultEntries = Object.entries(serviceImageDefaults || {});
    const overriddenCount = defaultEntries.filter(([slug]) =>
        String(data.service_images?.[slug] || '').trim(),
    ).length;

    return (
        <>
            <p className="text-sm text-white/55">
                The main image on each service landing page and the announcement modal. Leave a field
                empty to use the artwork the page ships with. Uploads run through the local image
                engine, which generates the responsive sizes the pages request.
            </p>

            <p className="mt-3 text-xs text-white/45">
                {overriddenCount} of {defaultEntries.length} service images replaced with custom
                artwork.
            </p>

            <div className="mt-5 space-y-4">
                <ImagePickerField
                    label="Announcement modal image"
                    value={data.service_images?.announcement || ''}
                    onChange={(next) => update('announcement', next)}
                    folder="service-images"
                    error={errors['service_images.announcement']}
                    hint="Used by the announcement modal, and shown alongside the service image below."
                    previewClassName="h-24 w-32"
                />

                <div className="grid gap-4 md:grid-cols-2">
                    {defaultEntries.map(([slug, defaultImage]) => (
                        <ImagePickerField
                            key={slug}
                            label={labelFor(slug)}
                            value={data.service_images?.[slug] || ''}
                            onChange={(next) => update(slug, next)}
                            folder="service-images"
                            error={errors[`service_images.${slug}`]}
                            hint={
                                data.service_images?.[slug]
                                    ? ''
                                    : `Currently using ${defaultImage}`
                            }
                            previewClassName="h-24 w-32"
                        />
                    ))}
                </div>

                {defaultEntries.length === 0 && (
                    <p className="rounded-jv-sm border border-jv-line bg-white/[0.03] px-4 py-3 text-xs text-white/55">
                        No service landing artwork is registered yet, so only the announcement modal
                        image can be set.
                    </p>
                )}
            </div>

            <AutosaveStatusPill statusText={statusText} statusClassName={statusClassName} />
        </>
    );
}
