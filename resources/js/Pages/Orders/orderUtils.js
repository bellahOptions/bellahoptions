export function formatMoney(amount, currency = "NGN", locale = "en-NG") {
    return new Intl.NumberFormat(locale, {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
    }).format(Number(amount || 0));
}

export function formatDate(value, locale = "en-NG") {
    if (!value) {
        return "";
    }

    return new Intl.DateTimeFormat(locale, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    }).format(new Date(value));
}

export function statusLabel(value) {
    return String(value || "")
        .replace(/_/g, " ")
        .replace(/\b\w/g, (character) => character.toUpperCase());
}

export function buildOrderFormSeed(checkoutServices, defaults = {}) {
    const seed = {
        full_name: defaults.full_name || "",
        email: defaults.email || "",
        phone: "",
        business_name: "",
        position: "",
        business_website: "",
        has_logo: "",
        logo_design_interest: "",
        logo_addon_package: "",
        project_summary: "",
        project_goals: "",
        target_audience: "",
        preferred_style: "",
        deliverables: "",
        additional_details: "",
        timeline_preference: "",
        service_package: defaults.service_package || "",
        create_account: false,
        password: "",
        password_confirmation: "",
        human_check_answer: "",
        human_check_nonce: defaults.human_check_nonce || "",
        form_rendered_at: defaults.form_rendered_at || 0,
        website: "",
        company_name: "",
        contact_notes: "",
        discount_code: defaults.discount_code || "",
    };

    Object.values(checkoutServices || {}).forEach((service) => {
        (service.intake || []).forEach((field) => {
            if (!field?.name || Object.hasOwn(seed, field.name)) {
                return;
            }

            seed[field.name] = "";
        });
    });

    return seed;
}
