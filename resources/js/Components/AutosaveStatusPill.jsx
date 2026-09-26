/**
 * Floating autosave indicator shared by the admin settings-driven pages.
 *
 * It is purely presentational: the state comes from
 * `usePlatformSettingsAutosave`, so every page reports saving in the same place
 * with the same wording.
 */
export default function AutosaveStatusPill({ statusText, statusClassName }) {
    return (
        <div className="pointer-events-none fixed right-4 top-20 z-[90]">
            <div
                role="status"
                aria-live="polite"
                className={`rounded-full border px-3.5 py-2 text-xs font-semibold backdrop-blur-xl ${statusClassName}`}
            >
                {statusText}
            </div>
        </div>
    );
}
