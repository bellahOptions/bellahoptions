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

const appName = import.meta.env.VITE_APP_NAME || 'Bellah Options';
axios.defaults.withCredentials = true;

createInertiaApp({
    title: (title) => {
        const normalized = String(title || '').trim();

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
        color: '#4B5563',
    },
});
