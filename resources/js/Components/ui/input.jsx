import { cn } from '@/lib/utils';

function Input({ className, type = 'text', ...props }) {
    return (
        <input
            type={type}
            className={cn(
                'flex h-10 w-full rounded-jv-sm border border-jv-line-strong bg-white/[0.05] px-3 py-2 text-sm text-white transition placeholder:text-white/30 focus-visible:border-jv-accent focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-jv-accent/15 disabled:cursor-not-allowed disabled:opacity-50',
                className,
            )}
            {...props}
        />
    );
}

export { Input };
