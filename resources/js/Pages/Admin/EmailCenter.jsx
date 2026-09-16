import { Eyebrow } from '@/Components/PublicUI';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { useMemo, useState } from 'react';

const NEW_BLOCK = (type) => ({
    id: `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type,
    content: '',
    url: '',
    alt: '',
    label: '',
    height: 20,
});

const BLOCK_TYPES = [
    { type: 'heading', label: 'Heading' },
    { type: 'text', label: 'Paragraph' },
    { type: 'image', label: 'Image' },
    { type: 'button', label: 'Button' },
    { type: 'divider', label: 'Divider' },
    { type: 'spacer', label: 'Spacer' },
];

const escapeHtml = (value) => String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const toBlockHtml = (blocks = []) => blocks.map((block) => {
    const type = String(block?.type || '').toLowerCase();
    const content = String(block?.content || '').trim();
    const url = String(block?.url || '').trim();
    const alt = String(block?.alt || '').trim();
    const label = String(block?.label || '').trim();
    const height = Math.max(8, Math.min(64, Number(block?.height || 20)));

    if (type === 'heading') return `<h2 style="font-family:Arial,sans-serif;color:#0f172a;">${escapeHtml(content)}</h2>`;
    if (type === 'text') return `<p style="font-family:Arial,sans-serif;color:#334155;line-height:1.7;">${escapeHtml(content)}</p>`;
    if (type === 'image' && url) return `<p><img src="${escapeHtml(url)}" alt="${escapeHtml(alt || 'Email image')}" style="max-width:100%;height:auto;border-radius:10px;" /></p>`;
    if (type === 'button' && url && label) return `<p><a href="${escapeHtml(url)}" style="display:inline-block;background:#050a80;color:#ffffff;text-decoration:none;padding:12px 16px;border-radius:8px;font-weight:700;">${escapeHtml(label)}</a></p>`;
    if (type === 'divider') return '<hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0;" />';
    if (type === 'spacer') return `<div style="height:${height}px;"></div>`;
    return '';
}).join('');

const fileToDataUrl = (file) => new Promise((resolve, reject) => {
    if (!(file instanceof File)) {
        resolve('');
        return;
    }

    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Could not read file.'));
    reader.readAsDataURL(file);
});

const buildHeaderImageHtml = (url) => `<p><img src="${escapeHtml(url)}" alt="Email header" style="display:block;width:100%;max-width:640px;height:auto;border-radius:10px;" /></p>`;

const prependHeaderImageToHtml = (html, url) => `${buildHeaderImageHtml(url)}${String(html || '')}`;

const upsertHeaderImageBlock = (blocks = [], url) => {
    const next = Array.isArray(blocks) ? [...blocks] : [];
    const firstImageIndex = next.findIndex((block) => String(block?.type || '').toLowerCase() === 'image');

    if (firstImageIndex === 0) {
        next[0] = {
            ...(next[0] || {}),
            type: 'image',
            url,
            alt: next[0]?.alt || 'Email header',
        };

        return next;
    }

    const headerBlock = {
        ...NEW_BLOCK('image'),
        url,
        alt: 'Email header',
    };

    if (firstImageIndex > 0) {
        const [existingImage] = next.splice(firstImageIndex, 1);
        next.unshift({
            ...(existingImage || headerBlock),
            type: 'image',
            url,
            alt: existingImage?.alt || 'Email header',
        });

        return next;
    }

    next.unshift(headerBlock);

    return next;
};

export default function EmailCenter({
    campaigns = [],
    placeholders = {},
    email_templates: emailTemplates = {},
    invoice_style: invoiceStyle = {},
    services = [],
    audiences = [],
    sources = [],
    campaign_default_from_email: campaignDefaultFromEmail = 'sales@bellahoptions.com',
}) {
    const [activeCampaignId, setActiveCampaignId] = useState(campaigns[0]?.id || null);
    const [dragIndex, setDragIndex] = useState(null);
    const [templateKey, setTemplateKey] = useState(Object.keys(emailTemplates || {})[0] || 'invoice_issued');
    const [templateDragIndex, setTemplateDragIndex] = useState(null);
    const [audiencePreview, setAudiencePreview] = useState(null);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [campaignHeaderUploading, setCampaignHeaderUploading] = useState(false);
    const [templateHeaderUploading, setTemplateHeaderUploading] = useState(false);

    const activeCampaign = useMemo(
        () => campaigns.find((campaign) => campaign.id === activeCampaignId) || null,
        [campaigns, activeCampaignId],
    );

    const campaignForm = useForm({
        id: activeCampaign?.id || null,
        name: activeCampaign?.name || '',
        audience: activeCampaign?.audience || 'all',
        preview_text: activeCampaign?.preview_text || '',
        from_email: activeCampaign?.from_email || campaignDefaultFromEmail,
        subject_template: activeCampaign?.subject_template || 'Hello {{customer_name}}',
        html_template: activeCampaign?.html_template || '',
        dynamic_fields: activeCampaign?.dynamic_fields || {},
        audience_filters: activeCampaign?.audience_filters || { source: 'all', service_slug: '' },
        builder_layout: activeCampaign?.builder_layout || [],
        is_active: activeCampaign?.is_active ?? true,
    });

    const templatesForm = useForm({
        email_templates: emailTemplates,
    });

    const invoiceStyleForm = useForm({
        invoice_style: {
            primary_color: invoiceStyle?.primary_color || '#0f1f33',
            accent_color: invoiceStyle?.accent_color || '#11845b',
            text_color: invoiceStyle?.text_color || '#182433',
            company_lines: invoiceStyle?.company_lines || [],
            footer_note: invoiceStyle?.footer_note || '',
        },
    });

    const syncCampaign = (campaign) => {
        setActiveCampaignId(campaign?.id || null);
        campaignForm.setData({
            id: campaign?.id || null,
            name: campaign?.name || '',
            audience: campaign?.audience || 'all',
            preview_text: campaign?.preview_text || '',
            from_email: campaign?.from_email || campaignDefaultFromEmail,
            subject_template: campaign?.subject_template || 'Hello {{customer_name}}',
            html_template: campaign?.html_template || '',
            dynamic_fields: campaign?.dynamic_fields || {},
            audience_filters: campaign?.audience_filters || { source: 'all', service_slug: '' },
            builder_layout: campaign?.builder_layout || [],
            is_active: campaign?.is_active ?? true,
        });
    };

    const updateTemplateValue = (patch) => {
        templatesForm.setData('email_templates', {
            ...(templatesForm.data.email_templates || {}),
            [templateKey]: {
                ...templateValue,
                ...patch,
            },
        });
    };

    const saveCampaign = (event) => {
        event.preventDefault();

        const payload = {
            ...campaignForm.data,
            html_template: campaignForm.data.html_template || toBlockHtml(campaignForm.data.builder_layout),
        };

        campaignForm.transform(() => payload);

        if (campaignForm.data.id) {
            campaignForm.put(route('admin.email-center.campaigns.update', campaignForm.data.id), { preserveScroll: true });
            return;
        }

        campaignForm.post(route('admin.email-center.campaigns.store'), {
            preserveScroll: true,
            onSuccess: () => campaignForm.reset(),
        });
    };

    const deleteCampaign = () => {
        if (!campaignForm.data.id || !window.confirm('Delete this campaign?')) return;
        router.delete(route('admin.email-center.campaigns.destroy', campaignForm.data.id), { preserveScroll: true });
    };

    const sendTest = () => {
        if (!campaignForm.data.id) return;
        const testEmail = window.prompt('Enter test email address');
        if (!testEmail) return;

        router.post(route('admin.email-center.campaigns.send-test', campaignForm.data.id), { test_email: testEmail }, { preserveScroll: true });
    };

    const sendCampaign = () => {
        if (!campaignForm.data.id) return;
        const limitText = window.prompt('Recipient limit (optional)');
        const limit = Number(limitText || 0);

        router.post(route('admin.email-center.campaigns.send', campaignForm.data.id), {
            limit: Number.isFinite(limit) && limit > 0 ? limit : null,
        }, { preserveScroll: true });
    };

    const previewAudience = async () => {
        if (!campaignForm.data.id) return;
        setPreviewLoading(true);
        try {
            const response = await window.axios.get(route('admin.email-center.campaigns.preview', campaignForm.data.id));
            setAudiencePreview(response?.data || null);
        } catch {
            setAudiencePreview(null);
        } finally {
            setPreviewLoading(false);
        }
    };

    const uploadOptimizedHeaderImage = async (file) => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await window.axios.post(route('admin.email-center.assets.header-image'), formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });

        return String(response?.data?.url || '');
    };

    const handleCampaignHeaderUpload = async (event) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) return;

        setCampaignHeaderUploading(true);
        try {
            const url = await uploadOptimizedHeaderImage(file);
            if (!url) return;

            campaignForm.setData('builder_layout', upsertHeaderImageBlock(campaignForm.data.builder_layout, url));
            campaignForm.setData('html_template', prependHeaderImageToHtml(campaignForm.data.html_template, url));
        } catch {
            // ignore upload errors here; backend returns validation messages through inertia flash if needed
        } finally {
            setCampaignHeaderUploading(false);
        }
    };

    const handleTemplateHeaderUpload = async (event) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) return;

        setTemplateHeaderUploading(true);
        try {
            const url = await uploadOptimizedHeaderImage(file);
            if (!url) return;

            updateTemplateValue({
                builder_layout: upsertHeaderImageBlock(templateValue.builder_layout, url),
                html_template: prependHeaderImageToHtml(templateValue.html_template, url),
            });
        } catch {
            // ignore upload errors here; backend returns validation messages through inertia flash if needed
        } finally {
            setTemplateHeaderUploading(false);
        }
    };

    const insertPlaceholder = (field) => {
        campaignForm.setData('html_template', `${campaignForm.data.html_template || ''}{{${field}}}`);
    };

    const insertSubjectPlaceholder = (field) => {
        campaignForm.setData('subject_template', `${campaignForm.data.subject_template || ''}{{${field}}}`);
    };

    const addCampaignBlock = (type) => {
        campaignForm.setData('builder_layout', [...(campaignForm.data.builder_layout || []), NEW_BLOCK(type)]);
    };

    const updateCampaignBlock = (index, key, value) => {
        const next = [...(campaignForm.data.builder_layout || [])];
        next[index] = { ...(next[index] || {}), [key]: value };
        campaignForm.setData('builder_layout', next);
    };

    const removeCampaignBlock = (index) => {
        const next = [...(campaignForm.data.builder_layout || [])];
        next.splice(index, 1);
        campaignForm.setData('builder_layout', next);
    };

    const moveCampaignBlock = (fromIndex, toIndex) => {
        const next = [...(campaignForm.data.builder_layout || [])];
        const [moved] = next.splice(fromIndex, 1);
        next.splice(toIndex, 0, moved);
        campaignForm.setData('builder_layout', next);
    };

    const templateValue = templatesForm.data.email_templates?.[templateKey] || {
        name: '',
        subject_template: '',
        from_email: '',
        html_template: '',
        builder_layout: [],
    };

    const addTemplateBlock = (type) => {
        updateTemplateValue({
            builder_layout: [...(templateValue.builder_layout || []), NEW_BLOCK(type)],
        });
    };

    const updateTemplateBlock = (index, key, value) => {
        const next = [...(templateValue.builder_layout || [])];
        next[index] = { ...(next[index] || {}), [key]: value };
        updateTemplateValue({ builder_layout: next });
    };

    const removeTemplateBlock = (index) => {
        const next = [...(templateValue.builder_layout || [])];
        next.splice(index, 1);
        updateTemplateValue({ builder_layout: next });
    };

    const moveTemplateBlock = (fromIndex, toIndex) => {
        const next = [...(templateValue.builder_layout || [])];
        const [moved] = next.splice(fromIndex, 1);
        next.splice(toIndex, 0, moved);
        updateTemplateValue({ builder_layout: next });
    };

    const saveTemplates = () => {
        templatesForm.patch(route('admin.email-center.templates.update'), { preserveScroll: true });
    };

    const saveInvoiceStyle = () => {
        invoiceStyleForm.patch(route('admin.email-center.invoice-style.update'), { preserveScroll: true });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Email Center" />

            <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
                <section className="jv-card jv-card--pad">
                    <Eyebrow>Communications</Eyebrow>
                    <h1 className="jv-display jv-display--md mt-5">Email Center</h1>
                    <p className="jv-lead mt-4 max-w-2xl">
                        Build dynamic campaigns, target purchasers vs prospects, and customize system email formats.
                    </p>
                </section>

                <section className="grid gap-6 xl:grid-cols-[300px_1fr]">
                    <aside className="jv-card jv-card--pad">
                        <div className="mb-4 flex items-center justify-between gap-2">
                            <h2 className="jv-mono text-white/45">Campaigns</h2>
                            <button type="button" onClick={() => syncCampaign(null)} className="jv-btn jv-btn--ghost jv-btn--sm">New</button>
                        </div>
                        <div className="space-y-2">
                            {campaigns.map((campaign) => (
                                <button
                                    key={campaign.id}
                                    type="button"
                                    onClick={() => syncCampaign(campaign)}
                                    className={`w-full rounded-jv-sm border px-3 py-2.5 text-left text-sm transition ${
                                        activeCampaignId === campaign.id
                                            ? 'border-jv-accent-line bg-jv-accent/10'
                                            : 'border-jv-line hover:bg-white/[0.05]'
                                    }`}
                                >
                                    <p className="font-semibold text-white">{campaign.name}</p>
                                    <p className="mt-0.5 text-xs text-white/45">{campaign.audience}</p>
                                </button>
                            ))}
                        </div>
                    </aside>

                    <form onSubmit={saveCampaign} className="jv-card jv-card--pad space-y-6">
                        <h2 className="jv-display jv-display--sm">Campaign Builder</h2>

                        <div className="grid gap-4 md:grid-cols-2">
                            <Field label="Campaign Name">
                                <input value={campaignForm.data.name} onChange={(event) => campaignForm.setData('name', event.target.value)} className={inputClass} />
                            </Field>
                            <Field label="Audience">
                                <select value={campaignForm.data.audience} onChange={(event) => campaignForm.setData('audience', event.target.value)} className={inputClass}>
                                    {audiences.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                                </select>
                            </Field>
                            <Field label="Audience Source Filter">
                                <select value={campaignForm.data.audience_filters?.source || 'all'} onChange={(event) => campaignForm.setData('audience_filters', { ...(campaignForm.data.audience_filters || {}), source: event.target.value })} className={inputClass}>
                                    {sources.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                                </select>
                            </Field>
                            <Field label="Service Filter (Optional)">
                                <select value={campaignForm.data.audience_filters?.service_slug || ''} onChange={(event) => campaignForm.setData('audience_filters', { ...(campaignForm.data.audience_filters || {}), service_slug: event.target.value })} className={inputClass}>
                                    <option value="">All Services</option>
                                    {services.map((service) => <option key={service.slug} value={service.slug}>{service.name}</option>)}
                                </select>
                            </Field>
                            <Field label="From Email (Optional)" className="md:col-span-2">
                                <input
                                    type="email"
                                    value={campaignForm.data.from_email || ''}
                                    onChange={(event) => campaignForm.setData('from_email', event.target.value)}
                                    className={inputClass}
                                    placeholder={campaignDefaultFromEmail}
                                />
                            </Field>
                            <Field label="Subject Template" className="md:col-span-2">
                                <input value={campaignForm.data.subject_template} onChange={(event) => campaignForm.setData('subject_template', event.target.value)} className={inputClass} />
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {Object.keys(placeholders).slice(0, 10).map((field) => (
                                        <button key={field} type="button" onClick={() => insertSubjectPlaceholder(field)} className={chipClass}>{`{{${field}}}`}</button>
                                    ))}
                                </div>
                            </Field>
                            <Field label="Preview Text" className="md:col-span-2">
                                <input value={campaignForm.data.preview_text || ''} onChange={(event) => campaignForm.setData('preview_text', event.target.value)} className={inputClass} />
                            </Field>
                        </div>

                        <div className="rounded-jv-sm border border-jv-line bg-white/[0.03] p-4">
                            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                                <p className="text-sm font-semibold text-white">Drag &amp; Drop Email Blocks</p>
                                <label className="jv-btn jv-btn--ghost jv-btn--sm cursor-pointer">
                                    {campaignHeaderUploading ? 'Uploading header...' : 'Upload Header Image'}
                                    <input type="file" accept=".jpg,.jpeg,.png,.webp,.gif,.bmp,.avif" className="hidden" onChange={handleCampaignHeaderUpload} />
                                </label>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                                {BLOCK_TYPES.map((block) => (
                                    <button key={block.type} type="button" onClick={() => addCampaignBlock(block.type)} className={ghostChipBtn}>
                                        Add {block.label}
                                    </button>
                                ))}
                                <button type="button" onClick={() => campaignForm.setData('html_template', toBlockHtml(campaignForm.data.builder_layout || []))} className={accentChipBtn}>
                                    Generate HTML From Blocks
                                </button>
                            </div>

                            <div className="mt-3 space-y-2">
                                {(campaignForm.data.builder_layout || []).map((block, index) => (
                                    <BlockEditor
                                        key={block.id || `${block.type}-${index}`}
                                        block={block}
                                        index={index}
                                        onChange={updateCampaignBlock}
                                        onRemove={removeCampaignBlock}
                                        onImageUpload={async (blockIndex, file) => {
                                            const dataUrl = await fileToDataUrl(file);
                                            if (dataUrl) updateCampaignBlock(blockIndex, 'url', dataUrl);
                                        }}
                                        onDragStart={() => setDragIndex(index)}
                                        onDragOver={(event) => event.preventDefault()}
                                        onDrop={() => {
                                            if (dragIndex === null || dragIndex === index) return;
                                            moveCampaignBlock(dragIndex, index);
                                            setDragIndex(null);
                                        }}
                                    />
                                ))}
                            </div>
                        </div>

                        <Field label="HTML Template" className="md:col-span-2">
                            <textarea rows={10} value={campaignForm.data.html_template || ''} onChange={(event) => campaignForm.setData('html_template', event.target.value)} className={inputClass} />
                            <div className="mt-2 flex flex-wrap gap-2">
                                {Object.keys(placeholders).map((field) => (
                                    <button key={field} type="button" onClick={() => insertPlaceholder(field)} className={chipClass}>{`{{${field}}}`}</button>
                                ))}
                            </div>
                        </Field>

                        <div className="flex flex-wrap items-center gap-2">
                            <button type="submit" className={primaryBtn}>{campaignForm.data.id ? 'Save Campaign' : 'Create Campaign'}</button>
                            {campaignForm.data.id ? <button type="button" onClick={deleteCampaign} className={dangerBtn}>Delete</button> : null}
                            {campaignForm.data.id ? <button type="button" onClick={sendTest} className={secondaryBtn}>Send Test</button> : null}
                            {campaignForm.data.id ? <button type="button" onClick={previewAudience} className={secondaryBtn}>{previewLoading ? 'Loading...' : 'Preview Audience'}</button> : null}
                            {campaignForm.data.id ? <button type="button" onClick={sendCampaign} className={secondaryBtn}>Send Campaign</button> : null}
                        </div>

                        {audiencePreview ? (
                            <div className="rounded-jv-sm border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-200">
                                <p className="font-semibold">Audience count: {audiencePreview.count}</p>
                                <p className="mt-1 text-xs text-emerald-200/80">Sample: {(audiencePreview.sample || []).map((item) => `${item.name} <${item.email}>`).join(', ')}</p>
                            </div>
                        ) : null}
                    </form>
                </section>

                <section className="grid gap-6 xl:grid-cols-2">
                    <div className="jv-card jv-card--pad">
                        <h2 className="jv-display jv-display--sm">System Email Template Designer</h2>
                        <p className="mt-2 text-sm text-white/55">Customize default app emails (subject, sender, header image, and body).</p>

                        <div className="mt-4 space-y-4">
                            <Field label="Template">
                                <select value={templateKey} onChange={(event) => setTemplateKey(event.target.value)} className={inputClass}>
                                    {Object.entries(templatesForm.data.email_templates || {}).map(([key, value]) => (
                                        <option key={key} value={key}>{value?.name || key}</option>
                                    ))}
                                </select>
                            </Field>
                            <Field label="Template Name">
                                <input value={templateValue.name || ''} onChange={(event) => updateTemplateValue({ name: event.target.value })} className={inputClass} />
                            </Field>
                            <Field label="From Email (Optional)">
                                <input
                                    type="email"
                                    value={templateValue.from_email || ''}
                                    onChange={(event) => updateTemplateValue({ from_email: event.target.value })}
                                    className={inputClass}
                                    placeholder="notifications@yourdomain.com"
                                />
                            </Field>
                            <Field label="Subject Template">
                                <input value={templateValue.subject_template || ''} onChange={(event) => updateTemplateValue({ subject_template: event.target.value })} className={inputClass} />
                            </Field>
                            <div className="rounded-jv-sm border border-jv-line bg-white/[0.03] p-4">
                                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                                    <p className="text-sm font-semibold text-white">Drag &amp; Drop Blocks</p>
                                    <label className="jv-btn jv-btn--ghost jv-btn--sm cursor-pointer">
                                        {templateHeaderUploading ? 'Uploading header...' : 'Upload Header Image'}
                                        <input type="file" accept=".jpg,.jpeg,.png,.webp,.gif,.bmp,.avif" className="hidden" onChange={handleTemplateHeaderUpload} />
                                    </label>
                                </div>
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {BLOCK_TYPES.map((block) => <button key={block.type} type="button" onClick={() => addTemplateBlock(block.type)} className={ghostChipBtn}>Add {block.label}</button>)}
                                    <button type="button" onClick={() => updateTemplateValue({ html_template: toBlockHtml(templateValue.builder_layout || []) })} className={accentChipBtn}>Generate HTML</button>
                                </div>
                                <div className="mt-3 space-y-2">
                                    {(templateValue.builder_layout || []).map((block, index) => (
                                        <BlockEditor
                                            key={block.id || `${block.type}-${index}`}
                                            block={block}
                                            index={index}
                                            onChange={(idx, key, val) => updateTemplateBlock(idx, key, val)}
                                            onRemove={removeTemplateBlock}
                                            onImageUpload={async (blockIndex, file) => {
                                                const dataUrl = await fileToDataUrl(file);
                                                if (dataUrl) updateTemplateBlock(blockIndex, 'url', dataUrl);
                                            }}
                                            onDragStart={() => setTemplateDragIndex(index)}
                                            onDragOver={(event) => event.preventDefault()}
                                            onDrop={() => {
                                                if (templateDragIndex === null || templateDragIndex === index) return;
                                                moveTemplateBlock(templateDragIndex, index);
                                                setTemplateDragIndex(null);
                                            }}
                                        />
                                    ))}
                                </div>
                            </div>
                            <Field label="HTML Template">
                                <textarea rows={8} value={templateValue.html_template || ''} onChange={(event) => updateTemplateValue({ html_template: event.target.value })} className={inputClass} />
                            </Field>
                            <button type="button" onClick={saveTemplates} className={primaryBtn}>Save System Templates</button>
                        </div>
                    </div>

                    <div className="jv-card jv-card--pad">
                        <h2 className="jv-display jv-display--sm">Invoice / Receipt Style Designer</h2>
                        <p className="mt-2 text-sm text-white/55">Control theme colors and company lines for invoice and receipt output.</p>

                        <div className="mt-5 grid gap-4">
                            <Field label="Primary Color">
                                <input type="color" value={invoiceStyleForm.data.invoice_style.primary_color} onChange={(event) => invoiceStyleForm.setData('invoice_style', { ...invoiceStyleForm.data.invoice_style, primary_color: event.target.value })} className="h-11 w-20 rounded-jv-sm border border-jv-line-strong bg-white/[0.05]" />
                            </Field>
                            <Field label="Accent Color">
                                <input type="color" value={invoiceStyleForm.data.invoice_style.accent_color} onChange={(event) => invoiceStyleForm.setData('invoice_style', { ...invoiceStyleForm.data.invoice_style, accent_color: event.target.value })} className="h-11 w-20 rounded-jv-sm border border-jv-line-strong bg-white/[0.05]" />
                            </Field>
                            <Field label="Text Color">
                                <input type="color" value={invoiceStyleForm.data.invoice_style.text_color} onChange={(event) => invoiceStyleForm.setData('invoice_style', { ...invoiceStyleForm.data.invoice_style, text_color: event.target.value })} className="h-11 w-20 rounded-jv-sm border border-jv-line-strong bg-white/[0.05]" />
                            </Field>
                            <Field label="Company Lines (one per line)">
                                <textarea rows={5} value={(invoiceStyleForm.data.invoice_style.company_lines || []).join('\n')} onChange={(event) => invoiceStyleForm.setData('invoice_style', { ...invoiceStyleForm.data.invoice_style, company_lines: event.target.value.split(/\r?\n/) })} className={inputClass} />
                            </Field>
                            <Field label="Footer Note">
                                <input value={invoiceStyleForm.data.invoice_style.footer_note || ''} onChange={(event) => invoiceStyleForm.setData('invoice_style', { ...invoiceStyleForm.data.invoice_style, footer_note: event.target.value })} className={inputClass} />
                            </Field>
                            <button type="button" onClick={saveInvoiceStyle} className={primaryBtn}>Save Invoice/Receipt Style</button>
                        </div>
                    </div>
                </section>
            </div>
        </AuthenticatedLayout>
    );
}

function Field({ label, className = '', children }) {
    return (
        <div className={className}>
            <label className="mb-1.5 block text-sm font-medium text-white/65">{label}</label>
            {children}
        </div>
    );
}

function BlockEditor({ block, index, onChange, onRemove, onImageUpload, onDragStart, onDragOver, onDrop }) {
    const type = String(block?.type || '');

    return (
        <div
            draggable
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDrop={onDrop}
            className="rounded-jv-sm border border-jv-line bg-white/[0.03] p-3"
        >
            <div className="mb-2 flex items-center justify-between">
                <p className="jv-mono text-white/40">{type}</p>
                <button type="button" onClick={() => onRemove(index)} className="text-xs font-semibold text-red-300 transition hover:text-red-200">Remove</button>
            </div>

            {type === 'heading' || type === 'text' ? (
                <textarea rows={3} value={block.content || ''} onChange={(event) => onChange(index, 'content', event.target.value)} className={inputClass} />
            ) : null}
            {type === 'image' ? (
                <div className="space-y-2">
                    <input placeholder="Image URL or path" value={block.url || ''} onChange={(event) => onChange(index, 'url', event.target.value)} className={inputClass} />
                    <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.webp,.gif"
                        onChange={async (event) => {
                            const file = event.target.files?.[0];
                            if (!file || typeof onImageUpload !== 'function') return;
                            try {
                                await onImageUpload(index, file);
                            } catch {
                                // ignored
                            }
                        }}
                        className="block w-full text-xs text-white/55 file:mr-3 file:rounded-full file:border-0 file:bg-jv-accent file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-[#1a68ff]"
                    />
                    <input placeholder="Alt text" value={block.alt || ''} onChange={(event) => onChange(index, 'alt', event.target.value)} className={inputClass} />
                </div>
            ) : null}
            {type === 'button' ? (
                <div className="space-y-2">
                    <input placeholder="Button label" value={block.label || ''} onChange={(event) => onChange(index, 'label', event.target.value)} className={inputClass} />
                    <input placeholder="Button URL" value={block.url || ''} onChange={(event) => onChange(index, 'url', event.target.value)} className={inputClass} />
                </div>
            ) : null}
            {type === 'spacer' ? (
                <input type="number" min="8" max="64" value={block.height || 20} onChange={(event) => onChange(index, 'height', event.target.value)} className={inputClass} />
            ) : null}
        </div>
    );
}

const inputClass = 'w-full rounded-jv-sm border border-jv-line-strong bg-white/[0.05] px-3 py-2 text-sm text-white transition placeholder:text-white/30 focus:border-jv-accent focus:outline-none focus:ring-4 focus:ring-jv-accent/15';
const chipClass = 'rounded-full border border-jv-line bg-white/[0.05] px-2.5 py-1 text-xs font-semibold text-white/60 transition hover:bg-white/[0.10] hover:text-white';
const primaryBtn = 'jv-btn jv-btn--primary';
const secondaryBtn = 'jv-btn jv-btn--ghost';
const dangerBtn = 'jv-btn jv-btn--sm border border-red-500/40 bg-red-500/10 text-red-300 hover:bg-red-500/20';
const ghostChipBtn = 'jv-btn jv-btn--ghost jv-btn--sm';
const accentChipBtn = 'jv-btn jv-btn--sm border border-jv-accent-line bg-jv-accent/10 text-[#a9c4ff] hover:bg-jv-accent/20 hover:text-white';
