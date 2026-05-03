import InputError from '@/Components/InputError';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm, usePage } from '@inertiajs/react';

export default function StaffLogin({ status }) {
    const { flash } = usePage().props;

    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
    });

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
