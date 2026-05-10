import InputError from '@/Components/InputError';
import HumanVerificationField from '@/Components/HumanVerificationField';
import PasswordInput from '@/Components/PasswordInput';
import GuestLayout from '@/Layouts/GuestLayout';
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
        website: '',
        company_name: '',
        contact_notes: '',
    });

    useEffect(() => {
        setData((previous) => ({
            ...previous,
            human_check_answer: '',
            turnstile_token: '',
            human_check_nonce: humanCheckNonce,
            form_rendered_at: formRenderedAt,
            website: '',
            company_name: '',
            contact_notes: '',
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

            <div>
                <h2 className="mt-2 text-3xl font-semibold text-slate-900">
                    Create your account
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                    Register to join our community of Smart Business owners
                </p>
            </div>

            <form onSubmit={submit} className="mt-6 space-y-4">
                <input
                    type="text"
                    name="company_name"
                    value={data.company_name}
                    onChange={(event) => setData('company_name', event.target.value)}
                    className="hidden"
                    tabIndex={-1}
                    autoComplete="off"
                    aria-hidden="true"
                />
                <input
                    type="text"
                    name="website"
                    value={data.website}
                    onChange={(event) => setData('website', event.target.value)}
                    className="hidden"
                    tabIndex={-1}
                    autoComplete="off"
                    aria-hidden="true"
                />
                <input
                    type="text"
                    name="contact_notes"
                    value={data.contact_notes}
                    onChange={(event) => setData('contact_notes', event.target.value)}
                    className="hidden"
                    tabIndex={-1}
                    autoComplete="off"
                    aria-hidden="true"
                />
                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <label htmlFor="first_name" className="text-sm font-medium text-slate-700">
                            First Name
                        </label>
                        <input
                            id="first_name"
                            name="first_name"
                            value={data.first_name}
                            className="mt-1 w-full rounded-xl border border-blue-200 bg-white px-3 py-2.5 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
                            autoComplete="given-name"
                            onChange={(event) => setData('first_name', event.target.value)}
                            required
                        />
                        <InputError message={errors.first_name || errors.name} className="mt-2" />
                    </div>

                    <div>
                        <label htmlFor="last_name" className="text-sm font-medium text-slate-700">
                            Last Name
                        </label>
                        <input
                            id="last_name"
                            name="last_name"
                            value={data.last_name}
                            className="mt-1 w-full rounded-xl border border-blue-200 bg-white px-3 py-2.5 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
                            autoComplete="family-name"
                            onChange={(event) => setData('last_name', event.target.value)}
                            required
                        />
                        <InputError message={errors.last_name} className="mt-2" />
                    </div>
                </div>

                <div>
                    <label htmlFor="email" className="text-sm font-medium text-slate-700">
                        Email Address
                    </label>
                    <input
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        className="mt-1 w-full rounded-xl border border-blue-200 bg-white px-3 py-2.5 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        autoComplete="username"
                        onChange={(event) => setData('email', event.target.value)}
                        required
                    />
                    <InputError message={errors.email} className="mt-2" />
                </div>

                <div>
                    <label htmlFor="password" className="text-sm font-medium text-slate-700">
                        Password
                    </label>
                    <PasswordInput
                        id="password"
                        name="password"
                        value={data.password}
                        inputClassName="mt-1 w-full rounded-xl border border-blue-200 bg-white px-3 py-2.5 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        autoComplete="new-password"
                        onChange={(event) => setData('password', event.target.value)}
                        required
                    />
                    <InputError message={errors.password} className="mt-2" />
                </div>

                <div>
                    <label htmlFor="password_confirmation" className="text-sm font-medium text-slate-700">
                        Confirm Password
                    </label>
                    <PasswordInput
                        id="password_confirmation"
                        name="password_confirmation"
                        value={data.password_confirmation}
                        inputClassName="mt-1 w-full rounded-xl border border-blue-200 bg-white px-3 py-2.5 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        autoComplete="new-password"
                        onChange={(event) => setData('password_confirmation', event.target.value)}
                        required
                    />
                    <InputError message={errors.password_confirmation} className="mt-2" />
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
                    className="w-full rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {processing ? 'Creating account...' : 'Create Account'}
                </button>

                <p className="text-sm text-slate-600">
                    Already registered?{' '}
                    <Link href={route('login')} className="font-semibold text-blue-700 hover:text-blue-800">
                        Sign in
                    </Link>
                </p>
            </form>
        </GuestLayout>
    );
}
