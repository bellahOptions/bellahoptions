import { Head, Link } from '@inertiajs/react';
import PageTheme from '@/Layouts/PageTheme';

export default function ServiceBriefConfirmation({ referenceNumber, serviceName, responseDueAt }) {
    return (
        <>
            <Head title="Brief Received" />

            <PageTheme>
                <main className="bg-gray-50 py-16 sm:py-20">
                    <div className="mx-auto max-w-xl px-4 sm:px-6 lg:px-8">
                        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-600">
                                ✓
                            </div>
                            <h1 className="mt-4 text-2xl font-black text-gray-950">Brief received!</h1>
                            <p className="mt-2 text-sm leading-7 text-gray-600">
                                Thanks for telling us about your {serviceName} project. We&apos;ll review it and follow up with a quote.
                            </p>

                            <div className="mt-6 rounded-lg border border-gray-100 bg-gray-50 p-4">
                                <p className="text-xs uppercase tracking-wide text-gray-500">Reference Number</p>
                                <p className="mt-1 text-lg font-black text-brand">{referenceNumber}</p>
                            </div>

                            {responseDueAt && (
                                <p className="mt-3 text-sm text-gray-700">
                                    We&apos;ll be in touch by <span className="font-semibold">{new Date(responseDueAt).toLocaleString()}</span>.
                                </p>
                            )}

                            <p className="mt-4 text-xs text-gray-500">
                                We&apos;ve emailed you a copy of your answers. Keep this reference number for any follow-up.
                            </p>

                            <Link
                                href={route('home')}
                                className="mt-6 inline-flex items-center rounded-md bg-brand px-5 py-2.5 text-sm font-black text-white hover:bg-brand-dark"
                            >
                                Back to Home
                            </Link>
                        </div>
                    </div>
                </main>
            </PageTheme>
        </>
    );
}
