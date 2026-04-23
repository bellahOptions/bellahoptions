import InputError from '@/Components/InputError';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function StaffOtpChallenge({
    maskedEmail = '',
    expiresInMinutes = 10,
    status,
}) {
    const {
        data,
        setData,
        post,
        processing,
        errors,
        clearErrors,
        setError,
    } = useForm({
        otp: '',
    });

    const submit = (event) => {
        event.preventDefault();

        post(route('staff.otp.store'));
    };

    const resend = () => {
        clearErrors();

        post(route('staff.otp.resend'), {
            preserveScroll: true,
            onError: (formErrors) => {
                if (formErrors?.otp) {
                    setError('otp', formErrors.otp);
                }
            },
        });
    };

    return (
        <GuestLayout>
            <Head title="Staff OTP Verification" />

            <div>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-emerald-700">
                    Staff Security Check
                </p>
                <h2 className="mt-2 text-3xl font-semibold text-slate-900">
                    Enter One-Time Passcode
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                    We sent a 6-digit OTP to <strong>{maskedEmail}</strong>. It expires in{' '}
                    {expiresInMinutes} minutes.
                </p>
            </div>

            {status && (
                <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                    {status}
                </div>
            )}

            <form onSubmit={submit} className="mt-6 space-y-4">
                <div>
                    <label htmlFor="otp" className="text-sm font-medium text-slate-700">
                        OTP Code
                    </label>
                    <input
                        id="otp"
                        type="text"
                        name="otp"
                        value={data.otp}
                        maxLength={6}
                        className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm tracking-[0.35em] focus:border-emerald-600 focus:outline-none"
                        autoComplete="one-time-code"
                        onChange={(event) =>
                            setData('otp', event.target.value.replace(/\D/g, '').slice(0, 6))
                        }
                        required
                    />
                    <InputError message={errors.otp} className="mt-2" />
                </div>

                <button
                    type="submit"
                    disabled={processing}
                    className="w-full rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {processing ? 'Verifying...' : 'Verify & Sign In'}
                </button>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-sm">
                    <button
                        type="button"
                        onClick={resend}
                        disabled={processing}
                        className="font-semibold text-cyan-700 hover:text-cyan-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        Resend OTP
                    </button>

                    <Link href={route('staff.login')} className="font-medium text-slate-600 hover:text-slate-900">
                        Back to staff login
                    </Link>
                </div>
            </form>
        </GuestLayout>
    );
}
