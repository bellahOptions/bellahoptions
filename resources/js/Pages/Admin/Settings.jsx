import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, usePage } from '@inertiajs/react';

export default function Settings({ settings }) {
    const { flash } = usePage().props;
    const { data, setData, patch, processing, errors } = useForm({
        maintenance_mode: Boolean(settings?.maintenance_mode),
        coming_soon_mode: Boolean(settings?.coming_soon_mode),
    });

    const submit = (event) => {
        event.preventDefault();

        patch(route('admin.settings.update'), {
            preserveScroll: true,
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Platform Settings
                </h2>
            }
        >
            <Head title="Platform Settings" />

            <div className="py-10">
                <div className="mx-auto max-w-4xl space-y-6 px-4 sm:px-6 lg:px-8">
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

                    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                        <h3 className="text-lg font-semibold text-gray-900">
                            Access Control Modes
                        </h3>
                        <p className="mt-2 text-sm leading-7 text-gray-600">
                            Super admins can pause public authentication routes. When active, visitors cannot use normal login or registration pages.
                        </p>

                        <form onSubmit={submit} className="mt-6 space-y-5">
                            <label className="flex items-start gap-3 rounded-lg border border-gray-200 p-4">
                                <input
                                    type="checkbox"
                                    checked={data.maintenance_mode}
                                    onChange={(event) =>
                                        setData('maintenance_mode', event.target.checked)
                                    }
                                    className="mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span>
                                    <span className="block text-sm font-semibold text-gray-900">
                                        Maintenance Mode
                                    </span>
                                    <span className="mt-1 block text-sm text-gray-600">
                                        Blocks visitor login and registration while maintenance is ongoing.
                                    </span>
                                </span>
                            </label>

                            <label className="flex items-start gap-3 rounded-lg border border-gray-200 p-4">
                                <input
                                    type="checkbox"
                                    checked={data.coming_soon_mode}
                                    onChange={(event) =>
                                        setData('coming_soon_mode', event.target.checked)
                                    }
                                    className="mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span>
                                    <span className="block text-sm font-semibold text-gray-900">
                                        Coming Soon Mode
                                    </span>
                                    <span className="mt-1 block text-sm text-gray-600">
                                        Keeps the app in pre-launch state and blocks public auth.
                                    </span>
                                </span>
                            </label>

                            {(errors.maintenance_mode || errors.coming_soon_mode) && (
                                <p className="text-sm text-red-600">
                                    {errors.maintenance_mode || errors.coming_soon_mode}
                                </p>
                            )}

                            <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex items-center rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {processing ? 'Saving...' : 'Save Settings'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
