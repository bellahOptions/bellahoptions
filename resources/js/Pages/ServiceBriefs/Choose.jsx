import { Eyebrow } from '@/Components/PublicUI';
import { Card } from '@/Components/ui/card';
import PageTheme from '@/Layouts/PageTheme';
import { Head, Link } from '@inertiajs/react';

export default function ChooseServiceBrief({ services = [] }) {
    return (
        <>
            <Head title="Start Your Brief" />

            <PageTheme>
                <main className="py-12 sm:py-16">
                    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                        <div className="flex flex-col items-center text-center">
                            <Eyebrow>Service Brief</Eyebrow>
                            <h1 className="jv-display jv-display--md mt-5">Start Your Brief</h1>
                            <p className="jv-lead mx-auto mt-4 max-w-xl">
                                Tell us about your project and we&apos;ll come back with a tailored quote. No payment
                                needed to get started — pick the service that fits.
                            </p>
                        </div>

                        <div className="mt-10 grid gap-4 sm:grid-cols-2">
                            {services.map((service) => (
                                <Card
                                    key={service.slug}
                                    as={Link}
                                    hover
                                    href={route('brief.create', service.slug)}
                                    className="block p-6"
                                >
                                    <h2 className="text-lg font-semibold tracking-tight text-white">{service.name}</h2>
                                    <p className="mt-2 text-sm leading-6 text-white/70">{service.intro}</p>
                                    <p className="jv-mono mt-4 text-[#a9c4ff]">
                                        About {service.estimated_minutes} minutes
                                    </p>
                                </Card>
                            ))}
                        </div>
                    </div>
                </main>
            </PageTheme>
        </>
    );
}
