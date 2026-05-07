import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/Components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Head, Link } from '@inertiajs/react';
import {
    Area,
    Bar,
    CartesianGrid,
    Cell,
    ComposedChart,
    Legend,
    Pie,
    PieChart,
    ReferenceArea,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
    Line,
    LineChart,
} from 'recharts';
import {
    Bell,
    ChartNoAxesCombined,
    FileText,
    LayoutDashboard,
    Menu,
    MessageSquareMore,
    Receipt,
    Settings,
    Users,
    Wrench,
    LogOut,
    Layers,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';

const sidebarItems = [
    { label: 'Dashboard Overview', icon: LayoutDashboard, href: '#overview' },
    { label: 'Users Management', icon: Users, href: route('admin.users.index') },
    { label: 'Live Chat', icon: MessageSquareMore, href: route('admin.live-chat.index') },
    { label: 'Order Management', icon: Receipt, href: '#order-management' },
    { label: 'Invoice Mgt', icon: FileText, href: route('admin.invoices.index') },
    { label: 'Service Management', icon: Wrench, href: route('admin.service-pricing.edit') },
    { label: 'Public Management', icon: Layers, href: route('admin.settings.edit') },
    { label: 'Analytics & Reports', icon: ChartNoAxesCombined, href: '#analytics' },
    { label: 'System Settings', icon: Settings, href: route('admin.settings.edit') },
];

const money = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
});

function formatUsd(value) {
    return money.format(Number(value || 0));
}

function CustomTooltip({ active, payload, label }) {
    if (!active || !payload?.length) {
        return null;
    }

    return (
        <div className="rounded-lg border border-slate-700 bg-[#0e1320] p-3 shadow-xl">
            <p className="mb-1 text-xs text-slate-400">{label}</p>
            {payload.map((entry) => (
                <p key={entry.name} style={{ color: entry.color }} className="text-sm font-semibold">
                    {entry.name}: {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}
                </p>
            ))}
        </div>
    );
}

function EmptyState({ message }) {
    return (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-700 py-16 text-slate-500">
            <ChartNoAxesCombined className="mb-3 h-12 w-12 opacity-30" />
            <p className="text-sm">{message}</p>
        </div>
    );
}

function CountUp({ value = 0, decimals = 0, prefix = '' }) {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
        let frame;
        const duration = 700;
        const start = performance.now();

        const tick = (now) => {
            const progress = Math.min(1, (now - start) / duration);
            setDisplayValue(value * progress);

            if (progress < 1) {
                frame = requestAnimationFrame(tick);
            }
        };

        frame = requestAnimationFrame(tick);

        return () => cancelAnimationFrame(frame);
    }, [value]);

    return <>{prefix}{displayValue.toFixed(decimals)}</>;
}

export default function AdminDashboard({
    user = {},
    timezone = 'Africa/Lagos',
    notifications = {},
    kpis = [],
    revenue_series: revenueSeries = [],
    user_growth: userGrowth = [],
    pending_payments: pendingPayments = [],
    pending_invoices: pendingInvoices = [],
    completion = {},
    leaderboard = [],
    staff_presence: staffPresence = [],
}) {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [clock, setClock] = useState('');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [range, setRange] = useState('30D');
    const [sortBy, setSortBy] = useState('rank');
    const [sortDirection, setSortDirection] = useState('asc');
    const [dialogState, setDialogState] = useState({ open: false, title: '', description: '', action: null });

    useEffect(() => {
        const timer = window.setTimeout(() => setIsLoading(false), 750);
        return () => window.clearTimeout(timer);
    }, []);

    useEffect(() => {
        const syncClock = () => {
            const now = new Date();
            setClock(
                now.toLocaleTimeString('en-NG', {
                    timeZone: timezone,
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                }),
            );
        };

        syncClock();
        const timer = window.setInterval(syncClock, 1000);

        return () => window.clearInterval(timer);
    }, [timezone]);

    const filteredRevenueSeries = useMemo(() => {
        const points = {
            '7D': 7,
            '30D': 30,
            '90D': 90,
            '1Y': 365,
        };

        const count = points[range] ?? 30;

        return revenueSeries.slice(-count);
    }, [range, revenueSeries]);

    const sortedLeaderboard = useMemo(() => {
        const items = [...leaderboard];

        items.sort((a, b) => {
            const left = a?.[sortBy];
            const right = b?.[sortBy];

            if (typeof left === 'string' && typeof right === 'string') {
                return sortDirection === 'asc' ? left.localeCompare(right) : right.localeCompare(left);
            }

            return sortDirection === 'asc' ? Number(left || 0) - Number(right || 0) : Number(right || 0) - Number(left || 0);
        });

        return items;
    }, [leaderboard, sortBy, sortDirection]);

    const completionPieData = [
        { name: 'Delivered', value: completion?.delivered ?? 0, color: '#3B82F6' },
        { name: 'Remaining', value: completion?.remaining ?? 0, color: '#F59E0B' },
    ];

    const handleSort = (key) => {
        if (sortBy === key) {
            setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
            return;
        }

        setSortBy(key);
        setSortDirection('asc');
    };

    const openConfirm = ({ title, description, action }) => {
        setDialogState({
            open: true,
            title,
            description,
            action,
        });
    };

    const runDialogAction = () => {
        dialogState.action?.();
        setDialogState((prev) => ({ ...prev, open: false }));
    };

    const onActionSuccess = (message) => {
        toast({
            title: 'Action completed',
            description: message,
            variant: 'success',
        });
    };

    return (
        <div className="min-h-screen bg-[#0A0D14] text-slate-100">
            <Head title="Admin Dashboard">
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
                <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
            </Head>

            <div className="pointer-events-none fixed inset-0 -z-0">
                <div className="absolute left-0 top-0 h-80 w-80 rounded-full bg-blue-600/15 blur-3xl" />
                <div className="absolute right-0 top-1/3 h-96 w-96 rounded-full bg-emerald-500/10 blur-3xl" />
            </div>

            <div className="relative z-10 flex">
                <aside className={`fixed inset-y-0 left-0 z-40 w-72 border-r border-slate-800 bg-[#0c111d] transition-transform duration-300 lg:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                    <div className="flex h-16 items-center justify-between border-b border-slate-800 px-5">
                        <Link href={route('dashboard')} className="font-['Syne'] text-lg font-bold text-white">
                            Bellah Admin
                        </Link>
                        <button type="button" className="rounded-md p-2 text-slate-400 lg:hidden" onClick={() => setMobileMenuOpen(false)}>
                            ✕
                        </button>
                    </div>

                    <nav className="space-y-1 p-4">
                        {sidebarItems.map((item) => {
                            const Icon = item.icon;

                            return (
                                <a
                                    key={item.label}
                                    href={item.href}
                                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-slate-300 transition hover:bg-slate-800 hover:text-white"
                                >
                                    <Icon className="h-4 w-4 text-blue-400" />
                                    {item.label}
                                </a>
                            );
                        })}

                        <Link
                            method="post"
                            as="button"
                            href={route('logout')}
                            className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-semibold text-rose-300 transition hover:bg-rose-500/10"
                        >
                            <LogOut className="h-4 w-4" />
                            Logout
                        </Link>
                    </nav>
                </aside>

                <div className="w-full lg:pl-72">
                    <header className="sticky top-0 z-30 border-b border-slate-800 bg-[#0A0D14]/90 backdrop-blur">
                        <div className="flex h-16 items-center justify-between px-4 sm:px-6">
                            <div className="flex items-center gap-3">
                                <button type="button" className="rounded-md border border-slate-700 p-2 text-slate-300 lg:hidden" onClick={() => setMobileMenuOpen(true)}>
                                    <Menu className="h-4 w-4" />
                                </button>
                                <div>
                                    <p className="text-sm text-slate-400">Staff console</p>
                                    <p className="font-['Syne'] text-lg font-bold text-white">{user?.name || 'Team Member'}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="hidden rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-200 sm:flex sm:items-center sm:gap-2">
                                    <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-300" />
                                    Active trade ticker
                                </div>

                                <div className="text-right">
                                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">WAT (UTC+1)</p>
                                    <p className="font-mono text-sm font-semibold text-slate-100">{clock}</p>
                                </div>

                                <button type="button" className="relative rounded-full border border-slate-700 p-2 text-slate-300">
                                    <Bell className="h-5 w-5" />
                                    {(notifications?.unread_chats ?? 0) > 0 ? (
                                        <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-slate-950">
                                            {notifications.unread_chats}
                                        </span>
                                    ) : null}
                                </button>
                            </div>
                        </div>
                    </header>

                    <main className="space-y-6 px-4 py-6 pb-20 sm:px-6 sm:py-8 lg:pb-8">
                        <section id="overview" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                            {kpis.map((kpi, index) => (
                                <motion.div
                                    key={kpi.key}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05, duration: 0.35 }}
                                >
                                    <Card className="border-slate-800 bg-[#0f1524]">
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-sm text-slate-400">{kpi.label}</CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            {isLoading ? (
                                                <Skeleton className="h-14 w-full" />
                                            ) : (
                                                <>
                                                    <p className="font-['Syne'] text-3xl font-bold text-white">
                                                        {kpi.key.includes('ngn') ? (
                                                            <CountUp value={Number(kpi.value)} decimals={2} prefix="$" />
                                                        ) : (
                                                            <CountUp value={Number(kpi.value)} decimals={0} />
                                                        )}
                                                    </p>
                                                    <p className={`mt-1 text-xs font-semibold ${Number(kpi.change_percent) >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                                                        {Number(kpi.change_percent) >= 0 ? '+' : ''}
                                                        {Number(kpi.change_percent).toFixed(1)}% vs last month
                                                    </p>
                                                    <div className="mt-3 h-14 w-full">
                                                        <ResponsiveContainer>
                                                            <LineChart data={kpi.trend.map((value, point) => ({ point, value }))}>
                                                                <Line type="monotone" dataKey="value" stroke="#3B82F6" dot={false} strokeWidth={2} />
                                                            </LineChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                </>
                                            )}
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </section>

                        <section id="analytics" className="rounded-2xl border border-slate-800 bg-[#0f1524] p-4 sm:p-6">
                            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <h2 className="font-['Syne'] text-xl font-bold text-white">Revenue Chart</h2>
                                    <p className="text-sm text-slate-400">Monthly revenue with invoice volume overlay.</p>
                                </div>

                                <div className="inline-flex rounded-lg border border-slate-700 bg-slate-900/70 p-1">
                                    {['7D', '30D', '90D', '1Y'].map((option) => (
                                        <button
                                            key={option}
                                            type="button"
                                            onClick={() => setRange(option)}
                                            className={`rounded-md px-3 py-1.5 text-xs font-semibold ${range === option ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}
                                        >
                                            {option}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {isLoading ? (
                                <Skeleton className="h-80 w-full" />
                            ) : (
                                <div className="h-80 w-full">
                                    <ResponsiveContainer>
                                        <ComposedChart data={filteredRevenueSeries}>
                                            <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                                            <XAxis dataKey="label" stroke="#64748b" tick={{ fontSize: 12 }} />
                                            <YAxis yAxisId="left" stroke="#64748b" tick={{ fontSize: 12 }} />
                                            <YAxis yAxisId="right" orientation="right" stroke="#64748b" tick={{ fontSize: 12 }} />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Legend />
                                            <Bar yAxisId="left" dataKey="revenue" name="Invoice" fill="#3B82F6" radius={[6, 6, 0, 0]} />
                                            <Line yAxisId="right" type="monotone" dataKey="invoice_volume" name="Payments" stroke="#10B981" strokeWidth={2} dot={false} />
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </section>

                        <section className="rounded-2xl border border-slate-800 bg-[#0f1524] p-4 sm:p-6">
                            <div className="mb-4">
                                <h2 className="font-['Syne'] text-xl font-bold text-white">User Growth</h2>
                                <p className="text-sm text-slate-400">Cumulative users with daily signups.</p>
                            </div>

                            {isLoading ? (
                                <Skeleton className="h-80 w-full" />
                            ) : (
                                <div className="h-80 w-full">
                                    <ResponsiveContainer>
                                        <ComposedChart data={userGrowth}>
                                            {userGrowth
                                                .filter((point) => point.is_weekend)
                                                .map((point) => (
                                                    <ReferenceArea key={`weekend-${point.date}`} x1={point.date} x2={point.date} fill="#334155" fillOpacity={0.2} />
                                                ))}
                                            <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                                            <XAxis dataKey="date" stroke="#64748b" tick={{ fontSize: 12 }} />
                                            <YAxis stroke="#64748b" tick={{ fontSize: 12 }} />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Area type="monotone" dataKey="total_users" name="Total Users" stroke="#60A5FA" fill="#1D4ED8" fillOpacity={0.2} strokeWidth={2} />
                                            <Bar dataKey="new_signups" name="New Signups" fill="#F59E0B" radius={[5, 5, 0, 0]} />
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </section>

                        <section className="rounded-2xl border border-slate-800 bg-[#0f1524] p-4 sm:p-6">
                            <h2 className="font-['Syne'] text-xl font-bold text-white">Pending Actions</h2>
                            <p className="mb-4 text-sm text-slate-400">Resolve pending payment and interrupted invoice actions.</p>

                            <Tabs defaultValue="payments">
                                <TabsList>
                                    <TabsTrigger value="payments">Pending Payment</TabsTrigger>
                                    <TabsTrigger value="invoices">Pending Invoice</TabsTrigger>
                                </TabsList>

                                <TabsContent value="payments">
                                    {isLoading ? (
                                        <Skeleton className="h-56 w-full" />
                                    ) : pendingPayments.length === 0 ? (
                                        <EmptyState message="No pending payments right now." />
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full text-left text-sm">
                                                <thead>
                                                    <tr className="border-b border-slate-800 text-slate-400">
                                                        <th className="px-3 py-2">User</th>
                                                        <th className="px-3 py-2">Amount</th>
                                                        <th className="px-3 py-2">Method</th>
                                                        <th className="px-3 py-2">Date</th>
                                                        <th className="px-3 py-2">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {pendingPayments.map((item) => (
                                                        <tr key={item.id} className="border-b border-slate-900/80 text-slate-200">
                                                            <td className="px-3 py-3">{item.user}</td>
                                                            <td className="px-3 py-3 font-semibold">{formatUsd(item.amount)}</td>
                                                            <td className="px-3 py-3">{item.method}</td>
                                                            <td className="px-3 py-3">{item.date}</td>
                                                            <td className="px-3 py-3">
                                                                <div className="flex gap-2">
                                                                    <Button
                                                                        size="sm"
                                                                        className="h-8 bg-blue-600 px-3 text-xs hover:bg-blue-500"
                                                                        onClick={() => openConfirm({
                                                                            title: 'Send payment reminder?',
                                                                            description: `Send reminder to ${item.user} for ${formatUsd(item.amount)}.`,
                                                                            action: () => onActionSuccess('Payment reminder sent.'),
                                                                        })}
                                                                    >
                                                                        Remind
                                                                    </Button>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        className="h-8 border-rose-500/50 bg-transparent px-3 text-xs text-rose-200 hover:bg-rose-500/10"
                                                                        onClick={() => openConfirm({
                                                                            title: 'Cancel pending payment?',
                                                                            description: `Cancel pending payment record for ${item.user}.`,
                                                                            action: () => onActionSuccess('Pending payment canceled.'),
                                                                        })}
                                                                    >
                                                                        Cancel
                                                                    </Button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </TabsContent>

                                <TabsContent value="invoices">
                                    {isLoading ? (
                                        <Skeleton className="h-56 w-full" />
                                    ) : pendingInvoices.length === 0 ? (
                                        <EmptyState message="No dropped invoice sessions right now." />
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full text-left text-sm">
                                                <thead>
                                                    <tr className="border-b border-slate-800 text-slate-400">
                                                        <th className="px-3 py-2">User</th>
                                                        <th className="px-3 py-2">Amount</th>
                                                        <th className="px-3 py-2">Wallet</th>
                                                        <th className="px-3 py-2">Date</th>
                                                        <th className="px-3 py-2">Actions</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {pendingInvoices.map((item) => (
                                                        <tr key={item.id} className="border-b border-slate-900/80 text-slate-200">
                                                            <td className="px-3 py-3">{item.user}</td>
                                                            <td className="px-3 py-3 font-semibold">{formatUsd(item.amount)}</td>
                                                            <td className="px-3 py-3">{item.wallet}</td>
                                                            <td className="px-3 py-3">{item.date}</td>
                                                            <td className="px-3 py-3">
                                                                <div className="flex gap-2">
                                                                    <a
                                                                        href={`mailto:${item.email}?subject=Your Bellah Order&body=Hello ${encodeURIComponent(item.user)},`}
                                                                        className="inline-flex h-8 items-center rounded-md border border-blue-500/50 bg-blue-500/10 px-3 text-xs font-semibold text-blue-100 hover:bg-blue-500/20"
                                                                    >
                                                                        Contact
                                                                    </a>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        className="h-8 border-rose-500/50 bg-transparent px-3 text-xs text-rose-200 hover:bg-rose-500/10"
                                                                        onClick={() => openConfirm({
                                                                            title: 'Delete pending invoice record?',
                                                                            description: `Delete interrupted invoice record for ${item.user}.`,
                                                                            action: () => onActionSuccess('Pending invoice record deleted.'),
                                                                        })}
                                                                    >
                                                                        Delete
                                                                    </Button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </TabsContent>
                            </Tabs>
                        </section>

                        <section className="grid gap-6 xl:grid-cols-2">
                            <Card className="border-slate-800 bg-[#0f1524]">
                                <CardHeader>
                                    <CardTitle className="font-['Syne'] text-xl text-white">Project Completion Rate</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {isLoading ? (
                                        <Skeleton className="h-72 w-full" />
                                    ) : (
                                        <div className="h-72 w-full">
                                            <ResponsiveContainer>
                                                <PieChart>
                                                    <Pie
                                                        data={completionPieData}
                                                        dataKey="value"
                                                        nameKey="name"
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={68}
                                                        outerRadius={100}
                                                        paddingAngle={4}
                                                    >
                                                        {completionPieData.map((entry) => (
                                                            <Cell key={entry.name} fill={entry.color} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip content={<CustomTooltip />} />
                                                    <Legend />
                                                </PieChart>
                                            </ResponsiveContainer>
                                            <div className="-mt-40 flex flex-col items-center justify-center text-center">
                                                <p className="font-['Syne'] text-3xl font-bold text-white">{completion?.total_trades_today ?? 0}</p>
                                                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Total trades today</p>
                                                <p className="mt-2 text-xs text-emerald-300">WIN {completion?.win_rate ?? 0}%</p>
                                                <p className="text-xs text-amber-300">LOSS {completion?.loss_rate ?? 0}%</p>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            <Card className="border-slate-800 bg-[#0f1524]">
                                <CardHeader>
                                    <CardTitle className="font-['Syne'] text-xl text-white">Staff Presence</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {isLoading ? (
                                        <Skeleton className="h-72 w-full" />
                                    ) : staffPresence.length === 0 ? (
                                        <EmptyState message="No staff presence data available." />
                                    ) : (
                                        <div className="space-y-3">
                                            {staffPresence.map((staff) => (
                                                <div key={staff.id} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/40 px-4 py-3">
                                                    <div>
                                                        <p className="font-semibold text-white">{staff.name}</p>
                                                        <p className="text-xs text-slate-400">{staff.online ? 'Online now' : `Last seen: ${staff.last_seen_at || 'Unknown'}`}</p>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className={`h-2.5 w-2.5 rounded-full ${staff.online ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                                                        <Badge variant="secondary" className="bg-slate-800 text-slate-200">
                                                            {staff.open_chats} open chats
                                                        </Badge>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </section>

                        <section className="rounded-2xl border border-slate-800 bg-[#0f1524] p-4 sm:p-6">
                            <div className="mb-4 flex items-center justify-between">
                                <div>
                                    <h2 className="font-['Syne'] text-xl font-bold text-white">Top Clients Leaderboard</h2>
                                    <p className="text-sm text-slate-400">Volume, win-rate and profit ranking.</p>
                                </div>
                            </div>

                            {isLoading ? (
                                <Skeleton className="h-72 w-full" />
                            ) : sortedLeaderboard.length === 0 ? (
                                <EmptyState message="No top clients data available yet." />
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full text-left text-sm">
                                        <thead>
                                            <tr className="border-b border-slate-800 text-slate-400">
                                                {[
                                                    { key: 'rank', label: 'Rank' },
                                                    { key: 'name', label: 'Name' },
                                                    { key: 'total_volume', label: 'Total Volume' },
                                                    { key: 'win_rate', label: 'Win Rate' },
                                                    { key: 'total_profit', label: 'Total Profit' },
                                                ].map((header) => (
                                                    <th key={header.key} className="px-3 py-2">
                                                        <button type="button" className="inline-flex items-center gap-1 hover:text-white" onClick={() => handleSort(header.key)}>
                                                            {header.label}
                                                            {sortBy === header.key ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
                                                        </button>
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {sortedLeaderboard.map((client) => (
                                                <tr key={`${client.rank}-${client.name}`} className="border-b border-slate-900/80 text-slate-200">
                                                    <td className="px-3 py-3">
                                                        <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${client.rank === 1 ? 'bg-amber-400 text-slate-950' : client.rank === 2 ? 'bg-slate-300 text-slate-900' : client.rank === 3 ? 'bg-orange-400 text-slate-950' : 'bg-slate-700 text-slate-200'}`}>
                                                            {client.rank}
                                                        </span>
                                                    </td>
                                                    <td className="px-3 py-3">
                                                        <div className="flex items-center gap-2">
                                                            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/20 text-xs font-bold text-blue-200">
                                                                {client.avatar}
                                                            </span>
                                                            {client.name}
                                                        </div>
                                                    </td>
                                                    <td className="px-3 py-3 font-semibold">{formatUsd(client.total_volume)}</td>
                                                    <td className="px-3 py-3">{Number(client.win_rate).toFixed(2)}%</td>
                                                    <td className="px-3 py-3 text-emerald-200">{formatUsd(client.total_profit)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </section>
                    </main>
                </div>
            </div>

            <Dialog open={dialogState.open} onOpenChange={(open) => setDialogState((prev) => ({ ...prev, open }))}>
                {({ open, setOpen }) => (
                    <DialogContent open={open} onClose={() => setOpen(false)}>
                        <DialogHeader>
                            <DialogTitle>{dialogState.title}</DialogTitle>
                            <DialogDescription>{dialogState.description}</DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button variant="outline" className="border-slate-600 bg-transparent text-slate-200 hover:bg-slate-800" onClick={() => setOpen(false)}>
                                Cancel
                            </Button>
                            <Button className="bg-blue-600 text-white hover:bg-blue-500" onClick={runDialogAction}>
                                Confirm
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                )}
            </Dialog>

            <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-800 bg-[#0b101c] lg:hidden">
                <div className="grid grid-cols-4">
                    {[
                        { label: 'Home', icon: LayoutDashboard, href: '#overview' },
                        { label: 'Orders', icon: Receipt, href: '#order-management' },
                        { label: 'Chats', icon: MessageSquareMore, href: route('admin.live-chat.index') },
                        { label: 'Menu', icon: Menu, onClick: () => setMobileMenuOpen((prev) => !prev) },
                    ].map((item) => {
                        const Icon = item.icon;

                        return item.onClick ? (
                            <button key={item.label} type="button" onClick={item.onClick} className="flex flex-col items-center gap-1 py-2 text-xs text-slate-300">
                                <Icon className="h-4 w-4" />
                                {item.label}
                            </button>
                        ) : (
                            <a key={item.label} href={item.href} className="flex flex-col items-center gap-1 py-2 text-xs text-slate-300">
                                <Icon className="h-4 w-4" />
                                {item.label}
                            </a>
                        );
                    })}
                </div>
            </nav>
        </div>
    );
}
