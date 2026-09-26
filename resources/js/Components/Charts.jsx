import { useMemo, useState } from "react";
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Legend,
    Line,
    LineChart,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

/**
 * Chart primitives for the admin and customer dashboards.
 *
 * The server already computed the series (`revenue_series`, `user_growth`,
 * `projects_chart`, `referral.monthly`, KPI `trend`) but nothing rendered them,
 * so the dashboards were tables and numbers. These wrappers carry the shared
 * dark-theme styling so each dashboard does not re-invent axis and tooltip
 * config, which is where chart code usually drifts.
 */

const AXIS_COLOR = "rgba(255,255,255,0.45)";
const GRID_COLOR = "rgba(255,255,255,0.08)";

export const CHART_COLORS = {
    brand: "#0055ff",
    brandSoft: "#5c93ff",
    emerald: "#34d399",
    amber: "#fbbf24",
    rose: "#fb7185",
    violet: "#a78bfa",
    sky: "#38bdf8",
};

const axisProps = {
    stroke: AXIS_COLOR,
    tick: { fill: AXIS_COLOR, fontSize: 11 },
    tickLine: false,
    axisLine: false,
};

/**
 * Number formatting that stays readable in a narrow axis gutter.
 */
export function compactNumber(value) {
    const numeric = Number(value || 0);

    if (Math.abs(numeric) >= 1_000_000) {
        return `${(numeric / 1_000_000).toFixed(1)}M`;
    }

    if (Math.abs(numeric) >= 1_000) {
        return `${(numeric / 1_000).toFixed(numeric >= 10_000 ? 0 : 1)}k`;
    }

    return String(Math.round(numeric));
}

export function compactMoney(value, currency = "NGN") {
    const numeric = Number(value || 0);
    const symbol = currency === "NGN" ? "₦" : `${currency} `;

    if (Math.abs(numeric) >= 1_000_000) {
        return `${symbol}${(numeric / 1_000_000).toFixed(1)}M`;
    }

    if (Math.abs(numeric) >= 1_000) {
        return `${symbol}${(numeric / 1_000).toFixed(0)}k`;
    }

    return `${symbol}${Math.round(numeric)}`;
}

/**
 * Shared tooltip. Recharts' default tooltip is a white box, which is unreadable
 * on the dark workspace.
 */
function ChartTooltip({ active, payload, label, valueFormatter, labelFormatter }) {
    if (!active || !payload || payload.length === 0) {
        return null;
    }

    return (
        <div className="rounded-jv-sm border border-jv-line-strong bg-[#0b0f19]/95 px-3 py-2 shadow-xl backdrop-blur">
            {label !== undefined && label !== null ? (
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/45">
                    {labelFormatter ? labelFormatter(label) : label}
                </p>
            ) : null}
            <ul className="space-y-1">
                {payload.map((entry) => (
                    <li key={String(entry.dataKey ?? entry.name)} className="flex items-center gap-2 text-xs">
                        <span
                            className="h-2 w-2 shrink-0 rounded-full"
                            style={{ backgroundColor: entry.color || entry.fill }}
                        />
                        <span className="text-white/55">{entry.name}</span>
                        <span className="ml-auto font-semibold text-white">
                            {valueFormatter ? valueFormatter(entry.value, entry.dataKey) : compactNumber(entry.value)}
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

const legendStyle = {
    fontSize: 11,
    color: "rgba(255,255,255,0.55)",
    paddingTop: 8,
};

/**
 * A titled chart panel matching the `jv-card` surfaces used elsewhere.
 */
export function ChartCard({
    title,
    description = "",
    icon: Icon = null,
    action = null,
    height = 260,
    isEmpty = false,
    emptyText = "Not enough data to chart yet.",
    children,
    className = "",
}) {
    return (
        <section className={`jv-card jv-card--pad ${className}`}>
            <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                    {Icon ? (
                        <span className="mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-jv-sm border border-jv-line-strong bg-white/[0.06] text-jv-accent">
                            <Icon className="h-4 w-4" />
                        </span>
                    ) : null}
                    <div className="min-w-0">
                        <h2 className="text-base font-semibold tracking-tight text-white">{title}</h2>
                        {description ? (
                            <p className="mt-1 text-xs leading-5 text-white/50">{description}</p>
                        ) : null}
                    </div>
                </div>
                {action}
            </div>

            {isEmpty ? (
                <p className="py-10 text-center text-sm text-white/45">{emptyText}</p>
            ) : (
                <div style={{ width: "100%", height }}>
                    <ResponsiveContainer width="100%" height="100%">
                        {children}
                    </ResponsiveContainer>
                </div>
            )}
        </section>
    );
}

/**
 * Revenue and invoice volume over time.
 */
export function RevenueChart({
    data = [],
    currency = "NGN",
    labels = { revenue: "Revenue", volume: "Invoice volume" },
    height = 280,
}) {
    const hasData = useMemo(
        () => Array.isArray(data) && data.some((point) => Number(point.revenue || 0) > 0 || Number(point.invoice_volume || 0) > 0),
        [data],
    );

    return (
        <ChartCard
            title="Revenue Trend"
            description="Paid revenue against total invoice volume, last 12 months."
            height={height}
            isEmpty={!hasData}
            emptyText="No invoice activity in the last 12 months yet."
        >
            <AreaChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <defs>
                    <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={CHART_COLORS.brand} stopOpacity={0.45} />
                        <stop offset="100%" stopColor={CHART_COLORS.brand} stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="volumeFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={CHART_COLORS.violet} stopOpacity={0.28} />
                        <stop offset="100%" stopColor={CHART_COLORS.violet} stopOpacity={0.02} />
                    </linearGradient>
                </defs>
                <CartesianGrid stroke={GRID_COLOR} vertical={false} />
                <XAxis dataKey="label" {...axisProps} minTickGap={28} />
                <YAxis {...axisProps} width={56} tickFormatter={(value) => compactMoney(value, currency)} />
                <Tooltip
                    content={<ChartTooltip valueFormatter={(value) => compactMoney(value, currency)} />}
                />
                <Legend wrapperStyle={legendStyle} />
                <Area
                    type="monotone"
                    dataKey="invoice_volume"
                    name={labels.volume}
                    stroke={CHART_COLORS.violet}
                    fill="url(#volumeFill)"
                    strokeWidth={2}
                />
                <Area
                    type="monotone"
                    dataKey="revenue"
                    name={labels.revenue}
                    stroke={CHART_COLORS.brandSoft}
                    fill="url(#revenueFill)"
                    strokeWidth={2}
                />
            </AreaChart>
        </ChartCard>
    );
}

/**
 * Cumulative user growth with daily signups as bars behind it.
 */
export function UserGrowthChart({ data = [], height = 260 }) {
    const hasData = useMemo(
        () => Array.isArray(data) && data.some((point) => Number(point.new_signups || 0) > 0),
        [data],
    );

    return (
        <ChartCard
            title="Customer Growth"
            description="Daily signups with the running customer total, last 90 days."
            height={height}
            isEmpty={!hasData}
            emptyText="No new signups in the last 90 days."
        >
            <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={GRID_COLOR} vertical={false} />
                <XAxis dataKey="date" {...axisProps} minTickGap={32} />
                <YAxis {...axisProps} width={48} tickFormatter={compactNumber} />
                <Tooltip content={<ChartTooltip valueFormatter={(value) => Number(value).toLocaleString()} />} />
                <Legend wrapperStyle={legendStyle} />
                <Line
                    type="monotone"
                    dataKey="total_users"
                    name="Total customers"
                    stroke={CHART_COLORS.emerald}
                    strokeWidth={2}
                    dot={false}
                />
                <Line
                    type="monotone"
                    dataKey="new_signups"
                    name="New signups"
                    stroke={CHART_COLORS.sky}
                    strokeWidth={2}
                    dot={false}
                />
            </LineChart>
        </ChartCard>
    );
}

/**
 * Hourly job activity: delivered against still-active.
 */
export function ProjectActivityChart({ data = [], height = 260 }) {
    const hasData = useMemo(
        () => Array.isArray(data) && data.some((point) => Number(point.jobs_delivered || 0) > 0 || Number(point.estimated_delivery || 0) > 0),
        [data],
    );

    return (
        <ChartCard
            title="Project Activity"
            description="Jobs delivered against jobs still in progress, last 24 hours."
            height={height}
            isEmpty={!hasData}
            emptyText="No project activity in the last 24 hours."
        >
            <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={GRID_COLOR} vertical={false} />
                <XAxis dataKey="time" {...axisProps} minTickGap={24} />
                <YAxis {...axisProps} width={36} allowDecimals={false} tickFormatter={compactNumber} />
                <Tooltip content={<ChartTooltip valueFormatter={(value) => String(value)} />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                <Legend wrapperStyle={legendStyle} />
                <Bar dataKey="jobs_delivered" name="Delivered" fill={CHART_COLORS.emerald} radius={[4, 4, 0, 0]} />
                <Bar dataKey="estimated_delivery" name="In progress" fill={CHART_COLORS.brand} radius={[4, 4, 0, 0]} />
            </BarChart>
        </ChartCard>
    );
}

/**
 * Single-series sparkline for a KPI tile, using the KPI's own 7-day trend.
 */
export function KpiSparkline({ data = [], color = CHART_COLORS.brand, height = 40 }) {
    const points = useMemo(
        () => (Array.isArray(data) ? data.map((value, index) => ({ index, value: Number(value || 0) })) : []),
        [data],
    );

    const hasSignal = points.some((point) => point.value > 0);

    if (!hasSignal) {
        return <div style={{ height }} aria-hidden="true" />;
    }

    const label = `Trend over the last ${points.length} days`;

    return (
        <div style={{ width: "100%", height }} role="img" aria-label={label}>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={points} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id={`spark-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={color} stopOpacity={0.5} />
                            <stop offset="100%" stopColor={color} stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <Area
                        type="monotone"
                        dataKey="value"
                        stroke={color}
                        strokeWidth={1.5}
                        fill={`url(#spark-${color.replace("#", "")})`}
                        dot={false}
                        isAnimationActive={false}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}

/**
 * Monthly referral breakdown. Referral counts are small integers, so a bar
 * chart communicates them better than a line.
 */
export function ReferralChart({ data = [], height = 200 }) {
    const hasData = useMemo(
        () => Array.isArray(data) && data.some((point) => Number(point.count || 0) > 0),
        [data],
    );

    return (
        <ChartCard
            title="Referral Activity"
            description="Confirmed referrals over the last 6 months."
            height={height}
            isEmpty={!hasData}
            emptyText="No referrals recorded yet — share your link to get started."
        >
            <BarChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={GRID_COLOR} vertical={false} />
                <XAxis dataKey="month" {...axisProps} />
                <YAxis {...axisProps} width={30} allowDecimals={false} tickFormatter={compactNumber} />
                <Tooltip content={<ChartTooltip valueFormatter={(value) => String(value)} />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                <Bar dataKey="count" name="Referrals" fill={CHART_COLORS.brandSoft} radius={[4, 4, 0, 0]} />
            </BarChart>
        </ChartCard>
    );
}

/**
 * Donut for a two- or three-way split, e.g. delivered against remaining.
 */
export function SplitDonut({ data = [], height = 200, centerLabel = "", centerValue = "" }) {
    const filtered = useMemo(
        () => (Array.isArray(data) ? data.filter((entry) => Number(entry.value || 0) > 0) : []),
        [data],
    );

    const [activeIndex, setActiveIndex] = useState(-1);

    if (filtered.length === 0) {
        return <div style={{ height }} className="flex items-center justify-center text-sm text-white/45">Nothing to split yet.</div>;
    }

    return (
        <div style={{ width: "100%", height }} className="relative">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={filtered}
                        dataKey="value"
                        nameKey="name"
                        innerRadius="62%"
                        outerRadius="88%"
                        paddingAngle={3}
                        stroke="none"
                        onMouseEnter={(_, index) => setActiveIndex(index)}
                        onMouseLeave={() => setActiveIndex(-1)}
                    >
                        {filtered.map((entry, index) => (
                            <Cell
                                key={entry.name}
                                fill={entry.color || CHART_COLORS.brand}
                                opacity={activeIndex === -1 || activeIndex === index ? 1 : 0.45}
                            />
                        ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip valueFormatter={(value) => String(value)} />} />
                </PieChart>
            </ResponsiveContainer>

            {centerValue !== "" ? (
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <span className="jv-display jv-display--sm">{centerValue}</span>
                    {centerLabel ? (
                        <span className="mt-1 text-[11px] uppercase tracking-[0.14em] text-white/45">{centerLabel}</span>
                    ) : null}
                </div>
            ) : null}
        </div>
    );
}

export default {
    ChartCard,
    RevenueChart,
    UserGrowthChart,
    ProjectActivityChart,
    ReferralChart,
    SplitDonut,
    KpiSparkline,
    CHART_COLORS,
    compactNumber,
    compactMoney,
};
