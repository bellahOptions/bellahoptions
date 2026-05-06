import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';

const emptyFaq = {
    question: '',
    answer: '',
    category: '',
    position: 0,
    is_published: true,
};

export default function FaqAdmin({ items = [] }) {
    const { flash } = usePage().props;
    const [editingId, setEditingId] = useState(null);
    const createForm = useForm(emptyFaq);
    const editForm = useForm(emptyFaq);

    const submitCreate = (event) => {
        event.preventDefault();

        createForm.post(route('admin.faqs.store'), {
            preserveScroll: true,
            onSuccess: () => {
                createForm.reset();
                createForm.setData('position', 0);
                createForm.setData('is_published', true);
            },
        });
    };

    const startEditing = (item) => {
        setEditingId(item.id);
        editForm.clearErrors();
        editForm.setData({
            question: item.question || '',
            answer: item.answer || '',
            category: item.category || '',
            position: Number(item.position || 0),
            is_published: Boolean(item.is_published),
        });
    };

    const cancelEditing = () => {
        setEditingId(null);
        editForm.clearErrors();
        editForm.reset();
    };

    const submitUpdate = (event, item) => {
        event.preventDefault();

        editForm.put(route('admin.faqs.update', item.id), {
            preserveScroll: true,
            onSuccess: cancelEditing,
        });
    };

    const deleteItem = (item) => {
        if (!window.confirm(`Delete FAQ: "${item.question}"?`)) {
            return;
        }

        router.delete(route('admin.faqs.destroy', item.id), {
            preserveScroll: true,
        });
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Manage FAQs</h2>}
        >
            <Head title="Manage FAQs" />

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
                                <h3 className="text-lg font-semibold text-gray-900">Add FAQ</h3>
                                <p className="text-sm text-gray-600">Create frequently asked questions for the public FAQ page.</p>
                            </div>
                            <button
                                type="submit"
                                disabled={createForm.processing}
                                className="mt-3 inline-flex items-center justify-center rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60 sm:mt-0"
                            >
                                {createForm.processing ? 'Saving...' : 'Add FAQ'}
                            </button>
                        </div>

                        <FaqFields form={createForm} className="mt-5" />
                    </form>

                    <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
                        <div className="border-b border-gray-200 px-6 py-4">
                            <h3 className="text-lg font-semibold text-gray-900">Current FAQs</h3>
                            <p className="text-sm text-gray-600">Published FAQs appear on the public page.</p>
                        </div>

                        <div className="divide-y divide-gray-100">
                            {items.length === 0 && (
                                <div className="px-6 py-10 text-sm text-gray-500">No FAQs yet.</div>
                            )}

                            {items.map((item) => {
                                const isEditing = editingId === item.id;

                                return (
                                    <div key={item.id} className="p-6">
                                        {isEditing ? (
                                            <form onSubmit={(event) => submitUpdate(event, item)} className="space-y-5">
                                                <FaqFields form={editForm} />
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
                                            <div className="space-y-3">
                                                <div className="flex flex-wrap items-start justify-between gap-3">
                                                    <div>
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <h4 className="text-base font-semibold text-gray-900">{item.question}</h4>
                                                            <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${item.is_published ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                                                                {item.is_published ? 'Published' : 'Draft'}
                                                            </span>
                                                        </div>
                                                        {item.category && (
                                                            <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-[#000285]">
                                                                {item.category}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="flex gap-2">
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
                                                <p className="text-sm leading-7 text-gray-600 whitespace-pre-line">{item.answer}</p>
                                                <p className="text-xs text-gray-500">Position: {item.position ?? 0}</p>
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

function FaqFields({ form, className = '' }) {
    return (
        <div className={`grid gap-4 md:grid-cols-2 ${className}`}>
            <Field label="Question" error={form.errors.question} className="md:col-span-2">
                <input
                    type="text"
                    value={form.data.question}
                    onChange={(event) => form.setData('question', event.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    required
                />
            </Field>

            <Field label="Answer" error={form.errors.answer} className="md:col-span-2">
                <textarea
                    rows={4}
                    value={form.data.answer}
                    onChange={(event) => form.setData('answer', event.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    required
                />
            </Field>

            <Field label="Category" error={form.errors.category}>
                <input
                    type="text"
                    value={form.data.category}
                    onChange={(event) => form.setData('category', event.target.value)}
                    placeholder="General"
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

function Field({ label, error, className = '', children }) {
    return (
        <div className={className}>
            <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
            {children}
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
    );
}
