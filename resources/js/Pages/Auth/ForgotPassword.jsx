import InputError from '@/Components/InputError';
import HumanVerificationField from '@/Components/HumanVerificationField';
import GuestLayout from '@/Layouts/GuestLayout';
import { Display, Eyebrow } from '@/Components/PublicUI';
import { Head, Link, useForm } from '@inertiajs/react';
import { useEffect } from 'react';

export default function ForgotPassword({
    status,
    humanVerificationMode = 'math',
    humanCheckQuestion = '',
    humanCheckNonce = '',
    turnstileSiteKey = '',
    formRenderedAt = 0,
}) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        human_check_answer: '',
        turnstile_token: '',
        human_check_nonce: humanCheckNonce,
        form_rendered_at: formRenderedAt,
    });

    useEffect(() => {
        setData((previous) => ({
            ...previous,
            human_check_answer: '',
            turnstile_token: '',
            human_check_nonce: humanCheckNonce,
            form_rendered_at: formRenderedAt,
        }));
    }, [formRenderedAt, humanCheckNonce, setData]);

    const submit = (e) => {
        e.preventDefault();

        post(route('password.email'));
    };

    return (
        <GuestLayout>
            <Head title="Forgot Password" />

            <Eyebrow>Account recovery</Eyebrow>

            <Display as="h2" size="sm" className="mt-5">
                Reset your password
            </Display>
            <p className="jv-body mt-3">
                Enter your account email and we&apos;ll send a secure reset link.
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
                        onChange={(e) => setData('email', e.target.value)}
                        required
                    />
                    <InputError message={errors.email} />
                </div>

                <HumanVerificationField
                    mode={humanVerificationMode}
                    question={humanCheckQuestion}
                    turnstileSiteKey={turnstileSiteKey}
                    mathValue={data.human_check_answer}
                    onMathChange={(value) => setData('human_check_answer', value)}
                    onTurnstileChange={(token) => setData('turnstile_token', token)}
                    mathError={errors.human_check_answer}
                    turnstileError={errors.turnstile_token}
                />

                <button
                    type="submit"
                    disabled={processing}
                    className="jv-btn jv-btn--primary w-full"
                >
                    Email Password Reset Link
                </button>

                <p className="jv-body border-t border-jv-line pt-5">
                    Remembered it?{' '}
                    <Link
                        href={route('login')}
                        className="font-semibold text-jv-accent transition-colors hover:text-white"
                    >
                        Back to sign in
                    </Link>
                </p>
            </form>
        </GuestLayout>
    );
}
