import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
    'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition',
    {
        variants: {
            variant: {
                default: 'border-transparent bg-jv-accent/20 text-[#a9c4ff]',
                secondary: 'border-jv-line bg-white/[0.07] text-white/70',
                success: 'border-transparent bg-emerald-500/15 text-emerald-300',
                warning: 'border-transparent bg-amber-500/15 text-amber-300',
                danger: 'border-transparent bg-red-500/15 text-red-300',
                outline: 'border-jv-line-strong text-white/70',
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
