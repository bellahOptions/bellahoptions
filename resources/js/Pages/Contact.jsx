import { Head, useForm, usePage } from "@inertiajs/react";
import { useEffect } from "react";
import PageTheme from "@/Layouts/PageTheme";
import PublicPageHeader from "@/Components/PublicPageHeader";
import HumanVerificationField from "@/Components/HumanVerificationField";
import { Button, Card, Display, Eyebrow, Section, Stagger, StaggerItem } from "@/Components/PublicUI";
import {
    CheckCircleIcon,
    EnvelopeIcon,
    MapPinIcon,
    PhoneIcon,
} from "@heroicons/react/24/outline";

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

const assurances = [
    "Replies usually land within one business day",
    "Scope, timeline, and budget confirmed before work starts",
    "Your brief stays private and is never shared",
];

function InputError({ message }) {
    if (!message) {
        return null;
    }

    return <p className="text-xs text-red-300">{message}</p>;
}

function Field({ label, type = "text", placeholder = "", value = "", onChange, error = "" }) {
    return (
        <div className="jv-field">
            <label className="jv-label">{label}</label>
            <input
                type={type}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                className="jv-input"
            />
            <InputError message={error} />
        </div>
    );
}

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
    });

    useEffect(() => {
        setData((previous) => ({
            ...previous,
            human_check_nonce: humanCheckNonce,
            form_rendered_at: formRenderedAt,
            human_check_answer: "",
            turnstile_token: "",
        }));
    }, [formRenderedAt, humanCheckNonce, setData]);

    const submit = (event) => {
        event.preventDefault();

        post(route("contact.submit"), {
            preserveScroll: true,
            onSuccess: () => {
                reset("name", "email", "phone", "project_type", "message", "human_check_answer", "turnstile_token");
                clearErrors();
            },
        });
    };

    return (
        <>
            <Head title="Contact Bellah Options" />
            <PageTheme>
                <main className="text-white">
                    <PublicPageHeader
                        pageKey="contact"
                        fallbackTitle="Tell us what you are building."
                        fallbackText="Share the project, launch, campaign, or brand challenge. We will help you pick a clear next step."
                        eyebrow="Contact"
                    />

                    <Section className="border-t border-jv-line">
                        <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14">
                            <div>
                                <Eyebrow>Direct lines</Eyebrow>
                                <Display size="md" muted="that reach a human." className="mt-6">
                                    Talk to Bellah Options
                                </Display>
                                <p className="jv-lead mt-5 max-w-md">
                                    Prefer to start with a conversation? Reach us on any of
                                    these channels or send the brief form.
                                </p>

                                <Stagger className="mt-9 grid gap-4">
                                    {contactCards.map((item) => {
                                        const Icon = item.icon;
                                        const content = (
                                            <StaggerItem
                                                as="article"
                                                className="flex items-center gap-4"
                                            >
                                                <Card
                                                    hover={Boolean(item.href)}
                                                    className="flex w-full items-center gap-4"
                                                >
                                                    <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-jv-sm border border-jv-line-strong bg-white/[0.06] text-jv-accent">
                                                        <Icon className="h-5 w-5" />
                                                    </span>
                                                    <div>
                                                        <p className="jv-mono text-white/40">
                                                            {item.label}
                                                        </p>
                                                        <p className="mt-2 text-sm font-semibold text-white">
                                                            {item.value}
                                                        </p>
                                                    </div>
                                                </Card>
                                            </StaggerItem>
                                        );

                                        return item.href ? (
                                            <a
                                                key={item.label}
                                                href={item.href}
                                                className="block"
                                            >
                                                {content}
                                            </a>
                                        ) : (
                                            <div key={item.label}>{content}</div>
                                        );
                                    })}
                                </Stagger>

                                <ul className="mt-9 space-y-3">
                                    {assurances.map((item) => (
                                        <li key={item} className="jv-check">
                                            <CheckCircleIcon className="h-4 w-4" />
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <Card className="lg:sticky lg:top-28 lg:self-start">
                                <Eyebrow>Project brief</Eyebrow>
                                <Display size="sm" className="mt-5">
                                    Send us the details
                                </Display>

                                <form onSubmit={submit} className="mt-8">
                                    {flash?.success && (
                                        <div className="mb-5 rounded-jv-sm border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
                                            {flash.success}
                                        </div>
                                    )}
                                    {flash?.error && (
                                        <div className="mb-5 rounded-jv-sm border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                                            {flash.error}
                                        </div>
                                    )}

                                    <div className="grid gap-5 sm:grid-cols-2">
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
                                        <div className="jv-field sm:col-span-2">
                                            <label className="jv-label" htmlFor="contact-message">
                                                Message
                                            </label>
                                            <textarea
                                                id="contact-message"
                                                rows={6}
                                                value={data.message}
                                                onChange={(event) => setData("message", event.target.value)}
                                                className="jv-textarea"
                                                placeholder="Tell us what you need..."
                                            />
                                            <InputError message={errors.message} />
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
                                                inputClassName="jv-input"
                                            />
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        variant="primary"
                                        size="lg"
                                        icon
                                        disabled={processing}
                                        className="mt-7 w-full"
                                    >
                                        {processing ? "Sending..." : "Send Message"}
                                    </Button>

                                    <p className="jv-small mt-4">
                                        Protected with rate limiting, honeypot checks, and human
                                        verification.
                                    </p>
                                </form>
                            </Card>
                        </div>
                    </Section>
                </main>
            </PageTheme>
        </>
    );
}
