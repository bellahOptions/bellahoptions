import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.jsx',
    ],

    theme: {
        extend: {
            fontFamily: {
                sans: ['DM Sans', ...defaultTheme.fontFamily.sans],
                mono: ['ui-monospace', 'SFMono-Regular', 'Fragment Mono', 'Menlo', ...defaultTheme.fontFamily.mono],
            },
            colors: {
                brand: {
                    DEFAULT: '#050a80',
                    dark: '#040860',
                    light: '#eef0fb',
                },
                // Joyce-style dark canvas + accent scale (Bellah blue/black theme)
                jv: {
                    accent: '#0055ff',
                    black: '#050508',
                    bg: '#08080c',
                    ink: '#121216',
                    line: 'rgba(255,255,255,0.08)',
                    'line-strong': 'rgba(255,255,255,0.15)',
                    glass: 'rgba(255,255,255,0.05)',
                },
            },
            borderRadius: {
                'jv-sm': '14px',
                jv: '20px',
                'jv-lg': '28px',
                'jv-xl': '36px',
            },
            maxWidth: {
                jv: '1240px',
            },
            keyframes: {
                'jv-scroll': {
                    from: { transform: 'translateX(0)' },
                    to: { transform: 'translateX(-50%)' },
                },
                'jv-rise': {
                    from: { opacity: '0', transform: 'translateY(14px)' },
                    to: { opacity: '1', transform: 'translateY(0)' },
                },
            },
            animation: {
                'jv-scroll': 'jv-scroll 34s linear infinite',
                'jv-rise': 'jv-rise 620ms cubic-bezier(0.22, 1, 0.36, 1) both',
            },
        },
    },

    plugins: [forms],
};
