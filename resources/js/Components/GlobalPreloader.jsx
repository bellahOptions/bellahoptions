import { router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import HashLoader from '@/Components/HashLoader';

export default function GlobalPreloader({ children }) {
    const [isLoading, setIsLoading] = useState(true);
    const timeoutRef = useRef(null);

    useEffect(() => {
        timeoutRef.current = window.setTimeout(() => setIsLoading(false), 450);

        const removeStartListener = router.on('start', () => {
            window.clearTimeout(timeoutRef.current);
            setIsLoading(true);
        });

        const stopLoading = () => {
            window.clearTimeout(timeoutRef.current);
            timeoutRef.current = window.setTimeout(() => setIsLoading(false), 250);
        };

        const removeFinishListener = router.on('finish', stopLoading);
        const removeErrorListener = router.on('error', stopLoading);

        return () => {
            window.clearTimeout(timeoutRef.current);
            removeStartListener();
            removeFinishListener();
            removeErrorListener();
        };
    }, []);

    return (
        <>
            {children}

            {isLoading && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/95 backdrop-blur-sm">
                    <HashLoader color="#00128a" />
                </div>
            )}
        </>
    );
}
