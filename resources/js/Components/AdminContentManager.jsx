import { Card } from "@/Components/ui/card";
import { Input } from "@/Components/ui/input";
import { Textarea } from "@/Components/ui/textarea";
import AuthenticatedLayout from "@/Layouts/AuthenticatedLayout";
import { Head, router, useForm, usePage } from "@inertiajs/react";
import { useState } from "react";

function initialData(fields) {
    return fields.reduce((data, field) => ({
        ...data,
        [field.name]:
            field.type === "checkbox"
                ? field.defaultValue ?? true
                : field.type === "file"
                    ? null
                    : field.defaultValue ?? "",
    }), {});
}

export default function AdminContentManager({ title, description, routeBase, fields, items = [], previewField = "image_path" }) {
    const { flash } = usePage().props;
    const [editingId, setEditingId] = useState(null);
    const blank = initialData(fields);
    const createForm = useForm(blank);
    const editForm = useForm(blank);

    const submitCreate = (event) => {
        event.preventDefault();

        createForm.post(route(`${routeBase}.store`), {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => createForm.reset(),
        });
    };

    const startEditing = (item) => {
        setEditingId(item.id);
        editForm.clearErrors();
        editForm.setData(fields.reduce((data, field) => ({
            ...data,
            [field.name]: field.type === "file" ? null : normalizeValue(item[field.name], field),
        }), {}));
    };

    const cancelEditing = () => {
        setEditingId(null);
        editForm.clearErrors();
        editForm.reset();
    };

    const submitUpdate = (event, item) => {
        event.preventDefault();

        editForm.put(route(`${routeBase}.update`, item.id), {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: cancelEditing,
        });
    };

    const deleteItem = (item) => {
        if (!window.confirm(`Delete "${item.title}"?`)) {
            return;
        }

        router.delete(route(`${routeBase}.destroy`, item.id), {
            preserveScroll: true,
        });
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold leading-tight tracking-tight text-white">{title}</h2>}
        >
            <Head title={title} />

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
                                    <h3 className="text-lg font-semibold tracking-tight text-white">Add New</h3>
                                    <p className="text-sm text-white/55">{description}</p>
                                </div>
                                <button
                                    type="submit"
                                    disabled={createForm.processing}
                                    className="jv-btn jv-btn--primary mt-3 disabled:cursor-not-allowed disabled:opacity-60 sm:mt-0"
                                >
                                    {createForm.processing ? "Saving..." : "Add"}
                                </button>
                            </div>

                            <ContentFields form={createForm} fields={fields} className="mt-5" />
                        </Card>
                    </form>

                    <Card className="overflow-hidden p-0">
                        <div className="border-b border-jv-line px-6 py-4">
                            <h3 className="text-lg font-semibold tracking-tight text-white">Current Items</h3>
                            <p className="text-sm text-white/55">Published items are visible on the public website.</p>
                        </div>

                        <div className="divide-y divide-jv-line/70">
                            {items.length === 0 && (
                                <div className="px-6 py-10 text-sm text-white/45">No items yet.</div>
                            )}

                            {items.map((item) => {
                                const isEditing = editingId === item.id;

                                return (
                                    <div key={item.id} className="p-6">
                                        {isEditing ? (
                                            <form onSubmit={(event) => submitUpdate(event, item)} className="space-y-5">
                                                <ContentFields form={editForm} fields={fields} />
                                                <div className="flex flex-wrap gap-2">
                                                    <button type="submit" disabled={editForm.processing} className="jv-btn jv-btn--primary disabled:cursor-not-allowed disabled:opacity-60">
                                                        {editForm.processing ? "Updating..." : "Save Changes"}
                                                    </button>
                                                    <button type="button" onClick={cancelEditing} className="jv-btn jv-btn--ghost">
                                                        Cancel
                                                    </button>
                                                </div>
                                            </form>
                                        ) : (
                                            <div className="grid gap-5 lg:grid-cols-[180px_1fr_auto]">
                                                <PreviewImage path={item[previewField]} title={item.title} />
                                                <div>
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <h4 className="text-base font-semibold text-white">{item.title}</h4>
                                                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${item.is_published ? "bg-emerald-500/15 text-emerald-300" : "bg-white/[0.07] text-white/60"}`}>
                                                            {item.is_published ? "Published" : "Draft"}
                                                        </span>
                                                    </div>
                                                    <p className="mt-2 text-sm leading-6 text-white/55">
                                                        {item.excerpt || item.description || item.body || "No description yet."}
                                                    </p>
                                                    <dl className="mt-3 grid gap-1 text-xs text-white/45 sm:grid-cols-2">
                                                        {fields.filter((field) => field.summary).map((field) => (
                                                            <div key={field.name}>
                                                                <dt className="inline font-semibold text-white/60">{field.label}: </dt>
                                                                <dd className="inline break-all">{String(item[field.name] || "None")}</dd>
                                                            </div>
                                                        ))}
                                                    </dl>
                                                </div>
                                                <div className="flex gap-2 lg:flex-col">
                                                    <button type="button" onClick={() => startEditing(item)} className="jv-btn jv-btn--outline jv-btn--sm">
                                                        Edit
                                                    </button>
                                                    <button type="button" onClick={() => deleteItem(item)} className="rounded-full border border-red-500/40 px-4 py-2 text-xs font-semibold text-red-300 transition hover:bg-red-500/10 hover:text-red-200">
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

function ContentFields({ form, fields, className = "" }) {
    return (
        <div className={`grid gap-4 md:grid-cols-2 ${className}`}>
            {fields.map((field) => (
                <Field key={field.name} label={field.label} error={form.errors[field.name]} className={field.className || ""}>
                    <InputField field={field} form={form} />
                </Field>
            ))}
        </div>
    );
}

function InputField({ field, form }) {
    if (field.type === "textarea") {
        return (
            <Textarea
                rows={field.rows || 3}
                value={form.data[field.name] || ""}
                onChange={(event) => form.setData(field.name, event.target.value)}
                required={field.required}
            />
        );
    }

    if (field.type === "checkbox") {
        return (
            <label className="inline-flex items-center gap-2 text-sm font-medium text-white/70">
                <input
                    type="checkbox"
                    checked={Boolean(form.data[field.name])}
                    onChange={(event) => form.setData(field.name, event.target.checked)}
                    className="h-4 w-4 rounded border-jv-line-strong bg-white/[0.06] text-jv-accent accent-jv-accent focus:ring-jv-accent/40"
                />
                Visible on public website
            </label>
        );
    }

    if (field.type === "file") {
        return (
            <input
                type="file"
                accept={field.accept || "image/*"}
                onChange={(event) => form.setData(field.name, event.target.files?.[0] || null)}
                className="block w-full text-sm text-white/70 file:mr-3 file:rounded-full file:border-0 file:bg-jv-accent file:px-4 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-[#1a68ff]"
                required={field.required}
            />
        );
    }

    return (
        <Input
            type={field.type || "text"}
            value={form.data[field.name] || ""}
            onChange={(event) => form.setData(field.name, event.target.value)}
            placeholder={field.placeholder || ""}
            required={field.required}
        />
    );
}

function Field({ label, error, className = "", children }) {
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

function imageSrc(path) {
    if (!path) {
        return "";
    }

    if (/^https?:\/\//i.test(path)) {
        return path;
    }

    return path.startsWith("/") ? path : `/${path}`;
}

function normalizeValue(value, field) {
    if (field.type === "checkbox") {
        return Boolean(value);
    }

    if ((field.type === "datetime-local" || field.type === "date") && value) {
        return String(value).slice(0, field.type === "date" ? 10 : 16);
    }

    return value ?? "";
}
