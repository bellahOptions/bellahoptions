import { cn } from '@/lib/utils';

function Label({ className, ...props }) {
    return <label className={cn('text-sm font-medium text-slate-700 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70', className)} {...props} />;
}

export { Label };
