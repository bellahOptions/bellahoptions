import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

/**
 * Formats a monetary amount with a currency prefix, omitting the decimal
 * places entirely when the amount has no cents (e.g. "₦85,000" instead of
 * "₦85,000.00") while still showing them when they matter (e.g. "₦85,000.05").
 */
export function formatMoney(amount, currency = 'NGN') {
    const numericAmount = Number(amount || 0);
    const hasCents = Math.round(Math.abs(numericAmount) * 100) % 100 !== 0;
    const formattedAmount = numericAmount.toLocaleString(undefined, {
        minimumFractionDigits: hasCents ? 2 : 0,
        maximumFractionDigits: 2,
    });
    const normalizedCurrency = String(currency || '').toUpperCase();

    if (normalizedCurrency === 'NGN' || normalizedCurrency === '') {
        return `₦${formattedAmount}`;
    }

    return `${normalizedCurrency} ${formattedAmount}`;
}
