import Checkbox from "@/Components/Checkbox";
import HumanVerificationField from "@/Components/HumanVerificationField";
import InputError from "@/Components/InputError";
import GuestLayout from "@/Layouts/GuestLayout";
import { Head, Link, useForm } from "@inertiajs/react";
import { useEffect } from "react";

export default function Login({
    status,
    canResetPassword,
    humanVerificationMode = "math",
    humanCheckQuestion = "",
    humanCheckNonce = "",
    turnstileSiteKey = "",
    formRenderedAt = 0,
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: "",
        password: "",
        remember: false,
        human_check_answer: "",
        turnstile_token: "",
        human_check_nonce: humanCheckNonce,
        form_rendered_at: formRenderedAt,
        website: "",
        company_name: "",
        contact_notes: "",
    });

    useEffect(() => {
        setData((previous) => ({
            ...previous,
            human_check_answer: "",
            turnstile_token: "",
            human_check_nonce: humanCheckNonce,
            form_rendered_at: formRenderedAt,
            website: "",
            company_name: "",
            contact_notes: "",
        }));
    }, [formRenderedAt, humanCheckNonce, setData]);

    const submit = (event) => {
        event.preventDefault();

        post(route("login"), {
            onFinish: () => reset("password"),
        });
    };

    return (
        <GuestLayout>
            <Head title="Sign In" />

            <div className="leading-tight">
                <h2 className="mt-2 text-3xl font-semibold text-gray-900">
                    Welcome Back
                </h2>
                <p className="text-sm leading-6 text-gray-600">
                    Access your account.
                </p>
            </div>

            {status && (
                <div className="mt-5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700">
                    {status}
                </div>
            )}

            <form onSubmit={submit} className="mt-6 space-y-4">
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
                <div>
                    <label
                        htmlFor="email"
                        className="text-sm font-medium text-slate-700"
                    >
                        Email Address
                    </label>
                    <input
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        className="mt-1 w-full rounded-xl border border-blue-200 bg-white px-3 py-2.5 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        autoComplete="username"
                        onChange={(event) =>
                            setData("email", event.target.value)
                        }
                        required
                    />
                    <InputError message={errors.email} className="mt-2" />
                </div>

                <div>
                    <label
                        htmlFor="password"
                        className="text-sm font-medium text-slate-700"
                    >
                        Password
                    </label>
                    <input
                        id="password"
                        type="password"
                        name="password"
                        value={data.password}
                        className="mt-1 w-full rounded-xl border border-blue-200 bg-white px-3 py-2.5 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        autoComplete="current-password"
                        onChange={(event) =>
                            setData("password", event.target.value)
                        }
                        required
                    />
                    <InputError message={errors.password} className="mt-2" />
                </div>

                <label className="inline-flex items-center gap-2">
                    <Checkbox
                        name="remember"
                        checked={data.remember}
                        onChange={(event) =>
                            setData("remember", event.target.checked)
                        }
                        className="text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-600">Remember me</span>
                </label>

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

                <button
                    type="submit"
                    disabled={processing}
                    className="w-full rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {processing ? "Signing in..." : "Sign In"}
                </button>

                <div className="flex flex-wrap items-center justify-end gap-3 pt-1 text-sm">
                    {canResetPassword && (
                        <Link
                            href={route("password.request")}
                            className="font-medium text-slate-600 hover:text-slate-900"
                        >
                            Forgot password?
                        </Link>
                    )}
                </div>

                <p className="text-sm text-slate-600">
                    Don&apos;t have an account?{" "}
                    <Link
                        href={route("register")}
                        className="font-semibold text-blue-700 hover:text-blue-800"
                    >
                        Create one
                    </Link>
                </p>
            </form>
        </GuestLayout>
    );
}
