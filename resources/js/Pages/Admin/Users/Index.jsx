import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';

export default function UserIndex({ users, stats = {}, filters = {}, roleOptions = [] }) {
    const { flash } = usePage().props;
    const [search, setSearch] = useState(filters.search || '');
    const [role, setRole] = useState(filters.role || '');

    const applyFilters = (event) => {
        event.preventDefault();

        router.get(
            route('admin.users.index'),
            {
                search,
                role,
            },
            {
                preserveState: true,
                replace: true,
            },
        );
    };

    const resetFilters = () => {
        setSearch('');
        setRole('');

        router.get(route('admin.users.index'), {}, { preserveState: true, replace: true });
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

                    <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                        <MetricCard label="Total Users" value={stats.total_users ?? 0} />
                        <MetricCard label="Staff Users" value={stats.staff_users ?? 0} />
                        <MetricCard label="Customers" value={stats.customer_users ?? 0} />
                        <MetricCard label="Verified" value={stats.verified_users ?? 0} />
                    </section>

                    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                        <form onSubmit={applyFilters} className="grid gap-3 sm:grid-cols-[1fr_auto_auto_auto] sm:items-end">
                            <div>
                                <label htmlFor="user-search" className="mb-1 block text-sm font-medium text-gray-700">
                                    Search
                                </label>
                                <input
                                    id="user-search"
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder="Name or email"
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label htmlFor="user-role" className="mb-1 block text-sm font-medium text-gray-700">
                                    Role
                                </label>
                                <select
                                    id="user-role"
                                    value={role}
                                    onChange={(event) => setRole(event.target.value)}
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                                >
                                    <option value="">All Roles</option>
                                    {roleOptions.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <button
                                type="submit"
                                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                            >
                                Filter
                            </button>
                            <button
                                type="button"
                                onClick={resetFilters}
                                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                            >
                                Reset
                            </button>
                        </form>
                    </section>

                    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                        <div className="overflow-x-auto">
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

function MetricCard({ label, value }) {
    return (
        <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm sm:p-4">
            <p className="text-[11px] uppercase tracking-wide text-gray-500 sm:text-xs">{label}</p>
            <p className="mt-2 text-lg font-semibold text-gray-900 sm:text-2xl">{value}</p>
        </div>
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
