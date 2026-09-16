import { cn } from '@/lib/utils';

/**
 * Fluid, wrapping stat-card row. Cards flow based on min-width and a lone
 * item on the last line stretches to fill the row instead of leaving a gap.
 */
export function StatGrid({ children, className }) {
    return <div className={cn('flex flex-wrap gap-3', className)}>{children}</div>;
}

const toneClasses = {
    brand: 'bg-jv-accent/15 text-[#a9c4ff]',
    emerald: 'bg-emerald-500/15 text-emerald-300',
    amber: 'bg-amber-500/15 text-amber-300',
    red: 'bg-red-500/15 text-red-300',
    sky: 'bg-sky-500/15 text-sky-300',
    slate: 'bg-white/[0.07] text-white/70',
    fuchsia: 'bg-fuchsia-500/15 text-fuchsia-300',
};

export function StatCard({ icon: Icon, label, value, tone = 'brand', className }) {
    return (
        <div
            className={cn(
                'jv-card min-w-[190px] flex-1 rounded-jv border border-jv-line bg-white/[0.04] p-4',
                className,
            )}
        >
            <div className="flex items-center gap-3">
                {Icon && (
                    <span
                        className={cn(
                            'flex h-9 w-9 shrink-0 items-center justify-center rounded-jv-sm',
                            toneClasses[tone] || toneClasses.brand,
                        )}
                    >
                        <Icon className="h-5 w-5" />
                    </span>
                )}
                <div className="min-w-0">
                    <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-white/45 sm:text-xs">{label}</p>
                    {/* Never truncate the value — a cut-off number is unreadable, so it wraps instead. */}
                    <p className="mt-0.5 break-words text-lg font-semibold text-white sm:text-xl">{value}</p>
                </div>
            </div>
        </div>
    );
}
