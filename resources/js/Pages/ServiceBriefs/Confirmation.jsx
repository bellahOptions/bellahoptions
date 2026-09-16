import { Button, Eyebrow } from '@/Components/PublicUI';
import { Card } from '@/Components/ui/card';
import PageTheme from '@/Layouts/PageTheme';
import { Head } from '@inertiajs/react';

export default function ServiceBriefConfirmation({ referenceNumber, serviceName, responseDueAt }) {
    return (
        <>
            <Head title="Brief Received" />

            <PageTheme>
                <main className="py-12 sm:py-16">
                    <div className="mx-auto max-w-xl px-4 sm:px-6 lg:px-8">
                        <Card className="p-8 text-center">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-500/10 text-2xl text-emerald-300">
                                ✓
                            </div>
                            <div className="mt-4 flex justify-center">
                                <Eyebrow>Brief Received</Eyebrow>
                            </div>
                            <h1 className="jv-display jv-display--md mt-5">Brief received!</h1>
                            <p className="jv-lead mt-4">
                                Thanks for telling us about your {serviceName} project. We&apos;ll review it and follow up with a quote.
                            </p>

                            <div className="mt-6 rounded-jv-sm border border-jv-line bg-white/[0.03] p-4">
                                <p className="jv-mono text-white/45">Reference Number</p>
                                <p className="mt-1 text-lg font-semibold text-jv-accent">{referenceNumber}</p>
                            </div>

                            {responseDueAt && (
                                <p className="mt-3 text-sm text-white/70">
                                    We&apos;ll be in touch by <span className="font-semibold text-white">{new Date(responseDueAt).toLocaleString()}</span>.
                                </p>
                            )}

                            <p className="mt-4 text-xs text-white/45">
                                We&apos;ve emailed you a copy of your answers. Keep this reference number for any follow-up.
                            </p>

                            <Button href={route('home')} variant="primary" className="mt-6">
                                Back to Home
                            </Button>
                        </Card>
                    </div>
                </main>
            </PageTheme>
        </>
    );
}
