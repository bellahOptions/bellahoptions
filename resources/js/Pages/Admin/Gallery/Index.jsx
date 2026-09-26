import Modal from '@/Components/Modal';
import FastImage from '@/Components/FastImage';
import { Card } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Select } from '@/Components/ui/select';
import { Textarea } from '@/Components/ui/textarea';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
    AlignLeft,
    ArrowUpDown,
    ChartColumn,
    CheckCircle2 as CheckCircleIcon,
    CloudUpload,
    Crop,
    ExternalLink,
    Eye,
    FileText,
    Globe,
    Image as ImageIcon,
    Info,
    LayoutGrid,
    Link as LinkIcon,
    Pencil,
    RefreshCw,
    Search,
    Tag,
    Trash2,
    TriangleAlert,
    Upload,
} from 'lucide-react';
import { useMemo, useRef, useState } from 'react';

const emptyItem = {
    title: '',
    category: '',
    position: 0,
    description: '',
    image_path: '',
    project_url: '',
    is_published: true,
};

function imageSrc(path) {
    if (!path) {
        return '';
    }

    if (/^https?:\/\//i.test(path)) {
        return path;
    }

    return path.startsWith('/') ? path : `/${path}`;
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

    return 'Upload failed. Please try another image.';
}

function canCropImage(path, extension = '') {
    const ext = String(extension || '').trim().toLowerCase()
        || String(path || '').split(/[?#]/)[0].split('.').pop()?.toLowerCase()
        || '';

    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'avif'].includes(ext);
}

const cropAspectOptions = [
    { value: 'free', label: 'No Crop' },
    { value: '1:1', label: 'Square (1:1)' },
    { value: '4:3', label: 'Landscape (4:3)' },
    { value: '16:9', label: 'Widescreen (16:9)' },
    { value: '3:4', label: 'Portrait (3:4)' },
    { value: '9:16', label: 'Mobile (9:16)' },
];

export default function GalleryAdmin({ items = [], mediaLibrary = null }) {
    const { flash } = usePage().props;
    const [editingId, setEditingId] = useState(null);
    const [mediaFiles, setMediaFiles] = useState(Array.isArray(mediaLibrary?.files) ? mediaLibrary.files : []);
    const [mediaLoading, setMediaLoading] = useState(false);
    const [mediaError, setMediaError] = useState('');
    const [selectorOpen, setSelectorOpen] = useState(false);
    const [selectorTarget, setSelectorTarget] = useState('create');
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

    const createForm = useForm(emptyItem);
    const editForm = useForm(emptyItem);

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

        createForm.post(route('admin.gallery.store'), {
            preserveScroll: true,
            onSuccess: () => {
                createForm.reset();
                createForm.setData('position', 0);
                createForm.setData('is_published', true);
                setUploadState((current) => ({
                    ...current,
                    create: { uploading: false, error: '' },
                }));
            },
        });
    };

    const startEditing = (item) => {
        setEditingId(item.id);
        editForm.clearErrors();
        editForm.setData({
            title: item.title || '',
            category: item.category || '',
            position: Number(item.position || 0),
            description: item.description || '',
            image_path: item.image_path || '',
            project_url: item.project_url || '',
            is_published: Boolean(item.is_published),
        });
        setUploadState((current) => ({
            ...current,
            edit: { uploading: false, error: '' },
        }));
    };

    const cancelEditing = () => {
        setEditingId(null);
        editForm.clearErrors();
        editForm.reset();
        setUploadState((current) => ({
            ...current,
            edit: { uploading: false, error: '' },
        }));
    };

    const submitUpdate = (event, item) => {
        event.preventDefault();

        editForm.put(route('admin.gallery.update', item.id), {
            preserveScroll: true,
            onSuccess: cancelEditing,
        });
    };

    const deleteItem = (item) => {
        if (!window.confirm(`Delete "${item.title}"?`)) {
            return;
        }

        router.delete(route('admin.gallery.destroy', item.id), {
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
            const response = await window.axios.get(route('admin.gallery.media.index'));
            const files = Array.isArray(response?.data?.files) ? response.data.files : [];

            setMediaFiles(files);
        } catch (error) {
            setMediaError('Unable to refresh media library right now.');
        } finally {
            setMediaLoading(false);
        }
    };

    const uploadImage = async (target, file) => {
        if (!file) {
            return;
        }

        const form = formByTarget(target);
        setUploadStatus(target, { uploading: true, error: '' });

        const body = new FormData();
        body.append('file', file);
        const selectedCrop = cropAspectByTarget[target] || 'free';
        if (selectedCrop) {
            body.append('crop_aspect', selectedCrop);
        }

        try {
            const response = await window.axios.post(route('admin.gallery.media.upload'), body, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            const uploadedPath = String(response?.data?.path || '');
            if (uploadedPath === '') {
                throw new Error('Upload response did not include a path.');
            }

            form.setData('image_path', uploadedPath);

            setUploadStatus(target, { uploading: false, error: '' });
            await refreshMediaLibrary();
        } catch (error) {
            setUploadStatus(target, { uploading: false, error: fileUploadError(error) });
        }
    };

    const openMediaSelector = async (target) => {
        setSelectorTarget(target);
        setSelectorOpen(true);
        await refreshMediaLibrary();
    };

    const closeMediaSelector = () => {
        setSelectorOpen(false);
        setSelectorSearch('');
    };

    const selectFile = (path) => {
        const form = formByTarget(selectorTarget);

        form.setData('image_path', path);

        closeMediaSelector();
    };

    const cropAndSelectFile = async (file) => {
        const path = String(file?.path || '');
        if (path === '') {
            return;
        }
        if (!canCropImage(path, file?.extension || '')) {
            selectFile(path);

            return;
        }

        setMediaLoading(true);
        setMediaError('');
        try {
            const response = await window.axios.post(route('admin.gallery.media.crop'), {
                path,
                crop_aspect: cropAspectByTarget.selector || '1:1',
            });

            const croppedPath = String(response?.data?.path || '');
            if (croppedPath === '') {
                throw new Error('Crop response did not include a path.');
            }

            selectFile(croppedPath);
            await refreshMediaLibrary();
        } catch (error) {
            setMediaError(fileUploadError(error));
        } finally {
            setMediaLoading(false);
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center gap-3">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-jv-sm border border-jv-line-strong bg-white/[0.06] text-jv-accent">
                        <ImageIcon className="h-4 w-4" />
                    </span>
                    <div>
                        <h2 className="text-xl font-semibold leading-tight tracking-tight text-white">Manage Gallery</h2>
                        <p className="text-xs text-white/45">
                            {items.length} {items.length === 1 ? 'project' : 'projects'} ·{' '}
                            {items.filter((item) => item.is_published).length} published
                        </p>
                    </div>
                </div>
            }
        >
            <Head title="Manage Gallery" />

            <div className="py-10">
                <div className="mx-auto max-w-6xl space-y-6 px-4 sm:px-6 lg:px-8">
                    {flash?.success && (
                        <div className="flex items-start gap-2.5 rounded-jv-sm border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                            <CheckCircleIcon className="mt-0.5 h-4 w-4 shrink-0" />
                            {flash.success}
                        </div>
                    )}

                    {flash?.error && (
                        <div className="flex items-start gap-2.5 rounded-jv-sm border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                            {flash.error}
                        </div>
                    )}

                    <form onSubmit={submitCreate}>
                        <Card className="p-5">
                            <div className="flex flex-col p-5 gap-4 border-b border-jv-line pb-5 sm:flex-row sm:items-start sm:justify-between">
                                <div className="flex items-start gap-3">
                                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-jv-sm border border-jv-line-strong bg-white/[0.06] text-jv-accent">
                                        <LayoutGrid className="h-4 w-4" />
                                    </span>
                                    <div>
                                        <h3 className="text-lg font-semibold tracking-tight text-white">Add Project</h3>
                                        <p className="mt-1 text-sm text-white/55">
                                            Upload an image or pick one from the media library, then describe the work.
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={createForm.processing}
                                    className="jv-btn jv-btn--primary shrink-0 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {createForm.processing ? (
                                        <>
                                            <RefreshCw className="h-4 w-4 animate-spin" />
                                            Saving…
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="h-4 w-4" />
                                            Add Project
                                        </>
                                    )}
                                </button>
                            </div>

                            <GalleryFields
                                form={createForm}
                                className="mt-6"
                                uploadStatus={uploadState.create}
                                cropAspect={cropAspectByTarget.create}
                                onChangeCropAspect={(value) => setCropAspectByTarget((current) => ({ ...current, create: value }))}
                                onUpload={(file) => uploadImage('create', file)}
                                onOpenMediaSelector={() => openMediaSelector('create')}
                            />
                        </Card>
                    </form>

                    <Card className="overflow-hidden p-0">
                        <div className="flex items-center gap-3 border-b border-jv-line px-6 py-4">
                            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-jv-sm border border-jv-line-strong bg-white/[0.06] text-jv-accent">
                                <ImageIcon className="h-4 w-4" />
                            </span>
                            <div>
                                <h3 className="text-lg font-semibold tracking-tight text-white">Current Items</h3>
                                <p className="text-sm text-white/55">Published projects are visible on the public gallery.</p>
                            </div>
                        </div>

                        <div className="divide-y divide-jv-line/70">
                            {items.length === 0 && (
                                <div className="px-6 py-10 text-sm text-white/45">No projects yet.</div>
                            )}

                            {items.map((item) => {
                                const isEditing = editingId === item.id;

                                return (
                                    <div key={item.id} className="p-6">
                                        {isEditing ? (
                                            <form onSubmit={(event) => submitUpdate(event, item)} className="space-y-5">
                                                <GalleryFields
                                                    form={editForm}
                                                    uploadStatus={uploadState.edit}
                                                    cropAspect={cropAspectByTarget.edit}
                                                    onChangeCropAspect={(value) => setCropAspectByTarget((current) => ({ ...current, edit: value }))}
                                                    onUpload={(file) => uploadImage('edit', file)}
                                                    onOpenMediaSelector={() => openMediaSelector('edit')}
                                                />
                                                <div className="flex flex-wrap gap-2">
                                                    <button
                                                        type="submit"
                                                        disabled={editForm.processing}
                                                        className="jv-btn jv-btn--primary disabled:cursor-not-allowed disabled:opacity-60"
                                                    >
                                                        {editForm.processing ? 'Updating...' : 'Save Changes'}
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={cancelEditing}
                                                        className="jv-btn jv-btn--ghost"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </form>
                                        ) : (
                                            <div className="grid gap-5 lg:grid-cols-[180px_1fr_auto]">
                                                <PreviewImage path={item.image_path} title={item.title} />
                                                <div>
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <h4 className="text-base font-semibold text-white">{item.title}</h4>
                                                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${item.is_published ? 'bg-emerald-500/15 text-emerald-300' : 'bg-white/[0.07] text-white/60'}`}>
                                                            {item.is_published ? 'Published' : 'Draft'}
                                                        </span>
                                                    </div>
                                                    <p className="mt-2 text-sm leading-6 text-white/55">
                                                        {item.description || 'No description yet.'}
                                                    </p>
                                                    <dl className="mt-3 grid gap-1 text-xs text-white/45 sm:grid-cols-2">
                                                        <div>
                                                            <dt className="inline font-semibold text-white/60">Category: </dt>
                                                            <dd className="inline break-all">{item.category || 'None'}</dd>
                                                        </div>
                                                        <div>
                                                            <dt className="inline font-semibold text-white/60">Position: </dt>
                                                            <dd className="inline break-all">{String(item.position ?? 0)}</dd>
                                                        </div>
                                                        <div>
                                                            <dt className="inline font-semibold text-white/60">Image: </dt>
                                                            <dd className="inline break-all">{item.image_path || 'None'}</dd>
                                                        </div>
                                                        <div>
                                                            <dt className="inline font-semibold text-white/60">Project URL: </dt>
                                                            <dd className="inline break-all">{item.project_url || 'None'}</dd>
                                                        </div>
                                                    </dl>
                                                </div>
                                                <div className="flex gap-2 lg:flex-col">
                                                    <button
                                                        type="button"
                                                        onClick={() => startEditing(item)}
                                                        className="jv-btn jv-btn--outline jv-btn--sm"
                                                    >
                                                        <Pencil className="h-3.5 w-3.5" />
                                                        Edit
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => deleteItem(item)}
                                                        className="jv-btn jv-btn--sm border border-red-500/40 text-red-300 transition hover:bg-red-500/10 hover:text-red-200"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                        Delete
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </Card>
                </div>
            </div>

            <Modal show={selectorOpen} maxWidth="2xl" onClose={closeMediaSelector}>
                <div className="space-y-4 p-5 sm:p-6">
                    <div className="flex flex-col gap-3 border-b border-jv-line pb-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-jv-sm border border-jv-line-strong bg-white/[0.06] text-jv-accent">
                                <ImageIcon className="h-4 w-4" />
                            </span>
                            <div>
                                <h3 className="text-lg font-semibold tracking-tight text-white">Media Library</h3>
                                <p className="text-sm text-white/55">
                                    Every uploaded image plus the public directory assets.
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={closeMediaSelector}
                            className="jv-btn jv-btn--ghost jv-btn--sm shrink-0"
                        >
                            Close
                        </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <div className="relative w-full sm:w-auto sm:flex-1">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                            <input
                                type="text"
                                value={selectorSearch}
                                onChange={(event) => setSelectorSearch(event.target.value)}
                                placeholder="Search by file name or path"
                                className="jv-input w-full pl-9"
                            />
                        </div>
                        <select
                            value={cropAspectByTarget.selector}
                            onChange={(event) => setCropAspectByTarget((current) => ({ ...current, selector: event.target.value }))}
                            className="jv-select w-auto"
                        >
                            {cropAspectOptions.filter((option) => option.value !== 'free').map((option) => (
                                <option key={option.value} value={option.value}>
                                    Crop Before Use: {option.label}
                                </option>
                            ))}
                        </select>
                        <button
                            type="button"
                            onClick={refreshMediaLibrary}
                            disabled={mediaLoading}
                            className="jv-btn jv-btn--outline jv-btn--sm disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <RefreshCw className={`h-3.5 w-3.5 ${mediaLoading ? 'animate-spin' : ''}`} />
                            {mediaLoading ? 'Refreshing…' : 'Refresh'}
                        </button>
                    </div>

                    {mediaError && (
                        <p className="flex items-center gap-1.5 text-xs text-red-300">
                            <TriangleAlert className="h-3.5 w-3.5" />
                            {mediaError}
                        </p>
                    )}

                    <div className="max-h-[60vh] overflow-y-auto rounded-jv-sm border border-jv-line p-3">
                        {filteredFiles.length === 0 ? (
                            <p className="py-8 text-center text-sm text-white/45">No matching files found.</p>
                        ) : (
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {filteredFiles.map((file) => (
                                    <div
                                        key={file.path}
                                        className="group overflow-hidden rounded-jv-sm border border-jv-line bg-white/[0.03] text-left transition hover:border-jv-accent-line hover:bg-white/[0.06]"
                                    >
                                        <div className="h-28 w-full overflow-hidden bg-black/40">
                                            <FastImage
                                                src={imageSrc(file.preview_url || file.path)}
                                                alt={file.name || file.path}
                                                sizes="(min-width: 1024px) 30vw, 45vw"
                                                className="h-full w-full object-cover"
                                            />
                                        </div>
                                        <div className="space-y-1 p-2">
                                            <p className="truncate text-xs font-semibold text-white">{file.name}</p>
                                            <p className="truncate text-[11px] text-white/45">{file.path}</p>
                                            <p className="text-[11px] text-white/45">{formatFileSize(Number(file.size || 0))}</p>
                                            <div className="mt-2 flex flex-wrap gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => selectFile(file.path)}
                                                    className="rounded-full border border-jv-accent-line px-2.5 py-1 text-[11px] font-semibold text-[#dbe7ff] transition hover:bg-jv-accent/15 hover:text-white"
                                                >
                                                    Use
                                                </button>
                                                {canCropImage(file.path, file.extension) && (
                                                    <button
                                                        type="button"
                                                        onClick={() => cropAndSelectFile(file)}
                                                        className="rounded-full border border-jv-line-strong px-2.5 py-1 text-[11px] font-semibold text-white/60 transition hover:bg-white/[0.08] hover:text-white"
                                                    >
                                                        Crop &amp; Use
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}

function GalleryFields({
    form,
    className = '',
    uploadStatus,
    cropAspect = 'free',
    onChangeCropAspect,
    onUpload,
    onOpenMediaSelector,
}) {
    return (
        <div className={`space-y-6 ${className}`}>
            {/* ── Details ── */}
            <fieldset className="space-y-4">
                <legend className="flex items-center gap-2 pb-1 text-xs font-semibold uppercase tracking-[0.14em] text-white/40">
                    <Info className="h-3.5 w-3.5 text-jv-accent" />
                    Project details
                </legend>

                <div className="grid gap-4 md:grid-cols-2">
                    <Field
                        label="Title"
                        error={form.errors.title}
                        icon={FileText}
                        className="md:col-span-2"
                    >
                        <Input
                            type="text"
                            value={form.data.title}
                            onChange={(event) => form.setData('title', event.target.value)}
                            placeholder="e.g. SavingsBOX — Floating the Naira campaign"
                            required
                        />
                    </Field>

                    <Field label="Category" error={form.errors.category} icon={Tag}>
                        <Input
                            type="text"
                            value={form.data.category}
                            onChange={(event) => form.setData('category', event.target.value)}
                            placeholder="Social Media Design"
                        />
                    </Field>

                    <Field
                        label="Position"
                        error={form.errors.position}
                        icon={ArrowUpDown}
                        hint="Lower numbers appear first on the public gallery."
                    >
                        <Input
                            type="number"
                            min={0}
                            value={form.data.position}
                            onChange={(event) => form.setData('position', event.target.value)}
                        />
                    </Field>

                    <Field
                        label="Description"
                        error={form.errors.description}
                        icon={AlignLeft}
                        className="md:col-span-2"
                    >
                        <Textarea
                            rows={3}
                            value={form.data.description}
                            onChange={(event) => form.setData('description', event.target.value)}
                            placeholder="What was the brief, and what did we deliver?"
                        />
                    </Field>
                </div>
            </fieldset>

            {/* ── Media ── */}
            <fieldset className="space-y-4 border-t border-jv-line pt-6">
                <legend className="flex items-center gap-2 pb-1 text-xs font-semibold uppercase tracking-[0.14em] text-white/40">
                    <ImageIcon className="h-3.5 w-3.5 text-jv-accent" />
                    Project image
                </legend>

                <ImageUploadField
                    imagePath={form.data.image_path}
                    uploadStatus={uploadStatus}
                    cropAspect={cropAspect}
                    onChangeCropAspect={onChangeCropAspect}
                    onUpload={onUpload}
                    onOpenMediaSelector={onOpenMediaSelector}
                    onClear={() => form.setData('image_path', '')}
                />

                {form.errors.image_path ? (
                    <p className="flex items-center gap-1.5 text-xs text-red-300">
                        <TriangleAlert className="h-3.5 w-3.5" />
                        {form.errors.image_path}
                    </p>
                ) : null}
            </fieldset>

            {/* ── Publishing ── */}
            <fieldset className="space-y-4 border-t border-jv-line pt-6">
                <legend className="flex items-center gap-2 pb-1 text-xs font-semibold uppercase tracking-[0.14em] text-white/40">
                    <Globe className="h-3.5 w-3.5 text-jv-accent" />
                    Publishing
                </legend>

                <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Project URL" error={form.errors.project_url} icon={LinkIcon}>
                        <Input
                            type="text"
                            value={form.data.project_url}
                            onChange={(event) => form.setData('project_url', event.target.value)}
                            placeholder="https://example.com"
                        />
                    </Field>

                    <Field label="Visibility" error={form.errors.is_published} icon={Eye}>
                        <label className="flex cursor-pointer items-center gap-3 rounded-jv-sm border border-jv-line-strong bg-white/[0.04] px-3 py-2.5 text-sm font-medium text-white/75 transition hover:bg-white/[0.07]">
                            <input
                                type="checkbox"
                                checked={Boolean(form.data.is_published)}
                                onChange={(event) => form.setData('is_published', event.target.checked)}
                                className="h-4 w-4 rounded border-jv-line-strong bg-white/[0.06] text-jv-accent accent-jv-accent focus:ring-jv-accent/40"
                            />
                            Visible on the public gallery
                        </label>
                    </Field>
                </div>
            </fieldset>
        </div>
    );
}

function ImageUploadField({
    imagePath,
    uploadStatus,
    cropAspect = 'free',
    onChangeCropAspect,
    onUpload,
    onOpenMediaSelector,
    onClear,
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

    return (
        <div className="space-y-3">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
                {/* Drop zone + actions */}
                <div
                    className={`flex flex-col items-center justify-center gap-3 rounded-jv border-2 border-dashed px-6 py-8 text-center transition ${
                        dragging
                            ? 'border-jv-accent bg-jv-accent/10'
                            : 'border-jv-line-strong bg-white/[0.03] hover:border-jv-accent-line'
                    }`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    <span
                        className={`inline-flex h-12 w-12 items-center justify-center rounded-full border transition ${
                            dragging
                                ? 'border-jv-accent bg-jv-accent/20 text-jv-accent'
                                : 'border-jv-line-strong bg-white/[0.06] text-white/50'
                        }`}
                    >
                        <CloudUpload className="h-6 w-6" />
                    </span>

                    <div>
                        <p className="text-sm font-semibold text-white">
                            {dragging ? 'Drop to upload' : 'Drag and drop an image here'}
                        </p>
                        <p className="mt-1 text-xs text-white/45">
                            JPG, PNG, WebP, AVIF or GIF. Large images are resized and served in modern formats automatically.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-2">
                        <button
                            type="button"
                            onClick={() => inputRef.current?.click()}
                            disabled={uploadStatus?.uploading}
                            className="jv-btn jv-btn--primary jv-btn--sm disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {uploadStatus?.uploading ? (
                                <>
                                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                    Uploading…
                                </>
                            ) : (
                                <>
                                    <Upload className="h-3.5 w-3.5" />
                                    Upload image
                                </>
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={onOpenMediaSelector}
                            className="jv-btn jv-btn--ghost jv-btn--sm"
                        >
                            <ImageIcon className="h-3.5 w-3.5" />
                            Media library
                        </button>
                        {imagePath ? (
                            <button
                                type="button"
                                onClick={onClear}
                                className="jv-btn jv-btn--sm border border-red-500/40 text-red-300 transition hover:bg-red-500/10 hover:text-red-200"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                                Clear
                            </button>
                        ) : null}
                    </div>

                    <label className="flex items-center gap-2 text-xs text-white/50">
                        <Crop className="h-3.5 w-3.5 text-white/35" />
                        Crop on upload
                        <select
                            value={cropAspect}
                            onChange={(event) => onChangeCropAspect?.(event.target.value)}
                            className="jv-select w-auto text-xs font-semibold"
                        >
                            {cropAspectOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </label>
                </div>

                {/* Live preview */}
                <div className="rounded-jv border border-jv-line bg-white/[0.03] p-3">
                    <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-white/45">
                        <Eye className="h-3.5 w-3.5" />
                        Current selection
                    </p>
                    <div className="mt-2.5">
                        <PreviewImage path={imagePath} title="Selected project image" compact />
                    </div>
                    {imagePath ? (
                        <div className="mt-2.5 space-y-1.5">
                            <p className="break-all font-mono text-[11px] leading-4 text-white/40">{imagePath}</p>
                            <Link
                                href={imagePath}
                                external
                                className="inline-flex items-center gap-1.5 text-xs font-semibold text-jv-accent transition hover:text-[#5c93ff]"
                            >
                                <ExternalLink className="h-3.5 w-3.5" />
                                Open full size
                            </Link>
                        </div>
                    ) : (
                        <p className="mt-2.5 text-xs text-white/45">No image selected yet.</p>
                    )}
                </div>
            </div>

            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                        onUpload(file);
                    }
                    event.target.value = '';
                }}
            />

            {uploadStatus?.error && (
                <p className="flex items-center gap-1.5 text-xs text-red-300">
                    <TriangleAlert className="h-3.5 w-3.5" />
                    {uploadStatus.error}
                </p>
            )}
        </div>
    );
}

function Field({ label, error, className = '', icon: Icon = null, hint = '', children }) {
    return (
        <div className={className}>
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-white/65">
                {Icon ? <Icon className="h-3.5 w-3.5 text-white/35" /> : null}
                {label}
            </label>
            {children}
            {hint && !error ? <p className="mt-1 text-xs text-white/40">{hint}</p> : null}
            {error && (
                <p className="mt-1 flex items-center gap-1.5 text-xs text-red-300">
                    <TriangleAlert className="h-3.5 w-3.5" />
                    {error}
                </p>
            )}
        </div>
    );
}

function PreviewImage({ path, title, compact = false }) {
    const src = imageSrc(path);
    const dimensions = compact ? 'aspect-[4/3] w-full' : 'aspect-[4/3] w-full lg:w-44';

    if (!src) {
        return (
            <div
                className={`flex ${dimensions} flex-col items-center justify-center gap-2 rounded-jv-sm border border-dashed border-jv-line-strong bg-white/[0.03]`}
            >
                <ImageIcon className="h-6 w-6 text-white/25" />
                <span className="text-xs font-semibold text-white/30">No image yet</span>
            </div>
        );
    }

    return (
        <FastImage
            src={src}
            alt={title}
            sizes={compact ? '(min-width: 1024px) 320px, 100vw' : '180px'}
            className={`${dimensions} rounded-jv-sm border border-jv-line object-cover`}
        />
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
