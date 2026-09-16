import { usePage } from '@inertiajs/react';
import { ArrowRight, X } from 'lucide-react';
import { useEffect, useState } from 'react';

const STORAGE_KEY = 'templatr_promo_dismissed';

export default function TemplatrPromoBanner() {
    const user = usePage().props?.auth?.user;
    const [dismissed, setDismissed] = useState(true);

    useEffect(() => {
        try {
            setDismissed(localStorage.getItem(STORAGE_KEY) === '1');
        } catch {
            setDismissed(false);
        }
    }, []);

    if (user?.is_staff || dismissed) {
        return null;
    }

    const handleDismiss = () => {
        try {
            localStorage.setItem(STORAGE_KEY, '1');
        } catch {
            // Storage unavailable (private browsing, blocked cookies, etc.) — dismiss for this render only.
        }
        setDismissed(true);
    };

    return (
        <div className="relative z-40 flex items-center justify-center gap-2 border-b border-jv-line bg-black/60 px-8 py-2.5 text-center text-xs font-medium text-white/70 backdrop-blur-xl sm:px-10 sm:text-[13px]">
            <p className="min-w-0 truncate">
                Need ready-made website templates?{' '}
                <a
                    href="https://templatr.site/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-1 inline-flex items-center gap-1 font-semibold text-white underline decoration-jv-accent underline-offset-4 transition hover:decoration-white"
                >
                    Check out Templatr
                    <ArrowRight className="h-3.5 w-3.5" />
                </a>
            </p>
            <button
                type="button"
                onClick={handleDismiss}
                aria-label="Dismiss this message"
                className="absolute right-2 shrink-0 rounded-full p-1 text-white/60 transition hover:bg-white/10 hover:text-white sm:right-4"
            >
                <X className="h-4 w-4" />
            </button>
        </div>
    );
}
