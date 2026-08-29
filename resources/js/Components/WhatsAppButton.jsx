import { usePage } from '@inertiajs/react';
import { FaWhatsapp } from 'react-icons/fa6';

export default function WhatsAppButton() {
    const contact = usePage().props?.contact || {};
    const whatsappUrl = String(contact?.whatsapp_url || '').trim();

    if (!whatsappUrl) {
        return null;
    }

    return (
        <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Chat with us on WhatsApp"
            className="fixed md:bottom-5 bottom-14 md:right-5 right-3 z-[70] flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-emerald-900/25 transition hover:scale-105 hover:bg-[#1ebd5a] focus:outline-none focus:ring-2 focus:ring-emerald-300 focus:ring-offset-2"
        >
            <FaWhatsapp className="h-7 w-7" />
        </a>
    );
}
