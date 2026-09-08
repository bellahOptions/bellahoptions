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
        position: userRecord.position || '',
        address: userRecord.address || '',
        commission_eligible: Boolean(userRecord.commission_eligible),
        commission_percent: userRecord.commission_percent || '',
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
                                <p><span className="font-semibold">Position:</span> {userRecord.position || 'N/A'}</p>
                                <p><span className="font-semibold">Staff:</span> {userRecord.is_staff ? 'Yes' : 'No'}</p>
                                <p>
                                    <span className="font-semibold">Commission Eligible:</span>{' '}
                                    {userRecord.commission_eligible
                                        ? `Yes (${userRecord.commission_percent}%)`
                                        : 'No'}
                                </p>
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
                                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
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
                                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
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
                                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
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
                                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
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
                                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
                                    >
                                        {roleOptions.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </select>
                                </FieldError>

                                <FieldError error={errors.position}>
                                    <label htmlFor="position" className="mb-1 block text-sm font-medium text-gray-700">
                                        Position / Title
                                    </label>
                                    <input
                                        id="position"
                                        value={data.position}
                                        onChange={(event) => setData('position', event.target.value)}
                                        placeholder="e.g. Customer Service Representative"
                                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
                                    />
                                    <p className="mt-1 text-xs text-gray-500">
                                        Used as this staff member&apos;s signature title on customer emails (e.g. invoice deletion notices).
                                    </p>
                                </FieldError>

                                <div className="rounded-lg border border-gray-200 p-3">
                                    <label htmlFor="commission_eligible" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                                        <input
                                            id="commission_eligible"
                                            type="checkbox"
                                            checked={data.commission_eligible}
                                            onChange={(event) => setData('commission_eligible', event.target.checked)}
                                            className="h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand/30"
                                        />
                                        Eligible for commission on paid invoices
                                    </label>
                                    {errors.commission_eligible && (
                                        <p className="mt-1 text-xs text-red-600">{errors.commission_eligible}</p>
                                    )}

                                    {data.commission_eligible && (
                                        <FieldError error={errors.commission_percent}>
                                            <label htmlFor="commission_percent" className="mb-1 mt-3 block text-sm font-medium text-gray-700">
                                                Commission %
                                            </label>
                                            <input
                                                id="commission_percent"
                                                type="number"
                                                min="0"
                                                max="100"
                                                step="0.01"
                                                value={data.commission_percent}
                                                onChange={(event) => setData('commission_percent', event.target.value)}
                                                placeholder="e.g. 10"
                                                className="w-full max-w-[160px] rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
                                            />
                                            <p className="mt-1 text-xs text-gray-500">
                                                Applied automatically to every invoice paid from now on. Visible to super admins on the Income Splits page.
                                            </p>
                                        </FieldError>
                                    )}
                                </div>

                                <FieldError error={errors.address}>
                                    <label htmlFor="address" className="mb-1 block text-sm font-medium text-gray-700">
                                        Address
                                    </label>
                                    <textarea
                                        id="address"
                                        value={data.address}
                                        onChange={(event) => setData('address', event.target.value)}
                                        className="min-h-20 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
                                    />
                                </FieldError>

                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
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
