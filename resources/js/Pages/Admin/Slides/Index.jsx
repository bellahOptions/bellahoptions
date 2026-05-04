import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';

const emptySlide = {
    slide_title: '',
    text: '',
    slide_image: '',
    slide_link: '',
    slide_link_text: '',
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

export default function Slides({ slideShows = [] }) {
    const { flash } = usePage().props;
    const [editingSlideId, setEditingSlideId] = useState(null);

    const createForm = useForm(emptySlide);
    const editForm = useForm(emptySlide);

    const submitCreate = (event) => {
        event.preventDefault();

        createForm.post(route('admin.slides.store'), {
            preserveScroll: true,
            onSuccess: () => createForm.reset(),
        });
    };

    const startEditing = (slide) => {
        setEditingSlideId(slide.id);
        editForm.clearErrors();
        editForm.setData({
            slide_title: slide.slide_title || '',
            text: slide.text || '',
            slide_image: slide.slide_image || '',
            slide_link: slide.slide_link || '',
            slide_link_text: slide.slide_link_text || '',
        });
    };

    const cancelEditing = () => {
        setEditingSlideId(null);
        editForm.clearErrors();
        editForm.reset();
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
                                    These slides are pulled from the database on the Welcome page.
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

                        <SlideFields form={createForm} className="mt-5" />
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
                                    No database slides yet. The Welcome page will use its fallback slides until you add one.
                                </div>
                            )}

                            {slideShows.map((slide) => {
                                const isEditing = editingSlideId === slide.id;

                                return (
                                    <div key={slide.id} className="p-6">
                                        {isEditing ? (
                                            <form onSubmit={(event) => submitUpdate(event, slide)} className="space-y-5">
                                                <SlideFields form={editForm} />
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
                                                <img
                                                    src={slideImageSrc(slide.slide_image)}
                                                    alt={slide.slide_title}
                                                    className="h-36 w-full rounded-md border border-gray-200 object-cover lg:w-56"
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
                                                            <dd className="inline break-all">{slide.slide_image}</dd>
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
        </AuthenticatedLayout>
    );
}

function SlideFields({ form, className = '' }) {
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

            <Field label="Image URL or Public Path" error={form.errors.slide_image}>
                <input
                    type="text"
                    value={form.data.slide_image}
                    onChange={(event) => form.setData('slide_image', event.target.value)}
                    placeholder="/images/welcome-slide.jpg"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    required
                />
            </Field>

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
