import InputError from '@/Components/InputError';
import HumanVerificationField from '@/Components/HumanVerificationField';
import PasswordInput from '@/Components/PasswordInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Display, Eyebrow } from '@/Components/PublicUI';
import { Head, Link, useForm } from '@inertiajs/react';
import { useEffect } from 'react';

export default function Register({
    humanVerificationMode = 'math',
    humanCheckQuestion = '',
    humanCheckNonce = '',
    turnstileSiteKey = '',
    formRenderedAt = 0,
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        password_confirmation: '',
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

    const submit = (event) => {
        event.preventDefault();

        post(route('register'), {
            data: {
                ...data,
                name: `${data.first_name} ${data.last_name}`.trim(),
            },
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Create Account" />

            <Eyebrow>New account</Eyebrow>

            <Display as="h2" size="sm" className="mt-5">
                Create your account
            </Display>
            <p className="jv-body mt-3">
                Join smart business owners who run their brand work through Bellah Options.
            </p>

            <form onSubmit={submit} className="mt-7 space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                    <div className="jv-field">
                        <label htmlFor="first_name" className="jv-label">
                            First name
                        </label>
                        <input
                            id="first_name"
                            name="first_name"
                            value={data.first_name}
                            className="jv-input"
                            autoComplete="given-name"
                            onChange={(event) => setData('first_name', event.target.value)}
                            required
                        />
                        <InputError message={errors.first_name || errors.name} />
                    </div>

                    <div className="jv-field">
                        <label htmlFor="last_name" className="jv-label">
                            Last name
                        </label>
                        <input
                            id="last_name"
                            name="last_name"
                            value={data.last_name}
                            className="jv-input"
                            autoComplete="family-name"
                            onChange={(event) => setData('last_name', event.target.value)}
                            required
                        />
                        <InputError message={errors.last_name} />
                    </div>
                </div>

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
                        onChange={(event) => setData('email', event.target.value)}
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
                        autoComplete="new-password"
                        onChange={(event) => setData('password', event.target.value)}
                        required
                    />
                    <InputError message={errors.password} />
                </div>

                <div className="jv-field">
                    <label htmlFor="password_confirmation" className="jv-label">
                        Confirm password
                    </label>
                    <PasswordInput
                        id="password_confirmation"
                        name="password_confirmation"
                        value={data.password_confirmation}
                        inputClassName="jv-input"
                        autoComplete="new-password"
                        onChange={(event) => setData('password_confirmation', event.target.value)}
                        required
                    />
                    <InputError message={errors.password_confirmation} />
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
                    {processing ? 'Creating account...' : 'Create Account'}
                </button>

                <p className="jv-body border-t border-jv-line pt-5">
                    Already registered?{' '}
                    <Link
                        href={route('login')}
                        className="font-semibold text-jv-accent transition-colors hover:text-white"
                    >
                        Sign in
                    </Link>
                </p>
            </form>
        </GuestLayout>
    );
}
