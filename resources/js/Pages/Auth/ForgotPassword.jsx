import InputError from '@/Components/InputError';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';

export default function ForgotPassword({ status }) {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('password.email'));
    };

    return (
        <GuestLayout>
            <Head title="Forgot Password" />

            <div>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-blue-700">
                    Account Recovery
                </p>
                <h2 className="mt-2 text-3xl font-semibold text-slate-900">
                    Reset your password
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                    Enter your account email and we&apos;ll send a secure reset link.
                </p>
            </div>

            {status && (
                <div className="mt-5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700">
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
                        className="mt-1 w-full rounded-xl border border-blue-200 bg-white px-3 py-2.5 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        autoComplete="username"
                        onChange={(e) => setData('email', e.target.value)}
                        required
                    />
                </div>

                <InputError message={errors.email} className="mt-2" />

                <div className="pt-1">
                    <button
                        type="submit"
                        disabled={processing}
                        className="w-full rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        Email Password Reset Link
                    </button>
                </div>
            </form>
        </GuestLayout>
    );
}
