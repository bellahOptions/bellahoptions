import InputError from '@/Components/InputError';
import PasswordInput from '@/Components/PasswordInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, useForm } from '@inertiajs/react';

export default function ConfirmPassword() {
    const { data, setData, post, processing, errors, reset } = useForm({
        password: '',
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('password.confirm'), {
            onFinish: () => reset('password'),
        });
    };

    return (
        <GuestLayout>
            <Head title="Confirm Password" />

            <div>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-blue-700">
                    Security Confirmation
                </p>
                <h2 className="mt-2 text-3xl font-semibold text-slate-900">
                    Confirm your password
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                    This action is protected. Re-enter your password to continue.
                </p>
            </div>

            <form onSubmit={submit} className="mt-6 space-y-4">
                <div>
                    <label htmlFor="password" className="text-sm font-medium text-slate-700">
                        Password
                    </label>
                    <PasswordInput
                        id="password"
                        name="password"
                        value={data.password}
                        inputClassName="mt-1 w-full rounded-xl border border-blue-200 bg-white px-3 py-2.5 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100"
                        onChange={(e) => setData('password', e.target.value)}
                        required
                    />

                    <InputError message={errors.password} className="mt-2" />
                </div>

                <div className="pt-1">
                    <button
                        type="submit"
                        disabled={processing}
                        className="w-full rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        Confirm
                    </button>
                </div>
            </form>
        </GuestLayout>
    );
}
