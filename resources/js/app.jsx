import '../css/app.css';
import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import axios from 'axios';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import GlobalPreloader from '@/Components/GlobalPreloader';
import ClientErrorBoundary from '@/Components/ClientErrorBoundary';
import { ToastProvider } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';

const FALLBACK_APP_NAME = 'Bellah Options';

/**
 * Resolve the product name used in the document title.
 *
 * Prefers `appName` shared from the server (config('app.name')) and only falls
 * back to the build-time VITE_ variable. The VITE_ value is not trustworthy on
 * its own: `.env` files are NOT variable-expanded by Vite, so a declaration such
 * as `VITE_APP_NAME="${APP_NAME}"` is injected *literally* and rendered every
 * title as "Client Reviews | ${APP_NAME}".
 *
 * `setup()` runs before the head manager fires, so `pageProps` is populated by
 * the time the title callback is first invoked.
 */
let pageProps = null;

const resolveAppName = () => {
    const configured = pageProps?.appName || import.meta.env.VITE_APP_NAME || '';
    const name = String(configured).trim();

    // Reject an empty value or an unresolved placeholder.
    if (name === '' || name.includes('${')) {
        return FALLBACK_APP_NAME;
    }

    return name;
};

axios.defaults.withCredentials = true;

createInertiaApp({
    title: (title) => {
        const appName = resolveAppName();
        const normalized = String(title || '').trim();

        // TEMP DEBUG
        window.__dshTitleCalls = window.__dshTitleCalls || [];
        window.__dshTitleCalls.push({ in: normalized, appName });

        if (normalized === '') {
            return appName;
        }

        return normalized.includes(appName)
            ? normalized
            : `${normalized} | ${appName}`;
    },
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.jsx`,
            import.meta.glob('./Pages/**/*.jsx'),
        ),
    setup({ el, App, props }) {
        // Capture the server-shared props once, before any title is applied.
        pageProps = props.initialPage?.props ?? null;

        const root = createRoot(el);

        root.render(
            <ToastProvider>
                <ClientErrorBoundary>
                    <GlobalPreloader>
                        <App {...props} />
                        <Toaster />
                    </GlobalPreloader>
                </ClientErrorBoundary>
            </ToastProvider>,
        );
    },
    progress: {
        color: '#0055ff',
    },
});
