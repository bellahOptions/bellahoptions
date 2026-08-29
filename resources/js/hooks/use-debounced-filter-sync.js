import { router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';

export function useDebouncedFilterSync(routeName, params, delay = 350, routeParams = undefined) {
    const isFirstRun = useRef(true);
    const paramsRef = useRef(params);
    const [isSyncing, setIsSyncing] = useState(false);
    paramsRef.current = params;

    useEffect(() => {
        if (isFirstRun.current) {
            isFirstRun.current = false;
            return undefined;
        }

        setIsSyncing(true);

        const timeout = setTimeout(() => {
            router.get(route(routeName, routeParams), paramsRef.current, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
                onFinish: () => setIsSyncing(false),
            });
        }, delay);

        return () => clearTimeout(timeout);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, Object.values(params));

    return isSyncing;
}
