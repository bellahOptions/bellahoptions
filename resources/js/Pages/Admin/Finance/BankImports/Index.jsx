import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Card, CardHeader, CardTitle } from '@/Components/ui/card';
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
            header={<h2 className="jv-display jv-display--sm">Bank Statement Import</h2>}
        >
            <Head title="Bank Statement Import" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
                    {flash?.success && (
                        <div className="rounded-jv-sm border border-emerald-500/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                            {flash.success}
                        </div>
                    )}
                    {flash?.error && (
                        <div className="rounded-jv-sm border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                            {flash.error}
                        </div>
                    )}

                    <FinanceTabs active="bank-imports" />

                    <Card className="p-5">
                        <h3 className="text-lg font-semibold text-white">Upload a Statement</h3>
                        <p className="mt-1 text-sm text-white/60">
                            Currently supports Fidelity Bank (Nigeria) PDF account statements. Each transaction is
                            parsed and matched against the running balance, so nothing is guessed — after reviewing,
                            you can confirm rows as expenses or income, which then flow into the ledger.
                        </p>

                        <form onSubmit={submitUpload} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                            <label
                                htmlFor="statement-file"
                                className="flex flex-1 cursor-pointer items-center gap-3 rounded-jv-sm border border-dashed border-jv-line-strong px-4 py-3 text-sm text-white/60 transition hover:border-jv-accent-line hover:bg-jv-accent/10"
                            >
                                <UploadCloud className="h-5 w-5 shrink-0 text-white/40" />
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
                            <Button
                                type="submit"
                                disabled={form.processing || !form.data.statement}
                                className="sm:w-auto"
                            >
                                <FileUp className="h-4 w-4" />
                                {form.processing ? 'Parsing…' : 'Upload & Parse'}
                            </Button>
                        </form>
                        {form.errors.statement && <p className="mt-2 text-xs text-red-300">{form.errors.statement}</p>}
                    </Card>

                    <Card className="overflow-hidden">
                        <CardHeader className="p-5 pb-3">
                            <CardTitle>Past Imports</CardTitle>
                        </CardHeader>

                        <div className="hidden overflow-x-auto md:block">
                            <table className="min-w-full text-sm">
                                <thead className="border-b border-jv-line">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-white/45">File</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-white/45">Account</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-white/45">Period</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-white/45">Rows</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-white/45">Status</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-white/45">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(imports?.data || []).length === 0 && (
                                        <tr className="border-b border-jv-line/70">
                                            <td className="px-4 py-4 text-white/45" colSpan={6}>
                                                No statements imported yet.
                                            </td>
                                        </tr>
                                    )}

                                    {(imports?.data || []).map((item) => (
                                        <tr key={item.id} className="border-b border-jv-line/70 transition hover:bg-white/[0.04]">
                                            <td className="px-4 py-3 align-top font-medium text-white">{item.original_filename}</td>
                                            <td className="px-4 py-3 align-top text-white/70">
                                                <p>{item.account_name || 'N/A'}</p>
                                                <p className="text-xs text-white/45">{item.account_number || ''}</p>
                                            </td>
                                            <td className="px-4 py-3 align-top text-white/70">
                                                {item.period_start && item.period_end ? `${item.period_start} → ${item.period_end}` : 'N/A'}
                                            </td>
                                            <td className="px-4 py-3 align-top text-right text-white/80">{item.total_rows}</td>
                                            <td className="px-4 py-3 align-top">
                                                <div className="flex flex-wrap gap-1.5">
                                                    <Badge variant="warning">
                                                        {item.pending_count} pending
                                                    </Badge>
                                                    <Badge variant="success">
                                                        {item.converted_count} converted
                                                    </Badge>
                                                    {item.flagged_rows > 0 && (
                                                        <Badge variant="danger">
                                                            <AlertTriangle className="mr-1 h-3 w-3" />
                                                            {item.flagged_rows} flagged
                                                        </Badge>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="space-x-2 px-4 py-3 align-top">
                                                <Link
                                                    href={route('admin.finance.bank-imports.show', item.id)}
                                                    className="inline-flex items-center rounded-full border border-jv-line-strong px-2.5 py-1 text-xs font-semibold text-white/75 transition hover:border-jv-accent-line hover:bg-jv-accent/10 hover:text-white"
                                                >
                                                    Review
                                                </Link>
                                                <button
                                                    type="button"
                                                    onClick={() => deleteImport(item.id, item.original_filename)}
                                                    className="inline-flex items-center rounded-full border border-red-500/30 px-2.5 py-1 text-xs font-semibold text-red-300 transition hover:bg-red-500/10"
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
                            <p className="p-5 text-sm text-white/45 md:hidden">No statements imported yet.</p>
                        ) : (
                            <div className="p-4 md:hidden">
                                <MobileCardList>
                                    {(imports?.data || []).map((item, index) => (
                                        <MobileCard key={item.id} index={index}>
                                            <MobileCardHeader
                                                title={item.original_filename}
                                                subtitle={item.account_name || item.account_number}
                                            />
                                            <div className="mt-3 divide-y divide-jv-line">
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
                                                    className="flex-1 rounded-full border border-jv-line-strong px-3 py-2 text-center text-xs font-semibold text-white/75 transition hover:bg-white/[0.06] hover:text-white"
                                                >
                                                    Review
                                                </Link>
                                                <button
                                                    type="button"
                                                    onClick={() => deleteImport(item.id, item.original_filename)}
                                                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full border border-red-500/30 px-3 py-2 text-xs font-semibold text-red-300 transition hover:bg-red-500/10"
                                                >
                                                    <Trash2 className="h-3.5 w-3.5" />
                                                    Delete
                                                </button>
                                            </MobileCardActions>
                                        </MobileCard>
                                    ))}
                                </MobileCardList>
                            </div>
                        )}

                        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-jv-line px-4 py-3 text-sm text-white/60">
                            <p>
                                Page {imports?.current_page || 1} of {imports?.last_page || 1}
                            </p>
                            <div className="flex items-center gap-2">
                                {imports?.prev_page_url ? (
                                    <Link
                                        href={imports.prev_page_url}
                                        className="rounded-full border border-jv-line-strong px-3 py-1.5 text-white/70 transition hover:bg-white/[0.06] hover:text-white"
                                        preserveScroll
                                    >
                                        Previous
                                    </Link>
                                ) : (
                                    <span className="cursor-not-allowed rounded-full border border-jv-line px-3 py-1.5 text-white/30">Previous</span>
                                )}
                                {imports?.next_page_url ? (
                                    <Link
                                        href={imports.next_page_url}
                                        className="rounded-full border border-jv-line-strong px-3 py-1.5 text-white/70 transition hover:bg-white/[0.06] hover:text-white"
                                        preserveScroll
                                    >
                                        Next
                                    </Link>
                                ) : (
                                    <span className="cursor-not-allowed rounded-full border border-jv-line px-3 py-1.5 text-white/30">Next</span>
                                )}
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
