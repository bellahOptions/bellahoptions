import { cn } from '@/lib/utils';

function Card({ className, ...props }) {
    return (
        <div
            className={cn(
                'jv-card rounded-jv border border-jv-line bg-white/[0.04] text-white backdrop-blur-sm',
                className,
            )}
            {...props}
        />
    );
}

function CardHeader({ className, ...props }) {
    return <div className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />;
}

function CardTitle({ className, ...props }) {
    return (
        <h3
            className={cn('text-lg font-semibold leading-none tracking-tight text-white', className)}
            {...props}
        />
    );
}

function CardDescription({ className, ...props }) {
    return <p className={cn('text-sm text-white/55', className)} {...props} />;
}

function CardContent({ className, ...props }) {
    return <div className={cn('p-6 pt-0', className)} {...props} />;
}

function CardFooter({ className, ...props }) {
    return <div className={cn('flex items-center p-6 pt-0', className)} {...props} />;
}

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
