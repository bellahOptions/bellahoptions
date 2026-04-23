import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';

export default function UserShow({ userRecord, roleOptions = [] }) {
    const { flash, auth } = usePage().props;
    const currentUserId = auth?.user?.id;
    const isSelf = currentUserId === userRecord.id;

    const { data, setData, patch, processing, errors } = useForm({
        name: userRecord.name || '',
        first_name: userRecord.first_name || '',
        last_name: userRecord.last_name || '',
        email: userRecord.email || '',
        role: userRecord.role || 'user',
        address: userRecord.address || '',
    });

    const submit = (event) => {
        event.preventDefault();

        patch(route('admin.users.update', userRecord.id), {
            preserveScroll: true,
        });
    };

    const deleteUser = () => {
        if (!window.confirm(`Delete user ${userRecord.email}? This action cannot be undone.`)) {
            return;
        }

        router.delete(route('admin.users.destroy', userRecord.id), {
            preserveScroll: true,
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">
                        User: {userRecord.name || userRecord.email}
                    </h2>
                    <Link
                        href={route('admin.users.index')}
                        className="rounded-md border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                    >
                        Back to Users
                    </Link>
                </div>
            }
        >
            <Head title={`User ${userRecord.name || userRecord.email}`} />

            <div className="py-8">
                <div className="mx-auto max-w-5xl space-y-6 px-4 sm:px-6 lg:px-8">
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

                    <section className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
                        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
                            <h3 className="text-lg font-semibold text-gray-900">Account Snapshot</h3>
                            <div className="mt-4 space-y-2 text-sm text-gray-700">
                                <p><span className="font-semibold">Email:</span> {userRecord.email}</p>
                                <p><span className="font-semibold">Role:</span> {formatRole(userRecord.role)}</p>
                                <p><span className="font-semibold">Staff:</span> {userRecord.is_staff ? 'Yes' : 'No'}</p>
                                <p><span className="font-semibold">Email Verified:</span> {userRecord.email_verified_at || 'No'}</p>
                                <p><span className="font-semibold">Created At:</span> {userRecord.created_at || 'N/A'}</p>
                                <p><span className="font-semibold">Updated At:</span> {userRecord.updated_at || 'N/A'}</p>
                            </div>

                            <div className="mt-6">
                                <button
                                    type="button"
                                    onClick={deleteUser}
                                    className="rounded-md border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50"
                                >
                                    Delete User
                                </button>
                                {isSelf && (
                                    <p className="mt-2 text-xs text-gray-500">
                                        Self-delete is blocked by backend safety rules.
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
                            <h3 className="text-lg font-semibold text-gray-900">Update User</h3>
                            <p className="mt-1 text-sm text-gray-600">
                                Only super admins can modify or delete users.
                            </p>

                            <form onSubmit={submit} className="mt-5 space-y-4">
                                <FieldError error={errors.name}>
                                    <label htmlFor="name" className="mb-1 block text-sm font-medium text-gray-700">
                                        Full Name
                                    </label>
                                    <input
                                        id="name"
                                        value={data.name}
                                        onChange={(event) => setData('name', event.target.value)}
                                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                                    />
                                </FieldError>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <FieldError error={errors.first_name}>
                                        <label htmlFor="first_name" className="mb-1 block text-sm font-medium text-gray-700">
                                            First Name
                                        </label>
                                        <input
                                            id="first_name"
                                            value={data.first_name}
                                            onChange={(event) => setData('first_name', event.target.value)}
                                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                                        />
                                    </FieldError>

                                    <FieldError error={errors.last_name}>
                                        <label htmlFor="last_name" className="mb-1 block text-sm font-medium text-gray-700">
                                            Last Name
                                        </label>
                                        <input
                                            id="last_name"
                                            value={data.last_name}
                                            onChange={(event) => setData('last_name', event.target.value)}
                                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                                        />
                                    </FieldError>
                                </div>

                                <FieldError error={errors.email}>
                                    <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
                                        Email
                                    </label>
                                    <input
                                        id="email"
                                        type="email"
                                        value={data.email}
                                        onChange={(event) => setData('email', event.target.value)}
                                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                                        required
                                    />
                                </FieldError>

                                <FieldError error={errors.role}>
                                    <label htmlFor="role" className="mb-1 block text-sm font-medium text-gray-700">
                                        Role
                                    </label>
                                    <select
                                        id="role"
                                        value={data.role}
                                        onChange={(event) => setData('role', event.target.value)}
                                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                                    >
                                        {roleOptions.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </FieldError>

                                <FieldError error={errors.address}>
                                    <label htmlFor="address" className="mb-1 block text-sm font-medium text-gray-700">
                                        Address
                                    </label>
                                    <textarea
                                        id="address"
                                        value={data.address}
                                        onChange={(event) => setData('address', event.target.value)}
                                        className="min-h-20 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                                    />
                                </FieldError>

                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {processing ? 'Saving...' : 'Save Changes'}
                                </button>
                            </form>
                        </div>
                    </section>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function FieldError({ error, children }) {
    return (
        <div>
            {children}
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
    );
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
