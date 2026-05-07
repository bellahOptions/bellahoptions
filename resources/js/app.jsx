import '../css/app.css';
import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import GlobalPreloader from '@/Components/GlobalPreloader';
import ClientErrorBoundary from '@/Components/ClientErrorBoundary';

const appName = import.meta.env.VITE_APP_NAME || 'Bellah Options';

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
            <ClientErrorBoundary>
                <GlobalPreloader>
                    <App {...props} />
                </GlobalPreloader>
            </ClientErrorBoundary>,
        );
    },
    progress: {
        color: '#4B5563',
    },
});
