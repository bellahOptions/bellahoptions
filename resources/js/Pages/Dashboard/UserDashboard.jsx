import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/Components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Head, Link } from '@inertiajs/react';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import {
    Bell,
    ChartNoAxesColumn,
    FolderKanban,
    Home,
    LifeBuoy,
    LogOut,
    Menu,
    Settings,
    Users,
    Wallet,
    Briefcase,
    Sparkles,
    Upload,
    Copy,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';

const navItems = [
    { label: 'Dashboard', icon: Home, href: '#dashboard' },
    { label: 'My Designs', icon: FolderKanban, href: '#projects' },
    { label: 'Hire Designer', icon: Briefcase, href: '#retainer' },
    { label: 'Transaction History', icon: Wallet, href: '#transactions' },
    { label: 'Business Community Insights', icon: ChartNoAxesColumn, href: '#insights' },
    { label: 'Referrals', icon: Users, href: '#referrals' },
    { label: 'Support / Live Chat', icon: LifeBuoy, href: '#support' },
    { label: 'Settings', icon: Settings, href: route('profile.edit') },
];

const money = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
});

const shortDate = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
});

function formatUsd(value) {
    return money.format(Number(value || 0));
}

function formatDate(value) {
    if (!value) {
        return 'N/A';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return 'N/A';
    }

    return shortDate.format(date);
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

function EmptyState({ message, ctaLabel, ctaHref }) {
    return (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-700 py-16 text-slate-500">
            <ChartNoAxesColumn className="mb-3 h-12 w-12 opacity-30" />
            <p className="text-sm">{message}</p>
            {ctaLabel ? (
                <Link href={ctaHref} className="mt-4">
                    <Button variant="outline" className="border-slate-600 bg-transparent text-slate-200 hover:bg-slate-800">
                        {ctaLabel}
                    </Button>
                </Link>
            ) : null}
        </div>
    );
}

export default function UserDashboard({
    user = {},
    timezone = 'Africa/Lagos',
    stats = {},
    projects_chart: projectsChart = [],
    recent_projects: recentProjects = [],
    quick_actions: quickActions = {},
    referral = {},
    notifications = {},
    has_paid_active_order: hasPaidActiveOrder = false,
}) {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [lagosTime, setLagosTime] = useState('');

    useEffect(() => {
        const timer = window.setTimeout(() => setIsLoading(false), 650);
        return () => window.clearTimeout(timer);
    }, []);

    useEffect(() => {
        const syncClock = () => {
            const now = new Date();
            setLagosTime(
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

    useEffect(() => {
        if ((notifications?.unread_count ?? 0) > 0) {
            toast({
                title: 'New support message',
                description: `You have ${notifications.unread_count} unread support message(s).`,
                variant: 'info',
            });
        }
    }, [notifications?.unread_count, toast]);

    const topStats = useMemo(
        () => [
            {
                key: 'total_jobs',
                label: 'Total Jobs',
                value: stats.total_jobs ?? 0,
                icon: FolderKanban,
            },
            {
                key: 'active_projects',
                label: 'Active Projects',
                value: stats.active_projects ?? 0,
                icon: Briefcase,
            },
            {
                key: 'loyalty_emblem',
                label: 'Loyalty Emblem',
                value: stats.loyalty_emblem ?? 'Bronze',
                icon: Sparkles,
            },
            {
                key: 'uploaded_today',
                label: 'Uploaded Today',
                value: stats.uploaded_today ?? 0,
                icon: Upload,
            },
        ],
        [stats],
    );

    const onCopyReferral = async () => {
        if (!referral?.link) {
            return;
        }

        try {
            await navigator.clipboard.writeText(referral.link);
            toast({
                title: 'Referral link copied',
                description: 'You can now share your referral URL.',
                variant: 'success',
            });
        } catch {
            toast({
                title: 'Copy failed',
                description: 'Please try copying the link manually.',
                variant: 'error',
            });
        }
    };

    const onOpenLiveSupport = () => {
        const toggle = document.querySelector('[aria-label="Open live chat"]');

        if (toggle instanceof HTMLElement) {
            toggle.click();
            toast({
                title: 'Live support opened',
                description: 'A support agent will join shortly.',
                variant: 'info',
            });
            return;
        }

        toast({
            title: 'Live support unavailable',
            description: 'Chat widget is not ready yet.',
            variant: 'error',
        });
    };

    return (
        <div className="min-h-screen bg-[#0A0D14] text-slate-100">
            <Head title="User Dashboard">
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
                <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
            </Head>

            <div className="pointer-events-none fixed inset-0 -z-0">
                <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-blue-600/20 blur-3xl" />
                <div className="absolute right-0 top-1/4 h-80 w-80 rounded-full bg-amber-500/20 blur-3xl" />
            </div>

            <div className="relative z-10 flex">
                <aside className={`fixed inset-y-0 left-0 z-40 w-72 border-r border-slate-800 bg-[#0c111d] transition-transform duration-300 lg:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                    <div className="flex h-16 items-center justify-between border-b border-slate-800 px-5">
                        <Link href={route('home')} className="font-['Syne'] text-lg font-bold tracking-wide text-white">
                            Bellah Options
                        </Link>
                        <button type="button" className="rounded-md p-2 text-slate-400 lg:hidden" onClick={() => setMobileMenuOpen(false)}>
                            ✕
                        </button>
                    </div>

                    <nav className="space-y-1 p-4">
                        {navItems.map((item) => {
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

                    <div className="absolute bottom-0 w-full border-t border-slate-800 p-4">
                        <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-3">
                            <p className="truncate text-sm font-semibold text-white">{user?.name}</p>
                            <p className="truncate text-xs text-slate-400">{user?.email}</p>
                            <Button
                                className="mt-3 w-full bg-blue-600 text-white hover:bg-blue-500"
                                onClick={onOpenLiveSupport}
                            >
                                <LifeBuoy className="mr-2 h-4 w-4" />
                                Live Chat
                            </Button>
                        </div>
                    </div>
                </aside>

                <div className="w-full lg:pl-72">
                    <header className="sticky top-0 z-30 border-b border-slate-800 bg-[#0A0D14]/90 backdrop-blur">
                        <div className="flex h-16 items-center justify-between px-4 sm:px-6">
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    className="rounded-md border border-slate-700 p-2 text-slate-300 lg:hidden"
                                    onClick={() => setMobileMenuOpen(true)}
                                >
                                    <Menu className="h-4 w-4" />
                                </button>
                                <div>
                                    <p className="text-sm text-slate-400">Welcome back,</p>
                                    <p className="font-['Syne'] text-lg font-bold text-white">{user?.name || 'Customer'}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">WAT (UTC+1)</p>
                                    <p className="font-mono text-sm font-semibold text-slate-100">{lagosTime}</p>
                                </div>
                                <button type="button" className="relative rounded-full border border-slate-700 p-2 text-slate-300">
                                    <Bell className="h-5 w-5" />
                                    {(notifications?.unread_count ?? 0) > 0 ? (
                                        <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-slate-950">
                                            {notifications.unread_count}
                                        </span>
                                    ) : null}
                                </button>
                            </div>
                        </div>
                    </header>

                    <main className="space-y-6 px-4 py-6 pb-24 sm:px-6 sm:py-8 lg:pb-8">
                        <section id="dashboard">
                            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                                {topStats.map((item, index) => {
                                    const Icon = item.icon;

                                    if (isLoading) {
                                        return <Skeleton key={item.key} className="h-32 w-full rounded-2xl" />;
                                    }

                                    return (
                                        <motion.div
                                            key={item.key}
                                            initial={{ opacity: 0, y: 12 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: index * 0.05, duration: 0.35 }}
                                        >
                                            <Card className="h-full border-slate-800 bg-[#0f1524]">
                                                <CardHeader className="pb-2">
                                                    <CardTitle className="text-sm text-slate-400">{item.label}</CardTitle>
                                                </CardHeader>
                                                <CardContent className="flex items-end justify-between">
                                                    <p className="font-['Syne'] text-3xl font-bold text-white">{item.value}</p>
                                                    <Icon className="h-6 w-6 text-blue-400" />
                                                </CardContent>
                                            </Card>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </section>

                        {hasPaidActiveOrder ? (
                            <section id="projects" className="rounded-2xl border border-slate-800 bg-[#0f1524] p-4 sm:p-6">
                                <div className="mb-4 flex items-center justify-between">
                                    <div>
                                        <h2 className="font-['Syne'] text-xl font-bold text-white">Projects Update</h2>
                                        <p className="text-sm text-slate-400">Last 24hrs delivery momentum.</p>
                                    </div>
                                    <Badge variant="default" className="bg-amber-400/20 text-amber-200">Live</Badge>
                                </div>

                                {isLoading ? (
                                    <Skeleton className="h-72 w-full" />
                                ) : (
                                    <div className="h-72 w-full">
                                        <ResponsiveContainer>
                                            <AreaChart data={projectsChart}>
                                                <defs>
                                                    <linearGradient id="jobsFill" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#2563EB" stopOpacity={0.45} />
                                                        <stop offset="95%" stopColor="#2563EB" stopOpacity={0.05} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                                <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 12 }} />
                                                <YAxis stroke="#64748b" tick={{ fontSize: 12 }} />
                                                <Tooltip content={<CustomTooltip />} />
                                                <Area
                                                    type="monotone"
                                                    dataKey="jobs_delivered"
                                                    name="Jobs/website progress delivered"
                                                    stroke="#3B82F6"
                                                    fill="url(#jobsFill)"
                                                    strokeWidth={2}
                                                    isAnimationActive
                                                />
                                                <Area
                                                    type="monotone"
                                                    dataKey="estimated_delivery"
                                                    name="Estimated delivery day"
                                                    stroke="#F59E0B"
                                                    fill="transparent"
                                                    strokeWidth={2}
                                                    isAnimationActive
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}
                            </section>
                        ) : null}

                        <section id="transactions" className="rounded-2xl border border-slate-800 bg-[#0f1524] p-4 sm:p-6">
                            <div className="mb-4">
                                <h2 className="font-['Syne'] text-xl font-bold text-white">Recent Projects</h2>
                                <p className="text-sm text-slate-400">Track payments and estimated delivery dates.</p>
                            </div>

                            {isLoading ? (
                                <Skeleton className="h-72 w-full" />
                            ) : recentProjects.length === 0 ? (
                                <EmptyState message="No trades yet. Start trading to see your history." ctaLabel="Start Trading" ctaHref={quickActions?.order_service_url || route('services')} />
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full text-left text-sm">
                                        <thead>
                                            <tr className="border-b border-slate-800 text-slate-400">
                                                <th className="px-3 py-2">Order ID</th>
                                                <th className="px-3 py-2">Description</th>
                                                <th className="px-3 py-2">Amount</th>
                                                <th className="px-3 py-2">Paid On</th>
                                                <th className="px-3 py-2">Est Delivery</th>
                                                <th className="px-3 py-2">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {recentProjects.map((project) => (
                                                <tr key={project.order_id} className="border-b border-slate-900/80 text-slate-200">
                                                    <td className="px-3 py-3 font-mono text-xs">{project.order_id}</td>
                                                    <td className="px-3 py-3">{project.description}</td>
                                                    <td className="px-3 py-3 font-semibold">{formatUsd(project.amount)}</td>
                                                    <td className="px-3 py-3">{formatDate(project.paid_on)}</td>
                                                    <td className="px-3 py-3">{formatDate(project.est_delivery_date)}</td>
                                                    <td className="px-3 py-3">
                                                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${project.status === 'delivered' ? 'bg-emerald-500/20 text-emerald-200' : 'bg-amber-400/20 text-amber-200'}`}>
                                                            {project.status === 'delivered' ? 'Delivered' : 'Ongoing'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </section>

                        <section id="insights" className="grid gap-4 lg:grid-cols-4">
                            {[
                                {
                                    title: 'Order New Service Now',
                                    text: 'Open the order flow and submit your next job brief.',
                                    href: quickActions?.order_service_url || route('services'),
                                },
                                {
                                    title: 'Hire a Designer',
                                    text: 'Switch to monthly retainer support.',
                                    href: quickActions?.retainer_url || route('services'),
                                },
                                {
                                    title: 'Join Community',
                                    text: 'Enter the Bellah business WhatsApp group.',
                                    href: quickActions?.community_url || '#',
                                },
                                {
                                    title: 'Live Support',
                                    text: 'Talk to support now about active jobs.',
                                    onClick: onOpenLiveSupport,
                                },
                            ].map((item, index) => (
                                <motion.div
                                    key={item.title}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.25 + index * 0.05, duration: 0.3 }}
                                    className="h-full"
                                >
                                    <Card className="h-full border-slate-800 bg-[#0f1524]">
                                        <CardContent className="flex h-full flex-col justify-between pt-6">
                                            <div>
                                                <h3 className="font-['Syne'] text-lg font-bold text-white">{item.title}</h3>
                                                <p className="mt-2 text-sm text-slate-400">{item.text}</p>
                                            </div>
                                            {item.onClick ? (
                                                <Button
                                                    onClick={item.onClick}
                                                    className="mt-5 bg-blue-600 text-white hover:bg-blue-500"
                                                >
                                                    Open
                                                </Button>
                                            ) : (
                                                <a
                                                    href={item.href}
                                                    className="mt-5 inline-flex items-center justify-center rounded-md border border-blue-500/40 bg-blue-500/10 px-4 py-2 text-sm font-semibold text-blue-200 hover:bg-blue-500/20"
                                                    target={item.title === 'Join Community' ? '_blank' : undefined}
                                                    rel={item.title === 'Join Community' ? 'noreferrer' : undefined}
                                                >
                                                    Go now
                                                </a>
                                            )}
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </section>

                        <section id="referrals" className="rounded-2xl border border-slate-800 bg-[#0f1524] p-4 sm:p-6">
                            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <h2 className="font-['Syne'] text-xl font-bold text-white">Referral Widget</h2>
                                    <p className="text-sm text-slate-400">
                                        You&apos;ve referred {referral?.friends_referred ?? 0} friends - earned {formatUsd(referral?.discount_earned ?? 0)} in discounts.
                                    </p>
                                </div>
                                <Button
                                    variant="outline"
                                    className="border-slate-600 bg-transparent text-slate-200 hover:bg-slate-800"
                                    onClick={onCopyReferral}
                                >
                                    <Copy className="mr-2 h-4 w-4" />
                                    Copy link
                                </Button>
                            </div>

                            <div className="rounded-lg border border-slate-700 bg-slate-900/60 p-3 text-xs text-slate-300">
                                {referral?.link || 'No referral link generated.'}
                            </div>

                            {isLoading ? (
                                <Skeleton className="mt-4 h-52 w-full" />
                            ) : (referral?.monthly?.length ?? 0) === 0 ? (
                                <EmptyState message="No referral activity yet. Share your link to start earning." />
                            ) : (
                                <div className="mt-4 h-52 w-full">
                                    <ResponsiveContainer>
                                        <BarChart data={referral.monthly}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                                            <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 12 }} />
                                            <YAxis stroke="#64748b" tick={{ fontSize: 12 }} allowDecimals={false} />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Bar dataKey="count" fill="#3B82F6" radius={[8, 8, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </section>
                    </main>
                </div>
            </div>

            <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-800 bg-[#0b101c] lg:hidden">
                <div className="grid grid-cols-4">
                    {[
                        { label: 'Home', icon: Home, href: '#dashboard' },
                        { label: 'Projects', icon: FolderKanban, href: '#projects' },
                        { label: 'Support', icon: LifeBuoy, onClick: onOpenLiveSupport },
                        { label: 'Menu', icon: Menu, onClick: () => setMobileMenuOpen((prev) => !prev) },
                    ].map((item) => {
                        const Icon = item.icon;

                        return item.onClick ? (
                            <button
                                key={item.label}
                                type="button"
                                onClick={item.onClick}
                                className="flex flex-col items-center gap-1 py-2 text-xs text-slate-300"
                            >
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
