import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function VerifyEmail({ status }) {
    const { post, processing } = useForm({});

    const submit = (e) => {
        e.preventDefault();

        post(route('verification.send'));
    };

    return (
        <GuestLayout>
            <Head title="Email Verification" />

            <div>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-blue-700">
                    Verify Email
                </p>
                <h2 className="mt-2 text-3xl font-semibold text-slate-900">
                    Confirm your email address
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                    Check your inbox and click the verification link we sent to you. If you didn&apos;t receive it, request another link below.
                </p>
            </div>

            {status === 'verification-link-sent' && (
                <div className="mt-5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-700">
                    A new verification link has been sent to the email address
                    you provided during registration.
                </div>
            )}

            <form onSubmit={submit} className="mt-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <button
                        type="submit"
                        disabled={processing}
                        className="rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        Resend Verification Email
                    </button>

                    <Link
                        href={route('logout')}
                        method="post"
                        as="button"
                        className="rounded-md text-sm font-medium text-slate-600 underline hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
                    >
                        Log Out
                    </Link>
                </div>
            </form>
        </GuestLayout>
    );
}
