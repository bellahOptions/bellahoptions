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
                sans: 'DM Sans',
            },
            colors: {
                brand: {
                    DEFAULT: '#050a80',
                    dark: '#040860',
                    light: '#eef0fb',
                },
            },
        },
    },

    plugins: [forms],
};
