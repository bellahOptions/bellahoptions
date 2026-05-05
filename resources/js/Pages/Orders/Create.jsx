import { Head, Link, useForm, usePage } from "@inertiajs/react";
import { useEffect, useMemo, useState } from "react";
import PageTheme from "@/Layouts/PageTheme";
import { RevealSection } from "@/Components/MotionReveal";
import {
    ArrowLeftIcon,
    ArrowRightIcon,
    CheckCircleIcon,
    LockClosedIcon,
    ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { buildOrderFormSeed, formatMoney } from "./orderUtils";

const steps = [
    "Client",
    "Service",
    "Business",
    "Package",
    "Account",
    "Review",
];

const errorStepMap = {
    full_name: 1,
    email: 1,
    phone: 1,
    position: 1,
    business_name: 3,
    business_website: 3,
    has_logo: 3,
    logo_design_interest: 3,
    logo_addon_package: 3,
    project_summary: 3,
    project_goals: 3,
    target_audience: 3,
    preferred_style: 3,
    deliverables: 3,
    timeline_preference: 3,
    additional_details: 3,
    service_package: 4,
    discount_code: 4,
    create_account: 5,
    password: 5,
    password_confirmation: 5,
    human_check_answer: 6,
    human_check_nonce: 6,
    form_rendered_at: 6,
    website: 6,
    company_name: 6,
};

export default function OrderCreate({
    serviceSlug,
    humanCheckQuestion = "",
    humanCheckNonce = "",
    formRenderedAt = 0,
    isAuthenticated = false,
    discountCode = "",
    discountSummary = "",
    checkoutServices = {},
    logoAddons = {},
    selectedServiceSlug,
    selectedPackageCode,
    visitorLocalization,
    profileDefaults = {},
}) {
    const { flash, auth, localization } = usePage().props;
    const locale = visitorLocalization?.locale?.replace("_", "-") || localization?.locale?.replace("_", "-") || "en-NG";
    const currency = visitorLocalization?.currency || localization?.currency || "NGN";
    const availableServices = Object.entries(checkoutServices || {});
    const initialServiceSlug = selectedServiceSlug && checkoutServices[selectedServiceSlug]
        ? selectedServiceSlug
        : serviceSlug;

    const { data, setData, post, processing, errors } = useForm(
        buildOrderFormSeed(checkoutServices, {
            full_name: profileDefaults.name || auth?.user?.name || "",
            email: profileDefaults.email || auth?.user?.email || "",
            service_package: selectedPackageCode || "",
            human_check_nonce: humanCheckNonce || "",
            form_rendered_at: formRenderedAt || 0,
            discount_code: discountCode || "",
        }),
    );

    const [currentStep, setCurrentStep] = useState(1);
    const [activeServiceSlug, setActiveServiceSlug] = useState(initialServiceSlug);

    const activeService = checkoutServices[activeServiceSlug] || null;
    const activePackages = activeService?.packages || {};
    const activePackageEntries = Object.entries(activePackages);
    const logoAddonEntries = Object.entries(logoAddons || {});
    const selectedLogoAddon = logoAddons[data.logo_addon_package] || null;

    useEffect(() => {
        if (!data.service_package && selectedPackageCode) {
            setData("service_package", selectedPackageCode);
        }
    }, [data.service_package, selectedPackageCode, setData]);

    useEffect(() => {
        if (!activePackages[data.service_package]) {
            const firstPackageCode = activePackageEntries[0]?.[0] || "";
            setData("service_package", firstPackageCode);
        }
    }, [activePackageEntries, activePackages, data.service_package, setData]);

    useEffect(() => {
        if (data.has_logo !== "no") {
            if (data.logo_design_interest !== "") {
                setData("logo_design_interest", "");
            }

            if (data.logo_addon_package !== "") {
                setData("logo_addon_package", "");
            }
        }
    }, [data.has_logo, data.logo_addon_package, data.logo_design_interest, setData]);

    useEffect(() => {
        if (data.logo_design_interest !== "yes" && data.logo_addon_package !== "") {
            setData("logo_addon_package", "");
        }
    }, [data.logo_addon_package, data.logo_design_interest, setData]);

    const summaryItems = useMemo(() => {
        const packageData = activePackages[data.service_package] || null;

        return [
            ["Client", data.full_name || "Not provided"],
            ["Email", data.email || "Not provided"],
            ["Business", data.business_name || "Not provided"],
            ["Service", activeService?.name || activeServiceSlug],
            ["Package", packageData?.name || "Not selected"],
            ["Logo", data.has_logo === "yes" ? "Client already has a logo" : data.has_logo === "no" ? "Client needs logo support" : "Not answered"],
            ["Logo Add-on", selectedLogoAddon?.name || (data.logo_design_interest === "no" ? "No add-on selected" : "Not selected")],
            ["Amount", packageData ? formatMoney(packageData.price, currency, locale) : "Pending"],
            ["Order Total", formatMoney((Number(packageData?.price || 0) + Number(selectedLogoAddon?.price || 0)), currency, locale)],
        ];
    }, [activePackages, activeService?.name, activeServiceSlug, currency, data.business_name, data.email, data.full_name, data.has_logo, data.logo_design_interest, data.service_package, locale, selectedLogoAddon]);

    const nextStep = () => setCurrentStep((value) => Math.min(steps.length, value + 1));
    const previousStep = () => setCurrentStep((value) => Math.max(1, value - 1));

    const submit = (event) => {
        event.preventDefault();

        post(route("orders.store", { serviceSlug: activeServiceSlug }), {
            preserveScroll: true,
            onError: (formErrors) => {
                const nextErrorStep = resolveErrorStep(formErrors, activeService);
                setCurrentStep(nextErrorStep);
            },
        });
    };

    const visibleErrorMessages = useMemo(() => Object.values(errors || {}).filter(Boolean), [errors]);

    return (
        <>
            <Head title="Start Order" />

            <PageTheme>
                <main className="bg-white text-gray-950">
                    <RevealSection className="bg-[#000285] py-16 text-white sm:py-20 lg:py-24">
                        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                            <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
                                <div>
                                    <p className="text-sm font-black uppercase tracking-[0.22em] text-cyan-300">Secure Order Intake</p>
                                    <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
                                        Start your Bellah Options project.
                                    </h1>
                                    <p className="mt-5 max-w-2xl text-base leading-8 text-blue-100">
                                        Complete the guided form below to choose a service, select a package, and create your order record.
                                    </p>
                                </div>

                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="bg-white/10 p-5">
                                        <ShieldCheckIcon className="h-7 w-7 text-cyan-200" />
                                        <p className="mt-3 font-black">Protected checkout</p>
                                        <p className="mt-2 text-sm leading-6 text-blue-100">Timed guard, honeypot checks, and server-side validation are active.</p>
                                    </div>
                                    <div className="bg-white/10 p-5">
                                        <LockClosedIcon className="h-7 w-7 text-cyan-200" />
                                        <p className="mt-3 font-black">Invoice-ready flow</p>
                                        <p className="mt-2 text-sm leading-6 text-blue-100">Every successful submission creates an order and prepares the next payment step.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </RevealSection>

                    <RevealSection className="bg-gray-50 py-16 sm:py-20">
                        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[280px_1fr] lg:px-8">
                            <aside className="space-y-4">
                                <div className="bg-white p-6 shadow-sm ring-1 ring-gray-200">
                                    <p className="text-sm font-black uppercase tracking-[0.18em] text-[#000285]">Order Steps</p>
                                    <div className="mt-5 space-y-3">
                                        {steps.map((step, index) => {
                                            const stepNumber = index + 1;
                                            const active = currentStep === stepNumber;
                                            const complete = currentStep > stepNumber;

                                            return (
                                                <div key={step} className={`flex items-center gap-3 ${active ? "text-gray-950" : "text-gray-500"}`}>
                                                    <div className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-black ${complete ? "bg-[#000285] text-white" : active ? "border border-[#000285] text-[#000285]" : "bg-gray-100"}`}>
                                                        {complete ? <CheckCircleIcon className="h-5 w-5" /> : stepNumber}
                                                    </div>
                                                    <span className="font-bold">{step}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {(discountCode || data.discount_code) && (
                                    <div className="border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-700">
                                        Discount <strong>{data.discount_code || discountCode}</strong> is attached.
                                        {discountSummary ? ` (${discountSummary})` : ""}
                                    </div>
                                )}
                            </aside>

                            <form onSubmit={submit} className="bg-white p-6 shadow-sm ring-1 ring-gray-200 sm:p-8">
                                {flash?.error && (
                                    <div className="mb-5 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                        {flash.error}
                                    </div>
                                )}

                                {visibleErrorMessages.length > 0 && (
                                    <div className="mb-5 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                        <p className="font-bold">We could not submit the order yet.</p>
                                        <p className="mt-1">
                                            Please review the highlighted fields. We have taken you to the first step that needs attention.
                                        </p>
                                    </div>
                                )}

                                {currentStep === 1 && (
                                    <section>
                                        <SectionTitle
                                            title="Client Information"
                                            text="Tell us who is making the request so we can set up the order correctly."
                                        />
                                        <div className="mt-6 grid gap-4 sm:grid-cols-2">
                                            <Field label="Full Name" error={errors.full_name}>
                                                <input autoComplete="name" value={data.full_name} onChange={(event) => setData("full_name", event.target.value)} className={inputClassName} />
                                            </Field>
                                            <Field label="Email Address" error={errors.email}>
                                                <input
                                                    type="email"
                                                    inputMode="email"
                                                    autoComplete="email"
                                                    placeholder="name@company.com"
                                                    value={data.email}
                                                    onChange={(event) => setData("email", event.target.value)}
                                                    className={inputClassName}
                                                />
                                            </Field>
                                            <Field label="Phone / WhatsApp" error={errors.phone}>
                                                <input
                                                    type="tel"
                                                    inputMode="tel"
                                                    autoComplete="tel"
                                                    placeholder="+234 800 000 0000"
                                                    value={data.phone}
                                                    onChange={(event) => setData("phone", event.target.value)}
                                                    className={inputClassName}
                                                />
                                            </Field>
                                            <Field label="Role / Position" error={errors.position}>
                                                <input value={data.position} onChange={(event) => setData("position", event.target.value)} className={inputClassName} />
                                            </Field>
                                        </div>
                                    </section>
                                )}

                                {currentStep === 2 && (
                                    <section>
                                        <SectionTitle
                                            title="Service Selection"
                                            text="Choose the service lane and we’ll update the package and brief questions automatically."
                                        />
                                        <div className="mt-6 grid gap-4 sm:grid-cols-2">
                                            {availableServices.map(([slug, service]) => (
                                                <button
                                                    key={slug}
                                                    type="button"
                                                    onClick={() => setActiveServiceSlug(slug)}
                                                    className={`border p-5 text-left transition ${activeServiceSlug === slug ? "border-[#000285] bg-blue-50" : "border-gray-200 bg-white hover:border-blue-200"}`}
                                                >
                                                    <p className="text-lg font-black text-gray-950">{service.name}</p>
                                                    <p className="mt-2 text-sm leading-6 text-gray-600">{service.description}</p>
                                                </button>
                                            ))}
                                        </div>
                                    </section>
                                )}

                                {currentStep === 3 && (
                                    <section>
                                        <SectionTitle
                                            title="Business and Project Details"
                                            text="Give us the context we need to scope the work properly."
                                        />
                                        <div className="mt-6 grid gap-4 sm:grid-cols-2">
                                            <Field label="Business Name" error={errors.business_name}>
                                                <input value={data.business_name} onChange={(event) => setData("business_name", event.target.value)} className={inputClassName} />
                                            </Field>
                                            <Field label="Business Website" error={errors.business_website}>
                                                <input
                                                    type="url"
                                                    inputMode="url"
                                                    placeholder="https://yourbusiness.com"
                                                    value={data.business_website}
                                                    onChange={(event) => setData("business_website", event.target.value)}
                                                    className={inputClassName}
                                                />
                                            </Field>
                                            <Field label="Do You Already Have a Logo?" error={errors.has_logo}>
                                                <select value={data.has_logo} onChange={(event) => setData("has_logo", event.target.value)} className={inputClassName}>
                                                    <option value="">Select an option</option>
                                                    <option value="yes">Yes, we already have a logo</option>
                                                    <option value="no">No, we need logo support</option>
                                                </select>
                                            </Field>
                                            {data.has_logo === "no" && (
                                                <Field label="Do You Want Us to Design a Logo?" error={errors.logo_design_interest}>
                                                    <select value={data.logo_design_interest} onChange={(event) => setData("logo_design_interest", event.target.value)} className={inputClassName}>
                                                        <option value="">Select an option</option>
                                                        <option value="yes">Yes, add logo / brand design</option>
                                                        <option value="no">No, not right now</option>
                                                    </select>
                                                </Field>
                                            )}
                                            <Field label="Business / Project Summary" error={errors.project_summary} className="sm:col-span-2">
                                                <textarea rows={4} value={data.project_summary} onChange={(event) => setData("project_summary", event.target.value)} className={inputClassName} />
                                            </Field>
                                            <Field label="Project Goals" error={errors.project_goals} className="sm:col-span-2">
                                                <textarea rows={3} value={data.project_goals} onChange={(event) => setData("project_goals", event.target.value)} className={inputClassName} />
                                            </Field>
                                            <Field label="Target Audience" error={errors.target_audience}>
                                                <textarea rows={3} value={data.target_audience} onChange={(event) => setData("target_audience", event.target.value)} className={inputClassName} />
                                            </Field>
                                            <Field label="Preferred Style" error={errors.preferred_style}>
                                                <textarea rows={3} value={data.preferred_style} onChange={(event) => setData("preferred_style", event.target.value)} className={inputClassName} />
                                            </Field>
                                            <Field label="Expected Deliverables" error={errors.deliverables}>
                                                <textarea rows={3} value={data.deliverables} onChange={(event) => setData("deliverables", event.target.value)} className={inputClassName} />
                                            </Field>
                                            <Field label="Timeline Preference" error={errors.timeline_preference}>
                                                <input value={data.timeline_preference} onChange={(event) => setData("timeline_preference", event.target.value)} className={inputClassName} />
                                            </Field>
                                            <Field label="Additional Details" error={errors.additional_details} className="sm:col-span-2">
                                                <textarea rows={3} value={data.additional_details} onChange={(event) => setData("additional_details", event.target.value)} className={inputClassName} />
                                            </Field>
                                        </div>

                                        {data.has_logo === "no" && data.logo_design_interest === "yes" && (
                                            <div className="mt-8 border border-blue-200 bg-blue-50 p-5">
                                                <p className="text-sm font-black uppercase tracking-[0.18em] text-[#000285]">Logo / Brand Design Add-on</p>
                                                <p className="mt-2 text-sm leading-6 text-gray-600">
                                                    Choose the add-on package you want us to include with this order.
                                                </p>
                                                <div className="mt-4 grid gap-4 lg:grid-cols-3">
                                                    {logoAddonEntries.map(([code, addon]) => {
                                                        const selected = data.logo_addon_package === code;

                                                        return (
                                                            <button
                                                                key={code}
                                                                type="button"
                                                                onClick={() => setData("logo_addon_package", code)}
                                                                className={`border p-5 text-left transition ${selected ? "border-[#000285] bg-white" : "border-blue-200 bg-blue-50/40 hover:border-blue-300"}`}
                                                            >
                                                                <p className="text-lg font-black text-gray-950">{addon.name}</p>
                                                                <p className="mt-2 text-sm font-bold text-[#000285]">{formatMoney(addon.price, currency, locale)}</p>
                                                                <p className="mt-3 text-sm leading-6 text-gray-600">{addon.description}</p>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                                {errors.logo_addon_package && <p className="mt-3 text-sm text-red-600">{errors.logo_addon_package}</p>}
                                            </div>
                                        )}

                                        {(activeService?.intake || []).length > 0 && (
                                            <div className="mt-8 border border-gray-200 bg-gray-50 p-5">
                                                <p className="text-sm font-black uppercase tracking-[0.18em] text-[#000285]">{activeService?.name} Brief</p>
                                                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                                    {activeService.intake.map((field) => (
                                                        <DynamicField
                                                            key={field.name}
                                                            field={field}
                                                            value={data[field.name] || ""}
                                                            error={errors[field.name]}
                                                            onChange={(value) => setData(field.name, value)}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </section>
                                )}

                                {currentStep === 4 && (
                                    <section>
                                        <SectionTitle
                                            title="Choose Package"
                                            text="Pick the package that best matches the depth and speed of the work."
                                        />
                                        <div className="mt-6 grid gap-4 lg:grid-cols-3">
                                            {activePackageEntries.map(([code, pack]) => {
                                                const selected = data.service_package === code;

                                                return (
                                                    <button
                                                        key={code}
                                                        type="button"
                                                        onClick={() => setData("service_package", code)}
                                                        className={`border p-5 text-left transition ${selected ? "border-[#000285] bg-blue-50" : "border-gray-200 bg-white hover:border-blue-200"}`}
                                                    >
                                                        <p className="text-lg font-black text-gray-950">{pack.name}</p>
                                                        <p className="mt-2 text-sm font-bold text-[#000285]">{formatMoney(pack.price, currency, locale)}</p>
                                                        <p className="mt-3 text-sm leading-6 text-gray-600">{pack.description}</p>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        {errors.service_package && <p className="mt-3 text-sm text-red-600">{errors.service_package}</p>}
                                    </section>
                                )}

                                {currentStep === 5 && (
                                    <section>
                                        <SectionTitle
                                            title="Account Preference"
                                            text="Choose whether to continue as a guest or create a Bellah Options account for tracking."
                                        />
                                        {isAuthenticated ? (
                                            <div className="mt-6 border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-700">
                                                You are already logged in. This order will be linked to your account automatically.
                                            </div>
                                        ) : (
                                            <div className="mt-6 space-y-4">
                                                <label className="flex items-start gap-3 border border-gray-200 p-5">
                                                    <input
                                                        type="checkbox"
                                                        checked={Boolean(data.create_account)}
                                                        onChange={(event) => setData("create_account", event.target.checked)}
                                                        className="mt-1 rounded border-gray-300 text-[#000285] focus:ring-[#000285]"
                                                    />
                                                    <span>
                                                        <span className="block font-black text-gray-950">Create an account</span>
                                                        <span className="mt-1 block text-sm leading-6 text-gray-600">Track progress, review invoices, and keep future orders in one place.</span>
                                                    </span>
                                                </label>
                                                {data.create_account && (
                                                    <div className="grid gap-4 sm:grid-cols-2">
                                                        <Field label="Password" error={errors.password}>
                                                            <input type="password" value={data.password} onChange={(event) => setData("password", event.target.value)} className={inputClassName} />
                                                        </Field>
                                                        <Field label="Confirm Password" error={errors.password_confirmation}>
                                                            <input type="password" value={data.password_confirmation} onChange={(event) => setData("password_confirmation", event.target.value)} className={inputClassName} />
                                                        </Field>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </section>
                                )}

                                {currentStep === 6 && (
                                    <section>
                                        <SectionTitle
                                            title="Review and Submit"
                                            text="Check the core details below before we create the order."
                                        />
                                        <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_320px]">
                                            <div className="border border-gray-200">
                                                {summaryItems.map(([label, value]) => (
                                                    <div key={label} className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4 last:border-b-0">
                                                        <p className="text-sm font-bold text-gray-500">{label}</p>
                                                        <p className="text-right text-sm font-black text-gray-950">{value}</p>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="bg-[#000285] p-6 text-white">
                                                <p className="text-sm font-black uppercase tracking-[0.18em] text-gray-300">Summary</p>
                                                <p className="mt-3 text-2xl font-black">Submit the order</p>
                                                <p className="mt-3 text-sm leading-6 text-blue-100">We’ll create the order record first. If payment is required, you’ll be taken straight to the payment screen.</p>
                                            </div>
                                        </div>
                                        <div className="mt-6 max-w-sm">
                                            <Field label={`Human Match: ${humanCheckQuestion}`} error={errors.human_check_answer}>
                                                <input
                                                    type="text"
                                                    value={data.human_check_answer}
                                                    onChange={(event) => setData("human_check_answer", event.target.value)}
                                                    className={inputClassName}
                                                    autoComplete="off"
                                                />
                                            </Field>
                                        </div>
                                    </section>
                                )}

                                <input type="hidden" value={data.human_check_nonce} readOnly />
                                <input type="hidden" value={data.form_rendered_at} readOnly />
                                <input type="hidden" value={data.discount_code} readOnly />
                                <div className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
                                    <label>
                                        Leave this field empty
                                        <input
                                            type="text"
                                            name="website"
                                            tabIndex={-1}
                                            autoComplete="off"
                                            value={data.website}
                                            onChange={(event) => setData("website", event.target.value)}
                                        />
                                    </label>
                                    <label>
                                        Leave this field empty
                                        <input
                                            type="text"
                                            name="company_name"
                                            tabIndex={-1}
                                            autoComplete="off"
                                            value={data.company_name}
                                            onChange={(event) => setData("company_name", event.target.value)}
                                        />
                                    </label>
                                    <label>
                                        Leave this field empty
                                        <input
                                            type="text"
                                            name="contact_notes"
                                            tabIndex={-1}
                                            autoComplete="off"
                                            value={data.contact_notes}
                                            onChange={(event) => setData("contact_notes", event.target.value)}
                                        />
                                    </label>
                                </div>

                                <div className="mt-8 flex flex-col gap-3 border-t border-gray-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex gap-3">
                                        <button type="button" onClick={previousStep} disabled={currentStep === 1} className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-5 py-3 text-sm font-black text-gray-700 disabled:cursor-not-allowed disabled:opacity-50">
                                            <ArrowLeftIcon className="h-4 w-4" />
                                            Back
                                        </button>
                                        {currentStep < steps.length ? (
                                            <button type="button" onClick={nextStep} className="inline-flex items-center gap-2 rounded-md bg-[#000285] px-5 py-3 text-sm font-black text-white">
                                                Continue
                                                <ArrowRightIcon className="h-4 w-4" />
                                            </button>
                                        ) : (
                                            <button type="submit" disabled={processing} className="inline-flex items-center gap-2 rounded-md bg-[#000285] px-5 py-3 text-sm font-black text-white disabled:opacity-60">
                                                {processing ? "Submitting..." : "Submit Order"}
                                                <ArrowRightIcon className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                    <Link href="/services" className="text-sm font-black text-[#000285]">
                                        Back to services
                                    </Link>
                                </div>
                            </form>
                        </div>
                    </RevealSection>
                </main>
            </PageTheme>
        </>
    );
}

const inputClassName = "w-full border border-gray-300 px-3 py-2 text-sm text-gray-950 focus:border-[#000285] focus:outline-none";

function resolveErrorStep(formErrors, activeService) {
    const serviceSpecificFields = new Set((activeService?.intake || []).map((field) => field.name));
    let earliestStep = steps.length;

    Object.keys(formErrors || {}).forEach((fieldName) => {
        const mappedStep = serviceSpecificFields.has(fieldName)
            ? 3
            : (errorStepMap[fieldName] || steps.length);

        earliestStep = Math.min(earliestStep, mappedStep);
    });

    return earliestStep;
}

function SectionTitle({ title, text }) {
    return (
        <div>
            <h2 className="text-2xl font-black text-gray-950">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-gray-600">{text}</p>
        </div>
    );
}

function Field({ label, error, className = "", children }) {
    return (
        <div className={className}>
            <label className="mb-2 block text-sm font-bold text-gray-700">{label}</label>
            {children}
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
    );
}

function DynamicField({ field, value, error, onChange }) {
    const className = field.type === "textarea" ? "sm:col-span-2" : "";

    return (
        <Field label={field.label} error={error} className={className}>
            {field.type === "textarea" ? (
                <textarea rows={field.rows || 3} value={value} onChange={(event) => onChange(event.target.value)} className={inputClassName} />
            ) : field.type === "select" ? (
                <select value={value} onChange={(event) => onChange(event.target.value)} className={inputClassName}>
                    <option value="">Select an option</option>
                    {Object.entries(field.options || {}).map(([optionValue, optionLabel]) => (
                        <option key={optionValue} value={optionValue}>
                            {optionLabel}
                        </option>
                    ))}
                </select>
            ) : (
                <input
                    type={field.type === "number" ? "number" : field.type === "url" ? "url" : "text"}
                    inputMode={field.type === "url" ? "url" : field.type === "number" ? "numeric" : undefined}
                    placeholder={field.placeholder || ""}
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    className={inputClassName}
                />
            )}
            {field.hint && <p className="mt-1 text-xs text-gray-500">{field.hint}</p>}
        </Field>
    );
}
