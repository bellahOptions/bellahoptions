import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import AutosaveStatusPill from '@/Components/AutosaveStatusPill';
import { Eyebrow } from '@/Components/PublicUI';
import RichTextEditor from '@/Components/RichTextEditor';
import usePlatformSettingsAutosave from '@/hooks/use-platform-settings-autosave';
import { Head, Link, useForm } from '@inertiajs/react';
import { DocumentTextIcon } from '@heroicons/react/24/outline';

/**
 * Legal terms manager.
 *
 * The content written here is what the public policy pages render, so the
 * precedence chain is: this stored term, else the parser's reading of it, else
 * the built-in copy in App\Support\PolicyContent.
 */

const quillModules = {
    toolbar: [
        [{ header: [2, 3, 4, false] }],
        ['bold', 'italic', 'underline'],
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
    'list',
    'bullet',
    'blockquote',
    'link',
];

const POLICIES = [
    {
        field: 'terms_of_service',
        label: 'Terms of Service Content',
        publicPath: '/terms-of-service',
    },
    {
        field: 'privacy_policy',
        label: 'Privacy Policy Content',
        publicPath: '/privacy-policy',
    },
    {
        field: 'cookie_policy',
        label: 'Cookie Policy Content',
        publicPath: '/cookie-policy',
    },
];

function TermsEditor({ label, publicPath, value, onChange, error }) {
    return (
        <div>
            <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-2">
                <label className="block text-sm font-medium text-white/65">{label}</label>
                <Link
                    href={publicPath}
                    className="text-xs font-semibold text-white/45 transition-colors hover:text-white"
                >
                    View public page
                </Link>
            </div>
            <div className="overflow-hidden rounded-jv-sm border border-jv-line-strong bg-white/[0.05] focus-within:border-jv-accent">
                <RichTextEditor
                    value={value}
                    onChange={onChange}
                    modules={quillModules}
                    formats={quillFormats}
                    placeholder="Write policy content here..."
                    className="min-h-[280px]"
                />
            </div>
            {error && <p className="mt-1 text-xs text-red-300">{error}</p>}
        </div>
    );
}

export default function LegalTerms({ settings = {} }) {
    const terms = settings?.terms || {};

    const { data, setData, errors, setError, clearErrors } = useForm({
        terms: {
            terms_of_service: terms?.terms_of_service || '',
            privacy_policy: terms?.privacy_policy || '',
            cookie_policy: terms?.cookie_policy || '',
        },
    });

    const { statusText, statusClassName } = usePlatformSettingsAutosave({
        data,
        setError,
        clearErrors,
    });

    const updateTerm = (field, value) => {
        setData('terms', {
            ...(data.terms || {}),
            [field]: value,
        });
    };

    const filledCount = POLICIES.filter((policy) =>
        String(data.terms?.[policy.field] || '').trim(),
    ).length;

    return (
        <AuthenticatedLayout>
            <Head title="Legal Terms" />

            <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
                <section className="jv-card jv-card--pad">
                    <Eyebrow>Legal</Eyebrow>
                    <h1 className="jv-display jv-display--md mt-5">Legal Terms Manager</h1>
                    <p className="jv-lead mt-4 max-w-2xl">
                        Update the Terms of Service, Privacy Policy, and Cookie Policy. These are the
                        pages customers agree to at checkout.
                    </p>

                    <div className="mt-6 flex flex-wrap gap-3">
                        <span className="inline-flex items-center gap-2 rounded-full border border-jv-line bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-white/70">
                            <DocumentTextIcon className="h-4 w-4 text-jv-accent" />
                            {filledCount} of {POLICIES.length} policies have custom wording
                        </span>
                    </div>
                </section>

                {filledCount < POLICIES.length && (
                    <p className="rounded-jv-sm border border-jv-line bg-white/[0.03] px-4 py-3 text-xs text-white/55">
                        A policy left blank falls back to the wording the site ships with, so the
                        public page is never empty.
                    </p>
                )}

                <form onSubmit={(event) => event.preventDefault()} className="space-y-6">
                    <div className="jv-card jv-card--pad">
                        <h3 className="text-lg font-semibold tracking-tight text-white">
                            Policy Content
                        </h3>
                        <p className="mt-1 text-xs text-white/45">
                            Use the editor to format headings, paragraphs, lists, and links. Numbered
                            headings become the section list and in-page navigation on the public page.
                        </p>

                        <div className="mt-5 grid gap-4">
                            {POLICIES.map((policy) => (
                                <TermsEditor
                                    key={policy.field}
                                    label={policy.label}
                                    publicPath={policy.publicPath}
                                    value={data.terms?.[policy.field] || ''}
                                    onChange={(value) => updateTerm(policy.field, value)}
                                    error={errors[`terms.${policy.field}`]}
                                />
                            ))}
                        </div>
                    </div>
                </form>
            </div>

            <AutosaveStatusPill statusText={statusText} statusClassName={statusClassName} />
        </AuthenticatedLayout>
    );
}
