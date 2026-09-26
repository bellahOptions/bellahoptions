import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import AutosaveStatusPill from '@/Components/AutosaveStatusPill';
import MediaSelectorModal, { mediaPreviewUrl, useMediaSelector } from '@/Components/MediaSelectorModal';
import PaymentAccountsEditor from '@/Components/PaymentAccountsEditor';
import { Eyebrow } from '@/Components/PublicUI';
import usePlatformSettingsAutosave from '@/hooks/use-platform-settings-autosave';
import { Head, useForm, usePage } from '@inertiajs/react';

/**
 * Platform settings: access modes, branding, contact details, payment fallback.
 *
 * This screen used to hold every unrelated setting in one 1700-line file. The
 * modules that had their own concerns moved to dedicated pages:
 *
 *   Service Page & Modal Images -> Admin/Dashboard
 *   Service Announcement Modal  -> Admin/Announcements
 *   Public SEO Meta             -> Admin/SeoMeta
 *   Client Reviews Manager      -> Admin/ClientReviews
 *   Legal Terms Manager         -> Admin/LegalTerms
 *
 * Each of those pages now owns its slice of the settings payload. The backend
 * treats every top-level key as an optional partial update, so saving one slice
 * never clobbers another.
 */

/**
 * Mirrors App\Support\PlatformSettings::usablePaymentFallback() so the warning
 * banner reflects exactly when the customer-facing transfer option disappears.
 *
 * A customer needs every field of at least one account, so an incomplete row is
 * simply not offered rather than shown half-filled.
 */
const isAccountComplete = (account) =>
    Boolean(
        String(account?.bank_name || '').trim()
        && String(account?.account_name || '').trim()
        && String(account?.account_number || '').trim(),
    );

const isPaymentFallbackUsable = (fallback) =>
    Boolean(fallback?.enabled && (fallback?.accounts || []).some(isAccountComplete));

const blankAccount = () => ({
    bank_name: '',
    bank_code: '',
    account_name: '',
    account_number: '',
});

/**
 * The form always needs at least one row to type into. A blank row is dropped by
 * the server, so keeping one here never persists an empty account.
 */
const accountsForForm = (fallback) => {
    const accounts = Array.isArray(fallback?.accounts) ? fallback.accounts : [];

    return accounts.length > 0
        ? accounts.map((account) => ({
            bank_name: account?.bank_name || '',
            bank_code: account?.bank_code || '',
            account_name: account?.account_name || '',
            account_number: account?.account_number || '',
        }))
        : [blankAccount()];
};

const inputClassName =
    'w-full rounded-jv-sm border border-jv-line-strong bg-white/[0.05] px-3 py-2 text-sm text-white transition placeholder:text-white/30 focus:border-jv-accent focus:outline-none focus:ring-4 focus:ring-jv-accent/15';

export default function Settings({ settings = {} }) {
    const { flash } = usePage().props;

    const { data, setData, errors, setError, clearErrors } = useForm({
        maintenance_mode: Boolean(settings?.maintenance_mode),
        website_uri: settings?.website_uri || '',
        contact_phone: settings?.contact_phone || '',
        contact_email: settings?.contact_email || '',
        contact_location: settings?.contact_location || '',
        contact_whatsapp_url: settings?.contact_whatsapp_url || '',
        contact_behance_url: settings?.contact_behance_url || '',
        contact_map_embed_url: settings?.contact_map_embed_url || '',
        logo_path: settings?.logo_path || '/logo-06.svg',
        favicon_path: settings?.favicon_path || '/favicon.ico',
        payment_fallback: {
            enabled: settings?.payment_fallback?.enabled !== false,
            accounts: accountsForForm(settings?.payment_fallback),
            instructions: settings?.payment_fallback?.instructions || '',
            reference_hint: settings?.payment_fallback?.reference_hint || '',
            support_email: settings?.payment_fallback?.support_email || '',
        },
    });

    const { statusText, statusClassName } = usePlatformSettingsAutosave({
        data,
        setError,
        clearErrors,
    });

    const selector = useMediaSelector();

    const updatePaymentFallback = (field, value) => {
        setData('payment_fallback', {
            ...(data.payment_fallback || {}),
            [field]: value,
        });
    };

    const pickBrandAsset = async (target) => {
        const path = await selector.pick(target);
        if (path) {
            setData(target, path);
        }
    };

    const uploadBrandAsset = async (target, file) => {
        const path = await selector.upload(file);
        if (path) {
            setData(target, path);
        }
    };

    const renderBrandAsset = ({ target, label, hint, previewClassName, alt, value }) => (
        <div>
            <label className="mb-1.5 block text-sm font-medium text-white/65">{label}</label>
            <input
                type="text"
                value={value}
                onChange={(event) => setData(target, event.target.value)}
                className={inputClassName}
            />
            {errors[target] && <p className="mt-1 text-xs text-red-300">{errors[target]}</p>}
            <div className="mt-2 flex flex-wrap gap-2">
                <label className="rounded-full border border-jv-accent-line bg-jv-accent/10 px-3 py-1.5 text-xs font-semibold text-[#a9c4ff] transition hover:bg-jv-accent/20 hover:text-white">
                    {hint}
                    <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file) {
                                uploadBrandAsset(target, file);
                            }
                            event.target.value = '';
                        }}
                    />
                </label>
                <button
                    type="button"
                    onClick={() => pickBrandAsset(target)}
                    className="rounded-full border border-jv-line-strong bg-white/[0.05] px-3 py-1.5 text-xs font-semibold text-white/70 transition hover:bg-white/[0.12] hover:text-white"
                >
                    Media Selector
                </button>
            </div>
            {value && (
                <img
                    src={mediaPreviewUrl(value)}
                    alt={alt}
                    className={`mt-3 rounded border border-jv-line bg-white/[0.06] ${previewClassName}`}
                />
            )}
        </div>
    );

    return (
        <AuthenticatedLayout>
            <Head title="Platform Settings" />

            <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
                <section className="jv-card jv-card--pad">
                    <Eyebrow>Configuration</Eyebrow>
                    <h1 className="jv-display jv-display--md mt-5">Platform Settings</h1>
                    <p className="jv-lead mt-4 max-w-2xl">
                        Control access modes, branding, contact details, and the payment fallback
                        account. Content and SEO settings live on their own pages in the sidebar.
                    </p>
                </section>

                {flash?.success && (
                    <div className="rounded-jv-sm border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                        {flash.success}
                    </div>
                )}

                {flash?.error && (
                    <div className="rounded-jv-sm border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                        {flash.error}
                    </div>
                )}

                <form onSubmit={(event) => event.preventDefault()} className="space-y-6">
                    <div className="jv-card jv-card--pad">
                        <h3 className="text-lg font-semibold tracking-tight text-white">
                            Access Control Modes
                        </h3>

                        <div className="mt-5 space-y-4">
                            <label className="flex items-start gap-3 rounded-jv-sm border border-jv-line bg-white/[0.03] p-4">
                                <input
                                    type="checkbox"
                                    checked={data.maintenance_mode}
                                    onChange={(event) =>
                                        setData('maintenance_mode', event.target.checked)
                                    }
                                    className="mt-1 h-4 w-4 rounded border-jv-line-strong bg-white/[0.06] text-jv-accent focus:ring-jv-accent/30"
                                />
                                <span>
                                    <span className="block text-sm font-semibold text-white">
                                        Maintenance Mode
                                    </span>
                                    <span className="mt-1 block text-sm text-white/55">
                                        Blocks all public routes while maintenance is active. Staff can
                                        still access the staff portal.
                                    </span>
                                </span>
                            </label>
                        </div>
                    </div>

                    <div className="jv-card jv-card--pad">
                        <h3 className="text-lg font-semibold tracking-tight text-white">Branding</h3>
                        <p className="mt-1 text-sm text-white/55">
                            Update the main website logo and favicon.
                        </p>

                        <div className="mt-5 grid gap-4 md:grid-cols-2">
                            {renderBrandAsset({
                                target: 'logo_path',
                                label: 'Logo Path',
                                hint: 'Upload Logo',
                                previewClassName: 'h-12 w-auto px-2 py-1',
                                alt: 'Website logo preview',
                                value: data.logo_path,
                            })}

                            {renderBrandAsset({
                                target: 'favicon_path',
                                label: 'Favicon Path',
                                hint: 'Upload Favicon',
                                previewClassName: 'h-10 w-10 p-1',
                                alt: 'Favicon preview',
                                value: data.favicon_path,
                            })}
                        </div>
                    </div>

                    <div className="jv-card jv-card--pad">
                        <h3 className="text-lg font-semibold tracking-tight text-white">
                            Default Contact Information
                        </h3>
                        <p className="mt-1 text-sm text-white/55">
                            This information is used across contact pages and website footer sections.
                        </p>

                        <div className="mt-5 grid gap-4 md:grid-cols-2">
                            <div className="md:col-span-2">
                                <label className="mb-1.5 block text-sm font-medium text-white/65">
                                    Main Website URL
                                </label>
                                <input
                                    type="url"
                                    value={data.website_uri}
                                    onChange={(event) => setData('website_uri', event.target.value)}
                                    placeholder="https://bellahoptions.com"
                                    className={inputClassName}
                                />
                                {errors.website_uri && (
                                    <p className="mt-1 text-xs text-red-300">{errors.website_uri}</p>
                                )}
                            </div>

                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-white/65">
                                    Phone
                                </label>
                                <input
                                    type="text"
                                    value={data.contact_phone}
                                    onChange={(event) =>
                                        setData('contact_phone', event.target.value)
                                    }
                                    className={inputClassName}
                                />
                                {errors.contact_phone && (
                                    <p className="mt-1 text-xs text-red-300">
                                        {errors.contact_phone}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-white/65">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={data.contact_email}
                                    onChange={(event) =>
                                        setData('contact_email', event.target.value)
                                    }
                                    className={inputClassName}
                                />
                                {errors.contact_email && (
                                    <p className="mt-1 text-xs text-red-300">
                                        {errors.contact_email}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-white/65">
                                    Location
                                </label>
                                <input
                                    type="text"
                                    value={data.contact_location}
                                    onChange={(event) =>
                                        setData('contact_location', event.target.value)
                                    }
                                    className={inputClassName}
                                />
                                {errors.contact_location && (
                                    <p className="mt-1 text-xs text-red-300">
                                        {errors.contact_location}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-white/65">
                                    WhatsApp URL
                                </label>
                                <input
                                    type="url"
                                    value={data.contact_whatsapp_url}
                                    onChange={(event) =>
                                        setData('contact_whatsapp_url', event.target.value)
                                    }
                                    className={inputClassName}
                                />
                                {errors.contact_whatsapp_url && (
                                    <p className="mt-1 text-xs text-red-300">
                                        {errors.contact_whatsapp_url}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-white/65">
                                    Behance URL
                                </label>
                                <input
                                    type="url"
                                    value={data.contact_behance_url}
                                    onChange={(event) =>
                                        setData('contact_behance_url', event.target.value)
                                    }
                                    className={inputClassName}
                                />
                                {errors.contact_behance_url && (
                                    <p className="mt-1 text-xs text-red-300">
                                        {errors.contact_behance_url}
                                    </p>
                                )}
                            </div>

                            <div className="md:col-span-2">
                                <label className="mb-1.5 block text-sm font-medium text-white/65">
                                    Google Map Embed URL
                                </label>
                                <input
                                    type="url"
                                    value={data.contact_map_embed_url}
                                    onChange={(event) =>
                                        setData('contact_map_embed_url', event.target.value)
                                    }
                                    className={inputClassName}
                                />
                                {errors.contact_map_embed_url && (
                                    <p className="mt-1 text-xs text-red-300">
                                        {errors.contact_map_embed_url}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="jv-card jv-card--pad">
                        <h3 className="text-lg font-semibold tracking-tight text-white">
                            Payment Fallback Accounts
                        </h3>
                        <p className="mt-1 text-sm text-white/55">
                            Shown to customers as a bank-transfer option when Paystack or Flutterwave
                            is unavailable. Add as many accounts as you need: customers see every
                            complete one. Pick a bank and type the account number and the registered
                            account name is fetched from Paystack to confirm it, so a mistyped number
                            cannot reach a customer. An account is only offered once its bank, account
                            name and account number are all filled in and the toggle below is on.
                        </p>

                        <label className="mt-5 flex items-start gap-3 rounded-jv-sm border border-jv-line bg-white/[0.03] p-4">
                            <input
                                type="checkbox"
                                checked={Boolean(data.payment_fallback?.enabled)}
                                onChange={(event) =>
                                    updatePaymentFallback('enabled', event.target.checked)
                                }
                                className="mt-0.5 h-4 w-4 rounded border-jv-line-strong bg-white/[0.06]"
                            />
                            <span>
                                <span className="block text-sm font-semibold text-white">
                                    Offer bank transfer as a fallback
                                </span>
                                <span className="mt-1 block text-xs text-white/55">
                                    Turn this off to fail closed and require online payment. Existing
                                    transfer submissions already recorded are unaffected.
                                </span>
                            </span>
                        </label>

                        <PaymentAccountsEditor
                            accounts={data.payment_fallback?.accounts || []}
                            errors={errors}
                            onChange={(accounts) => updatePaymentFallback('accounts', accounts)}
                        />

                        <div className="mt-5 grid gap-4 md:grid-cols-2">

                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-white/65">
                                    Payment Support Email
                                </label>
                                <input
                                    type="email"
                                    value={data.payment_fallback?.support_email || ''}
                                    onChange={(event) =>
                                        updatePaymentFallback('support_email', event.target.value)
                                    }
                                    placeholder="support@bellahoptions.com"
                                    className={inputClassName}
                                />
                                {errors['payment_fallback.support_email'] && (
                                    <p className="mt-1 text-xs text-red-300">
                                        {errors['payment_fallback.support_email']}
                                    </p>
                                )}
                                <p className="mt-1 text-xs text-white/45">
                                    Where customers send proof of payment.
                                </p>
                            </div>

                            <div className="md:col-span-2">
                                <label className="mb-1.5 block text-sm font-medium text-white/65">
                                    Reference Hint
                                </label>
                                <input
                                    type="text"
                                    value={data.payment_fallback?.reference_hint || ''}
                                    onChange={(event) =>
                                        updatePaymentFallback('reference_hint', event.target.value)
                                    }
                                    placeholder="Use your order code or invoice number as the transfer reference."
                                    className={inputClassName}
                                />
                                {errors['payment_fallback.reference_hint'] && (
                                    <p className="mt-1 text-xs text-red-300">
                                        {errors['payment_fallback.reference_hint']}
                                    </p>
                                )}
                            </div>

                            <div className="md:col-span-2">
                                <label className="mb-1.5 block text-sm font-medium text-white/65">
                                    Transfer Instructions
                                </label>
                                <textarea
                                    rows={3}
                                    value={data.payment_fallback?.instructions || ''}
                                    onChange={(event) =>
                                        updatePaymentFallback('instructions', event.target.value)
                                    }
                                    placeholder="Use your invoice number or order code as the transfer reference and send proof of payment to support."
                                    className={inputClassName}
                                />
                                {errors['payment_fallback.instructions'] && (
                                    <p className="mt-1 text-xs text-red-300">
                                        {errors['payment_fallback.instructions']}
                                    </p>
                                )}
                            </div>
                        </div>

                        {!isPaymentFallbackUsable(data.payment_fallback) && (
                            <p className="mt-4 rounded-jv-sm border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                                The transfer fallback is currently hidden from customers because it is
                                {data.payment_fallback?.enabled ? ' incomplete' : ' switched off'}.
                            </p>
                        )}
                    </div>
                </form>
            </div>

            <AutosaveStatusPill statusText={statusText} statusClassName={statusClassName} />
            <MediaSelectorModal controller={selector} />
        </AuthenticatedLayout>
    );
}
