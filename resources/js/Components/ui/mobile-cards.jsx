import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'motion/react';

/**
 * Animated stacked-card list shown in place of a <table> below the `md` breakpoint.
 * Pair with a `hidden md:block` table for the desktop view.
 */
export function MobileCardList({ children, className }) {
    return (
        <div className={cn('grid gap-3 md:hidden', className)}>
            <AnimatePresence initial={false}>{children}</AnimatePresence>
        </div>
    );
}

export function MobileCard({ index = 0, className, children, onClick }) {
    return (
        <motion.article
            layout
            initial={{ opacity: 0, y: 14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.28, delay: Math.min(index, 8) * 0.045, ease: 'easeOut' }}
            whileTap={onClick ? { scale: 0.98 } : undefined}
            onClick={onClick}
            className={cn(
                'overflow-hidden rounded-xl border border-gray-200 bg-white p-4 shadow-sm',
                onClick && 'cursor-pointer active:bg-gray-50',
                className,
            )}
        >
            {children}
        </motion.article>
    );
}

export function MobileCardHeader({ title, subtitle, badge }) {
    return (
        <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-900">{title}</p>
                {subtitle ? <p className="mt-0.5 truncate text-xs text-gray-500">{subtitle}</p> : null}
            </div>
            {badge ? <div className="shrink-0">{badge}</div> : null}
        </div>
    );
}

export function MobileCardRow({ label, value, className }) {
    if (value === null || value === undefined || value === '') {
        return null;
    }

    return (
        <div className={cn('flex items-center justify-between gap-3 py-1 text-sm', className)}>
            <span className="shrink-0 text-gray-500">{label}</span>
            <span className="min-w-0 flex-1 truncate text-right font-medium text-gray-800">{value}</span>
        </div>
    );
}

export function MobileCardActions({ children }) {
    return <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-3">{children}</div>;
}
