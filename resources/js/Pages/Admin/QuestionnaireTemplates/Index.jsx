import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Select } from '@/Components/ui/select';
import { Textarea } from '@/Components/ui/textarea';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, usePage } from '@inertiajs/react';
import { useState } from 'react';

const SERVICE_LABELS = {
    'social-media-design': 'Social Media Design',
    'graphic-design': 'Graphic Design',
    'brand-design': 'Brand Design',
    'web-design': 'Web Design',
    'special-service': 'Special Service',
    'mobile-app-development': 'Mobile App Development',
    'ui-ux': 'UI/UX',
    'manage-hires': 'Manage Hires',
};

const QUESTION_TYPES = [
    { value: 'rating', label: 'Rating (1-5)' },
    { value: 'text', label: 'Free text' },
    { value: 'choice', label: 'Multiple choice' },
];

function emptyQuestion() {
    return {
        id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        label: '',
        type: 'rating',
        options: [],
    };
}

export default function QuestionnaireTemplatesIndex({ serviceSlugs = [], templates = [] }) {
    const { flash } = usePage().props;
    const [editingSlug, setEditingSlug] = useState(null);
    const [form, setForm] = useState({ name: '', questions: [], is_active: true });
    const [processing, setProcessing] = useState(false);
    const [importing, setImporting] = useState(false);
    const [importError, setImportError] = useState('');

    const templatesBySlug = templates.reduce((acc, template) => {
        acc[template.service_slug] = template;
        return acc;
    }, {});

    const startEditing = (slug) => {
        const existing = templatesBySlug[slug];

        setEditingSlug(slug);
        setImportError('');
        setForm(existing
            ? { name: existing.name, questions: existing.questions.map((q) => ({ ...q, options: q.options || [] })), is_active: existing.is_active }
            : { name: `${SERVICE_LABELS[slug] || slug} Questionnaire`, questions: [emptyQuestion()], is_active: true });
    };

    const cancelEditing = () => {
        setEditingSlug(null);
    };

    const addQuestion = () => {
        setForm((prev) => ({ ...prev, questions: [...prev.questions, emptyQuestion()] }));
    };

    const removeQuestion = (id) => {
        setForm((prev) => ({ ...prev, questions: prev.questions.filter((q) => q.id !== id) }));
    };

    const updateQuestion = (id, changes) => {
        setForm((prev) => ({
            ...prev,
            questions: prev.questions.map((q) => (q.id === id ? { ...q, ...changes } : q)),
        }));
    };

    const submitTemplate = (event) => {
        event.preventDefault();

        const existing = templatesBySlug[editingSlug];
        const payload = {
            service_slug: editingSlug,
            name: form.name,
            questions: form.questions.map((q) => ({
                id: q.id,
                label: q.label,
                type: q.type,
                options: q.type === 'choice' ? q.options.filter((option) => option.trim() !== '') : [],
            })),
            is_active: form.is_active,
        };

        setProcessing(true);

        const options = {
            preserveScroll: true,
            onFinish: () => setProcessing(false),
            onSuccess: () => setEditingSlug(null),
        };

        if (existing) {
            router.patch(route('admin.questionnaire-templates.update', existing.id), payload, options);
        } else {
            router.post(route('admin.questionnaire-templates.store'), payload, options);
        }
    };

    const importQuestions = async (event) => {
        const file = event.target.files?.[0];
        event.target.value = '';

        if (!file) {
            return;
        }

        setImporting(true);
        setImportError('');

        const body = new FormData();
        body.append('file', file);

        try {
            const response = await window.axios.post(route('admin.questionnaire-templates.import'), body, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            const imported = (response?.data?.questions || []).map((question) => ({
                ...question,
                options: question.options || [],
            }));

            if (imported.length === 0) {
                throw new Error('No questions were found in that file.');
            }

            setForm((prev) => {
                const hasRealQuestions = prev.questions.some((q) => q.label.trim() !== '');

                return {
                    ...prev,
                    questions: hasRealQuestions ? [...prev.questions, ...imported] : imported,
                };
            });
        } catch (error) {
            setImportError(error?.response?.data?.message || error?.message || 'Failed to import that file.');
        } finally {
            setImporting(false);
        }
    };

    const deleteTemplate = (template) => {
        if (!window.confirm(`Delete the questionnaire template for ${SERVICE_LABELS[template.service_slug] || template.service_slug}?`)) {
            return;
        }

        router.delete(route('admin.questionnaire-templates.destroy', template.id), { preserveScroll: true });
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Questionnaire Templates</h2>}
        >
            <Head title="Questionnaire Templates" />

            <div className="py-8">
                <div className="mx-auto max-w-4xl space-y-6 px-4 sm:px-6 lg:px-8">
                    <p className="text-sm text-gray-600">
                        Define the post-service questionnaire sent to clients per service. A questionnaire can only be
                        sent from an invoice once its service has an active template here.
                    </p>

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

                    <div className="space-y-4">
                        {serviceSlugs.map((slug) => {
                            const template = templatesBySlug[slug];
                            const isEditing = editingSlug === slug;

                            return (
                                <section key={slug} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <h3 className="text-base font-semibold text-gray-900">{SERVICE_LABELS[slug] || slug}</h3>
                                            {template ? (
                                                <p className="mt-1 text-sm text-gray-600">
                                                    {template.name} — {template.questions.length} question(s) —{' '}
                                                    {template.is_active ? 'Active' : 'Inactive'}
                                                </p>
                                            ) : (
                                                <p className="mt-1 text-sm text-gray-500">No template configured yet.</p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {!isEditing && (
                                                <button
                                                    type="button"
                                                    onClick={() => startEditing(slug)}
                                                    className="rounded-md border border-brand/30 px-3 py-2 text-xs font-semibold text-brand hover:bg-brand-light"
                                                >
                                                    {template ? 'Edit' : 'Create'}
                                                </button>
                                            )}
                                            {template && (
                                                <button
                                                    type="button"
                                                    onClick={() => deleteTemplate(template)}
                                                    className="rounded-md border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50"
                                                >
                                                    Delete
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {isEditing && (
                                        <form onSubmit={submitTemplate} className="mt-4 space-y-4 border-t border-gray-100 pt-4">
                                            <div>
                                                <Label htmlFor={`name-${slug}`}>Template Name</Label>
                                                <Input
                                                    id={`name-${slug}`}
                                                    className="mt-1"
                                                    value={form.name}
                                                    onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                                                    required
                                                />
                                            </div>

                                            <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-3">
                                                <Label htmlFor={`import-${slug}`}>Import Questions from CSV or PDF</Label>
                                                <p className="mt-1 text-xs text-gray-500">
                                                    CSV: columns <code>question</code>, <code>type</code> (rating/text/choice), <code>options</code> (separated by | or ;).
                                                    PDF: lines ending in "?" are detected as questions (best-effort — review the results below).
                                                    Imported questions are added to the list below, which you can still edit before saving.
                                                </p>
                                                <input
                                                    id={`import-${slug}`}
                                                    type="file"
                                                    accept=".csv,.txt,.pdf"
                                                    onChange={importQuestions}
                                                    disabled={importing}
                                                    className="mt-2 block w-full text-sm text-gray-700 file:mr-3 file:rounded-md file:border-0 file:bg-brand file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-brand-dark"
                                                />
                                                {importing && <p className="mt-1 text-xs text-gray-500">Importing...</p>}
                                                {importError && <p className="mt-1 text-xs text-red-600">{importError}</p>}
                                            </div>

                                            <div className="space-y-3">
                                                {form.questions.map((question, index) => (
                                                    <div key={question.id} className="rounded-lg border border-gray-200 p-3">
                                                        <div className="flex items-center justify-between gap-2">
                                                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                                                Question {index + 1}
                                                            </p>
                                                            <button
                                                                type="button"
                                                                onClick={() => removeQuestion(question.id)}
                                                                className="text-xs font-semibold text-red-600 hover:text-red-700"
                                                            >
                                                                Remove
                                                            </button>
                                                        </div>

                                                        <div className="mt-2 grid gap-3 sm:grid-cols-2">
                                                            <div className="sm:col-span-2">
                                                                <Label>Question</Label>
                                                                <Input
                                                                    className="mt-1"
                                                                    value={question.label}
                                                                    onChange={(event) => updateQuestion(question.id, { label: event.target.value })}
                                                                    required
                                                                />
                                                            </div>
                                                            <div>
                                                                <Label>Answer Type</Label>
                                                                <Select
                                                                    className="mt-1"
                                                                    value={question.type}
                                                                    onChange={(event) => updateQuestion(question.id, { type: event.target.value })}
                                                                >
                                                                    {QUESTION_TYPES.map((type) => (
                                                                        <option key={type.value} value={type.value}>{type.label}</option>
                                                                    ))}
                                                                </Select>
                                                            </div>
                                                            {question.type === 'choice' && (
                                                                <div className="sm:col-span-2">
                                                                    <Label>Options (one per line)</Label>
                                                                    <Textarea
                                                                        className="mt-1"
                                                                        rows={3}
                                                                        value={question.options.join('\n')}
                                                                        onChange={(event) => updateQuestion(question.id, {
                                                                            options: event.target.value.split('\n'),
                                                                        })}
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}

                                                <button
                                                    type="button"
                                                    onClick={addQuestion}
                                                    className="rounded-md border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                                                >
                                                    + Add Question
                                                </button>
                                            </div>

                                            <label className="flex items-center gap-2 text-sm text-gray-700">
                                                <input
                                                    type="checkbox"
                                                    checked={form.is_active}
                                                    onChange={(event) => setForm((prev) => ({ ...prev, is_active: event.target.checked }))}
                                                />
                                                Active (available to send from invoices)
                                            </label>

                                            <div className="flex justify-end gap-2">
                                                <Button type="button" variant="outline" onClick={cancelEditing}>
                                                    Cancel
                                                </Button>
                                                <Button type="submit" disabled={processing || form.questions.length === 0}>
                                                    {processing ? 'Saving...' : 'Save Template'}
                                                </Button>
                                            </div>
                                        </form>
                                    )}
                                </section>
                            );
                        })}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
