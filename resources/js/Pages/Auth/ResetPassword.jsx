import InputError from '@/Components/InputError';
import PasswordInput from '@/Components/PasswordInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';

export default function ResetPassword({ token, email }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        token: token,
        email: email,
        password: '',
        password_confirmation: '',
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('password.store'), {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Reset Password" />

            <div>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-blue-700">
                    Password Reset
                </p>
                <h2 className="mt-2 text-3xl font-semibold text-slate-900">
                    Set a new password
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                    Choose a strong password to secure your account.
                </p>
            </div>

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

                    <InputError message={errors.email} className="mt-2" />
                </div>

                <div>
                    <label htmlFor="password" className="text-sm font-medium text-slate-700">
                        New Password
                    </label>
                    <PasswordInput
                        id="password"
                        name="password"
                        value={data.password}
                        inputClassName="mt-1 w-full rounded-xl border border-blue-200 bg-white px-3 py-2.5 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        autoComplete="new-password"
                        onChange={(e) => setData('password', e.target.value)}
                        required
                    />

                    <InputError message={errors.password} className="mt-2" />
                </div>

                <div>
                    <label htmlFor="password_confirmation" className="text-sm font-medium text-slate-700">
                        Confirm New Password
                    </label>
                    <PasswordInput
                        id="password_confirmation"
                        name="password_confirmation"
                        value={data.password_confirmation}
                        inputClassName="mt-1 w-full rounded-xl border border-blue-200 bg-white px-3 py-2.5 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        autoComplete="new-password"
                        onChange={(e) =>
                            setData('password_confirmation', e.target.value)
                        }
                        required
                    />

                    <InputError
                        message={errors.password_confirmation}
                        className="mt-2"
                    />
                </div>

                <div className="pt-1">
                    <button
                        type="submit"
                        disabled={processing}
                        className="w-full rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        Reset Password
                    </button>
                </div>
            </form>
        </GuestLayout>
    );
}
