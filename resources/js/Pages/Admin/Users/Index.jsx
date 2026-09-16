import { Eyebrow } from '@/Components/PublicUI';
import { Badge } from '@/Components/ui/badge';
import { Card } from '@/Components/ui/card';
import { MobileCard, MobileCardActions, MobileCardHeader, MobileCardList, MobileCardRow } from '@/Components/ui/mobile-cards';
import { StatCard, StatGrid } from '@/Components/ui/stat-card';
import { useDebouncedFilterSync } from '@/hooks/use-debounced-filter-sync';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import { BadgeCheck, Loader2, RotateCcw, Search, ShieldCheck, UserCircle2, Users } from 'lucide-react';
import { useState } from 'react';

export default function UserIndex({ users, stats = {}, filters = {}, roleOptions = [] }) {
    const { flash } = usePage().props;
    const [search, setSearch] = useState(filters.search || '');
    const [role, setRole] = useState(filters.role || '');

    const isSyncing = useDebouncedFilterSync('admin.users.index', { search, role });
    const hasActiveFilters = Boolean(search || role);

    const resetFilters = () => {
        setSearch('');
        setRole('');
    };

    return (
        <AuthenticatedLayout>
            <Head title="User Management" />

            <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
                <section className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <Eyebrow>Admin</Eyebrow>
                        <h1 className="jv-display jv-display--md mt-5">User Management</h1>
                        <p className="jv-lead mt-4 max-w-2xl">
                            Search, review, and manage every staff and customer account.
                        </p>
                    </div>
                    <Link href={route('dashboard')} className="jv-btn jv-btn--ghost jv-btn--sm">
                        Back to Dashboard
                    </Link>
                </section>

                {flash?.success && (
                    <div className="rounded-jv-sm border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                        {flash.success}
                    </div>
                )}

                {flash?.error && (
                    <div className="rounded-jv-sm border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                        {flash.error}
                    </div>
                )}

                <StatGrid>
                    <StatCard icon={Users} label="Total Users" value={stats.total_users ?? 0} tone="sky" />
                    <StatCard icon={ShieldCheck} label="Staff Users" value={stats.staff_users ?? 0} tone="brand" />
                    <StatCard icon={UserCircle2} label="Customers" value={stats.customer_users ?? 0} tone="slate" />
                    <StatCard icon={BadgeCheck} label="Verified" value={stats.verified_users ?? 0} tone="emerald" />
                </StatGrid>

                <Card className="p-4 sm:p-5">
                    <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
                        <div className="relative flex-1 lg:min-w-[240px]">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                            <input
                                id="user-search"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Search name or email…"
                                className="h-11 w-full rounded-jv-sm border border-jv-line-strong bg-white/[0.05] py-2.5 pl-9 pr-9 text-sm text-white transition placeholder:text-white/30 focus-visible:border-jv-accent focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-jv-accent/15"
                            />
                            {isSyncing && (
                                <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-jv-accent" />
                            )}
                        </div>

                        <select
                            id="user-role"
                            value={role}
                            onChange={(event) => setRole(event.target.value)}
                            aria-label="Role"
                            className="h-11 w-full rounded-jv-sm border border-jv-line-strong bg-white/[0.05] px-3 text-sm text-white transition [color-scheme:dark] focus-visible:border-jv-accent focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-jv-accent/15 lg:w-auto"
                        >
                            <option value="">All roles</option>
                            {roleOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>

                        <button
                            type="button"
                            onClick={resetFilters}
                            disabled={!hasActiveFilters}
                            className="jv-btn jv-btn--ghost h-11 w-full disabled:cursor-not-allowed disabled:opacity-40 lg:w-auto"
                        >
                            <RotateCcw className="h-3.5 w-3.5" />
                            Reset
                        </button>
                    </div>
                </Card>

                <Card className="overflow-hidden">
                    <div className="hidden overflow-x-auto md:block">
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="border-b border-jv-line text-left text-xs uppercase tracking-wide text-white/45">
                                    <th className="px-5 py-3 font-medium">Name</th>
                                    <th className="px-5 py-3 font-medium">Email</th>
                                    <th className="px-5 py-3 font-medium">Role</th>
                                    <th className="px-5 py-3 font-medium">Verified</th>
                                    <th className="px-5 py-3 font-medium">Created</th>
                                    <th className="px-5 py-3 font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(users?.data || []).length === 0 && (
                                    <tr>
                                        <td className="px-5 py-4 text-white/45" colSpan={6}>
                                            No users found.
                                        </td>
                                    </tr>
                                )}
                                {(users?.data || []).map((user) => (
                                    <tr key={user.id} className="border-b border-jv-line/70 transition hover:bg-white/[0.04]">
                                        <td className="px-5 py-3 align-top">
                                            <p className="font-semibold text-white">{displayUserName(user)}</p>
                                            <p className="text-xs text-white/45">
                                                {user.first_name || 'N/A'} {user.last_name || ''}
                                            </p>
                                        </td>
                                        <td className="px-5 py-3 align-top text-white/80">{user.email}</td>
                                        <td className="px-5 py-3 align-top text-white/80">{formatRole(user.role)}</td>
                                        <td className="px-5 py-3 align-top">
                                            {user.email_verified_at ? (
                                                <Badge variant="success">Yes</Badge>
                                            ) : (
                                                <Badge variant="secondary">No</Badge>
                                            )}
                                        </td>
                                        <td className="px-5 py-3 align-top text-white/80">{user.created_at || 'N/A'}</td>
                                        <td className="px-5 py-3 align-top">
                                            <Link
                                                href={route('admin.users.show', user.id)}
                                                className="jv-btn jv-btn--ghost jv-btn--sm"
                                            >
                                                View
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="p-4 md:hidden">
                        {(users?.data || []).length === 0 ? (
                            <p className="text-sm text-white/45">No users found.</p>
                        ) : (
                            <MobileCardList>
                                {(users?.data || []).map((user, index) => (
                                    <MobileCard key={user.id} index={index}>
                                        <MobileCardHeader
                                            title={displayUserName(user)}
                                            subtitle={user.email}
                                            badge={
                                                <Badge variant={user.email_verified_at ? 'success' : 'secondary'}>
                                                    {user.email_verified_at ? 'Verified' : 'Unverified'}
                                                </Badge>
                                            }
                                        />

                                        <div className="mt-3 space-y-0.5 divide-y divide-jv-line/70">
                                            <MobileCardRow label="Role" value={formatRole(user.role)} />
                                            <MobileCardRow label="Created" value={user.created_at || 'N/A'} />
                                        </div>

                                        <MobileCardActions>
                                            <Link
                                                href={route('admin.users.show', user.id)}
                                                className="jv-btn jv-btn--ghost jv-btn--sm w-full"
                                            >
                                                View
                                            </Link>
                                        </MobileCardActions>
                                    </MobileCard>
                                ))}
                            </MobileCardList>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-jv-line px-5 py-4 text-sm text-white/55">
                        <p>
                            Page {users?.current_page || 1} of {users?.last_page || 1}
                        </p>
                        <div className="flex items-center gap-2">
                            {users?.prev_page_url ? (
                                <Link
                                    href={users.prev_page_url}
                                    className="jv-btn jv-btn--ghost jv-btn--sm"
                                    preserveScroll
                                >
                                    Previous
                                </Link>
                            ) : (
                                <span className="cursor-not-allowed rounded-full border border-jv-line px-3.5 py-2 text-xs font-semibold text-white/25">
                                    Previous
                                </span>
                            )}

                            {users?.next_page_url ? (
                                <Link
                                    href={users.next_page_url}
                                    className="jv-btn jv-btn--ghost jv-btn--sm"
                                    preserveScroll
                                >
                                    Next
                                </Link>
                            ) : (
                                <span className="cursor-not-allowed rounded-full border border-jv-line px-3.5 py-2 text-xs font-semibold text-white/25">
                                    Next
                                </span>
                            )}
                        </div>
                    </div>
                </Card>
            </div>
        </AuthenticatedLayout>
    );
}

function displayUserName(user) {
    if (user?.name) {
        return user.name;
    }

    return [user?.first_name, user?.last_name].filter(Boolean).join(' ') || 'N/A';
}

function formatRole(role) {
    const labels = {
        super_admin: 'Super Admin',
        customer_rep: 'Customer Representative',
        admin: 'Admin (Legacy)',
        staff: 'Staff (Legacy)',
        user: 'User',
    };

    return labels[role] || role || 'N/A';
}
