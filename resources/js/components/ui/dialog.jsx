import { cn } from '@/lib/utils';

function Dialog({ open, onOpenChange, children }) {
    return children({ open: Boolean(open), setOpen: onOpenChange });
}

function DialogContent({ open, onClose, className, children }) {
    if (!open) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <button
                type="button"
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
                aria-label="Close dialog"
            />
            <div className={cn('relative z-10 w-full max-w-lg rounded-2xl border border-slate-700 bg-[#111726] p-6 text-slate-100 shadow-2xl', className)}>
                {children}
            </div>
        </div>
    );
}

function DialogHeader({ className, ...props }) {
    return <div className={cn('space-y-2', className)} {...props} />;
}

function DialogTitle({ className, ...props }) {
    return <h3 className={cn('font-display text-xl font-bold text-white', className)} {...props} />;
}

function DialogDescription({ className, ...props }) {
    return <p className={cn('text-sm text-slate-300', className)} {...props} />;
}

function DialogFooter({ className, ...props }) {
    return <div className={cn('mt-6 flex items-center justify-end gap-3', className)} {...props} />;
}

export {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
};
