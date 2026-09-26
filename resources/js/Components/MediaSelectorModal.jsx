import Modal from '@/Components/Modal';
import { useCallback, useRef, useState } from 'react';

/**
 * Shared media library picker.
 *
 * Several admin screens need to choose an image out of the same library and/or
 * upload a new one (branding logo, favicon, announcement image, per-service
 * landing artwork, SEO open-graph images, review screenshots). Each of them used
 * to carry its own copy of this modal plus its own copy of the "resolve this
 * path into an absolute URL" rule.
 *
 * `pick(target)` returns a promise that resolves with the chosen path, or null
 * if the operator closes the dialog. `upload(file)` returns the stored path, or
 * null when the upload fails. Callers stay in charge of where the value lands,
 * which keeps the data-shape decisions in the page rather than in the modal.
 */

/**
 * Turns a stored media path into something an <img> can load. Absolute URLs and
 * root-relative paths are passed through; bare storage-relative paths (the shape
 * the media engine stores) get a leading slash.
 */
export function mediaPreviewUrl(path) {
    const value = String(path || '');

    if (value === '') {
        return '';
    }

    if (/^https?:\/\//i.test(value) || value.startsWith('/')) {
        return value;
    }

    return `/${value}`;
}

export function useMediaSelector() {
    const [open, setOpen] = useState(false);
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [target, setTarget] = useState('');
    const resolver = useRef(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError('');

        try {
            const response = await window.axios.get(route('admin.gallery.media.index'));
            setFiles(Array.isArray(response?.data?.files) ? response.data.files : []);
        } catch (caught) {
            setError('Unable to load media files right now.');
        } finally {
            setLoading(false);
        }
    }, []);

    const settle = useCallback((value) => {
        const resolve = resolver.current;
        resolver.current = null;
        setOpen(false);

        if (resolve) {
            resolve(value);
        }
    }, []);

    const pick = useCallback(
        (nextTarget = '') =>
            new Promise((resolve) => {
                // Replacing a pending promise would strand its awaiter forever.
                if (resolver.current) {
                    resolver.current(null);
                }

                resolver.current = resolve;
                setTarget(nextTarget);
                setOpen(true);
                load();
            }),
        [load],
    );

    const choose = useCallback(
        (path) => {
            settle(String(path || ''));
        },
        [settle],
    );

    const close = useCallback(() => {
        settle(null);
    }, [settle]);

    const upload = useCallback(async (file) => {
        if (!file) {
            return null;
        }

        const body = new FormData();
        body.append('file', file);

        try {
            const response = await window.axios.post(route('admin.gallery.media.upload'), body, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            const uploadedPath = String(response?.data?.path || '');

            return uploadedPath !== '' ? uploadedPath : null;
        } catch (caught) {
            window.alert('Upload failed. Please try another file.');

            return null;
        }
    }, []);

    return { open, files, loading, error, target, pick, choose, close, upload, reload: load };
}

export default function MediaSelectorModal({ controller }) {
    if (!controller) {
        return null;
    }

    const { open, files, loading, error, choose, close } = controller;

    return (
        <Modal show={open} maxWidth="2xl" onClose={close}>
            <div className="space-y-4 p-5 sm:p-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold tracking-tight text-white">
                        Select Media File
                    </h3>
                    <button type="button" onClick={close} className="jv-btn jv-btn--ghost jv-btn--sm">
                        Close
                    </button>
                </div>

                {loading && <p className="text-sm text-white/55">Loading media...</p>}
                {error && <p className="text-sm text-red-300">{error}</p>}

                {!loading && !error && files.length === 0 && (
                    <p className="text-sm text-white/55">
                        No media files yet. Upload one to get started.
                    </p>
                )}

                {!loading && !error && files.length > 0 && (
                    <div className="max-h-[60vh] overflow-y-auto rounded-jv-sm border border-jv-line p-3">
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {files.map((file) => (
                                <button
                                    key={file.path}
                                    type="button"
                                    onClick={() => choose(file.path)}
                                    className="overflow-hidden rounded-jv-sm border border-jv-line text-left transition hover:border-jv-accent-line"
                                >
                                    <div className="h-24 w-full overflow-hidden bg-white/[0.06]">
                                        <img
                                            src={mediaPreviewUrl(file.preview_url || file.path)}
                                            alt={file.name || file.path}
                                            className="h-full w-full object-cover"
                                        />
                                    </div>
                                    <div className="space-y-1 p-2">
                                        <p className="truncate text-xs font-semibold text-white">
                                            {file.name}
                                        </p>
                                        <p className="truncate text-[11px] text-white/45">
                                            {file.path}
                                        </p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
}
