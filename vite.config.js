import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [
        laravel({
            input: 'resources/js/app.jsx',
            refresh: true,
        }),
        react(),
    ],

    server: {
        /*
         * Bind IPv4 as well as IPv6.
         *
         * By default Vite binds only `::1` on Windows. It then writes that
         * address into `public/hot` ("http://[::1]:5173"), which Laravel's Vite
         * helper hands to the browser for every asset URL. Browsers reaching the
         * app over 127.0.0.1 / localhost (IPv4) cannot connect to `::1`, so the
         * JS and CSS silently fail to load: the page renders blank and form
         * controls fall back to the browser's default white styling.
         */
        host: '0.0.0.0',
        hmr: {
            host: '127.0.0.1',
        },
    },
});
