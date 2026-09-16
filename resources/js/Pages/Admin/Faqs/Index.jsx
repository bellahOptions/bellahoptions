import { Card } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Textarea } from '@/Components/ui/textarea';
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
            header={<h2 className="text-xl font-semibold leading-tight tracking-tight text-white">Manage FAQs</h2>}
        >
            <Head title="Manage FAQs" />

            <div className="py-10">
                <div className="mx-auto max-w-6xl space-y-6 px-4 sm:px-6 lg:px-8">
                    {flash?.success && (
                        <div className="rounded-jv-sm border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                            {flash.success}
                        </div>
                    )}

                    {flash?.error && (
                        <div className="rounded-jv-sm border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                            {flash.error}
                        </div>
                    )}

                    <form onSubmit={submitCreate}>
                        <Card>
                            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <h3 className="text-lg font-semibold tracking-tight text-white">Add FAQ</h3>
                                    <p className="text-sm text-white/55">Create frequently asked questions for the public FAQ page.</p>
                                </div>
                                <button
                                    type="submit"
                                    disabled={createForm.processing}
                                    className="jv-btn jv-btn--primary mt-3 disabled:cursor-not-allowed disabled:opacity-60 sm:mt-0"
                                >
                                    {createForm.processing ? 'Saving...' : 'Add FAQ'}
                                </button>
                            </div>

                            <FaqFields form={createForm} className="mt-5" />
                        </Card>
                    </form>

                    <Card className="overflow-hidden p-0">
                        <div className="border-b border-jv-line px-6 py-4">
                            <h3 className="text-lg font-semibold tracking-tight text-white">Current FAQs</h3>
                            <p className="text-sm text-white/55">Published FAQs appear on the public page.</p>
                        </div>

                        <div className="divide-y divide-jv-line/70">
                            {items.length === 0 && (
                                <div className="px-6 py-10 text-sm text-white/45">No FAQs yet.</div>
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
                                            <div className="space-y-3">
                                                <div className="flex flex-wrap items-start justify-between gap-3">
                                                    <div>
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <h4 className="text-base font-semibold text-white">{item.question}</h4>
                                                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${item.is_published ? 'bg-emerald-500/15 text-emerald-300' : 'bg-white/[0.07] text-white/60'}`}>
                                                                {item.is_published ? 'Published' : 'Draft'}
                                                            </span>
                                                        </div>
                                                        {item.category && (
                                                            <p className="jv-mono mt-1.5 text-jv-accent">
                                                                {item.category}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => startEditing(item)}
                                                            className="jv-btn jv-btn--outline jv-btn--sm"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => deleteItem(item)}
                                                            className="rounded-full border border-red-500/40 px-4 py-2 text-xs font-semibold text-red-300 transition hover:bg-red-500/10 hover:text-red-200"
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </div>
                                                <p className="whitespace-pre-line text-sm leading-7 text-white/55">{item.answer}</p>
                                                <p className="text-xs text-white/45">Position: {item.position ?? 0}</p>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </Card>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function FaqFields({ form, className = '' }) {
    return (
        <div className={`grid gap-4 md:grid-cols-2 ${className}`}>
            <Field label="Question" error={form.errors.question} className="md:col-span-2">
                <Input
                    type="text"
                    value={form.data.question}
                    onChange={(event) => form.setData('question', event.target.value)}
                    required
                />
            </Field>

            <Field label="Answer" error={form.errors.answer} className="md:col-span-2">
                <Textarea
                    rows={4}
                    value={form.data.answer}
                    onChange={(event) => form.setData('answer', event.target.value)}
                    required
                />
            </Field>

            <Field label="Category" error={form.errors.category}>
                <Input
                    type="text"
                    value={form.data.category}
                    onChange={(event) => form.setData('category', event.target.value)}
                    placeholder="General"
                />
            </Field>

            <Field label="Position" error={form.errors.position}>
                <Input
                    type="number"
                    min={0}
                    value={form.data.position}
                    onChange={(event) => form.setData('position', event.target.value)}
                />
            </Field>

            <Field label="Published" error={form.errors.is_published} className="md:col-span-2">
                <label className="inline-flex items-center gap-2 text-sm font-medium text-white/70">
                    <input
                        type="checkbox"
                        checked={Boolean(form.data.is_published)}
                        onChange={(event) => form.setData('is_published', event.target.checked)}
                        className="h-4 w-4 rounded border-jv-line-strong bg-white/[0.06] text-jv-accent accent-jv-accent focus:ring-jv-accent/40"
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
            <label className="mb-1.5 block text-sm font-medium text-white/65">{label}</label>
            {children}
            {error && <p className="mt-1 text-xs text-red-300">{error}</p>}
        </div>
    );
}
