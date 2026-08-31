import { cn } from '@/lib/utils';

function Select({ className, children, ...props }) {
    return (
        <select
            className={cn(
                'flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30 disabled:cursor-not-allowed disabled:opacity-50',
                className,
            )}
            {...props}
        >
            {children}
        </select>
    );
}

export { Select };
