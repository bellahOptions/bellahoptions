import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold ring-offset-background transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#000285]/30 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
    {
        variants: {
            variant: {
                default: 'bg-[#000285] text-white hover:bg-[#0010a3]',
                secondary: 'bg-[#eef1ff] text-[#000285] hover:bg-[#e2e8ff]',
                outline: 'border border-[#ced7ff] bg-white text-[#000285] hover:bg-[#f7f9ff]',
                ghost: 'text-[#000285] hover:bg-[#eef1ff]',
                destructive: 'bg-red-600 text-white hover:bg-red-700',
            },
            size: {
                default: 'h-10 px-4 py-2',
                sm: 'h-9 rounded-md px-3',
                lg: 'h-11 rounded-md px-6',
                icon: 'h-10 w-10',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    },
);

function Button({ className, variant, size, asChild = false, ...props }) {
    const Component = asChild ? 'span' : 'button';

    return <Component className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { Button, buttonVariants };
