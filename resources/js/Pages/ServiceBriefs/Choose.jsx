import { Head, Link } from '@inertiajs/react';
import PageTheme from '@/Layouts/PageTheme';

export default function ChooseServiceBrief({ services = [] }) {
    return (
        <>
            <Head title="Start Your Brief" />

            <PageTheme>
                <main className="bg-gray-50 py-16 sm:py-20">
                    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                        <div className="text-center">
                            <h1 className="text-3xl font-black text-gray-950 sm:text-4xl">Start Your Brief</h1>
                            <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-gray-600">
                                Tell us about your project and we&apos;ll come back with a tailored quote. No payment
                                needed to get started — pick the service that fits.
                            </p>
                        </div>

                        <div className="mt-10 grid gap-4 sm:grid-cols-2">
                            {services.map((service) => (
                                <Link
                                    key={service.slug}
                                    href={route('brief.create', service.slug)}
                                    className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:border-brand/40 hover:shadow-md"
                                >
                                    <h2 className="text-lg font-bold text-gray-900">{service.name}</h2>
                                    <p className="mt-2 text-sm leading-6 text-gray-600">{service.intro}</p>
                                    <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-brand">
                                        About {service.estimated_minutes} minutes
                                    </p>
                                </Link>
                            ))}
                        </div>
                    </div>
                </main>
            </PageTheme>
        </>
    );
}
