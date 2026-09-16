import InputError from '@/Components/InputError';
import GuestLayout from '@/Layouts/GuestLayout';
import { Display, Eyebrow } from '@/Components/PublicUI';
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

            <Eyebrow>Staff security check</Eyebrow>

            <Display as="h2" size="sm" className="mt-5">
                Enter one-time passcode
            </Display>
            <p className="jv-body mt-3">
                We sent a 6-digit OTP to <strong className="font-semibold text-white">{maskedEmail}</strong>. It expires in{' '}
                {expiresInMinutes} minutes.
            </p>

            {status && (
                <div className="mt-6 rounded-jv-sm border border-jv-accent/30 bg-jv-accent/10 px-4 py-3 text-sm text-white/80">
                    {status}
                </div>
            )}

            <form onSubmit={submit} className="mt-7 space-y-5">
                <div className="jv-field">
                    <label htmlFor="otp" className="jv-label">
                        OTP code
                    </label>
                    <input
                        id="otp"
                        type="text"
                        name="otp"
                        value={data.otp}
                        maxLength={6}
                        className="jv-input text-center !text-lg tracking-[0.45em]"
                        autoComplete="one-time-code"
                        onChange={(event) =>
                            setData('otp', event.target.value.replace(/\D/g, '').slice(0, 6))
                        }
                        required
                    />
                    <InputError message={errors.otp} />
                </div>

                <button
                    type="submit"
                    disabled={processing}
                    className="jv-btn jv-btn--primary w-full"
                >
                    {processing ? 'Verifying...' : 'Verify & Sign In'}
                </button>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-jv-line pt-5 text-sm">
                    <button
                        type="button"
                        onClick={resend}
                        disabled={processing}
                        className="font-semibold text-jv-accent transition-colors hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        Resend OTP
                    </button>

                    <Link
                        href={route('staff.login')}
                        className="text-white/60 transition-colors hover:text-white"
                    >
                        Back to staff login
                    </Link>
                </div>
            </form>
        </GuestLayout>
    );
}
