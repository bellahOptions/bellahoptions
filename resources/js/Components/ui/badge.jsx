import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
    'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition',
    {
        variants: {
            variant: {
                default: 'border-transparent bg-[#eef1ff] text-[#000285]',
                secondary: 'border-transparent bg-slate-100 text-slate-700',
                success: 'border-transparent bg-emerald-100 text-emerald-700',
                warning: 'border-transparent bg-amber-100 text-amber-700',
                outline: 'border-slate-200 text-slate-700',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    },
);

function Badge({ className, variant, ...props }) {
    return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
