import InputError from '@/Components/InputError';
import HumanVerificationField from '@/Components/HumanVerificationField';
import GuestLayout from '@/Layouts/GuestLayout';
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

        post(route('staff.login.store'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Staff Login" />

            <div>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-blue-700">
                    Staff Portal
                </p>
                <h2 className="mt-2 text-3xl font-semibold text-slate-900">
                    Admin & Staff Access
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                    For Bellah Options super admins and customer reps.
                </p>
            </div>

            {status && (
                <div className="mt-5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700">
                    {status}
                </div>
            )}

            {flash?.error && (
                <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {flash.error}
                </div>
            )}

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
                <div>
                    <label htmlFor="email" className="text-sm font-medium text-slate-700">
                        Work Email
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
                    <input
                        id="password"
                        type="password"
                        name="password"
                        value={data.password}
                        className="mt-1 w-full rounded-xl border border-blue-200 bg-white px-3 py-2.5 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        autoComplete="current-password"
                        onChange={(event) => setData('password', event.target.value)}
                        required
                    />
                    <InputError message={errors.password} className="mt-2" />
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
                    {processing ? 'Signing in...' : 'Enter Staff Dashboard'}
                </button>

                <p className="text-sm text-slate-600">
                    Need user login instead?{' '}
                    <Link href={route('login')} className="font-semibold text-blue-700 hover:text-blue-800">
                        Go to user login
                    </Link>
                </p>
            </form>
        </GuestLayout>
    );
}
