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
        <AuthenticatedLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">User Management</h2>
                    <Link
                        href={route('dashboard')}
                        className="rounded-md border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                    >
                        Back to Dashboard
                    </Link>
                </div>
            }
        >
            <Head title="User Management" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
                    {flash?.success && (
                        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                            {flash.success}
                        </div>
                    )}

                    {flash?.error && (
                        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {flash.error}
                        </div>
                    )}

                    <StatGrid>
                        <StatCard icon={Users} label="Total Users" value={stats.total_users ?? 0} tone="sky" />
                        <StatCard icon={ShieldCheck} label="Staff Users" value={stats.staff_users ?? 0} tone="brand" />
                        <StatCard icon={UserCircle2} label="Customers" value={stats.customer_users ?? 0} tone="slate" />
                        <StatCard icon={BadgeCheck} label="Verified" value={stats.verified_users ?? 0} tone="emerald" />
                    </StatGrid>

                    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
                        <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
                            <div className="relative flex-1 lg:min-w-[240px]">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <input
                                    id="user-search"
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder="Search name or email…"
                                    className="w-full rounded-lg border border-gray-300 py-2.5 pl-9 pr-9 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
                                />
                                {isSyncing && (
                                    <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-brand" />
                                )}
                            </div>

                            <select
                                id="user-role"
                                value={role}
                                onChange={(event) => setRole(event.target.value)}
                                aria-label="Role"
                                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30 lg:w-auto"
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
                                className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40 lg:w-auto"
                            >
                                <RotateCcw className="h-3.5 w-3.5" />
                                Reset
                            </button>
                        </div>
                    </section>

                    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                        <div className="hidden overflow-x-auto md:block">
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-3 py-2 text-left font-semibold text-gray-600">Name</th>
                                        <th className="px-3 py-2 text-left font-semibold text-gray-600">Email</th>
                                        <th className="px-3 py-2 text-left font-semibold text-gray-600">Role</th>
                                        <th className="px-3 py-2 text-left font-semibold text-gray-600">Verified</th>
                                        <th className="px-3 py-2 text-left font-semibold text-gray-600">Created</th>
                                        <th className="px-3 py-2 text-left font-semibold text-gray-600">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {(users?.data || []).length === 0 && (
                                        <tr>
                                            <td className="px-3 py-4 text-gray-500" colSpan={6}>
                                                No users found.
                                            </td>
                                        </tr>
                                    )}
                                    {(users?.data || []).map((user) => (
                                        <tr key={user.id}>
                                            <td className="px-3 py-3 align-top">
                                                <p className="font-semibold text-gray-900">{displayUserName(user)}</p>
                                                <p className="text-xs text-gray-500">
                                                    {user.first_name || 'N/A'} {user.last_name || ''}
                                                </p>
                                            </td>
                                            <td className="px-3 py-3 align-top text-gray-700">{user.email}</td>
                                            <td className="px-3 py-3 align-top text-gray-700">{formatRole(user.role)}</td>
                                            <td className="px-3 py-3 align-top text-gray-700">
                                                {user.email_verified_at ? 'Yes' : 'No'}
                                            </td>
                                            <td className="px-3 py-3 align-top text-gray-700">{user.created_at || 'N/A'}</td>
                                            <td className="px-3 py-3 align-top">
                                                <Link
                                                    href={route('admin.users.show', user.id)}
                                                    className="rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                                >
                                                    View
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {(users?.data || []).length === 0 ? (
                            <p className="text-sm text-gray-500 md:hidden">No users found.</p>
                        ) : (
                            <MobileCardList>
                                {(users?.data || []).map((user, index) => (
                                    <MobileCard key={user.id} index={index}>
                                        <MobileCardHeader
                                            title={displayUserName(user)}
                                            subtitle={user.email}
                                            badge={
                                                <span
                                                    className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                                                        user.email_verified_at
                                                            ? 'bg-emerald-100 text-emerald-700'
                                                            : 'bg-slate-100 text-slate-600'
                                                    }`}
                                                >
                                                    {user.email_verified_at ? 'Verified' : 'Unverified'}
                                                </span>
                                            }
                                        />

                                        <div className="mt-3 space-y-0.5 divide-y divide-gray-50">
                                            <MobileCardRow label="Role" value={formatRole(user.role)} />
                                            <MobileCardRow label="Created" value={user.created_at || 'N/A'} />
                                        </div>

                                        <MobileCardActions>
                                            <Link
                                                href={route('admin.users.show', user.id)}
                                                className="w-full rounded-md border border-slate-200 px-3 py-2 text-center text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                            >
                                                View
                                            </Link>
                                        </MobileCardActions>
                                    </MobileCard>
                                ))}
                            </MobileCardList>
                        )}

                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-gray-600">
                            <p>
                                Page {users?.current_page || 1} of {users?.last_page || 1}
                            </p>
                            <div className="flex items-center gap-2">
                                {users?.prev_page_url ? (
                                    <Link
                                        href={users.prev_page_url}
                                        className="rounded-md border border-gray-300 px-3 py-1.5 text-gray-700 hover:bg-gray-50"
                                        preserveScroll
                                    >
                                        Previous
                                    </Link>
                                ) : (
                                    <span className="cursor-not-allowed rounded-md border border-gray-200 px-3 py-1.5 text-gray-400">
                                        Previous
                                    </span>
                                )}

                                {users?.next_page_url ? (
                                    <Link
                                        href={users.next_page_url}
                                        className="rounded-md border border-gray-300 px-3 py-1.5 text-gray-700 hover:bg-gray-50"
                                        preserveScroll
                                    >
                                        Next
                                    </Link>
                                ) : (
                                    <span className="cursor-not-allowed rounded-md border border-gray-200 px-3 py-1.5 text-gray-400">
                                        Next
                                    </span>
                                )}
                            </div>
                        </div>
                    </section>
                </div>
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
