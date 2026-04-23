import InputError from '@/Components/InputError';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

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
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-cyan-700">
                    Join Bellah Options
                </p>
                <h2 className="mt-2 text-3xl font-semibold text-slate-900">
                    Create your account
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                    Register to access the client experience while staff operations remain on the dedicated portal.
                </p>
            </div>

            <form onSubmit={submit} className="mt-6 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                        <label htmlFor="first_name" className="text-sm font-medium text-slate-700">
                            First Name
                        </label>
                        <input
                            id="first_name"
                            name="first_name"
                            value={data.first_name}
                            className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:border-cyan-600 focus:outline-none"
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
                            className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:border-cyan-600 focus:outline-none"
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
                    <input
                        id="password_confirmation"
                        type="password"
                        name="password_confirmation"
                        value={data.password_confirmation}
                        className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:border-cyan-600 focus:outline-none"
                        autoComplete="new-password"
                        onChange={(event) => setData('password_confirmation', event.target.value)}
                        required
                    />
                    <InputError message={errors.password_confirmation} className="mt-2" />
                </div>

                <button
                    type="submit"
                    disabled={processing}
                    className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {processing ? 'Creating account...' : 'Create Account'}
                </button>

                <p className="text-sm text-slate-600">
                    Already registered?{' '}
                    <Link href={route('login')} className="font-semibold text-cyan-700 hover:text-cyan-800">
                        Sign in
                    </Link>
                </p>
            </form>
        </GuestLayout>
    );
}
