import ApplicationLogo from '@/Components/ApplicationLogo';
import AuthCanvas from '@/Components/AuthCanvas';
import { Head, usePage } from '@inertiajs/react';
import { Mail, MessageCircle, Wrench } from 'lucide-react';

export default function Maintenance() {
    const { flash, contact = {} } = usePage().props;
    const message = flash?.error || "We're currently performing scheduled maintenance. Please check back shortly.";

    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-white px-4 py-10 text-gray-900 sm:px-6 lg:px-8">
            <Head title="Maintenance" />
            <AuthCanvas />

            <div className="relative w-full max-w-xl rounded-3xl border border-white/80 bg-white/90 p-8 text-center shadow-xl shadow-blue-100/40 backdrop-blur sm:p-12">
                <div className="flex justify-center">
                    <ApplicationLogo className="h-10 w-auto" />
                </div>

                <div className="mx-auto mt-8 flex h-14 w-14 items-center justify-center rounded-full bg-brand-light text-brand">
                    <Wrench className="h-7 w-7" />
                </div>

                <h1 className="mt-6 text-2xl font-black tracking-tight text-gray-950 sm:text-3xl">
                    We'll be right back
                </h1>
                <p className="mt-4 text-base leading-7 text-gray-600">{message}</p>

                {(contact?.whatsapp_url || contact?.email) && (
                    <div className="mt-8 flex flex-col items-center gap-3 border-t border-gray-100 pt-6 sm:flex-row sm:justify-center">
                        {contact?.whatsapp_url && (
                            <a
                                href={contact.whatsapp_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark"
                            >
                                <MessageCircle className="h-4 w-4" />
                                Message us on WhatsApp
                            </a>
                        )}
                        {contact?.email && (
                            <a
                                href={`mailto:${contact.email}`}
                                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
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
