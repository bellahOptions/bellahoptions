import RichTextEditor from '@/Components/RichTextEditor';
import { Card } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Textarea } from '@/Components/ui/textarea';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { useState } from 'react';

const emptyPost = {
    title: '',
    slug: '',
    category: '',
    excerpt: '',
    body: '',
    cover_image: '',
    author_name: 'Bellah Options',
    published_at: '',
    position: 0,
    is_published: true,
};

const quillModules = {
    toolbar: [
        [{ header: [2, 3, 4, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['blockquote', 'link'],
        ['clean'],
    ],
};

const quillFormats = [
    'header',
    'bold',
    'italic',
    'underline',
    'strike',
    'list',
    'bullet',
    'blockquote',
    'link',
];

function imageSrc(path) {
    if (!path) {
        return '';
    }

    if (/^https?:\/\//i.test(path)) {
        return path;
    }

    return path.startsWith('/') ? path : `/${path}`;
}

export default function BlogAdmin({ items = [] }) {
    const { flash } = usePage().props;
    const [editingId, setEditingId] = useState(null);
    const createForm = useForm(emptyPost);
    const editForm = useForm(emptyPost);

    const submitCreate = (event) => {
        event.preventDefault();

        createForm.post(route('admin.blog.store'), {
            preserveScroll: true,
            onSuccess: () => {
                createForm.reset();
                createForm.setData('author_name', 'Bellah Options');
                createForm.setData('position', 0);
                createForm.setData('is_published', true);
            },
        });
    };

    const startEditing = (item) => {
        setEditingId(item.id);
        editForm.clearErrors();
        editForm.setData({
            title: item.title || '',
            slug: item.slug || '',
            category: item.category || '',
            excerpt: item.excerpt || '',
            body: item.body || '',
            cover_image: item.cover_image || '',
            author_name: item.author_name || 'Bellah Options',
            published_at: item.published_at ? String(item.published_at).slice(0, 16) : '',
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

        editForm.put(route('admin.blog.update', item.id), {
            preserveScroll: true,
            onSuccess: cancelEditing,
        });
    };

    const deleteItem = (item) => {
        if (!window.confirm(`Delete "${item.title}"?`)) {
            return;
        }

        router.delete(route('admin.blog.destroy', item.id), {
            preserveScroll: true,
        });
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold leading-tight tracking-tight text-white">Manage Blog</h2>}
        >
            <Head title="Manage Blog" />

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
                                    <h3 className="text-lg font-semibold tracking-tight text-white">Add New Post</h3>
                                    <p className="text-sm text-white/55">Use the rich editor to preserve headings, lists, links, and spacing.</p>
                                </div>
                                <button
                                    type="submit"
                                    disabled={createForm.processing}
                                    className="jv-btn jv-btn--primary mt-3 disabled:cursor-not-allowed disabled:opacity-60 sm:mt-0"
                                >
                                    {createForm.processing ? 'Saving...' : 'Add Post'}
                                </button>
                            </div>

                            <BlogFields form={createForm} className="mt-5" />
                        </Card>
                    </form>

                    <Card className="overflow-hidden p-0">
                        <div className="border-b border-jv-line px-6 py-4">
                            <h3 className="text-lg font-semibold tracking-tight text-white">Current Posts</h3>
                            <p className="text-sm text-white/55">Published posts are visible on the public blog.</p>
                        </div>

                        <div className="divide-y divide-jv-line/70">
                            {items.length === 0 && (
                                <div className="px-6 py-10 text-sm text-white/45">No posts yet.</div>
                            )}

                            {items.map((item) => {
                                const isEditing = editingId === item.id;

                                return (
                                    <div key={item.id} className="p-6">
                                        {isEditing ? (
                                            <form onSubmit={(event) => submitUpdate(event, item)} className="space-y-5">
                                                <BlogFields form={editForm} />
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
                                                <PreviewImage path={item.cover_image} title={item.title} />
                                                <div>
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <h4 className="text-base font-semibold text-white">{item.title}</h4>
                                                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${item.is_published ? 'bg-emerald-500/15 text-emerald-300' : 'bg-white/[0.07] text-white/60'}`}>
                                                            {item.is_published ? 'Published' : 'Draft'}
                                                        </span>
                                                    </div>
                                                    <p className="mt-2 text-sm leading-6 text-white/55">
                                                        {item.excerpt || 'No excerpt yet.'}
                                                    </p>
                                                    <dl className="mt-3 grid gap-1 text-xs text-white/45 sm:grid-cols-2">
                                                        <div>
                                                            <dt className="inline font-semibold text-white/60">Slug: </dt>
                                                            <dd className="inline break-all">{item.slug || 'None'}</dd>
                                                        </div>
                                                        <div>
                                                            <dt className="inline font-semibold text-white/60">Category: </dt>
                                                            <dd className="inline break-all">{item.category || 'None'}</dd>
                                                        </div>
                                                        <div>
                                                            <dt className="inline font-semibold text-white/60">Author: </dt>
                                                            <dd className="inline break-all">{item.author_name || 'None'}</dd>
                                                        </div>
                                                        <div>
                                                            <dt className="inline font-semibold text-white/60">Published At: </dt>
                                                            <dd className="inline break-all">{item.published_at || 'None'}</dd>
                                                        </div>
                                                    </dl>
                                                </div>
                                                <div className="flex gap-2 lg:flex-col">
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

function BlogFields({ form, className = '' }) {
    return (
        <div className={`grid gap-4 md:grid-cols-2 ${className}`}>
            <Field label="Title" error={form.errors.title} className="md:col-span-2">
                <Input
                    type="text"
                    value={form.data.title}
                    onChange={(event) => form.setData('title', event.target.value)}
                    required
                />
            </Field>

            <Field label="Slug" error={form.errors.slug}>
                <Input
                    type="text"
                    value={form.data.slug}
                    onChange={(event) => form.setData('slug', event.target.value)}
                    placeholder="leave blank to auto-generate"
                />
            </Field>

            <Field label="Category" error={form.errors.category}>
                <Input
                    type="text"
                    value={form.data.category}
                    onChange={(event) => form.setData('category', event.target.value)}
                />
            </Field>

            <Field label="Excerpt" error={form.errors.excerpt} className="md:col-span-2">
                <Textarea
                    rows={2}
                    value={form.data.excerpt}
                    onChange={(event) => form.setData('excerpt', event.target.value)}
                />
            </Field>

            <Field label="Post Body" error={form.errors.body} className="md:col-span-2">
                <div className="overflow-hidden rounded-jv-sm border border-jv-line-strong bg-white/[0.03] focus-within:border-jv-accent">
                    <RichTextEditor
                        value={form.data.body || ''}
                        onChange={(value) => form.setData('body', value)}
                        modules={quillModules}
                        formats={quillFormats}
                        placeholder="Write post content with formatting..."
                        className="min-h-[280px]"
                    />
                </div>
            </Field>

            <Field label="Cover Image URL or Public Path" error={form.errors.cover_image}>
                <Input
                    type="text"
                    value={form.data.cover_image}
                    onChange={(event) => form.setData('cover_image', event.target.value)}
                    placeholder="/images/blog-cover.jpg"
                />
            </Field>

            <Field label="Author Name" error={form.errors.author_name}>
                <Input
                    type="text"
                    value={form.data.author_name}
                    onChange={(event) => form.setData('author_name', event.target.value)}
                />
            </Field>

            <Field label="Published At" error={form.errors.published_at}>
                <Input
                    type="datetime-local"
                    value={form.data.published_at || ''}
                    onChange={(event) => form.setData('published_at', event.target.value)}
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

function PreviewImage({ path, title }) {
    const src = imageSrc(path);

    if (!src) {
        return (
            <div className="flex h-32 w-full items-center justify-center rounded-jv-sm border border-jv-line bg-white/[0.03] text-xs font-semibold text-white/30 lg:w-44">
                No Image
            </div>
        );
    }

    return (
        <img
            src={src}
            alt={title}
            className="h-32 w-full rounded-jv-sm border border-jv-line object-cover lg:w-44"
        />
    );
}
