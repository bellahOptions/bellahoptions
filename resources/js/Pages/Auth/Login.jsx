import Checkbox from "@/Components/Checkbox";
import HumanVerificationField from "@/Components/HumanVerificationField";
import InputError from "@/Components/InputError";
import PasswordInput from "@/Components/PasswordInput";
import GuestLayout from "@/Layouts/GuestLayout";
import { Display, Eyebrow } from "@/Components/PublicUI";
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
    });

    useEffect(() => {
        setData((previous) => ({
            ...previous,
            human_check_answer: "",
            turnstile_token: "",
            human_check_nonce: humanCheckNonce,
            form_rendered_at: formRenderedAt,
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

            <Eyebrow>Account access</Eyebrow>

            <Display as="h2" size="sm" className="mt-5">
                Welcome back
            </Display>
            <p className="jv-body mt-3">
                Sign in to pick up where your projects left off.
            </p>

            {status && (
                <div className="mt-6 rounded-jv-sm border border-jv-accent/30 bg-jv-accent/10 px-4 py-3 text-sm text-white/80">
                    {status}
                </div>
            )}

            <form onSubmit={submit} className="mt-7 space-y-5">
                <div className="jv-field">
                    <label htmlFor="email" className="jv-label">
                        Email address
                    </label>
                    <input
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        className="jv-input"
                        autoComplete="username"
                        onChange={(event) =>
                            setData("email", event.target.value)
                        }
                        required
                    />
                    <InputError message={errors.email} />
                </div>

                <div className="jv-field">
                    <label htmlFor="password" className="jv-label">
                        Password
                    </label>
                    <PasswordInput
                        id="password"
                        name="password"
                        value={data.password}
                        inputClassName="jv-input"
                        autoComplete="current-password"
                        onChange={(event) =>
                            setData("password", event.target.value)
                        }
                        required
                    />
                    <InputError message={errors.password} />
                </div>

                <label className="flex items-center gap-2.5">
                    <Checkbox
                        name="remember"
                        checked={data.remember}
                        onChange={(event) =>
                            setData("remember", event.target.checked)
                        }
                    />
                    <span className="text-sm text-white/60">Remember me</span>
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
                    className="jv-btn jv-btn--primary w-full"
                >
                    {processing ? "Signing in..." : "Sign In"}
                </button>

                <div className="flex flex-wrap items-center justify-end gap-3 text-sm">
                    {canResetPassword && (
                        <Link
                            href={route("password.request")}
                            className="text-white/60 transition-colors hover:text-white"
                        >
                            Forgot password?
                        </Link>
                    )}
                </div>

                <p className="jv-body border-t border-jv-line pt-5">
                    Don&apos;t have an account?{" "}
                    <Link
                        href={route("register")}
                        className="font-semibold text-jv-accent transition-colors hover:text-white"
                    >
                        Create one
                    </Link>
                </p>
            </form>
        </GuestLayout>
    );
}
