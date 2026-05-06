import { Head, Link, useForm, usePage } from "@inertiajs/react";
import { useEffect, useMemo, useRef, useState } from "react";
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
import { loadTurnstileScript } from "@/lib/turnstile";

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
    turnstile_token: 6,
    human_check_nonce: 6,
    form_rendered_at: 6,
    website: 6,
    company_name: 6,
    contact_notes: 6,
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^[+0-9()\-\s]+$/;
const fullNamePattern = /^[\p{L}\s\-.'`]+$/u;
const httpUrlPattern = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;
const discountPattern = /^[A-Z0-9\-]+$/;
const orderDraftStoragePrefix = "bellah_order_draft_v2";
const sensitiveDraftFields = new Set([
    "password",
    "password_confirmation",
    "human_check_answer",
    "human_check_nonce",
    "form_rendered_at",
    "turnstile_token",
    "website",
    "company_name",
    "contact_notes",
]);

function resolveAutoTimeline(serviceSlug, packageCode) {
    if (serviceSlug === "brand-design" && packageCode === "logo-design") {
        return "8 working days";
    }

    if (serviceSlug === "brand-design") {
        return "2 weeks";
    }

    if (serviceSlug === "social-media-design") {
        return "2 weeks. Delivery comes in batches of 5 designs every 3 working days until completion.";
    }

    if (serviceSlug === "ui-ux" || serviceSlug === "web-design") {
        return "Timeline is subject to Bellah Options team review after project scope confirmation.";
    }

    return "";
}

export default function OrderCreate({
    serviceSlug,
    humanVerificationMode = "math",
    humanCheckQuestion = "",
    humanCheckNonce = "",
    turnstileSiteKey = "",
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
    const draftStorageKey = `${orderDraftStoragePrefix}:${serviceSlug}`;

    const { data, setData, setError, clearErrors, post, processing, errors } = useForm(
        buildOrderFormSeed(checkoutServices, {
            full_name: profileDefaults.name || auth?.user?.name || "",
            email: profileDefaults.email || auth?.user?.email || "",
            service_package: selectedPackageCode || "",
            human_check_nonce: humanCheckNonce || "",
            form_rendered_at: formRenderedAt || 0,
            turnstile_token: "",
            discount_code: discountCode || "",
        }),
    );

    const [currentStep, setCurrentStep] = useState(1);
    const [activeServiceSlug, setActiveServiceSlug] = useState(initialServiceSlug);
    const [draftRestored, setDraftRestored] = useState(false);
    const [turnstileClientError, setTurnstileClientError] = useState("");
    const turnstileContainerRef = useRef(null);
    const turnstileWidgetIdRef = useRef(null);
    const hasAttemptedDraftRestoreRef = useRef(false);

    const activeService = checkoutServices[activeServiceSlug] || null;
    const activePackages = activeService?.packages || {};
    const activePackageEntries = Object.entries(activePackages);
    const logoAddonEntries = Object.entries(logoAddons || {});
    const selectedLogoAddon = logoAddons[data.logo_addon_package] || null;
    const autoTimelinePreference = useMemo(
        () => resolveAutoTimeline(activeServiceSlug, data.service_package),
        [activeServiceSlug, data.service_package],
    );
    const intakeFieldMap = useMemo(() => {
        const map = new Map();

        (activeService?.intake || []).forEach((field) => {
            if (field?.name) {
                map.set(field.name, field);
            }
        });

        return map;
    }, [activeService]);

    const validateField = (fieldName, nextData) => {
        const value = nextData[fieldName];
        const normalized = String(value ?? "").trim();
        const intakeField = intakeFieldMap.get(fieldName);

        if (fieldName === "full_name") {
            if (normalized === "") return "Full name is required.";
            if (normalized.length < 3) return "Full name must be at least 3 characters.";
            if (normalized.length > 120) return "Full name must not exceed 120 characters.";
            if (!fullNamePattern.test(normalized)) return "Please enter a valid full name.";
            return null;
        }

        if (fieldName === "email") {
            if (normalized === "") return "Email is required.";
            if (!emailPattern.test(normalized)) return "Please enter a valid email address.";
            if (normalized.length > 255) return "Email must not exceed 255 characters.";
            return null;
        }

        if (fieldName === "phone") {
            if (normalized === "") return "Phone is required.";
            if (normalized.length < 7) return "Phone must be at least 7 characters.";
            if (normalized.length > 30) return "Phone must not exceed 30 characters.";
            if (!phonePattern.test(normalized)) return "Please enter a valid phone number.";
            return null;
        }

        if (fieldName === "business_name") {
            if (normalized === "") return "Business name is required.";
            if (normalized.length < 2) return "Business name must be at least 2 characters.";
            if (normalized.length > 180) return "Business name must not exceed 180 characters.";
            return null;
        }

        if (fieldName === "position") {
            return normalized.length > 120 ? "Role/position must not exceed 120 characters." : null;
        }

        if (fieldName === "business_website") {
            if (normalized === "") return null;
            if (normalized.length > 255) return "Business website must not exceed 255 characters.";
            if (!httpUrlPattern.test(normalized)) return "Please enter a valid full website URL, including http:// or https://.";
            return null;
        }

        if (fieldName === "has_logo") {
            return ["yes", "no"].includes(normalized) ? null : "Please tell us whether you already have a logo.";
        }

        if (fieldName === "logo_design_interest") {
            if (nextData.has_logo !== "no") return null;
            if (!["yes", "no"].includes(normalized)) return "Please tell us whether you want Bellah Options to design a logo for you.";
            return null;
        }

        if (fieldName === "logo_addon_package") {
            if (!(nextData.has_logo === "no" && nextData.logo_design_interest === "yes")) return null;
            if (normalized === "") return "Please choose a logo or brand design package.";
            return logoAddons[normalized] ? null : "The selected logo package is invalid.";
        }

        if (fieldName === "service_package") {
            if (normalized === "") return "Please select a package.";
            return activePackages[normalized] ? null : "Please select a valid package.";
        }

        if (fieldName === "discount_code") {
            if (normalized === "") return null;
            return discountPattern.test(normalized.toUpperCase()) ? null : "Please enter a valid discount code.";
        }

        if (fieldName === "project_summary") {
            if (normalized === "") return "Project summary is required.";
            if (normalized.length < 30) return "Project summary must be at least 30 characters.";
            if (normalized.length > 2500) return "Project summary must not exceed 2500 characters.";
            return null;
        }

        if (fieldName === "project_goals") return normalized.length > 1500 ? "Project goals must not exceed 1500 characters." : null;
        if (fieldName === "target_audience") return normalized.length > 1000 ? "Target audience must not exceed 1000 characters." : null;
        if (fieldName === "preferred_style") return normalized.length > 1000 ? "Preferred style must not exceed 1000 characters." : null;
        if (fieldName === "deliverables") return normalized.length > 1500 ? "Deliverables must not exceed 1500 characters." : null;
        if (fieldName === "additional_details") return normalized.length > 2000 ? "Additional details must not exceed 2000 characters." : null;
        if (fieldName === "timeline_preference") return normalized.length > 120 ? "Timeline preference must not exceed 120 characters." : null;

        if (fieldName === "create_account") return null;

        if (fieldName === "password") {
            if (isAuthenticated || !nextData.create_account) return null;
            if (normalized === "") return "A password is required to create your account.";
            if (normalized.length < 8) return "Password must be at least 8 characters.";
            return null;
        }

        if (fieldName === "password_confirmation") {
            if (isAuthenticated || !nextData.create_account) return null;
            if (String(nextData.password || "") !== String(nextData.password_confirmation || "")) {
                return "Password confirmation does not match.";
            }

            return null;
        }

        if (fieldName === "human_check_answer") {
            if (humanVerificationMode !== "math") return null;
            return normalized === "" ? "Human verification is required." : null;
        }

        if (fieldName === "turnstile_token") {
            if (humanVerificationMode !== "turnstile") return null;
            return normalized === "" ? "Please complete the captcha verification." : null;
        }

        if (fieldName === "website" || fieldName === "company_name" || fieldName === "contact_notes") {
            return normalized === "" ? null : "Human verification failed.";
        }

        if (!intakeField) {
            return null;
        }

        const required = Boolean(intakeField.required);
        const maxLength = Number(intakeField.max || (intakeField.type === "textarea" ? 2500 : 255));

        if (required && normalized === "") {
            return `${intakeField.label || "This field"} is required.`;
        }

        if (normalized === "") {
            return null;
        }

        if (intakeField.type === "number") {
            const numericValue = Number(value);

            if (!Number.isInteger(numericValue)) {
                return `${intakeField.label || "This field"} must be a whole number.`;
            }

            const min = Number(intakeField.min || 0);
            const max = Number(intakeField.max || 1000000);

            if (numericValue < min || numericValue > max) {
                return `${intakeField.label || "This field"} must be between ${min} and ${max}.`;
            }

            return null;
        }

        if (normalized.length > maxLength) {
            return `${intakeField.label || "This field"} must not exceed ${maxLength} characters.`;
        }

        if (intakeField.type === "url" && !httpUrlPattern.test(normalized)) {
            return `${intakeField.label || "This field"} must be a valid URL starting with http:// or https://.`;
        }

        if (intakeField.type === "select") {
            const options = intakeField.options || {};
            const allowedValues = Array.isArray(options) ? options : Object.keys(options);

            if (allowedValues.length > 0 && !allowedValues.includes(normalized)) {
                return `${intakeField.label || "This field"} has an invalid option selected.`;
            }
        }

        return null;
    };

    const validateFields = (nextData, fieldNames) => {
        const uniqueFields = [...new Set(fieldNames)];

        uniqueFields.forEach((fieldName) => {
            const error = validateField(fieldName, nextData);

            if (error) {
                setError(fieldName, error);
            } else {
                clearErrors(fieldName);
            }
        });
    };

    const updateField = (fieldName, value, relatedFields = []) => {
        const nextData = {
            ...data,
            [fieldName]: value,
        };

        setData(fieldName, value);
        validateFields(nextData, [fieldName, ...relatedFields]);
    };

    useEffect(() => {
        if (!data.service_package && selectedPackageCode) {
            const nextData = {
                ...data,
                service_package: selectedPackageCode,
            };

            setData("service_package", selectedPackageCode);
            validateFields(nextData, ["service_package"]);
        }
    }, [data, data.service_package, selectedPackageCode, setData]);

    useEffect(() => {
        if (!activePackages[data.service_package]) {
            const firstPackageCode = activePackageEntries[0]?.[0] || "";
            const nextData = {
                ...data,
                service_package: firstPackageCode,
            };

            setData("service_package", firstPackageCode);
            validateFields(nextData, ["service_package"]);
        }
    }, [activePackageEntries, activePackages, data, data.service_package, setData]);

    useEffect(() => {
        if (data.has_logo !== "no") {
            if (data.logo_design_interest !== "") {
                setData("logo_design_interest", "");
                clearErrors("logo_design_interest");
            }

            if (data.logo_addon_package !== "") {
                setData("logo_addon_package", "");
                clearErrors("logo_addon_package");
            }
        }
    }, [clearErrors, data.has_logo, data.logo_addon_package, data.logo_design_interest, setData]);

    useEffect(() => {
        if (data.logo_design_interest !== "yes" && data.logo_addon_package !== "") {
            setData("logo_addon_package", "");
            clearErrors("logo_addon_package");
        }
    }, [clearErrors, data.logo_addon_package, data.logo_design_interest, setData]);

    useEffect(() => {
        if ((humanCheckNonce || "") !== data.human_check_nonce) {
            setData("human_check_nonce", humanCheckNonce || "");
        }

        if ((formRenderedAt || 0) !== data.form_rendered_at) {
            setData("form_rendered_at", formRenderedAt || 0);
        }

        if (humanVerificationMode === "math" && data.turnstile_token !== "") {
            setData("turnstile_token", "");
        }
    }, [data.form_rendered_at, data.human_check_nonce, data.turnstile_token, formRenderedAt, humanCheckNonce, humanVerificationMode, setData]);

    useEffect(() => {
        if (typeof window === "undefined" || hasAttemptedDraftRestoreRef.current) {
            return;
        }

        hasAttemptedDraftRestoreRef.current = true;

        try {
            const rawDraft = window.sessionStorage.getItem(draftStorageKey)
                || window.localStorage.getItem(draftStorageKey);
            if (!rawDraft) {
                return;
            }

            const parsedDraft = JSON.parse(rawDraft);
            if (!parsedDraft || typeof parsedDraft !== "object") {
                return;
            }

            const restoredData = parsedDraft.data && typeof parsedDraft.data === "object"
                ? parsedDraft.data
                : {};
            const restoredStep = Number(parsedDraft.currentStep || 1);
            const restoredServiceSlug = String(parsedDraft.activeServiceSlug || "");

            Object.entries(restoredData).forEach(([fieldName, fieldValue]) => {
                if (sensitiveDraftFields.has(fieldName)) {
                    return;
                }

                if (Object.hasOwn(data, fieldName)) {
                    setData(fieldName, fieldValue ?? "");
                }
            });

            if (Number.isInteger(restoredStep) && restoredStep >= 1 && restoredStep <= steps.length) {
                setCurrentStep(restoredStep);
            }

            if (restoredServiceSlug && checkoutServices[restoredServiceSlug]) {
                setActiveServiceSlug(restoredServiceSlug);
            }

            setDraftRestored(true);
        } catch {
            // ignore malformed draft payloads
        }
    }, [checkoutServices, data, draftStorageKey, setData]);

    useEffect(() => {
        if (typeof window === "undefined") {
            return;
        }

        const draftPayload = {
            currentStep,
            activeServiceSlug,
            data: Object.fromEntries(
                Object.entries(data).filter(([fieldName]) => !sensitiveDraftFields.has(fieldName)),
            ),
            saved_at: Date.now(),
        };

        window.sessionStorage.setItem(draftStorageKey, JSON.stringify(draftPayload));
        window.localStorage.setItem(draftStorageKey, JSON.stringify(draftPayload));
    }, [activeServiceSlug, currentStep, data, draftStorageKey]);

    useEffect(() => {
        if (!autoTimelinePreference || data.timeline_preference === autoTimelinePreference) {
            return;
        }

        setData("timeline_preference", autoTimelinePreference);
        validateFields({ ...data, timeline_preference: autoTimelinePreference }, ["timeline_preference"]);
    }, [autoTimelinePreference, data, data.timeline_preference, setData]);

    useEffect(() => {
        if (humanVerificationMode !== "turnstile") {
            return;
        }

        if (!turnstileSiteKey) {
            return;
        }

        let cancelled = false;

        loadTurnstileScript()
            .then((turnstile) => {
                if (cancelled || !turnstileContainerRef.current || turnstileWidgetIdRef.current !== null) {
                    return;
                }

                turnstileWidgetIdRef.current = turnstile.render(turnstileContainerRef.current, {
                    sitekey: turnstileSiteKey,
                    callback: (token) => {
                        updateField("turnstile_token", token);
                        setTurnstileClientError("");
                    },
                    "expired-callback": () => {
                        updateField("turnstile_token", "");
                        setTurnstileClientError("Verification expired. Please complete the captcha again.");
                    },
                    "error-callback": () => {
                        updateField("turnstile_token", "");
                        setTurnstileClientError("Captcha failed to load correctly. Please refresh and try again.");
                        return true;
                    },
                });
                setTurnstileClientError("");
            })
            .catch(() => {
                if (!cancelled) {
                    setTurnstileClientError("Captcha failed to load correctly. Please refresh and try again.");
                }
            });

        return () => {
            cancelled = true;
            if (window.turnstile && turnstileWidgetIdRef.current !== null) {
                window.turnstile.remove(turnstileWidgetIdRef.current);
                turnstileWidgetIdRef.current = null;
            }
        };
    }, [humanVerificationMode, turnstileSiteKey]);

    useEffect(() => {
        if (humanVerificationMode !== "turnstile" || !errors.turnstile_token) {
            return;
        }

        if (window.turnstile && turnstileWidgetIdRef.current !== null) {
            window.turnstile.reset(turnstileWidgetIdRef.current);
        }

        if (data.turnstile_token !== "") {
            setData("turnstile_token", "");
        }
    }, [data.turnstile_token, errors.turnstile_token, humanVerificationMode, setData]);

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

    const fieldsForStep = (stepNumber, nextData) => {
        if (stepNumber === 1) {
            return ["full_name", "email", "phone", "position"];
        }

        if (stepNumber === 2) {
            return [];
        }

        if (stepNumber === 3) {
            const intakeFields = (activeService?.intake || [])
                .map((field) => field?.name)
                .filter(Boolean);
            const fields = [
                "business_name",
                "business_website",
                "has_logo",
                "project_summary",
                "project_goals",
                "target_audience",
                "preferred_style",
                "deliverables",
                "timeline_preference",
                "additional_details",
                ...intakeFields,
            ];

            if (nextData.has_logo === "no") {
                fields.push("logo_design_interest");

                if (nextData.logo_design_interest === "yes") {
                    fields.push("logo_addon_package");
                }
            }

            return fields;
        }

        if (stepNumber === 4) {
            return ["service_package", "discount_code"];
        }

        if (stepNumber === 5) {
            const fields = ["create_account"];

            if (!isAuthenticated && nextData.create_account) {
                fields.push("password", "password_confirmation");
            }

            return fields;
        }

        if (stepNumber === 6) {
            const fields = ["website", "company_name", "contact_notes"];

            if (humanVerificationMode === "turnstile") {
                fields.push("turnstile_token");
            } else {
                fields.push("human_check_answer");
            }

            return fields;
        }

        return [];
    };

    const validateStep = (stepNumber, nextData) => {
        const fields = fieldsForStep(stepNumber, nextData);
        validateFields(nextData, fields);

        return fields.every((fieldName) => !validateField(fieldName, nextData));
    };
    const stepHasIssues = (stepNumber, nextData) => {
        const fields = fieldsForStep(stepNumber, nextData);

        return fields.some((fieldName) => Boolean(validateField(fieldName, nextData)));
    };

    const nextStep = () => {
        const canProceed = validateStep(currentStep, data);

        if (!canProceed) {
            return;
        }

        setCurrentStep((value) => Math.min(steps.length, value + 1));
    };
    const previousStep = () => setCurrentStep((value) => Math.max(1, value - 1));

    const submit = (event) => {
        event.preventDefault();

        const canSubmit = validateStep(steps.length, data);

        if (!canSubmit) {
            return;
        }

        post(route("orders.store", { serviceSlug: activeServiceSlug }), {
            preserveScroll: true,
            onError: (formErrors) => {
                const nextErrorStep = resolveErrorStep(formErrors, activeService);
                setCurrentStep(nextErrorStep);
            },
            onSuccess: () => {
                if (typeof window !== "undefined") {
                    window.sessionStorage.removeItem(draftStorageKey);
                    window.localStorage.removeItem(draftStorageKey);
                }
            },
        });
    };

    const visibleErrorMessages = useMemo(() => {
        const mapped = Object.entries(errors || {})
            .filter(([, message]) => Boolean(message))
            .map(([fieldName, message]) => {
                const stillInvalid = validateField(fieldName, data) !== null;

                if (stillInvalid) {
                    return String(message);
                }

                if (!Object.hasOwn(data, fieldName)) {
                    return String(message);
                }

                return null;
            })
            .filter(Boolean);

        return [...new Set(mapped)];
    }, [data, errors, validateField]);
    const hasMeaningfulInput = useMemo(() => {
        const keys = [
            "full_name",
            "email",
            "phone",
            "business_name",
            "project_summary",
            "service_package",
        ];

        return keys.some((fieldName) => String(data[fieldName] || "").trim() !== "");
    }, [data]);
    const showPositiveStatus = visibleErrorMessages.length === 0
        && hasMeaningfulInput
        && !stepHasIssues(currentStep, data);

    useEffect(() => {
        const staleErrorFields = Object.keys(errors || {}).filter((fieldName) => {
            if (!Object.hasOwn(data, fieldName)) {
                return false;
            }

            return validateField(fieldName, data) === null;
        });

        staleErrorFields.forEach((fieldName) => clearErrors(fieldName));
    }, [clearErrors, data, errors, validateField]);

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
                                {draftRestored && (
                                    <div className="border border-cyan-200 bg-cyan-50 p-5 text-sm text-cyan-800">
                                        We restored your last in-progress draft automatically.
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
                                        <ul className="mt-2 list-disc space-y-1 pl-5">
                                            {visibleErrorMessages.slice(0, 4).map((message) => (
                                                <li key={message}>{message}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {showPositiveStatus && (
                                    <div className="mb-5 border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                                        You are doing everything right.
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
                                                <input autoComplete="name" value={data.full_name} onChange={(event) => updateField("full_name", event.target.value)} className={inputClassName} />
                                            </Field>
                                            <Field label="Email Address" error={errors.email}>
                                                <input
                                                    type="email"
                                                    inputMode="email"
                                                    autoComplete="email"
                                                    placeholder="name@company.com"
                                                    value={data.email}
                                                    onChange={(event) => updateField("email", event.target.value)}
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
                                                    onChange={(event) => updateField("phone", event.target.value)}
                                                    className={inputClassName}
                                                />
                                            </Field>
                                            <Field label="Role / Position" error={errors.position}>
                                                <input value={data.position} onChange={(event) => updateField("position", event.target.value)} className={inputClassName} />
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
                                                <input value={data.business_name} onChange={(event) => updateField("business_name", event.target.value)} className={inputClassName} />
                                            </Field>
                                            <Field label="Business Website" error={errors.business_website}>
                                                <input
                                                    type="url"
                                                    inputMode="url"
                                                    placeholder="https://yourbusiness.com"
                                                    value={data.business_website}
                                                    onChange={(event) => updateField("business_website", event.target.value)}
                                                    className={inputClassName}
                                                />
                                            </Field>
                                            <Field label="Do You Already Have a Logo?" error={errors.has_logo}>
                                                <select value={data.has_logo} onChange={(event) => updateField("has_logo", event.target.value, ["logo_design_interest", "logo_addon_package"])} className={inputClassName}>
                                                    <option value="">Select an option</option>
                                                    <option value="yes">Yes, we already have a logo</option>
                                                    <option value="no">No, we need logo support</option>
                                                </select>
                                            </Field>
                                            {data.has_logo === "no" && (
                                                <Field label="Do You Want Us to Design a Logo?" error={errors.logo_design_interest}>
                                                    <select value={data.logo_design_interest} onChange={(event) => updateField("logo_design_interest", event.target.value, ["logo_addon_package"])} className={inputClassName}>
                                                        <option value="">Select an option</option>
                                                        <option value="yes">Yes, add logo / brand design</option>
                                                        <option value="no">No, not right now</option>
                                                    </select>
                                                </Field>
                                            )}
                                            <Field label="Business / Project Summary" error={errors.project_summary} className="sm:col-span-2">
                                                <textarea rows={4} value={data.project_summary} onChange={(event) => updateField("project_summary", event.target.value)} className={inputClassName} />
                                            </Field>
                                            <Field label="Project Goals" error={errors.project_goals} className="sm:col-span-2">
                                                <textarea rows={3} value={data.project_goals} onChange={(event) => updateField("project_goals", event.target.value)} className={inputClassName} />
                                            </Field>
                                            <Field label="Target Audience" error={errors.target_audience}>
                                                <textarea rows={3} value={data.target_audience} onChange={(event) => updateField("target_audience", event.target.value)} className={inputClassName} />
                                            </Field>
                                            <Field label="Preferred Style" error={errors.preferred_style}>
                                                <textarea rows={3} value={data.preferred_style} onChange={(event) => updateField("preferred_style", event.target.value)} className={inputClassName} />
                                            </Field>
                                            <Field label="Expected Deliverables" error={errors.deliverables}>
                                                <textarea rows={3} value={data.deliverables} onChange={(event) => updateField("deliverables", event.target.value)} className={inputClassName} />
                                            </Field>
                                            <Field label="Timeline Preference" error={errors.timeline_preference}>
                                                <input
                                                    value={data.timeline_preference}
                                                    readOnly={Boolean(autoTimelinePreference)}
                                                    onChange={(event) => updateField("timeline_preference", event.target.value)}
                                                    className={`${inputClassName} ${autoTimelinePreference ? "bg-gray-50" : ""}`}
                                                />
                                            </Field>
                                            <Field label="Additional Details" error={errors.additional_details} className="sm:col-span-2">
                                                <textarea rows={3} value={data.additional_details} onChange={(event) => updateField("additional_details", event.target.value)} className={inputClassName} />
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
                                                                onClick={() => updateField("logo_addon_package", code)}
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
                                                            onChange={(value) => updateField(field.name, value)}
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
                                                        onClick={() => updateField("service_package", code)}
                                                        className={`border p-5 text-left transition ${selected ? "border-[#000285] bg-blue-50" : "border-gray-200 bg-white hover:border-blue-200"}`}
                                                    >
                                                        <div className="flex items-start justify-between gap-2">
                                                            <p className="text-lg font-black text-gray-950">{pack.name}</p>
                                                            {pack.is_recommended && (
                                                                <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-indigo-700">
                                                                    Recommended
                                                                </span>
                                                            )}
                                                        </div>
                                                        {pack.discount_price && Number(pack.base_price_ngn || 0) > Number(pack.discount_price || 0) ? (
                                                            <div className="mt-2 flex items-center gap-2">
                                                                <p className="text-sm font-bold text-[#000285]">{formatMoney(pack.discount_price, currency, locale)}</p>
                                                                <p className="text-xs font-semibold text-gray-500 line-through">{formatMoney(pack.base_price_ngn, currency, locale)}</p>
                                                            </div>
                                                        ) : (
                                                            <p className="mt-2 text-sm font-bold text-[#000285]">{formatMoney(pack.price, currency, locale)}</p>
                                                        )}
                                                        <p className="mt-3 text-sm leading-6 text-gray-600">{pack.description}</p>
                                                        {Array.isArray(pack.features) && pack.features.length > 0 && (
                                                            <ul className="mt-3 space-y-1">
                                                                {pack.features.slice(0, 4).map((feature) => (
                                                                    <li key={`${code}-${feature}`} className="text-xs text-gray-600">
                                                                        - {feature}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        )}
                                                        {pack.sample_image && (
                                                            <img
                                                                src={String(pack.sample_image).startsWith('/') || /^https?:\/\//i.test(String(pack.sample_image))
                                                                    ? String(pack.sample_image)
                                                                    : `/${String(pack.sample_image)}`}
                                                                alt={pack.name}
                                                                className="mt-3 h-16 w-full rounded object-cover"
                                                            />
                                                        )}
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
                                                        onChange={(event) => updateField("create_account", event.target.checked, ["password", "password_confirmation"])}
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
                                                            <input type="password" value={data.password} onChange={(event) => updateField("password", event.target.value, ["password_confirmation"])} className={inputClassName} />
                                                        </Field>
                                                        <Field label="Confirm Password" error={errors.password_confirmation}>
                                                            <input type="password" value={data.password_confirmation} onChange={(event) => updateField("password_confirmation", event.target.value)} className={inputClassName} />
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
                                            {humanVerificationMode === "turnstile" ? (
                                                <Field label="Security Check (Cloudflare Captcha)" error={errors.turnstile_token || turnstileClientError}>
                                                    {turnstileSiteKey ? (
                                                        <div ref={turnstileContainerRef} className="min-h-16" />
                                                    ) : (
                                                        <p className="text-sm text-red-600">
                                                            Captcha is not configured. Please contact support.
                                                        </p>
                                                    )}
                                                </Field>
                                            ) : (
                                                <Field label={`Human Check: ${humanCheckQuestion}`} error={errors.human_check_answer}>
                                                    <input
                                                        type="text"
                                                        value={data.human_check_answer}
                                                        onChange={(event) => updateField("human_check_answer", event.target.value)}
                                                        className={inputClassName}
                                                        autoComplete="off"
                                                    />
                                                </Field>
                                            )}
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
                                            onChange={(event) => updateField("website", event.target.value)}
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
                                            onChange={(event) => updateField("company_name", event.target.value)}
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
                                            onChange={(event) => updateField("contact_notes", event.target.value)}
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
