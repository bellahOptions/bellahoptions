import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60 ring-offset-white',
    {
        variants: {
            variant: {
                default: 'bg-brand text-white shadow-sm hover:bg-brand-dark',
                secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200',
                outline: 'border border-slate-300 bg-white hover:bg-slate-100',
            },
            size: {
                default: 'h-10 px-4 py-2',
                sm: 'h-9 px-3 text-xs',
                lg: 'h-11 px-6 text-base',
                icon: 'h-10 w-10',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    },
);

function Button({ className, variant, size, type = 'button', ...props }) {
    return (
        <button
            type={type}
            className={cn(buttonVariants({ variant, size }), className)}
            {...props}
        />
    );
}

export { Button, buttonVariants };
