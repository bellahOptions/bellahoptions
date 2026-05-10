import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Modal from '@/Components/Modal';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useMemo, useRef, useState } from 'react';

const emptySlide = {
    slide_title: '',
    text: '',
    slide_image: '',
    slide_background: '',
    content_media_type: '',
    content_media_path: '',
    content_media_position: 'center',
    content_media_alignment: 'center',
    layout_style: 'center',
    content_alignment: 'center',
    title_animation: 'fade-up',
    text_animation: 'fade-up',
    media_animation: 'zoom-in',
    button_animation: 'fade-up',
    slide_link: '',
    slide_link_text: '',
};

const layoutStyleOptions = [
    { value: 'center', label: 'Centered Content' },
    { value: 'split-left', label: 'Split Layout (Media Left)' },
    { value: 'split-right', label: 'Split Layout (Media Right)' },
];

const contentAlignmentOptions = [
    { value: 'center', label: 'Center' },
    { value: 'left', label: 'Left' },
];

const mediaPositionOptions = [
    { value: 'top', label: 'Top' },
    { value: 'center', label: 'Center' },
    { value: 'bottom', label: 'Bottom' },
];

const mediaAlignmentOptions = [
    { value: 'left', label: 'Left' },
    { value: 'center', label: 'Center' },
    { value: 'right', label: 'Right' },
];

const cropAspectOptions = [
    { value: 'free', label: 'No Crop' },
    { value: '1:1', label: 'Square (1:1)' },
    { value: '4:3', label: 'Landscape (4:3)' },
    { value: '16:9', label: 'Widescreen (16:9)' },
    { value: '3:4', label: 'Portrait (3:4)' },
    { value: '9:16', label: 'Mobile (9:16)' },
];

const animationOptions = [
    { value: 'fade-up', label: 'Fade Up' },
    { value: 'fade-down', label: 'Fade Down' },
    { value: 'slide-left', label: 'Slide Left' },
    { value: 'slide-right', label: 'Slide Right' },
    { value: 'zoom-in', label: 'Zoom In' },
    { value: 'none', label: 'None' },
];

const backgroundPreviewClasses = {
    'particles-ocean': 'bg-gradient-to-br from-[#000285] via-[#0891b2] to-[#111827]',
    'particles-aurora': 'bg-gradient-to-br from-[#111827] via-[#2563eb] to-[#0f766e]',
    'particles-cosmic': 'bg-gradient-to-br from-[#0f172a] via-[#7c3aed] to-[#0369a1]',
    'particles-sunset': 'bg-gradient-to-br from-[#7f1d1d] via-[#ea580c] to-[#f59e0b]',
    'particles-nebula': 'bg-gradient-to-br from-[#1e1b4b] via-[#7c3aed] to-[#db2777]',
    'particles-forest': 'bg-gradient-to-br from-[#022c22] via-[#0f766e] to-[#65a30d]',
    'particles-midnight': 'bg-gradient-to-br from-[#020617] via-[#1d4ed8] to-[#0f172a]',
    'particles-ember': 'bg-gradient-to-br from-[#431407] via-[#dc2626] to-[#f97316]',
};

function slideImageSrc(path) {
    if (!path) {
        return '';
    }

    if (/^https?:\/\//i.test(path)) {
        return path;
    }

    return path.startsWith('/') ? path : `/${path}`;
}

function normalizeBackgroundId(value) {
    if (!value) {
        return '';
    }

    const id = String(value).trim();

    return Object.prototype.hasOwnProperty.call(backgroundPreviewClasses, id) ? id : '';
}

function fileUploadError(error) {
    const responseError = error?.response?.data?.errors?.file;
    if (Array.isArray(responseError) && responseError.length > 0) {
        return String(responseError[0]);
    }

    const message = error?.response?.data?.message;
    if (typeof message === 'string' && message.length > 0) {
        return message;
    }

    return 'Upload failed. Please try another file.';
}

function normalizeLayoutStyle(value) {
    const candidate = String(value || '').trim().toLowerCase();

    return ['center', 'split-left', 'split-right'].includes(candidate) ? candidate : 'center';
}

function normalizeContentAlignment(value) {
    const candidate = String(value || '').trim().toLowerCase();

    return ['left', 'center'].includes(candidate) ? candidate : 'center';
}

function normalizeAnimation(value, fallback = 'fade-up') {
    const candidate = String(value || '').trim().toLowerCase();

    return ['fade-up', 'fade-down', 'slide-left', 'slide-right', 'zoom-in', 'none'].includes(candidate)
        ? candidate
        : fallback;
}

function normalizeMediaPosition(value) {
    const candidate = String(value || '').trim().toLowerCase();

    return ['top', 'center', 'bottom'].includes(candidate) ? candidate : 'center';
}

function normalizeMediaAlignment(value) {
    const candidate = String(value || '').trim().toLowerCase();

    return ['left', 'center', 'right'].includes(candidate) ? candidate : 'center';
}

function inferMediaType(path, extension = '') {
    const ext = String(extension || '').trim().toLowerCase();
    if (['mp4', 'webm', 'ogg', 'mov'].includes(ext)) {
        return 'video';
    }

    const normalizedPath = String(path || '').split(/[?#]/)[0] || '';
    const pathExtension = normalizedPath.includes('.') ? normalizedPath.split('.').pop()?.toLowerCase() : '';

    return ['mp4', 'webm', 'ogg', 'mov'].includes(pathExtension || '') ? 'video' : 'image';
}

function canCropFile(path, extension = '') {
    const ext = String(extension || '').trim().toLowerCase()
        || String(path || '').split(/[?#]/)[0].split('.').pop()?.toLowerCase()
        || '';

    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'avif'].includes(ext);
}

export default function Slides({ slideShows = [], mediaLibrary = null }) {
    const { flash } = usePage().props;
    const [editingSlideId, setEditingSlideId] = useState(null);
    const [mediaFiles, setMediaFiles] = useState(Array.isArray(mediaLibrary?.files) ? mediaLibrary.files : []);
    const [dynamicBackgrounds, setDynamicBackgrounds] = useState(
        Array.isArray(mediaLibrary?.dynamic_backgrounds) ? mediaLibrary.dynamic_backgrounds : [],
    );
    const [mediaLoading, setMediaLoading] = useState(false);
    const [mediaError, setMediaError] = useState('');
    const [selectorOpen, setSelectorOpen] = useState(false);
    const [selectorTarget, setSelectorTarget] = useState('create');
    const [selectorPurpose, setSelectorPurpose] = useState('background');
    const [selectorTab, setSelectorTab] = useState('files');
    const [selectorSearch, setSelectorSearch] = useState('');
    const [cropAspectByTarget, setCropAspectByTarget] = useState({
        create: 'free',
        edit: 'free',
        selector: '1:1',
    });
    const [uploadState, setUploadState] = useState({
        create: { uploading: false, error: '' },
        edit: { uploading: false, error: '' },
    });

    const createForm = useForm(emptySlide);
    const editForm = useForm(emptySlide);

    const filteredFiles = useMemo(() => {
        const query = selectorSearch.trim().toLowerCase();

        if (query === '') {
            return mediaFiles;
        }

        return mediaFiles.filter((file) => {
            const name = String(file?.name || '').toLowerCase();
            const path = String(file?.path || '').toLowerCase();
            const directory = String(file?.directory || '').toLowerCase();

            return name.includes(query) || path.includes(query) || directory.includes(query);
        });
    }, [mediaFiles, selectorSearch]);

    const submitCreate = (event) => {
        event.preventDefault();

        createForm.post(route('admin.slides.store'), {
            preserveScroll: true,
            onSuccess: () => {
                createForm.reset();
                setUploadState((current) => ({
                    ...current,
                    create: { uploading: false, error: '' },
                }));
            },
        });
    };

    const startEditing = (slide) => {
        setEditingSlideId(slide.id);
        editForm.clearErrors();
        editForm.setData({
            slide_title: slide.slide_title || '',
            text: slide.text || '',
            slide_image: slide.slide_image || '',
            slide_background: normalizeBackgroundId(slide.slide_background),
            content_media_type: slide.content_media_type || '',
            content_media_path: slide.content_media_path || '',
            content_media_position: normalizeMediaPosition(slide.content_media_position),
            content_media_alignment: normalizeMediaAlignment(slide.content_media_alignment),
            layout_style: normalizeLayoutStyle(slide.layout_style),
            content_alignment: normalizeContentAlignment(slide.content_alignment),
            title_animation: normalizeAnimation(slide.title_animation, 'fade-up'),
            text_animation: normalizeAnimation(slide.text_animation, 'fade-up'),
            media_animation: normalizeAnimation(slide.media_animation, 'zoom-in'),
            button_animation: normalizeAnimation(slide.button_animation, 'fade-up'),
            slide_link: slide.slide_link || '',
            slide_link_text: slide.slide_link_text || '',
        });
        setUploadState((current) => ({
            ...current,
            edit: { uploading: false, error: '' },
        }));
    };

    const cancelEditing = () => {
        setEditingSlideId(null);
        editForm.clearErrors();
        editForm.reset();
        setUploadState((current) => ({
            ...current,
            edit: { uploading: false, error: '' },
        }));
    };

    const submitUpdate = (event, slide) => {
        event.preventDefault();

        editForm.put(route('admin.slides.update', slide.id), {
            preserveScroll: true,
            onSuccess: cancelEditing,
        });
    };

    const deleteSlide = (slide) => {
        if (!window.confirm(`Delete "${slide.slide_title}" from the Welcome slideshow?`)) {
            return;
        }

        router.delete(route('admin.slides.destroy', slide.id), {
            preserveScroll: true,
        });
    };

    const formByTarget = (target) => (target === 'edit' ? editForm : createForm);

    const setUploadStatus = (target, nextState) => {
        setUploadState((current) => ({
            ...current,
            [target]: {
                ...current[target],
                ...nextState,
            },
        }));
    };

    const refreshMediaLibrary = async () => {
        setMediaLoading(true);
        setMediaError('');

        try {
            const response = await window.axios.get(route('admin.slides.media.index'));
            const files = Array.isArray(response?.data?.files) ? response.data.files : [];
            const backgrounds = Array.isArray(response?.data?.dynamic_backgrounds)
                ? response.data.dynamic_backgrounds
                : [];

            setMediaFiles(files);
            setDynamicBackgrounds(backgrounds);
        } catch (error) {
            setMediaError('Unable to refresh media library right now.');
        } finally {
            setMediaLoading(false);
        }
    };

    const uploadImage = async (target, file, purpose = 'background') => {
        if (!file) {
            return;
        }

        const form = formByTarget(target);
        setUploadStatus(target, { uploading: true, error: '' });

        const body = new FormData();
        body.append('file', file);
        const selectedCrop = cropAspectByTarget[target] || 'free';
        const fileMediaType = inferMediaType('', file?.name?.split('.').pop() || '');
        if (fileMediaType !== 'video' && selectedCrop) {
            body.append('crop_aspect', selectedCrop);
        }

        try {
            const response = await window.axios.post(route('admin.slides.media.upload'), body, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            const uploadedPath = String(response?.data?.path || '');
            if (uploadedPath === '') {
                throw new Error('Upload response did not include a path.');
            }

            const mediaType = String(response?.data?.media_type || inferMediaType(uploadedPath, file.name?.split('.').pop() || ''));
            if (purpose === 'foreground') {
                form.setData('content_media_path', uploadedPath);
                form.setData('content_media_type', mediaType);
            } else {
                form.setData('slide_image', uploadedPath);
                form.setData('slide_background', '');
            }

            setUploadStatus(target, { uploading: false, error: '' });
            await refreshMediaLibrary();
        } catch (error) {
            setUploadStatus(target, { uploading: false, error: fileUploadError(error) });
        }
    };

    const cropAndSelectFile = async (file) => {
        const path = String(file?.path || '');
        if (path === '') {
            return;
        }

        if (inferMediaType(path, file?.extension || '') === 'video' || !canCropFile(path, file?.extension || '')) {
            selectFile(file);

            return;
        }

        setMediaLoading(true);
        setMediaError('');
        try {
            const response = await window.axios.post(route('admin.slides.media.crop'), {
                path,
                crop_aspect: cropAspectByTarget.selector || '1:1',
            });

            const croppedPath = String(response?.data?.path || '');
            if (croppedPath === '') {
                throw new Error('Crop response did not include a path.');
            }

            const nextFile = {
                ...file,
                path: croppedPath,
                preview_url: croppedPath,
                extension: 'webp',
            };

            selectFile(nextFile);
            await refreshMediaLibrary();
        } catch (error) {
            setMediaError(fileUploadError(error));
        } finally {
            setMediaLoading(false);
        }
    };

    const openMediaSelector = async (target, purpose = 'background') => {
        setSelectorTarget(target);
        setSelectorPurpose(purpose);
        setSelectorTab(purpose === 'foreground' ? 'files' : 'files');
        setSelectorOpen(true);
        await refreshMediaLibrary();
    };

    const closeMediaSelector = () => {
        setSelectorOpen(false);
        setSelectorSearch('');
    };

    const selectFile = (file) => {
        const form = formByTarget(selectorTarget);
        const path = String(file?.path || '');

        if (path === '') {
            return;
        }

        if (selectorPurpose === 'foreground') {
            form.setData('content_media_path', path);
            form.setData('content_media_type', inferMediaType(path, file?.extension || ''));
        } else {
            form.setData('slide_image', path);
            form.setData('slide_background', '');
        }

        closeMediaSelector();
    };

    const selectBackground = (backgroundId) => {
        if (selectorPurpose !== 'background') {
            return;
        }

        const form = formByTarget(selectorTarget);

        form.setData('slide_background', backgroundId);
        form.setData('slide_image', '');

        closeMediaSelector();
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Manage Welcome Slides
                </h2>
            }
        >
            <Head title="Manage Slides" />

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

                    <form onSubmit={submitCreate} className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Add Slide</h3>
                                <p className="text-sm text-gray-600">
                                    Upload with drag-and-drop, browse from media library, or choose dynamic backgrounds.
                                </p>
                                <p className="mt-1 text-xs text-gray-500">
                                    If no media is selected, homepage falls back to an animated background.
                                </p>
                            </div>
                            <button
                                type="submit"
                                disabled={createForm.processing}
                                className="mt-3 inline-flex items-center justify-center rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60 sm:mt-0"
                            >
                                {createForm.processing ? 'Saving...' : 'Add Slide'}
                            </button>
                        </div>

                        <SlideFields
                            form={createForm}
                            className="mt-5"
                            uploadStatus={uploadState.create}
                            cropAspect={cropAspectByTarget.create}
                            onChangeCropAspect={(value) => setCropAspectByTarget((current) => ({ ...current, create: value }))}
                            onUpload={(file, purpose) => uploadImage('create', file, purpose)}
                            onOpenMediaSelector={(purpose) => openMediaSelector('create', purpose)}
                        />
                    </form>

                    <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
                        <div className="border-b border-gray-200 px-6 py-4">
                            <h3 className="text-lg font-semibold text-gray-900">Current Slides</h3>
                            <p className="text-sm text-gray-600">
                                Newest slides appear first in the Welcome slideshow.
                            </p>
                        </div>

                        <div className="divide-y divide-gray-100">
                            {slideShows.length === 0 && (
                                <div className="px-6 py-10 text-sm text-gray-500">
                                    No database slides yet. The Welcome page will use fallback slides until you add one.
                                </div>
                            )}

                            {slideShows.map((slide) => {
                                const isEditing = editingSlideId === slide.id;

                                return (
                                    <div key={slide.id} className="p-6">
                                        {isEditing ? (
                                            <form onSubmit={(event) => submitUpdate(event, slide)} className="space-y-5">
                                                <SlideFields
                                                    form={editForm}
                                                    uploadStatus={uploadState.edit}
                                                    cropAspect={cropAspectByTarget.edit}
                                                    onChangeCropAspect={(value) => setCropAspectByTarget((current) => ({ ...current, edit: value }))}
                                                    onUpload={(file, purpose) => uploadImage('edit', file, purpose)}
                                                    onOpenMediaSelector={(purpose) => openMediaSelector('edit', purpose)}
                                                />
                                                <div className="flex flex-wrap gap-2">
                                                    <button
                                                        type="submit"
                                                        disabled={editForm.processing}
                                                        className="rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                                                    >
                                                        {editForm.processing ? 'Updating...' : 'Save Changes'}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={cancelEditing}
                                                        className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </form>
                                        ) : (
                                            <div className="grid gap-5 lg:grid-cols-[220px_1fr_auto]">
                                                <SlideCardPreview
                                                    imagePath={slide.slide_image}
                                                    backgroundId={slide.slide_background}
                                                    title={slide.slide_title}
                                                />
                                                <div>
                                                    <h4 className="text-base font-semibold text-gray-900">
                                                        {slide.slide_title}
                                                    </h4>
                                                    <p className="mt-2 text-sm leading-6 text-gray-600">
                                                        {slide.text}
                                                    </p>
                                                    <dl className="mt-3 space-y-1 text-xs text-gray-500">
                                                        <div>
                                                            <dt className="inline font-semibold">Image: </dt>
                                                            <dd className="inline break-all">{slide.slide_image || 'None'}</dd>
                                                        </div>
                                                        <div>
                                                            <dt className="inline font-semibold">Dynamic Background: </dt>
                                                            <dd className="inline break-all">{slide.slide_background || 'None'}</dd>
                                                        </div>
                                                        <div>
                                                            <dt className="inline font-semibold">Foreground Media: </dt>
                                                            <dd className="inline break-all">{slide.content_media_path || 'None'}</dd>
                                                        </div>
                                                        <div>
                                                            <dt className="inline font-semibold">Foreground Media Type: </dt>
                                                            <dd className="inline">{slide.content_media_type || 'Auto'}</dd>
                                                        </div>
                                                        <div>
                                                            <dt className="inline font-semibold">Foreground Media Position: </dt>
                                                            <dd className="inline">{normalizeMediaPosition(slide.content_media_position)}</dd>
                                                        </div>
                                                        <div>
                                                            <dt className="inline font-semibold">Foreground Media Alignment: </dt>
                                                            <dd className="inline">{normalizeMediaAlignment(slide.content_media_alignment)}</dd>
                                                        </div>
                                                        <div>
                                                            <dt className="inline font-semibold">Layout: </dt>
                                                            <dd className="inline">{slide.layout_style || 'center'}</dd>
                                                        </div>
                                                        <div>
                                                            <dt className="inline font-semibold">Content Align: </dt>
                                                            <dd className="inline">{slide.content_alignment || 'center'}</dd>
                                                        </div>
                                                        <div>
                                                            <dt className="inline font-semibold">Animations: </dt>
                                                            <dd className="inline">
                                                                title={slide.title_animation || 'fade-up'}, text={slide.text_animation || 'fade-up'}, media={slide.media_animation || 'zoom-in'}, button={slide.button_animation || 'fade-up'}
                                                            </dd>
                                                        </div>
                                                        <div>
                                                            <dt className="inline font-semibold">Link: </dt>
                                                            <dd className="inline break-all">{slide.slide_link || 'None'}</dd>
                                                        </div>
                                                        <div>
                                                            <dt className="inline font-semibold">Button Text: </dt>
                                                            <dd className="inline">{slide.slide_link_text || 'None'}</dd>
                                                        </div>
                                                    </dl>
                                                </div>
                                                <div className="flex gap-2 lg:flex-col">
                                                    <button
                                                        type="button"
                                                        onClick={() => startEditing(slide)}
                                                        className="rounded-md border border-blue-200 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => deleteSlide(slide)}
                                                        className="rounded-md border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            <Modal show={selectorOpen} maxWidth="2xl" onClose={closeMediaSelector}>
                <div className="space-y-4 p-5 sm:p-6">
                    <div className="flex flex-col gap-3 border-b border-gray-100 pb-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Media Selector</h3>
                            <p className="text-sm text-gray-600">
                                {selectorPurpose === 'foreground'
                                    ? 'Pick an image or video for slide foreground content.'
                                    : 'Pick from public files or dynamic backgrounds.'}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={closeMediaSelector}
                            className="inline-flex items-center justify-center rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                        >
                            Close
                        </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setSelectorTab('files')}
                            className={`rounded-md px-3 py-2 text-sm font-semibold ${selectorTab === 'files' ? 'bg-blue-700 text-white' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                        >
                            Files ({mediaFiles.length})
                        </button>
                        {selectorPurpose === 'background' && (
                            <button
                                type="button"
                                onClick={() => setSelectorTab('backgrounds')}
                                className={`rounded-md px-3 py-2 text-sm font-semibold ${selectorTab === 'backgrounds' ? 'bg-blue-700 text-white' : 'border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                            >
                                Dynamic Backgrounds ({dynamicBackgrounds.length})
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={refreshMediaLibrary}
                            disabled={mediaLoading}
                            className="ml-auto rounded-md border border-blue-200 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {mediaLoading ? 'Refreshing...' : 'Refresh'}
                        </button>
                    </div>

                    {selectorTab === 'files' && (
                        <>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <input
                                    type="text"
                                    value={selectorSearch}
                                    onChange={(event) => setSelectorSearch(event.target.value)}
                                    placeholder="Search media by file name or path"
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                                />
                                <select
                                    value={cropAspectByTarget.selector}
                                    onChange={(event) => setCropAspectByTarget((current) => ({ ...current, selector: event.target.value }))}
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                                >
                                    {cropAspectOptions.filter((option) => option.value !== 'free').map((option) => (
                                        <option key={option.value} value={option.value}>
                                            Crop Before Use: {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            {mediaError && <p className="text-xs text-red-600">{mediaError}</p>}
                            <div className="max-h-[60vh] overflow-y-auto rounded-md border border-gray-200 p-3">
                                {filteredFiles.length === 0 ? (
                                    <p className="text-sm text-gray-500">No matching files found.</p>
                                ) : (
                                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                        {filteredFiles.map((file) => (
                                            <div
                                                key={file.path}
                                                className="group overflow-hidden rounded-md border border-gray-200 text-left transition hover:border-blue-400 hover:shadow-sm"
                                            >
                                                <div className="h-28 w-full overflow-hidden bg-gray-50">
                                                    {inferMediaType(file.path, file.extension) === 'video' ? (
                                                        <video
                                                            src={slideImageSrc(file.preview_url || file.path)}
                                                            className="h-full w-full object-cover"
                                                            muted
                                                            loop
                                                            autoPlay
                                                            playsInline
                                                        />
                                                    ) : (
                                                        <img
                                                            src={slideImageSrc(file.preview_url || file.path)}
                                                            alt={file.name || file.path}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    )}
                                                </div>
                                                <div className="space-y-1 p-2">
                                                    <p className="truncate text-xs font-semibold text-gray-900">{file.name}</p>
                                                    <p className="truncate text-[11px] text-gray-500">{file.path}</p>
                                                    <p className="text-[11px] text-gray-500">
                                                        {formatFileSize(Number(file.size || 0))}
                                                    </p>
                                                    <div className="mt-2 flex flex-wrap gap-1">
                                                        <button
                                                            type="button"
                                                            onClick={() => selectFile(file)}
                                                            className="rounded border border-blue-200 px-2 py-1 text-[11px] font-semibold text-blue-700 hover:bg-blue-50"
                                                        >
                                                            Use
                                                        </button>
                                                        {inferMediaType(file.path, file.extension) !== 'video' && canCropFile(file.path, file.extension) && (
                                                            <button
                                                                type="button"
                                                                onClick={() => cropAndSelectFile(file)}
                                                                className="rounded border border-slate-300 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                                                            >
                                                                Crop & Use
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    {selectorTab === 'backgrounds' && (
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {dynamicBackgrounds.length === 0 && (
                                <p className="col-span-full text-sm text-gray-500">
                                    No dynamic background options available.
                                </p>
                            )}
                            {dynamicBackgrounds.map((option) => {
                                const optionId = String(option.id || '');
                                const downloadUrl = slideImageSrc(option.download_url || '');

                                return (
                                    <div
                                        key={optionId}
                                        className="rounded-md border border-gray-200 text-left transition hover:border-blue-400 hover:shadow-sm"
                                    >
                                        <div className={`h-28 w-full ${backgroundPreviewClasses[optionId] || 'bg-gradient-to-br from-slate-800 to-slate-600'}`} />
                                        <div className="space-y-1 p-3">
                                            <p className="text-sm font-semibold text-gray-900">{option.label || optionId}</p>
                                            <p className="text-xs text-gray-500">{option.description || ''}</p>
                                            <p className="text-[11px] font-semibold text-blue-700">{optionId}</p>
                                            <div className="mt-2 flex flex-wrap gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => selectBackground(optionId)}
                                                    className="rounded border border-blue-200 px-2 py-1 text-[11px] font-semibold text-blue-700 hover:bg-blue-50"
                                                >
                                                    Use
                                                </button>
                                                {downloadUrl && (
                                                    <a
                                                        href={downloadUrl}
                                                        download
                                                        className="rounded border border-slate-300 px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                                                    >
                                                        Download
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}

function SlideFields({
    form,
    className = '',
    uploadStatus,
    cropAspect = 'free',
    onChangeCropAspect,
    onUpload,
    onOpenMediaSelector,
}) {
    const selectedBackground = normalizeBackgroundId(form.data.slide_background);
    const resolvedContentMediaType = form.data.content_media_type || inferMediaType(form.data.content_media_path, '');

    return (
        <div className={`grid gap-4 md:grid-cols-2 ${className}`}>
            <Field
                label="Slide Title"
                error={form.errors.slide_title}
                className="md:col-span-2"
            >
                <input
                    type="text"
                    value={form.data.slide_title}
                    onChange={(event) => form.setData('slide_title', event.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    required
                />
            </Field>

            <Field label="Slide Text" error={form.errors.text} className="md:col-span-2">
                <textarea
                    rows={3}
                    value={form.data.text}
                    onChange={(event) => form.setData('text', event.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    required
                />
            </Field>

            <Field label="Hero Background Media" error={form.errors.slide_image} className="md:col-span-2">
                <SlideMediaField
                    mode="background"
                    mediaPath={form.data.slide_image}
                    backgroundId={selectedBackground}
                    uploadStatus={uploadStatus}
                    cropAspect={cropAspect}
                    onChangeCropAspect={onChangeCropAspect}
                    onUpload={(file) => onUpload(file, 'background')}
                    onOpenMediaSelector={() => onOpenMediaSelector('background')}
                    onClearMedia={() => {
                        form.setData('slide_image', '');
                        form.setData('slide_background', '');
                    }}
                />
            </Field>

            <Field label="Background Image URL or Public Path (Optional)" error={form.errors.slide_image}>
                <input
                    type="text"
                    value={form.data.slide_image}
                    onChange={(event) => {
                        form.setData('slide_image', event.target.value);
                        if (event.target.value.trim() !== '') {
                            form.setData('slide_background', '');
                        }
                    }}
                    placeholder="/images/welcome-slide.jpg"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
            </Field>

            <Field label="Dynamic Background" error={form.errors.slide_background}>
                <div className="space-y-2">
                    <input
                        type="text"
                        value={selectedBackground || 'None'}
                        readOnly
                        className="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-700"
                    />
                    <button
                        type="button"
                        onClick={() => onOpenMediaSelector('background')}
                        className="rounded-md border border-blue-200 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50"
                    >
                        Choose Dynamic Background
                    </button>
                    {selectedBackground && (
                        <button
                            type="button"
                            onClick={() => form.setData('slide_background', '')}
                            className="ml-2 rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                        >
                            Clear Background
                        </button>
                    )}
                </div>
            </Field>

            <Field
                label="Foreground Media (Image/Video)"
                error={form.errors.content_media_path || form.errors.content_media_type}
                className="md:col-span-2"
            >
                <SlideMediaField
                    mode="foreground"
                    mediaPath={form.data.content_media_path}
                    mediaType={resolvedContentMediaType}
                    uploadStatus={uploadStatus}
                    cropAspect={cropAspect}
                    onChangeCropAspect={onChangeCropAspect}
                    onUpload={(file) => onUpload(file, 'foreground')}
                    onOpenMediaSelector={() => onOpenMediaSelector('foreground')}
                    onClearMedia={() => {
                        form.setData('content_media_path', '');
                        form.setData('content_media_type', '');
                    }}
                />
            </Field>

            <Field label="Foreground Media URL or Public Path" error={form.errors.content_media_path}>
                <input
                    type="text"
                    value={form.data.content_media_path}
                    onChange={(event) => form.setData('content_media_path', event.target.value)}
                    placeholder="/storage/slide-videos/promo.mp4"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
            </Field>

            <Field label="Foreground Media Type" error={form.errors.content_media_type}>
                <select
                    value={form.data.content_media_type || ''}
                    onChange={(event) => form.setData('content_media_type', event.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                >
                    <option value="">Auto Detect</option>
                    <option value="image">Image</option>
                    <option value="video">Video</option>
                </select>
            </Field>

            <Field label="Foreground Media Position" error={form.errors.content_media_position}>
                <select
                    value={form.data.content_media_position || 'center'}
                    onChange={(event) => form.setData('content_media_position', event.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                >
                    {mediaPositionOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            </Field>

            <Field label="Foreground Media Alignment" error={form.errors.content_media_alignment}>
                <select
                    value={form.data.content_media_alignment || 'center'}
                    onChange={(event) => form.setData('content_media_alignment', event.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                >
                    {mediaAlignmentOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            </Field>

            <Field label="Layout Structure" error={form.errors.layout_style}>
                <select
                    value={form.data.layout_style || 'center'}
                    onChange={(event) => form.setData('layout_style', event.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                >
                    {layoutStyleOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            </Field>

            <Field label="Content Alignment" error={form.errors.content_alignment}>
                <select
                    value={form.data.content_alignment || 'center'}
                    onChange={(event) => form.setData('content_alignment', event.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                >
                    {contentAlignmentOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            </Field>

            <AnimationField
                label="Title Animation"
                value={form.data.title_animation || 'fade-up'}
                error={form.errors.title_animation}
                onChange={(value) => form.setData('title_animation', value)}
            />
            <AnimationField
                label="Text Animation"
                value={form.data.text_animation || 'fade-up'}
                error={form.errors.text_animation}
                onChange={(value) => form.setData('text_animation', value)}
            />
            <AnimationField
                label="Media Animation"
                value={form.data.media_animation || 'zoom-in'}
                error={form.errors.media_animation}
                onChange={(value) => form.setData('media_animation', value)}
            />
            <AnimationField
                label="Button Animation"
                value={form.data.button_animation || 'fade-up'}
                error={form.errors.button_animation}
                onChange={(value) => form.setData('button_animation', value)}
            />

            <Field label="Slide Link" error={form.errors.slide_link}>
                <input
                    type="text"
                    value={form.data.slide_link}
                    onChange={(event) => form.setData('slide_link', event.target.value)}
                    placeholder="/order/web-design"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
            </Field>

            <Field label="Link Button Text" error={form.errors.slide_link_text}>
                <input
                    type="text"
                    value={form.data.slide_link_text}
                    onChange={(event) => form.setData('slide_link_text', event.target.value)}
                    placeholder="Learn More"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
            </Field>
        </div>
    );
}

function SlideMediaField({
    mode,
    mediaPath,
    mediaType = '',
    backgroundId = '',
    uploadStatus,
    cropAspect = 'free',
    onChangeCropAspect,
    onUpload,
    onOpenMediaSelector,
    onClearMedia,
}) {
    const inputRef = useRef(null);
    const [dragging, setDragging] = useState(false);

    const handleDragOver = (event) => {
        event.preventDefault();
        setDragging(true);
    };

    const handleDragLeave = (event) => {
        event.preventDefault();
        setDragging(false);
    };

    const handleDrop = (event) => {
        event.preventDefault();
        setDragging(false);

        const file = event.dataTransfer?.files?.[0];
        if (file) {
            onUpload(file);
        }
    };

    const handleChooseFile = () => {
        inputRef.current?.click();
    };

    const resolvedMedia = slideImageSrc(mediaPath);
    const hasBackground = Boolean(normalizeBackgroundId(backgroundId));
    const isForeground = mode === 'foreground';
    const isVideo = isForeground && (mediaType === 'video' || inferMediaType(mediaPath, '') === 'video');

    return (
        <div className="space-y-3">
            <div
                className={`rounded-md border-2 border-dashed p-4 transition ${dragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-gray-700">
                        {isForeground
                            ? 'Drag and drop an image/video here, or browse from your device/media library.'
                            : 'Drag and drop a background image here, or browse from your device/media library.'}
                    </p>
                    <div className="flex flex-wrap gap-2">
                        <select
                            value={cropAspect}
                            onChange={(event) => onChangeCropAspect?.(event.target.value)}
                            className="rounded-md border border-gray-300 bg-white px-2 py-2 text-xs font-semibold text-gray-700"
                        >
                            {cropAspectOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                        <button
                            type="button"
                            onClick={handleChooseFile}
                            disabled={uploadStatus?.uploading}
                            className="rounded-md bg-blue-700 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {uploadStatus?.uploading ? 'Uploading...' : isForeground ? 'Upload Media' : 'Upload Image'}
                        </button>
                        <button
                            type="button"
                            onClick={onOpenMediaSelector}
                            className="rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                        >
                            Open Media Selector
                        </button>
                        <button
                            type="button"
                            onClick={onClearMedia}
                            className="rounded-md border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
                        >
                            Clear
                        </button>
                    </div>
                </div>
                <input
                    ref={inputRef}
                    type="file"
                    accept={isForeground ? 'image/*,video/*' : 'image/*'}
                    className="hidden"
                    onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) {
                            onUpload(file);
                        }
                        event.target.value = '';
                    }}
                />
            </div>

            {uploadStatus?.error && <p className="text-xs text-red-600">{uploadStatus.error}</p>}

            <div className="rounded-md border border-gray-200 bg-white p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Current selection</p>
                {isForeground ? (
                    <ForegroundMediaPreview mediaPath={resolvedMedia} isVideo={isVideo} />
                ) : (
                    <SlideCardPreview
                        imagePath={resolvedMedia}
                        backgroundId={hasBackground ? backgroundId : ''}
                        title="Selected slide media"
                        compact
                    />
                )}
                {mediaPath && (
                    <p className="mt-2 break-all text-xs text-gray-500">
                        Path: {mediaPath}
                    </p>
                )}
                {!mediaPath && hasBackground && !isForeground && (
                    <p className="mt-2 break-all text-xs text-gray-500">
                        Dynamic background: {backgroundId}
                    </p>
                )}
                {!mediaPath && !hasBackground && (
                    <p className="mt-2 text-xs text-gray-500">No media selected.</p>
                )}
            </div>
        </div>
    );
}

function AnimationField({ label, value, error, onChange }) {
    return (
        <Field label={label} error={error}>
            <select
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            >
                {animationOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </Field>
    );
}

function ForegroundMediaPreview({ mediaPath, isVideo }) {
    if (!mediaPath) {
        return (
            <div className="flex h-36 w-full items-center justify-center bg-gray-50 text-xs font-semibold text-gray-400">
                No Foreground Media
            </div>
        );
    }

    if (isVideo) {
        return (
            <video
                src={mediaPath}
                className="h-36 w-full object-cover"
                muted
                loop
                autoPlay
                playsInline
                controls
            />
        );
    }

    return (
        <img
            src={mediaPath}
            alt="Foreground media preview"
            className="h-36 w-full object-cover"
        />
    );
}

function SlideCardPreview({ imagePath, backgroundId, title, compact = false }) {
    const imageSrc = slideImageSrc(imagePath);
    const dynamicBackgroundId = normalizeBackgroundId(backgroundId);

    const className = compact
        ? 'h-36 w-full rounded-md border border-gray-200 object-cover'
        : 'h-36 w-full rounded-md border border-gray-200 object-cover lg:w-56';

    if (imageSrc) {
        return (
            <img
                src={imageSrc}
                alt={title}
                className={className}
            />
        );
    }

    if (dynamicBackgroundId) {
        return (
            <div className={`relative ${compact ? 'h-36 w-full' : 'h-36 w-full lg:w-56'} overflow-hidden rounded-md border border-gray-200 ${backgroundPreviewClasses[dynamicBackgroundId]}`}>
                <div
                    className="absolute inset-0 opacity-30"
                    style={{
                        backgroundImage: 'linear-gradient(rgba(255,255,255,0.22) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.22) 1px, transparent 1px)',
                        backgroundSize: '40px 40px',
                    }}
                />
                <div className="absolute bottom-2 left-2 rounded bg-black/35 px-2 py-1 text-[11px] font-semibold text-white">
                    {dynamicBackgroundId}
                </div>
            </div>
        );
    }

    return (
        <div className={`flex ${compact ? 'h-36 w-full' : 'h-36 w-full lg:w-56'} items-center justify-center rounded-md border border-gray-200 bg-gray-50 text-xs font-semibold text-gray-400`}>
            No Image/Background
        </div>
    );
}

function Field({ label, error, className = '', children }) {
    return (
        <div className={className}>
            <label className="mb-1 block text-sm font-medium text-gray-700">
                {label}
            </label>
            {children}
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
    );
}

function formatFileSize(value) {
    if (!Number.isFinite(value) || value <= 0) {
        return '0 KB';
    }

    if (value < 1024) {
        return `${value} B`;
    }

    const kb = value / 1024;
    if (kb < 1024) {
        return `${kb.toFixed(1)} KB`;
    }

    return `${(kb / 1024).toFixed(1)} MB`;
}
