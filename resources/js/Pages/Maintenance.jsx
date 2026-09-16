import ApplicationLogo from '@/Components/ApplicationLogo';
import AuthCanvas from '@/Components/AuthCanvas';
import { Head, usePage } from '@inertiajs/react';
import { Mail, MessageCircle, Wrench } from 'lucide-react';

export default function Maintenance() {
    const { flash, contact = {} } = usePage().props;
    const message = flash?.error || "We're currently performing scheduled maintenance. Please check back shortly.";

    return (
        <div className="jv-canvas relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10 sm:px-6 lg:px-8">
            <Head title="Maintenance" />
            <AuthCanvas />

            <div className="jv-card jv-glow relative w-full max-w-xl overflow-hidden p-8 text-center sm:p-12">
                <div className="relative flex justify-center">
                    <ApplicationLogo className="h-10 w-auto brightness-0 invert" />
                </div>

                <div className="relative mx-auto mt-8 flex h-14 w-14 items-center justify-center rounded-full border border-jv-accent-line bg-jv-accent/15 text-jv-accent">
                    <Wrench className="h-7 w-7" />
                </div>

                <span className="jv-kicker jv-kicker--center relative mt-8">
                    Scheduled maintenance
                </span>

                <h1 className="jv-display jv-display--md relative mt-6">
                    We&apos;ll be right back
                </h1>
                <p className="jv-lead relative mt-4">{message}</p>

                {(contact?.whatsapp_url || contact?.email) && (
                    <div className="relative mt-8 flex flex-col items-center gap-3 border-t border-jv-line pt-6 sm:flex-row sm:justify-center">
                        {contact?.whatsapp_url && (
                            <a
                                href={contact.whatsapp_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="jv-btn jv-btn--primary w-full sm:w-auto"
                            >
                                <MessageCircle className="h-4 w-4" />
                                Message us on WhatsApp
                            </a>
                        )}
                        {contact?.email && (
                            <a
                                href={`mailto:${contact.email}`}
                                className="jv-btn jv-btn--ghost w-full sm:w-auto"
                            >
                                <Mail className="h-4 w-4" />
                                {contact.email}
                            </a>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
