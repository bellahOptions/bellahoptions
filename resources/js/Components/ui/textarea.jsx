import { cn } from '@/lib/utils';

function Textarea({ className, rows = 3, ...props }) {
    return (
        <textarea
            rows={rows}
            className={cn(
                'flex w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30 disabled:cursor-not-allowed disabled:opacity-50',
                className,
            )}
            {...props}
        />
    );
}

export { Textarea };
