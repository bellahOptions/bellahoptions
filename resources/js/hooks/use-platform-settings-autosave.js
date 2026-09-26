import { useEffect, useMemo, useRef, useState } from 'react';

/**
 * Debounced autosave for the platform settings form.
 *
 * The settings screen used to be one 1700-line page that PATCHed every setting
 * on every keystroke. That screen has since been split into several focused
 * admin pages (Settings, Announcements, SEO Meta, Legal Terms, and the service
 * image module on the dashboard), each of which still autosaves.
 *
 * Behaviour is deliberately unchanged from the original inline implementation:
 *
 *  - The first render only records a baseline signature, so simply opening a
 *    page never writes anything.
 *  - Only a real change to the serialised form data schedules a request.
 *  - A newer edit cancels the pending request by bumping `requestId`, and a
 *    response that is no longer the newest is discarded. Without that guard a
 *    slow early response could mark stale data as saved.
 *  - Validation errors from the server are mapped back onto the form fields.
 *
 * The backend (`SettingController::update`) treats every top-level key as an
 * optional partial update, so a page that submits only `service_announcement`
 * leaves the other settings untouched.
 */
const AUTOSAVE_DEBOUNCE_MS = 900;

export default function usePlatformSettingsAutosave({ data, setError, clearErrors, enabled = true }) {
    const [state, setState] = useState('idle');
    const [updatedAt, setUpdatedAt] = useState(null);
    const [errorDetail, setErrorDetail] = useState('');
    const timer = useRef(null);
    const lastSavedSignature = useRef('');
    const requestId = useRef(0);

    const signature = useMemo(() => JSON.stringify(data), [data]);

    useEffect(() => {
        if (!enabled) {
            return undefined;
        }

        // First pass establishes the baseline; it must never trigger a write.
        if (lastSavedSignature.current === '') {
            lastSavedSignature.current = signature;

            return undefined;
        }

        if (signature === lastSavedSignature.current) {
            return undefined;
        }

        if (timer.current) {
            window.clearTimeout(timer.current);
        }

        const currentRequestId = requestId.current + 1;
        requestId.current = currentRequestId;
        setState('saving');

        timer.current = window.setTimeout(() => {
            const payload = JSON.parse(signature);
            const csrfToken = document
                ?.querySelector('meta[name="csrf-token"]')
                ?.getAttribute('content');

            window.axios
                .patch(route('admin.settings.update'), payload, {
                    headers: {
                        Accept: 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                        ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
                    },
                })
                .then(() => {
                    if (currentRequestId !== requestId.current) {
                        return;
                    }

                    clearErrors();
                    setErrorDetail('');
                    lastSavedSignature.current = signature;
                    setState('saved');
                    setUpdatedAt(new Date());
                })
                .catch((error) => {
                    if (currentRequestId !== requestId.current) {
                        return;
                    }

                    const responseErrors = error?.response?.data?.errors;
                    let detail = String(
                        error?.response?.data?.message || error?.message || 'Unknown error.',
                    );

                    if (responseErrors && typeof responseErrors === 'object') {
                        const normalizedErrors = Object.fromEntries(
                            Object.entries(responseErrors).map(([field, messages]) => [
                                field,
                                Array.isArray(messages)
                                    ? String(messages[0] ?? '')
                                    : String(messages ?? ''),
                            ]),
                        );

                        setError(normalizedErrors);

                        const [firstField, firstMessage] =
                            Object.entries(normalizedErrors)[0] || [];
                        if (firstField) {
                            detail = `${firstField}: ${firstMessage}`;
                        }
                    }

                    setErrorDetail(detail);
                    setState('error');
                });
        }, AUTOSAVE_DEBOUNCE_MS);

        return () => {
            if (timer.current) {
                window.clearTimeout(timer.current);
            }
        };
    }, [signature, clearErrors, setError, enabled]);

    const statusText = useMemo(() => {
        if (state === 'saving') {
            return 'Autosave: saving changes...';
        }

        if (state === 'saved') {
            if (!updatedAt) {
                return 'Autosave: all changes saved.';
            }

            return `Autosave: saved at ${updatedAt.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
            })}`;
        }

        if (state === 'error') {
            return errorDetail
                ? `Autosave failed: ${errorDetail}`
                : 'Autosave failed. Fix the highlighted field to retry.';
        }

        return 'Autosave: ready.';
    }, [state, updatedAt, errorDetail]);

    const statusClassName = useMemo(() => {
        if (state === 'saving') {
            return 'border-jv-accent-line bg-jv-accent/10 text-[#a9c4ff]';
        }

        if (state === 'saved') {
            return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300';
        }

        if (state === 'error') {
            return 'border-red-500/30 bg-red-500/10 text-red-300';
        }

        return 'border-jv-line bg-white/[0.06] text-white/70';
    }, [state]);

    return { state, statusText, statusClassName, updatedAt, errorDetail };
}

export { AUTOSAVE_DEBOUNCE_MS };
