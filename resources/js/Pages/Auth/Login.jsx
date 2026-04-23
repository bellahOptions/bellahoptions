import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Login({ status, canResetPassword }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (event) => {
        event.preventDefault();

        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Sign In" />

            <div>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-cyan-700">
                    Welcome Back
                </p>
                <h2 className="mt-2 text-3xl font-semibold text-slate-900">
                    Sign in to your account
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                    Regular user access. Staff should use the staff portal.
                </p>
            </div>

            {status && (
                <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                    {status}
                </div>
            )}

            <form onSubmit={submit} className="mt-6 space-y-4">
                <div>
                    <label htmlFor="email" className="text-sm font-medium text-slate-700">
                        Email Address
                    </label>
                    <input
                        id="email"
                        type="email"
                        name="email"
                        value={data.email}
                        className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:border-cyan-600 focus:outline-none"
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
                        className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:border-cyan-600 focus:outline-none"
                        autoComplete="current-password"
                        onChange={(event) => setData('password', event.target.value)}
                        required
                    />
                    <InputError message={errors.password} className="mt-2" />
                </div>

                <label className="inline-flex items-center gap-2">
                    <Checkbox
                        name="remember"
                        checked={data.remember}
                        onChange={(event) => setData('remember', event.target.checked)}
                    />
                    <span className="text-sm text-slate-600">Remember me</span>
                </label>

                <button
                    type="submit"
                    disabled={processing}
                    className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {processing ? 'Signing in...' : 'Sign In'}
                </button>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-sm">
                    <Link href={route('staff.login')} className="font-medium text-cyan-700 hover:text-cyan-800">
                        Staff login
                    </Link>

                    {canResetPassword && (
                        <Link
                            href={route('password.request')}
                            className="font-medium text-slate-600 hover:text-slate-900"
                        >
                            Forgot password?
                        </Link>
                    )}
                </div>

                <p className="text-sm text-slate-600">
                    Don&apos;t have an account?{' '}
                    <Link href={route('register')} className="font-semibold text-cyan-700 hover:text-cyan-800">
                        Create one
                    </Link>
                </p>
            </form>
        </GuestLayout>
    );
}
