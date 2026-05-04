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
            header={<h2 className="text-xl font-semibold leading-tight text-gray-800">{title}</h2>}
        >
            <Head title={title} />

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
                                <h3 className="text-lg font-semibold text-gray-900">Add New</h3>
                                <p className="text-sm text-gray-600">{description}</p>
                            </div>
                            <button
                                type="submit"
                                disabled={createForm.processing}
                                className="mt-3 inline-flex items-center justify-center rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60 sm:mt-0"
                            >
                                {createForm.processing ? "Saving..." : "Add"}
                            </button>
                        </div>

                        <ContentFields form={createForm} fields={fields} className="mt-5" />
                    </form>

                    <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
                        <div className="border-b border-gray-200 px-6 py-4">
                            <h3 className="text-lg font-semibold text-gray-900">Current Items</h3>
                            <p className="text-sm text-gray-600">Published items are visible on the public website.</p>
                        </div>

                        <div className="divide-y divide-gray-100">
                            {items.length === 0 && (
                                <div className="px-6 py-10 text-sm text-gray-500">No items yet.</div>
                            )}

                            {items.map((item) => {
                                const isEditing = editingId === item.id;

                                return (
                                    <div key={item.id} className="p-6">
                                        {isEditing ? (
                                            <form onSubmit={(event) => submitUpdate(event, item)} className="space-y-5">
                                                <ContentFields form={editForm} fields={fields} />
                                                <div className="flex flex-wrap gap-2">
                                                    <button type="submit" disabled={editForm.processing} className="rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60">
                                                        {editForm.processing ? "Updating..." : "Save Changes"}
                                                    </button>
                                                    <button type="button" onClick={cancelEditing} className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">
                                                        Cancel
                                                    </button>
                                                </div>
                                            </form>
                                        ) : (
                                            <div className="grid gap-5 lg:grid-cols-[180px_1fr_auto]">
                                                <PreviewImage path={item[previewField]} title={item.title} />
                                                <div>
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <h4 className="text-base font-semibold text-gray-900">{item.title}</h4>
                                                        <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${item.is_published ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-600"}`}>
                                                            {item.is_published ? "Published" : "Draft"}
                                                        </span>
                                                    </div>
                                                    <p className="mt-2 text-sm leading-6 text-gray-600">
                                                        {item.excerpt || item.description || item.body || "No description yet."}
                                                    </p>
                                                    <dl className="mt-3 grid gap-1 text-xs text-gray-500 sm:grid-cols-2">
                                                        {fields.filter((field) => field.summary).map((field) => (
                                                            <div key={field.name}>
                                                                <dt className="inline font-semibold">{field.label}: </dt>
                                                                <dd className="inline break-all">{String(item[field.name] || "None")}</dd>
                                                            </div>
                                                        ))}
                                                    </dl>
                                                </div>
                                                <div className="flex gap-2 lg:flex-col">
                                                    <button type="button" onClick={() => startEditing(item)} className="rounded-md border border-blue-200 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50">
                                                        Edit
                                                    </button>
                                                    <button type="button" onClick={() => deleteItem(item)} className="rounded-md border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50">
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
    const common = "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none";

    if (field.type === "textarea") {
        return (
            <textarea
                rows={field.rows || 3}
                value={form.data[field.name] || ""}
                onChange={(event) => form.setData(field.name, event.target.value)}
                className={common}
                required={field.required}
            />
        );
    }

    if (field.type === "checkbox") {
        return (
            <label className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700">
                <input
                    type="checkbox"
                    checked={Boolean(form.data[field.name])}
                    onChange={(event) => form.setData(field.name, event.target.checked)}
                    className="rounded border-gray-300 text-blue-700 focus:ring-blue-500"
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
                className={common}
                required={field.required}
            />
        );
    }

    return (
        <input
            type={field.type || "text"}
            value={form.data[field.name] || ""}
            onChange={(event) => form.setData(field.name, event.target.value)}
            placeholder={field.placeholder || ""}
            className={common}
            required={field.required}
        />
    );
}

function Field({ label, error, className = "", children }) {
    return (
        <div className={className}>
            <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
            {children}
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
    );
}

function PreviewImage({ path, title }) {
    const src = imageSrc(path);

    if (!src) {
        return (
            <div className="flex h-32 w-full items-center justify-center rounded-md border border-gray-200 bg-gray-50 text-xs font-semibold text-gray-400 lg:w-44">
                No Image
            </div>
        );
    }

    return (
        <img
            src={src}
            alt={title}
            className="h-32 w-full rounded-md border border-gray-200 object-cover lg:w-44"
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
