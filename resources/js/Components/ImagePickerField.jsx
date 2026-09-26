import { useEffect, useMemo, useRef, useState } from "react";
import FastImage from "@/Components/FastImage";

const MAX_UPLOAD_BYTES = 12 * 1024 * 1024;

/**
 * Reusable image field with upload + media-library picking.
 *
 * Replaces the per-screen copies of this logic that existed in the gallery,
 * service pricing and email centre screens. Uploads go to the shared media
 * endpoint, which returns an engine path (`/media/...`) so the stored value is
 * a responsive, immutable asset rather than a link to a third-party original.
 */
export default function ImagePickerField({
    label = "Image",
    value = "",
    onChange,
    folder = "general",
    error = "",
    hint = "",
    previewClassName = "h-24 w-24",
}) {
    const [libraryOpen, setLibraryOpen] = useState(false);
    const [library, setLibrary] = useState([]);
    const [libraryLoading, setLibraryLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [localError, setLocalError] = useState("");
    const fileInputRef = useRef(null);

    const resolvedPreview = useMemo(() => {
        if (!value) {
            return "";
        }

        return String(value);
    }, [value]);

    const loadLibrary = () => {
        setLibraryLoading(true);
        setLocalError("");

        window.axios
            .get(route("admin.media.library"))
            .then((response) => setLibrary(Array.isArray(response.data?.files) ? response.data.files : []))
            .catch(() => setLocalError("The media library could not be loaded."))
            .finally(() => setLibraryLoading(false));
    };

    useEffect(() => {
        if (libraryOpen && library.length === 0) {
            loadLibrary();
        }
    }, [libraryOpen, library.length]);

    const upload = (file) => {
        if (!file) {
            return;
        }

        if (!file.type.startsWith("image/")) {
            setLocalError("Please choose an image file.");
            return;
        }

        if (file.size > MAX_UPLOAD_BYTES) {
            setLocalError("That image is larger than 12MB. Please choose a smaller file.");
            return;
        }

        const body = new FormData();
        body.append("file", file);
        body.append("folder", folder);

        setUploading(true);
        setLocalError("");

        window.axios
            .post(route("admin.media.upload"), body, {
                headers: { "Content-Type": "multipart/form-data" },
            })
            .then((response) => {
                const path = response.data?.path || response.data?.url || "";

                if (!path) {
                    setLocalError("The upload did not return an image path.");
                    return;
                }

                onChange?.(String(path));
            })
            .catch((requestError) => {
                const message =
                    requestError?.response?.data?.errors?.file?.[0] ||
                    requestError?.response?.data?.message ||
                    "Image upload failed. Please try again.";

                setLocalError(String(message));
            })
            .finally(() => {
                setUploading(false);

                if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                }
            });
    };

    const fieldId = `image-${folder}-${label}`.replace(/\s+/g, "-").toLowerCase();

    return (
        <div className="rounded-jv-sm border border-jv-line bg-white/[0.03] p-4">
            <label htmlFor={fieldId} className="block text-sm font-medium text-white/65">
                {label}
            </label>

            <div className="mt-3 flex items-start gap-4">
                <div className={`${previewClassName} shrink-0 overflow-hidden rounded-jv-sm border border-jv-line bg-black/40`}>
                    {resolvedPreview ? (
                        <FastImage
                            src={resolvedPreview}
                            alt={`${label} preview`}
                            sizes="120px"
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center text-[10px] uppercase tracking-wider text-white/30">
                            No image
                        </div>
                    )}
                </div>

                <div className="min-w-0 flex-1">
                    <input
                        id={fieldId}
                        type="text"
                        value={value}
                        onChange={(event) => onChange?.(event.target.value)}
                        placeholder="/media/... or /images/..."
                        className="w-full rounded-jv-sm border border-jv-line-strong bg-white/[0.05] px-3 py-2 text-xs text-white transition placeholder:text-white/30 focus:border-jv-accent focus:outline-none focus:ring-4 focus:ring-jv-accent/15"
                    />

                    <div className="mt-2 flex flex-wrap items-center gap-2">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(event) => upload(event.target.files?.[0])}
                        />
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className="rounded-full border border-jv-line-strong bg-white/[0.05] px-3 py-1.5 text-xs font-semibold text-white/70 transition hover:bg-white/[0.12] hover:text-white disabled:opacity-50"
                        >
                            {uploading ? "Uploading…" : "Upload image"}
                        </button>
                        <button
                            type="button"
                            onClick={() => setLibraryOpen((open) => !open)}
                            className="rounded-full border border-jv-line-strong bg-white/[0.05] px-3 py-1.5 text-xs font-semibold text-white/70 transition hover:bg-white/[0.12] hover:text-white"
                        >
                            {libraryOpen ? "Close library" : "Choose from library"}
                        </button>
                        {value ? (
                            <button
                                type="button"
                                onClick={() => onChange?.("")}
                                className="rounded-full border border-red-500/40 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-200 transition hover:bg-red-500/20"
                            >
                                Clear
                            </button>
                        ) : null}
                    </div>

                    {hint ? <p className="mt-2 text-xs text-white/45">{hint}</p> : null}
                    {localError ? <p className="mt-2 text-xs text-red-300">{localError}</p> : null}
                    {error ? <p className="mt-2 text-xs text-red-300">{error}</p> : null}
                </div>
            </div>

            {libraryOpen ? (
                <div className="mt-4 rounded-jv-sm border border-jv-line bg-black/30 p-3">
                    {libraryLoading ? (
                        <p className="text-xs text-white/50">Loading media library…</p>
                    ) : library.length === 0 ? (
                        <p className="text-xs text-white/50">No images found in the library yet.</p>
                    ) : (
                        <div className="grid max-h-64 grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-5 lg:grid-cols-7">
                            {library.map((file) => (
                                <button
                                    key={`${file.path}-${file.name}`}
                                    type="button"
                                    onClick={() => {
                                        onChange?.(String(file.path || ""));
                                        setLibraryOpen(false);
                                    }}
                                    title={String(file.path || "")}
                                    className="group relative aspect-square overflow-hidden rounded border border-jv-line bg-black/40 transition hover:border-jv-accent"
                                >
                                    <FastImage
                                        src={String(file.preview_url || file.path || "")}
                                        alt={String(file.name || "")}
                                        sizes="120px"
                                        className="h-full w-full object-cover"
                                    />
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            ) : null}
        </div>
    );
}
