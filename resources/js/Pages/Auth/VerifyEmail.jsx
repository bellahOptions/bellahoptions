import GuestLayout from '@/Layouts/GuestLayout';
import { Display, Eyebrow } from '@/Components/PublicUI';
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

            <Eyebrow>Verify email</Eyebrow>

            <Display as="h2" size="sm" className="mt-5">
                Confirm your email address
            </Display>
            <p className="jv-body mt-3">
                Check your inbox and click the verification link we sent to you. If you didn&apos;t receive it, request another link below.
            </p>

            {status === 'verification-link-sent' && (
                <div className="mt-6 rounded-jv-sm border border-jv-accent/30 bg-jv-accent/10 px-4 py-3 text-sm text-white/80">
                    A new verification link has been sent to the email address
                    you provided during registration.
                </div>
            )}

            <form onSubmit={submit} className="mt-7">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <button
                        type="submit"
                        disabled={processing}
                        className="jv-btn jv-btn--primary"
                    >
                        Resend Verification Email
                    </button>

                    <Link
                        href={route('logout')}
                        method="post"
                        as="button"
                        className="text-sm font-medium text-white/60 underline decoration-jv-line underline-offset-4 transition-colors hover:text-white"
                    >
                        Log Out
                    </Link>
                </div>
            </form>
        </GuestLayout>
    );
}
