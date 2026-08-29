import { MobileCard, MobileCardActions, MobileCardHeader, MobileCardList, MobileCardRow } from '@/Components/ui/mobile-cards';
import FinanceTabs from '@/Components/finance/FinanceTabs';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { AlertTriangle, FileUp, Trash2, UploadCloud } from 'lucide-react';
import { useRef } from 'react';

export default function BankImportsIndex({ imports }) {
    const { flash } = usePage().props;
    const fileInputRef = useRef(null);

    const form = useForm({
        statement: null,
    });

    const submitUpload = (event) => {
        event.preventDefault();

        if (!form.data.statement) {
            return;
        }

        form.post(route('admin.finance.bank-imports.store'), {
            forceFormData: true,
            onSuccess: () => {
                form.reset();
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            },
        });
    };

    const deleteImport = (importId, filename) => {
        if (!window.confirm(`Delete the import "${filename}"? Any expenses/income already confirmed from it will be kept, but unconverted rows will be lost.`)) {
            return;
        }

        router.delete(route('admin.finance.bank-imports.destroy', importId));
    };

    return (
        <AuthenticatedLayout
            header={<h2 className="text-xl font-semibold leading-tight text-gray-800">Bank Statement Import</h2>}
        >
            <Head title="Bank Statement Import" />

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

                    <FinanceTabs active="bank-imports" />

                    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                        <h3 className="text-lg font-semibold text-gray-900">Upload a Statement</h3>
                        <p className="mt-1 text-sm text-gray-600">
                            Currently supports Fidelity Bank (Nigeria) PDF account statements. Each transaction is
                            parsed and matched against the running balance, so nothing is guessed — after reviewing,
                            you can confirm rows as expenses or income, which then flow into the ledger.
                        </p>

                        <form onSubmit={submitUpload} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                            <label
                                htmlFor="statement-file"
                                className="flex flex-1 cursor-pointer items-center gap-3 rounded-lg border border-dashed border-gray-300 px-4 py-3 text-sm text-gray-600 hover:border-brand hover:bg-brand-light/30"
                            >
                                <UploadCloud className="h-5 w-5 shrink-0 text-gray-400" />
                                <span className="truncate">
                                    {form.data.statement ? form.data.statement.name : 'Choose a PDF statement…'}
                                </span>
                            </label>
                            <input
                                id="statement-file"
                                ref={fileInputRef}
                                type="file"
                                accept="application/pdf"
                                className="hidden"
                                onChange={(event) => form.setData('statement', event.target.files?.[0] ?? null)}
                            />
                            <button
                                type="submit"
                                disabled={form.processing || !form.data.statement}
                                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <FileUp className="h-4 w-4" />
                                {form.processing ? 'Parsing…' : 'Upload & Parse'}
                            </button>
                        </form>
                        {form.errors.statement && <p className="mt-2 text-xs text-red-600">{form.errors.statement}</p>}
                    </section>

                    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                        <h3 className="text-lg font-semibold text-gray-900">Past Imports</h3>

                        <div className="mt-4 hidden overflow-x-auto md:block">
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-3 py-2 text-left font-semibold text-gray-600">File</th>
                                        <th className="px-3 py-2 text-left font-semibold text-gray-600">Account</th>
                                        <th className="px-3 py-2 text-left font-semibold text-gray-600">Period</th>
                                        <th className="px-3 py-2 text-right font-semibold text-gray-600">Rows</th>
                                        <th className="px-3 py-2 text-left font-semibold text-gray-600">Status</th>
                                        <th className="px-3 py-2 text-left font-semibold text-gray-600">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {(imports?.data || []).length === 0 && (
                                        <tr>
                                            <td className="px-3 py-4 text-gray-500" colSpan={6}>
                                                No statements imported yet.
                                            </td>
                                        </tr>
                                    )}

                                    {(imports?.data || []).map((item) => (
                                        <tr key={item.id}>
                                            <td className="px-3 py-3 align-top text-gray-900">{item.original_filename}</td>
                                            <td className="px-3 py-3 align-top text-gray-700">
                                                <p>{item.account_name || 'N/A'}</p>
                                                <p className="text-xs text-gray-500">{item.account_number || ''}</p>
                                            </td>
                                            <td className="px-3 py-3 align-top text-gray-700">
                                                {item.period_start && item.period_end ? `${item.period_start} → ${item.period_end}` : 'N/A'}
                                            </td>
                                            <td className="px-3 py-3 align-top text-right text-gray-700">{item.total_rows}</td>
                                            <td className="px-3 py-3 align-top">
                                                <div className="flex flex-wrap gap-1.5">
                                                    <span className="inline-flex rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700">
                                                        {item.pending_count} pending
                                                    </span>
                                                    <span className="inline-flex rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">
                                                        {item.converted_count} converted
                                                    </span>
                                                    {item.flagged_rows > 0 && (
                                                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-700">
                                                            <AlertTriangle className="h-3 w-3" />
                                                            {item.flagged_rows} flagged
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="space-x-2 px-3 py-3 align-top">
                                                <Link
                                                    href={route('admin.finance.bank-imports.show', item.id)}
                                                    className="rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                                >
                                                    Review
                                                </Link>
                                                <button
                                                    type="button"
                                                    onClick={() => deleteImport(item.id, item.original_filename)}
                                                    className="rounded-md border border-red-200 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-50"
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {(imports?.data || []).length === 0 ? (
                            <p className="text-sm text-gray-500 md:hidden">No statements imported yet.</p>
                        ) : (
                            <MobileCardList>
                                {(imports?.data || []).map((item, index) => (
                                    <MobileCard key={item.id} index={index}>
                                        <MobileCardHeader
                                            title={item.original_filename}
                                            subtitle={item.account_name || item.account_number}
                                        />
                                        <div className="mt-3 space-y-0.5 divide-y divide-gray-50">
                                            <MobileCardRow
                                                label="Period"
                                                value={item.period_start && item.period_end ? `${item.period_start} → ${item.period_end}` : 'N/A'}
                                            />
                                            <MobileCardRow label="Rows" value={item.total_rows} />
                                            <MobileCardRow label="Pending" value={item.pending_count} />
                                            <MobileCardRow label="Converted" value={item.converted_count} />
                                            {item.flagged_rows > 0 && <MobileCardRow label="Flagged" value={item.flagged_rows} />}
                                        </div>
                                        <MobileCardActions>
                                            <Link
                                                href={route('admin.finance.bank-imports.show', item.id)}
                                                className="flex-1 rounded-md border border-slate-200 px-3 py-2 text-center text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                            >
                                                Review
                                            </Link>
                                            <button
                                                type="button"
                                                onClick={() => deleteImport(item.id, item.original_filename)}
                                                className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                                Delete
                                            </button>
                                        </MobileCardActions>
                                    </MobileCard>
                                ))}
                            </MobileCardList>
                        )}

                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-gray-600">
                            <p>
                                Page {imports?.current_page || 1} of {imports?.last_page || 1}
                            </p>
                            <div className="flex items-center gap-2">
                                {imports?.prev_page_url ? (
                                    <Link href={imports.prev_page_url} className="rounded-md border border-gray-300 px-3 py-1.5 text-gray-700 hover:bg-gray-50" preserveScroll>
                                        Previous
                                    </Link>
                                ) : (
                                    <span className="cursor-not-allowed rounded-md border border-gray-200 px-3 py-1.5 text-gray-400">Previous</span>
                                )}
                                {imports?.next_page_url ? (
                                    <Link href={imports.next_page_url} className="rounded-md border border-gray-300 px-3 py-1.5 text-gray-700 hover:bg-gray-50" preserveScroll>
                                        Next
                                    </Link>
                                ) : (
                                    <span className="cursor-not-allowed rounded-md border border-gray-200 px-3 py-1.5 text-gray-400">Next</span>
                                )}
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
