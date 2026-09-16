import InputError from '@/Components/InputError';
import HumanVerificationField from '@/Components/HumanVerificationField';
import PasswordInput from '@/Components/PasswordInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Display, Eyebrow } from '@/Components/PublicUI';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useEffect } from 'react';

export default function StaffLogin({
    status,
    humanVerificationMode = 'math',
    humanCheckQuestion = '',
    humanCheckNonce = '',
    turnstileSiteKey = '',
    formRenderedAt = 0,
}) {
    const { flash } = usePage().props;

    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
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

        post(route('staff.login.store'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Staff Login" />

            <Eyebrow>Staff portal</Eyebrow>

            <Display as="h2" size="sm" className="mt-5">
                Admin &amp; staff access
            </Display>
            <p className="jv-body mt-3">
                For Bellah Options senior admins and customer reps.
            </p>

            {status && (
                <div className="mt-6 rounded-jv-sm border border-jv-accent/30 bg-jv-accent/10 px-4 py-3 text-sm text-white/80">
                    {status}
                </div>
            )}

            {flash?.error && (
                <div className="mt-6 rounded-jv-sm border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                    {flash.error}
                </div>
            )}

            <form onSubmit={submit} className="mt-7 space-y-5">
                <div className="jv-field">
                    <label htmlFor="email" className="jv-label">
                        Work email
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
                        autoComplete="current-password"
                        onChange={(event) => setData('password', event.target.value)}
                        required
                    />
                    <InputError message={errors.password} />
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
                    {processing ? 'Signing in...' : 'Enter Staff Dashboard'}
                </button>

                <p className="jv-body border-t border-jv-line pt-5">
                    Need user login instead?{' '}
                    <Link
                        href={route('login')}
                        className="font-semibold text-jv-accent transition-colors hover:text-white"
                    >
                        Go to user login
                    </Link>
                </p>
            </form>
        </GuestLayout>
    );
}
