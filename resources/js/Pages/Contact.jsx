import { Head, useForm, usePage } from "@inertiajs/react";
import PageTheme from "@/Layouts/PageTheme";
import { RevealSection, Stagger, StaggerItem } from "@/Components/MotionReveal";
import PublicPageHeader from "@/Components/PublicPageHeader";
import GoogleReviewsSection from "@/Components/GoogleReviewsSection";
import { EnvelopeIcon, MapPinIcon, PhoneIcon } from "@heroicons/react/24/outline";
import { useEffect } from "react";
import HumanVerificationField from "@/Components/HumanVerificationField";

const contactCards = [
    {
        label: "Call",
        value: "+234 810 867 1804",
        href: "tel:+2348108671804",
        icon: PhoneIcon,
    },
    {
        label: "Email",
        value: "info@bellahoptions.com",
        href: "mailto:info@bellahoptions.com",
        icon: EnvelopeIcon,
    },
    {
        label: "Visit",
        value: "Ogun State, Nigeria",
        href: null,
        icon: MapPinIcon,
    },
];

export default function Contact({
    humanVerificationMode = "math",
    humanCheckQuestion = "",
    humanCheckNonce = "",
    turnstileSiteKey = "",
    formRenderedAt = 0,
}) {
    const { flash } = usePage().props;
    const { data, setData, post, processing, errors, reset, clearErrors } = useForm({
        name: "",
        email: "",
        phone: "",
        project_type: "",
        message: "",
        human_check_answer: "",
        turnstile_token: "",
        human_check_nonce: humanCheckNonce,
        form_rendered_at: formRenderedAt,
        company_name: "",
        website: "",
        contact_notes: "",
    });

    useEffect(() => {
        setData((previous) => ({
            ...previous,
            human_check_nonce: humanCheckNonce,
            form_rendered_at: formRenderedAt,
            human_check_answer: "",
            turnstile_token: "",
            company_name: "",
            website: "",
            contact_notes: "",
        }));
    }, [formRenderedAt, humanCheckNonce, setData]);

    const submit = (event) => {
        event.preventDefault();

        post(route("contact.submit"), {
            preserveScroll: true,
            onSuccess: () => {
                reset("name", "email", "phone", "project_type", "message", "human_check_answer", "turnstile_token", "company_name", "website", "contact_notes");
                clearErrors();
            },
        });
    };

    return (
        <>
            <Head title="Contact Bellah Options" />
            <PageTheme>
                <main className="bg-white text-gray-950">
                    <PublicPageHeader
                        pageKey="contact"
                        fallbackTitle="Tell us what you are building."
                        fallbackText="Share the project, launch, campaign, or brand challenge. We will help you pick a clear next step."
                    />

                    <RevealSection className="bg-gray-50 py-16 sm:py-20 lg:py-24">
                        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
                            <Stagger className="grid gap-4">
                                {contactCards.map((item) => {
                                    const Icon = item.icon;
                                    const content = (
                                        <StaggerItem
                                            as="article"
                                            className="flex items-center gap-4 bg-white p-6 shadow-sm ring-1 ring-gray-200"
                                        >
                                            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-blue-50 text-[#000285]">
                                                <Icon className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black uppercase tracking-[0.18em] text-gray-500">{item.label}</p>
                                                <p className="mt-1 font-bold text-gray-950">{item.value}</p>
                                            </div>
                                        </StaggerItem>
                                    );

                                    return item.href ? (
                                        <a key={item.label} href={item.href}>{content}</a>
                                    ) : (
                                        <div key={item.label}>{content}</div>
                                    );
                                })}
                            </Stagger>

                            <form onSubmit={submit} className="bg-white p-6 shadow-sm ring-1 ring-gray-200">
                                {flash?.success && (
                                    <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                                        {flash.success}
                                    </div>
                                )}
                                {flash?.error && (
                                    <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                        {flash.error}
                                    </div>
                                )}

                                <input
                                    type="text"
                                    name="company_name"
                                    value={data.company_name}
                                    onChange={(event) => setData("company_name", event.target.value)}
                                    className="hidden"
                                    tabIndex={-1}
                                    autoComplete="off"
                                    aria-hidden="true"
                                />
                                <input
                                    type="text"
                                    name="website"
                                    value={data.website}
                                    onChange={(event) => setData("website", event.target.value)}
                                    className="hidden"
                                    tabIndex={-1}
                                    autoComplete="off"
                                    aria-hidden="true"
                                />
                                <input
                                    type="text"
                                    name="contact_notes"
                                    value={data.contact_notes}
                                    onChange={(event) => setData("contact_notes", event.target.value)}
                                    className="hidden"
                                    tabIndex={-1}
                                    autoComplete="off"
                                    aria-hidden="true"
                                />

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <Field
                                        label="Name"
                                        placeholder="Your name"
                                        value={data.name}
                                        onChange={(event) => setData("name", event.target.value)}
                                        error={errors.name}
                                    />
                                    <Field
                                        label="Email"
                                        placeholder="you@example.com"
                                        type="email"
                                        value={data.email}
                                        onChange={(event) => setData("email", event.target.value)}
                                        error={errors.email}
                                    />
                                    <Field
                                        label="Phone"
                                        placeholder="+234 800 000 0000"
                                        value={data.phone}
                                        onChange={(event) => setData("phone", event.target.value)}
                                        error={errors.phone}
                                    />
                                    <div className="sm:col-span-2">
                                        <Field
                                            label="Project Type"
                                            placeholder="Brand design, website, campaign..."
                                            value={data.project_type}
                                            onChange={(event) => setData("project_type", event.target.value)}
                                            error={errors.project_type}
                                        />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label className="mb-2 block text-sm font-bold text-gray-700">Message</label>
                                        <textarea
                                            rows={6}
                                            value={data.message}
                                            onChange={(event) => setData("message", event.target.value)}
                                            className="w-full rounded-md border-gray-300 text-sm focus:border-[#000285] focus:ring-[#000285]"
                                            placeholder="Tell us what you need..."
                                        />
                                        {errors.message && <p className="mt-1 text-xs text-red-600">{errors.message}</p>}
                                    </div>
                                    <div className="sm:col-span-2">
                                        <HumanVerificationField
                                            mode={humanVerificationMode}
                                            question={humanCheckQuestion}
                                            turnstileSiteKey={turnstileSiteKey}
                                            mathValue={data.human_check_answer}
                                            onMathChange={(value) => setData("human_check_answer", value)}
                                            onTurnstileChange={(token) => setData("turnstile_token", token)}
                                            mathError={errors.human_check_answer}
                                            turnstileError={errors.turnstile_token}
                                        />
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="mt-5 rounded-md bg-[#000285] px-6 py-3 text-sm font-black text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {processing ? "Sending..." : "Send Message"}
                                </button>
                                <p className="mt-3 text-xs text-gray-500">
                                    Protected with rate limiting, honeypot checks, and human verification.
                                </p>
                            </form>
                        </div>
                    </RevealSection>

                    <GoogleReviewsSection
                        className="bg-white py-16 sm:py-20"
                        title="What Clients Say Before They Reach Out"
                        subtitle="Recent Google reviews from businesses and founders who have worked with Bellah Options."
                    />
                </main>
            </PageTheme>
        </>
    );
}

function Field({ label, type = "text", placeholder = "", value = "", onChange, error = "" }) {
    return (
        <div>
            <label className="mb-2 block text-sm font-bold text-gray-700">{label}</label>
            <input
                type={type}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                className="w-full rounded-md border-gray-300 text-sm focus:border-[#000285] focus:ring-[#000285]"
            />
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
    );
}
