import { Eyebrow } from '@/Components/PublicUI';
import { Badge } from '@/Components/ui/badge';
import { Card } from '@/Components/ui/card';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';

const inputClass = 'h-10 w-full rounded-jv-sm border border-jv-line-strong bg-white/[0.05] px-3 text-sm text-white transition placeholder:text-white/30 focus-visible:border-jv-accent focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-jv-accent/15';
const labelClass = 'mb-1.5 block text-sm font-medium text-white/65';
const checkboxClass = 'h-4 w-4 rounded border-jv-line-strong bg-white/[0.06] text-jv-accent focus:ring-jv-accent/30';

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
        <AuthenticatedLayout>
            <Head title={`User ${userRecord.name || userRecord.email}`} />

            <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
                <section className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <Eyebrow>User Record</Eyebrow>
                        <h1 className="jv-display jv-display--md mt-5">{userRecord.name || userRecord.email}</h1>
                    </div>
                    <Link href={route('admin.users.index')} className="jv-btn jv-btn--ghost jv-btn--sm">
                        Back to Users
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

                <section className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
                    <Card className="p-5 sm:p-6">
                        <h2 className="text-lg font-semibold tracking-tight text-white">Account Snapshot</h2>
                        <dl className="mt-5 space-y-3 text-sm">
                            <SnapshotRow label="Email" value={userRecord.email} />
                            <SnapshotRow label="Role" value={<Badge variant="outline">{formatRole(userRecord.role)}</Badge>} />
                            <SnapshotRow label="Position" value={userRecord.position || 'N/A'} />
                            <SnapshotRow
                                label="Staff"
                                value={<Badge variant={userRecord.is_staff ? 'default' : 'secondary'}>{userRecord.is_staff ? 'Yes' : 'No'}</Badge>}
                            />
                            <SnapshotRow
                                label="Commission Eligible"
                                value={
                                    userRecord.commission_eligible
                                        ? `Yes (${userRecord.commission_percent}%)`
                                        : 'No'
                                }
                            />
                            <SnapshotRow
                                label="Email Verified"
                                value={
                                    userRecord.email_verified_at
                                        ? <Badge variant="success">Verified</Badge>
                                        : <Badge variant="secondary">No</Badge>
                                }
                            />
                            <SnapshotRow label="Created At" value={userRecord.created_at || 'N/A'} />
                            <SnapshotRow label="Updated At" value={userRecord.updated_at || 'N/A'} />
                        </dl>

                        <div className="mt-6 border-t border-jv-line pt-5">
                            <button
                                type="button"
                                onClick={deleteUser}
                                className="jv-btn jv-btn--sm border border-red-500/40 bg-red-500/10 text-red-300 hover:bg-red-500/20"
                            >
                                Delete User
                            </button>
                            {isSelf && (
                                <p className="mt-2 text-xs text-white/45">
                                    Self-delete is blocked by backend safety rules.
                                </p>
                            )}
                        </div>
                    </Card>

                    <Card className="p-5 sm:p-6">
                        <h2 className="text-lg font-semibold tracking-tight text-white">Update User</h2>
                        <p className="mt-1 text-sm text-white/55">
                            Only super admins can modify or delete users.
                        </p>

                        <form onSubmit={submit} className="mt-6 space-y-4">
                            <FieldError error={errors.name}>
                                <label htmlFor="name" className={labelClass}>
                                    Full Name
                                </label>
                                <input
                                    id="name"
                                    value={data.name}
                                    onChange={(event) => setData('name', event.target.value)}
                                    className={inputClass}
                                />
                            </FieldError>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <FieldError error={errors.first_name}>
                                    <label htmlFor="first_name" className={labelClass}>
                                        First Name
                                    </label>
                                    <input
                                        id="first_name"
                                        value={data.first_name}
                                        onChange={(event) => setData('first_name', event.target.value)}
                                        className={inputClass}
                                    />
                                </FieldError>

                                <FieldError error={errors.last_name}>
                                    <label htmlFor="last_name" className={labelClass}>
                                        Last Name
                                    </label>
                                    <input
                                        id="last_name"
                                        value={data.last_name}
                                        onChange={(event) => setData('last_name', event.target.value)}
                                        className={inputClass}
                                    />
                                </FieldError>
                            </div>

                            <FieldError error={errors.email}>
                                <label htmlFor="email" className={labelClass}>
                                    Email
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    value={data.email}
                                    onChange={(event) => setData('email', event.target.value)}
                                    className={inputClass}
                                    required
                                />
                            </FieldError>

                            <FieldError error={errors.role}>
                                <label htmlFor="role" className={labelClass}>
                                    Role
                                </label>
                                <select
                                    id="role"
                                    value={data.role}
                                    onChange={(event) => setData('role', event.target.value)}
                                    className={inputClass}
                                >
                                    {roleOptions.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </FieldError>

                            <FieldError error={errors.position}>
                                <label htmlFor="position" className={labelClass}>
                                    Position / Title
                                </label>
                                <input
                                    id="position"
                                    value={data.position}
                                    onChange={(event) => setData('position', event.target.value)}
                                    placeholder="e.g. Customer Service Representative"
                                    className={inputClass}
                                />
                                <p className="mt-1.5 text-xs text-white/45">
                                    Used as this staff member&apos;s signature title on customer emails (e.g. invoice deletion notices).
                                </p>
                            </FieldError>

                            <div className="rounded-jv-sm border border-jv-line bg-white/[0.03] p-4">
                                <label htmlFor="commission_eligible" className="flex items-center gap-2.5 text-sm font-medium text-white/70">
                                    <input
                                        id="commission_eligible"
                                        type="checkbox"
                                        checked={data.commission_eligible}
                                        onChange={(event) => setData('commission_eligible', event.target.checked)}
                                        className={checkboxClass}
                                    />
                                    Eligible for commission on paid invoices
                                </label>
                                {errors.commission_eligible && (
                                    <p className="mt-1 text-xs text-red-300">{errors.commission_eligible}</p>
                                )}

                                {data.commission_eligible && (
                                    <FieldError error={errors.commission_percent}>
                                        <label htmlFor="commission_percent" className={`${labelClass} mt-4`}>
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
                                            className={`${inputClass} max-w-[160px]`}
                                        />
                                        <p className="mt-1.5 text-xs text-white/45">
                                            Applied automatically to every invoice paid from now on. Visible to super admins on the Income Splits page.
                                        </p>
                                    </FieldError>
                                )}
                            </div>

                            <FieldError error={errors.address}>
                                <label htmlFor="address" className={labelClass}>
                                    Address
                                </label>
                                <textarea
                                    id="address"
                                    value={data.address}
                                    onChange={(event) => setData('address', event.target.value)}
                                    className="jv-textarea min-h-20"
                                />
                            </FieldError>

                            <button
                                type="submit"
                                disabled={processing}
                                className="jv-btn jv-btn--primary disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {processing ? 'Saving...' : 'Save Changes'}
                            </button>
                        </form>
                    </Card>
                </section>
            </div>
        </AuthenticatedLayout>
    );
}

function SnapshotRow({ label, value }) {
    return (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-jv-line/70 pb-2.5 last:border-0 last:pb-0">
            <dt className="text-white/45">{label}</dt>
            <dd className="font-medium text-white/85">{value}</dd>
        </div>
    );
}

function FieldError({ error, children }) {
    return (
        <div>
            {children}
            {error && <p className="mt-1 text-xs text-red-300">{error}</p>}
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
