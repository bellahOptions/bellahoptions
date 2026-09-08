import { cn } from '@/lib/utils';

/**
 * Fluid, wrapping stat-card row. Cards flow based on min-width and a lone
 * item on the last line stretches to fill the row instead of leaving a gap.
 */
export function StatGrid({ children, className }) {
    return <div className={cn('flex flex-wrap gap-3', className)}>{children}</div>;
}

const toneClasses = {
    brand: 'bg-brand-light text-brand',
    emerald: 'bg-emerald-100 text-emerald-700',
    amber: 'bg-amber-100 text-amber-700',
    red: 'bg-red-100 text-red-700',
    sky: 'bg-sky-100 text-sky-700',
    slate: 'bg-slate-100 text-slate-700',
    fuchsia: 'bg-fuchsia-100 text-fuchsia-700',
};

export function StatCard({ icon: Icon, label, value, tone = 'brand', className }) {
    return (
        <div className={cn('min-w-[190px] flex-1 rounded-xl border border-gray-200 bg-white p-4 shadow-sm', className)}>
            <div className="flex items-center gap-3">
                {Icon && (
                    <span
                        className={cn(
                            'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                            toneClasses[tone] || toneClasses.brand,
                        )}
                    >
                        <Icon className="h-5 w-5" />
                    </span>
                )}
                <div className="min-w-0">
                    <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-gray-500 sm:text-xs">{label}</p>
                    {/* Never truncate the value — a cut-off number is unreadable, so it wraps instead. */}
                    <p className="mt-0.5 break-words text-lg font-bold text-gray-900 sm:text-xl">{value}</p>
                </div>
            </div>
        </div>
    );
}
