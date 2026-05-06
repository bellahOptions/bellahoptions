import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import Modal from '@/Components/Modal';
import { Head, router, useForm, usePage } from '@inertiajs/react';
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

export default function GalleryAdmin({ items = [], mediaLibrary = null }) {
    const { flash } = usePage().props;
    const [editingId, setEditingId] = useState(null);
    const [mediaFiles, setMediaFiles] = useState(Array.isArray(mediaLibrary?.files) ? mediaLibrary.files : []);
    const [mediaLoading, setMediaLoading] = useState(false);
    const [mediaError, setMediaError] = useState('');
    const [selectorOpen, setSelectorOpen] = useState(false);
    const [selectorTarget, setSelectorTarget] = useState('create');
    const [selectorSearch, setSelectorSearch] = useState('');
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

    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Manage Gallery</h2>}
        >
            <Head title="Manage Gallery" />

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
                                <h3 className="text-lg font-semibold text-gray-900">Add Project</h3>
                                <p className="text-sm text-gray-600">
                                    Use drag-and-drop upload or choose an existing public image from media selector.
                                </p>
                            </div>
                            <button
                                type="submit"
                                disabled={createForm.processing}
                                className="mt-3 inline-flex items-center justify-center rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60 sm:mt-0"
                            >
                                {createForm.processing ? 'Saving...' : 'Add Project'}
                            </button>
                        </div>

                        <GalleryFields
                            form={createForm}
                            className="mt-5"
                            uploadStatus={uploadState.create}
                            onUpload={(file) => uploadImage('create', file)}
                            onOpenMediaSelector={() => openMediaSelector('create')}
                        />
                    </form>

                    <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
                        <div className="border-b border-gray-200 px-6 py-4">
                            <h3 className="text-lg font-semibold text-gray-900">Current Items</h3>
                            <p className="text-sm text-gray-600">Published projects are visible on the public gallery.</p>
                        </div>

                        <div className="divide-y divide-gray-100">
                            {items.length === 0 && (
                                <div className="px-6 py-10 text-sm text-gray-500">No projects yet.</div>
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
                                                    onUpload={(file) => uploadImage('edit', file)}
                                                    onOpenMediaSelector={() => openMediaSelector('edit')}
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
                                            <div className="grid gap-5 lg:grid-cols-[180px_1fr_auto]">
                                                <PreviewImage path={item.image_path} title={item.title} />
                                                <div>
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <h4 className="text-base font-semibold text-gray-900">{item.title}</h4>
                                                        <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${item.is_published ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                                                            {item.is_published ? 'Published' : 'Draft'}
                                                        </span>
                                                    </div>
                                                    <p className="mt-2 text-sm leading-6 text-gray-600">
                                                        {item.description || 'No description yet.'}
                                                    </p>
                                                    <dl className="mt-3 grid gap-1 text-xs text-gray-500 sm:grid-cols-2">
                                                        <div>
                                                            <dt className="inline font-semibold">Category: </dt>
                                                            <dd className="inline break-all">{item.category || 'None'}</dd>
                                                        </div>
                                                        <div>
                                                            <dt className="inline font-semibold">Position: </dt>
                                                            <dd className="inline break-all">{String(item.position ?? 0)}</dd>
                                                        </div>
                                                        <div>
                                                            <dt className="inline font-semibold">Image: </dt>
                                                            <dd className="inline break-all">{item.image_path || 'None'}</dd>
                                                        </div>
                                                        <div>
                                                            <dt className="inline font-semibold">Project URL: </dt>
                                                            <dd className="inline break-all">{item.project_url || 'None'}</dd>
                                                        </div>
                                                    </dl>
                                                </div>
                                                <div className="flex gap-2 lg:flex-col">
                                                    <button
                                                        type="button"
                                                        onClick={() => startEditing(item)}
                                                        className="rounded-md border border-blue-200 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => deleteItem(item)}
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
                            <p className="text-sm text-gray-600">Pick any image from the public directory.</p>
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
                        <input
                            type="text"
                            value={selectorSearch}
                            onChange={(event) => setSelectorSearch(event.target.value)}
                            placeholder="Search media by file name or path"
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none sm:w-auto sm:flex-1"
                        />
                        <button
                            type="button"
                            onClick={refreshMediaLibrary}
                            disabled={mediaLoading}
                            className="rounded-md border border-blue-200 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {mediaLoading ? 'Refreshing...' : 'Refresh'}
                        </button>
                    </div>

                    {mediaError && <p className="text-xs text-red-600">{mediaError}</p>}

                    <div className="max-h-[60vh] overflow-y-auto rounded-md border border-gray-200 p-3">
                        {filteredFiles.length === 0 ? (
                            <p className="text-sm text-gray-500">No matching files found.</p>
                        ) : (
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {filteredFiles.map((file) => (
                                    <button
                                        key={file.path}
                                        type="button"
                                        onClick={() => selectFile(file.path)}
                                        className="group overflow-hidden rounded-md border border-gray-200 text-left transition hover:border-blue-400 hover:shadow-sm"
                                    >
                                        <div className="h-28 w-full overflow-hidden bg-gray-50">
                                            <img
                                                src={imageSrc(file.preview_url || file.path)}
                                                alt={file.name || file.path}
                                                className="h-full w-full object-cover"
                                            />
                                        </div>
                                        <div className="space-y-1 p-2">
                                            <p className="truncate text-xs font-semibold text-gray-900">{file.name}</p>
                                            <p className="truncate text-[11px] text-gray-500">{file.path}</p>
                                            <p className="text-[11px] text-gray-500">{formatFileSize(Number(file.size || 0))}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </Modal>
        </AuthenticatedLayout>
    );
}

function GalleryFields({ form, className = '', uploadStatus, onUpload, onOpenMediaSelector }) {
    return (
        <div className={`grid gap-4 md:grid-cols-2 ${className}`}>
            <Field label="Title" error={form.errors.title} className="md:col-span-2">
                <input
                    type="text"
                    value={form.data.title}
                    onChange={(event) => form.setData('title', event.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    required
                />
            </Field>

            <Field label="Category" error={form.errors.category}>
                <input
                    type="text"
                    value={form.data.category}
                    onChange={(event) => form.setData('category', event.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
            </Field>

            <Field label="Position" error={form.errors.position}>
                <input
                    type="number"
                    min={0}
                    value={form.data.position}
                    onChange={(event) => form.setData('position', event.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
            </Field>

            <Field label="Description" error={form.errors.description} className="md:col-span-2">
                <textarea
                    rows={3}
                    value={form.data.description}
                    onChange={(event) => form.setData('description', event.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
            </Field>

            <Field label="Project Image" error={form.errors.image_path} className="md:col-span-2">
                <ImageUploadField
                    imagePath={form.data.image_path}
                    uploadStatus={uploadStatus}
                    onUpload={onUpload}
                    onOpenMediaSelector={onOpenMediaSelector}
                    onClear={() => form.setData('image_path', '')}
                />
            </Field>

            <Field label="Image URL or Public Path" error={form.errors.image_path}>
                <input
                    type="text"
                    value={form.data.image_path}
                    onChange={(event) => form.setData('image_path', event.target.value)}
                    placeholder="/images/sample.jpg"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    required
                />
            </Field>

            <Field label="Project URL" error={form.errors.project_url}>
                <input
                    type="text"
                    value={form.data.project_url}
                    onChange={(event) => form.setData('project_url', event.target.value)}
                    placeholder="https://example.com"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
            </Field>

            <Field label="Published" error={form.errors.is_published} className="md:col-span-2">
                <label className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <input
                        type="checkbox"
                        checked={Boolean(form.data.is_published)}
                        onChange={(event) => form.setData('is_published', event.target.checked)}
                        className="rounded border-gray-300 text-blue-700 focus:ring-blue-500"
                    />
                    Visible on public website
                </label>
            </Field>
        </div>
    );
}

function ImageUploadField({ imagePath, uploadStatus, onUpload, onOpenMediaSelector, onClear }) {
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
            <div
                className={`rounded-md border-2 border-dashed p-4 transition ${dragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-gray-700">Drag and drop an image here, or upload/select one.</p>
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => inputRef.current?.click()}
                            disabled={uploadStatus?.uploading}
                            className="rounded-md bg-blue-700 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {uploadStatus?.uploading ? 'Uploading...' : 'Upload Image'}
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
                            onClick={onClear}
                            className="rounded-md border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
                        >
                            Clear
                        </button>
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
            </div>

            {uploadStatus?.error && <p className="text-xs text-red-600">{uploadStatus.error}</p>}

            <div className="rounded-md border border-gray-200 bg-white p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">Current selection</p>
                <PreviewImage path={imagePath} title="Selected project image" compact />
                {imagePath ? (
                    <p className="mt-2 break-all text-xs text-gray-500">Image path: {imagePath}</p>
                ) : (
                    <p className="mt-2 text-xs text-gray-500">No image selected.</p>
                )}
            </div>
        </div>
    );
}

function Field({ label, error, className = '', children }) {
    return (
        <div className={className}>
            <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
            {children}
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
    );
}

function PreviewImage({ path, title, compact = false }) {
    const src = imageSrc(path);

    if (!src) {
        return (
            <div className={`flex ${compact ? 'h-36 w-full' : 'h-32 w-full lg:w-44'} items-center justify-center rounded-md border border-gray-200 bg-gray-50 text-xs font-semibold text-gray-400`}>
                No Image
            </div>
        );
    }

    return (
        <img
            src={src}
            alt={title}
            className={`${compact ? 'h-36 w-full' : 'h-32 w-full lg:w-44'} rounded-md border border-gray-200 object-cover`}
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
