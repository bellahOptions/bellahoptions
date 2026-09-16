import { Button } from '@/Components/ui/button';
import { Card } from '@/Components/ui/card';
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

const FIELD_TYPES = ['text', 'textarea', 'email', 'tel', 'number', 'date', 'url', 'select', 'multiselect', 'radio', 'checkbox', 'scale', 'file'];
const OPTIONS_TYPES = ['select', 'multiselect', 'radio'];

function emptyField() {
    return {
        localId: `f_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        key: '', label: '', type: 'text', required: false,
        options: [], help: '', placeholder: '', min: '', max: '',
        advancedJson: '',
    };
}

function emptyStep() {
    return { title: '', fields: [emptyField()] };
}

function templateToForm(template) {
    return {
        name: template.name,
        intro_copy: template.intro_copy || '',
        estimated_minutes: template.estimated_minutes || 5,
        steps: template.steps.map((step) => ({
            title: step.title,
            fields: step.fields.map((field) => {
                const { key, label, type, required, options, help, placeholder, min, max, ...rest } = field;
                const advanced = { ...rest };
                delete advanced.max_selections;

                return {
                    localId: `f_${key}_${Math.random().toString(36).slice(2, 5)}`,
                    key, label, type, required: Boolean(required),
                    options: options || [],
                    help: help || '', placeholder: placeholder || '',
                    min: min ?? '', max: max ?? '',
                    max_selections: field.max_selections ?? '',
                    advancedJson: Object.keys(advanced).length > 0 ? JSON.stringify(advanced, null, 2) : '',
                };
            }),
        })),
    };
}

export default function ServiceBriefTemplatesIndex({ serviceSlugs = [], templates = {} }) {
    const { flash } = usePage().props;
    const [editingSlug, setEditingSlug] = useState(null);
    const [form, setForm] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [formError, setFormError] = useState('');

    const startEditing = (slug) => {
        const existing = templates[slug];
        setEditingSlug(slug);
        setFormError('');
        setForm(existing
            ? templateToForm(existing)
            : { name: `${SERVICE_LABELS[slug] || slug} Brief`, intro_copy: '', estimated_minutes: 5, steps: [emptyStep()] });
    };

    const cancelEditing = () => {
        setEditingSlug(null);
        setForm(null);
    };

    const updateStep = (stepIndex, changes) => {
        setForm((prev) => ({
            ...prev,
            steps: prev.steps.map((step, i) => (i === stepIndex ? { ...step, ...changes } : step)),
        }));
    };

    const addStep = () => {
        setForm((prev) => ({ ...prev, steps: [...prev.steps, emptyStep()] }));
    };

    const removeStep = (stepIndex) => {
        setForm((prev) => ({ ...prev, steps: prev.steps.filter((_, i) => i !== stepIndex) }));
    };

    const updateField = (stepIndex, localId, changes) => {
        setForm((prev) => ({
            ...prev,
            steps: prev.steps.map((step, i) => (i !== stepIndex ? step : {
                ...step,
                fields: step.fields.map((field) => (field.localId === localId ? { ...field, ...changes } : field)),
            })),
        }));
    };

    const addField = (stepIndex) => {
        setForm((prev) => ({
            ...prev,
            steps: prev.steps.map((step, i) => (i === stepIndex ? { ...step, fields: [...step.fields, emptyField()] } : step)),
        }));
    };

    const removeField = (stepIndex, localId) => {
        setForm((prev) => ({
            ...prev,
            steps: prev.steps.map((step, i) => (i !== stepIndex ? step : { ...step, fields: step.fields.filter((f) => f.localId !== localId) })),
        }));
    };

    const submitTemplate = (event) => {
        event.preventDefault();
        setFormError('');

        let steps;
        try {
            steps = form.steps.map((step) => ({
                title: step.title,
                fields: step.fields.map((field) => {
                    let advanced = {};
                    if (field.advancedJson.trim() !== '') {
                        advanced = JSON.parse(field.advancedJson);
                    }

                    return {
                        key: field.key,
                        label: field.label,
                        type: field.type,
                        required: field.required,
                        options: OPTIONS_TYPES.includes(field.type) ? field.options.filter((o) => o.trim() !== '') : [],
                        help: field.help || undefined,
                        placeholder: field.placeholder || undefined,
                        min: field.min !== '' ? Number(field.min) : undefined,
                        max: field.max !== '' ? Number(field.max) : undefined,
                        max_selections: field.type === 'multiselect' && field.max_selections !== '' ? Number(field.max_selections) : undefined,
                        ...advanced,
                    };
                }),
            }));
        } catch (error) {
            setFormError(`Invalid Advanced JSON in one of the fields: ${error.message}`);
            return;
        }

        const payload = {
            service_slug: editingSlug,
            name: form.name,
            intro_copy: form.intro_copy,
            estimated_minutes: Number(form.estimated_minutes) || 5,
            steps,
        };

        setProcessing(true);
        router.post(route('admin.service-brief-templates.store'), payload, {
            preserveScroll: true,
            onFinish: () => setProcessing(false),
            onSuccess: () => cancelEditing(),
        });
    };

    return (
        <AuthenticatedLayout header={<h2 className="text-xl font-semibold leading-tight tracking-tight text-white">Service Brief Templates</h2>}>
            <Head title="Service Brief Templates" />

            <div className="py-8">
                <div className="mx-auto max-w-5xl space-y-6 px-4 sm:px-6 lg:px-8">
                    <p className="text-sm text-white/55">
                        Define the pre-order questions asked for each service&apos;s &quot;Start your brief&quot; wizard.
                        Saving creates a new version — clients who already submitted keep the version they answered.
                    </p>

                    {flash?.success && <div className="rounded-jv-sm border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">{flash.success}</div>}

                    <div className="space-y-4">
                        {serviceSlugs.map((slug) => {
                            const template = templates[slug];
                            const isEditing = editingSlug === slug;

                            return (
                                <Card key={slug} className="p-5 sm:p-6">
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <h3 className="text-base font-semibold text-white">{SERVICE_LABELS[slug] || slug}</h3>
                                            {template ? (
                                                <p className="mt-1 text-sm text-white/55">
                                                    {template.name} — v{template.version} — {template.steps.reduce((n, s) => n + s.fields.length, 0)} question(s)
                                                </p>
                                            ) : (
                                                <p className="mt-1 text-sm text-white/45">No template yet — the universal intake still applies.</p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {template && (
                                                <a
                                                    href={route('admin.service-brief-templates.preview', slug)}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="jv-btn jv-btn--ghost jv-btn--sm"
                                                >
                                                    Preview
                                                </a>
                                            )}
                                            {!isEditing && (
                                                <button type="button" onClick={() => startEditing(slug)} className="jv-btn jv-btn--outline jv-btn--sm">
                                                    {template ? 'Edit' : 'Create'}
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {isEditing && (
                                        <form onSubmit={submitTemplate} className="mt-4 space-y-4 border-t border-jv-line pt-4">
                                            {formError && <div className="rounded-jv-sm border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">{formError}</div>}

                                            <div className="grid gap-3 sm:grid-cols-3">
                                                <div className="sm:col-span-2">
                                                    <Label>Template Name</Label>
                                                    <Input className="mt-1" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
                                                </div>
                                                <div>
                                                    <Label>Estimated Minutes</Label>
                                                    <Input type="number" min="1" className="mt-1" value={form.estimated_minutes} onChange={(e) => setForm((p) => ({ ...p, estimated_minutes: e.target.value }))} />
                                                </div>
                                            </div>

                                            <div>
                                                <Label>Intro Copy</Label>
                                                <Textarea className="mt-1" rows={2} value={form.intro_copy} onChange={(e) => setForm((p) => ({ ...p, intro_copy: e.target.value }))} />
                                            </div>

                                            {form.steps.map((step, stepIndex) => (
                                                <div key={stepIndex} className="rounded-jv-sm border border-jv-line p-4">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <Input
                                                            className="max-w-xs"
                                                            value={step.title}
                                                            placeholder={`Step ${stepIndex + 1} title`}
                                                            onChange={(e) => updateStep(stepIndex, { title: e.target.value })}
                                                            required
                                                        />
                                                        {form.steps.length > 1 && (
                                                            <button type="button" onClick={() => removeStep(stepIndex)} className="text-xs font-semibold text-red-300 transition hover:text-red-200">
                                                                Remove Step
                                                            </button>
                                                        )}
                                                    </div>

                                                    <div className="mt-3 space-y-3">
                                                        {step.fields.map((field, fieldIndex) => (
                                                            <div key={field.localId} className="rounded-jv-sm border border-jv-line bg-white/[0.03] p-3">
                                                                <div className="flex items-center justify-between">
                                                                    <p className="text-xs font-semibold uppercase tracking-wide text-white/45">Question {fieldIndex + 1}</p>
                                                                    <button type="button" onClick={() => removeField(stepIndex, field.localId)} className="text-xs font-semibold text-red-300 transition hover:text-red-200">
                                                                        Remove
                                                                    </button>
                                                                </div>

                                                                <div className="mt-2 grid gap-3 sm:grid-cols-2">
                                                                    <div>
                                                                        <Label>Key (permanent, snake_case)</Label>
                                                                        <Input className="mt-1" value={field.key} onChange={(e) => updateField(stepIndex, field.localId, { key: e.target.value })} required />
                                                                    </div>
                                                                    <div>
                                                                        <Label>Type</Label>
                                                                        <Select className="mt-1" value={field.type} onChange={(e) => updateField(stepIndex, field.localId, { type: e.target.value })}>
                                                                            {FIELD_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                                                                        </Select>
                                                                    </div>
                                                                    <div className="sm:col-span-2">
                                                                        <Label>Label</Label>
                                                                        <Input className="mt-1" value={field.label} onChange={(e) => updateField(stepIndex, field.localId, { label: e.target.value })} required />
                                                                    </div>
                                                                    {OPTIONS_TYPES.includes(field.type) && (
                                                                        <div className="sm:col-span-2">
                                                                            <Label>Options (one per line)</Label>
                                                                            <Textarea
                                                                                className="mt-1"
                                                                                rows={3}
                                                                                value={field.options.join('\n')}
                                                                                onChange={(e) => updateField(stepIndex, field.localId, { options: e.target.value.split('\n') })}
                                                                            />
                                                                        </div>
                                                                    )}
                                                                    <div>
                                                                        <Label>Help Text</Label>
                                                                        <Input className="mt-1" value={field.help} onChange={(e) => updateField(stepIndex, field.localId, { help: e.target.value })} />
                                                                    </div>
                                                                    <div>
                                                                        <Label>Placeholder</Label>
                                                                        <Input className="mt-1" value={field.placeholder} onChange={(e) => updateField(stepIndex, field.localId, { placeholder: e.target.value })} />
                                                                    </div>
                                                                    <label className="flex items-center gap-2 text-sm text-white/70 sm:col-span-2">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={field.required}
                                                                            onChange={(e) => updateField(stepIndex, field.localId, { required: e.target.checked })}
                                                                            className="h-4 w-4 rounded border-jv-line-strong bg-white/[0.06] text-jv-accent accent-jv-accent focus:ring-jv-accent/40"
                                                                        />
                                                                        Required
                                                                    </label>
                                                                    <details className="sm:col-span-2">
                                                                        <summary className="cursor-pointer text-xs font-semibold text-white/45">Advanced (condition / flag_on / min / max) — JSON</summary>
                                                                        <Textarea
                                                                            className="mt-2 font-mono text-xs"
                                                                            rows={3}
                                                                            placeholder='e.g. {"condition": {"field": "other_key", "operator": "equals", "value": "Yes"}}'
                                                                            value={field.advancedJson}
                                                                            onChange={(e) => updateField(stepIndex, field.localId, { advancedJson: e.target.value })}
                                                                        />
                                                                    </details>
                                                                </div>
                                                            </div>
                                                        ))}

                                                        <button type="button" onClick={() => addField(stepIndex)} className="jv-btn jv-btn--ghost jv-btn--sm">
                                                            + Add Question
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}

                                            <button type="button" onClick={addStep} className="jv-btn jv-btn--ghost jv-btn--sm">
                                                + Add Step
                                            </button>

                                            <div className="flex justify-end gap-2 border-t border-jv-line pt-4">
                                                <Button type="button" variant="outline" onClick={cancelEditing}>Cancel</Button>
                                                <Button type="submit" disabled={processing}>{processing ? 'Saving...' : 'Save Template'}</Button>
                                            </div>
                                        </form>
                                    )}
                                </Card>
                            );
                        })}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
