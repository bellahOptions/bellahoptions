import { cn } from '@/lib/utils';
import { useToastState } from '@/hooks/use-toast';

const VARIANT_STYLES = {
    default: 'border-slate-700 bg-[#101623] text-slate-100',
    success: 'border-emerald-400/40 bg-emerald-500/10 text-emerald-100',
    error: 'border-rose-400/40 bg-rose-500/10 text-rose-100',
    info: 'border-blue-400/40 bg-blue-500/10 text-blue-100',
};

function Toaster() {
    const { toasts, dismiss } = useToastState();

    return (
        <div className="pointer-events-none fixed right-4 top-4 z-[130] flex w-full max-w-sm flex-col gap-2">
            {toasts.map((item) => (
                <div
                    key={item.id}
                    className={cn(
                        'pointer-events-auto rounded-xl border px-4 py-3 shadow-lg backdrop-blur',
                        VARIANT_STYLES[item.variant] || VARIANT_STYLES.default,
                    )}
                >
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            {item.title ? <p className="text-sm font-bold">{item.title}</p> : null}
                            {item.description ? <p className="mt-1 text-xs text-slate-200/90">{item.description}</p> : null}
                        </div>
                        <button
                            type="button"
                            onClick={() => dismiss(item.id)}
                            className="rounded-md p-1 text-slate-300 hover:bg-slate-700 hover:text-white"
                            aria-label="Dismiss notification"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
}

export { Toaster };
