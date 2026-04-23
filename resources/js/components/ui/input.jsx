import { cn } from '@/lib/utils';
import { forwardRef } from 'react';

const Input = forwardRef(({ className, type = 'text', ...props }, ref) => {
    return (
        <input
            ref={ref}
            type={type}
            className={cn(
                'flex h-11 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#050a97] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
                className,
            )}
            {...props}
        />
    );
});

Input.displayName = 'Input';

export { Input };
