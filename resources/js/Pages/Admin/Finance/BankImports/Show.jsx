import Modal from '@/Components/Modal';
import { Badge } from '@/Components/ui/badge';
import { Card } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { MobileCard, MobileCardActions, MobileCardHeader, MobileCardList, MobileCardRow } from '@/Components/ui/mobile-cards';
import { Select } from '@/Components/ui/select';
import { StatCard, StatGrid } from '@/Components/ui/stat-card';
import { Textarea } from '@/Components/ui/textarea';
import FinanceTabs from '@/Components/finance/FinanceTabs';
import { useDebouncedFilterSync } from '@/hooks/use-debounced-filter-sync';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { formatMoney } from '@/lib/utils';
import { Head, Link, router, usePage, WhenVisible } from '@inertiajs/react';
import { AlertTriangle, ArrowDownRight, ArrowUpRight, Ban, Check, Loader2, Wallet } from 'lucide-react';
import { useMemo, useState } from 'react';

const statusOptions = [
    { value: '', label: 'All statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'ignored', label: 'Ignored' },
];

const typeOptions = [
    { value: '', label: 'All types' },
    { value: 'income', label: 'Income' },
    { value: 'expense', label: 'Expense' },
];

const checkboxClass =
    'h-4 w-4 rounded border-jv-line-strong bg-white/[0.06] text-jv-accent accent-jv-accent focus:ring-2 focus:ring-jv-accent/40 focus:ring-offset-0';

export default function BankImportShow({ import: bankImport, filters = {}, categories = [], transactions }) {
    const { flash } = usePage().props;
    const [status, setStatus] = useState(filters.status || '');
    const [type, setType] = useState(filters.type || '');
    const [selectedIds, setSelectedIds] = useState([]);
    const [convertTarget, setConvertTarget] = useState(null);
    const [convertCategory, setConvertCategory] = useState('');
    const [convertSourceName, setConvertSourceName] = useState('');
    const [convertDescription, setConvertDescription] = useState('');
    const [convertingAll, setConvertingAll] = useState(false);

    const isSyncing = useDebouncedFilterSync('admin.finance.bank-imports.show', { status, type }, 200, bankImport.id);

    const rows = transactions?.data || [];
    const selectablePendingIds = useMemo(
        () => rows.filter((row) => row.status === 'pending').map((row) => row.id),
        [rows],
    );
    const selectedExpenseIds = useMemo(
        () => rows.filter((row) => row.type === 'expense' && selectedIds.includes(row.id)).map((row) => row.id),
        [rows, selectedIds],
    );
    const selectedIncomeIds = useMemo(
        () => rows.filter((row) => row.type === 'income' && selectedIds.includes(row.id)).map((row) => row.id),
        [rows, selectedIds],
    );

    const toggleSelected = (id) => {
        setSelectedIds((previous) => (previous.includes(id) ? previous.filter((current) => current !== id) : [...previous, id]));
    };

    const toggleSelectAll = () => {
        setSelectedIds((previous) => (previous.length === selectablePendingIds.length ? [] : selectablePendingIds));
    };

    const openConvert = (row) => {
        setConvertTarget(row);
        setConvertCategory(row.suggested_category || categories[0] || '');
        setConvertSourceName(row.description.slice(0, 160));
        setConvertDescription(row.description);
    };

    const closeConvert = () => setConvertTarget(null);

    const submitConvert = (event) => {
        event.preventDefault();
        if (!convertTarget) return;

        router.post(
            route('admin.finance.bank-imports.transactions.convert', convertTarget.id),
            {
                type: convertTarget.type,
                category: convertTarget.type === 'expense' ? convertCategory : undefined,
                source_name: convertTarget.type === 'income' ? convertSourceName : undefined,
                description: convertDescription,
            },
            { preserveScroll: true, onSuccess: closeConvert },
        );
    };

    const ignoreRow = (id) => {
        if (!window.confirm('Ignore this transaction? It will be excluded from the ledger.')) return;
        router.patch(route('admin.finance.bank-imports.transactions.ignore', id), {}, { preserveScroll: true });
    };

    const submitBulkConvertExpenses = () => {
        if (selectedExpenseIds.length === 0) return;

        router.post(
            route('admin.finance.bank-imports.bulk-convert', bankImport.id),
            { ids: selectedExpenseIds },
            { preserveScroll: true, onSuccess: () => setSelectedIds((previous) => previous.filter((id) => !selectedExpenseIds.includes(id))) },
        );
    };

    const submitBulkConvertIncome = () => {
        if (selectedIncomeIds.length === 0) return;

        router.post(
            route('admin.finance.bank-imports.bulk-convert', bankImport.id),
            { ids: selectedIncomeIds },
            { preserveScroll: true, onSuccess: () => setSelectedIds((previous) => previous.filter((id) => !selectedIncomeIds.includes(id))) },
        );
    };

    const convertAll = () => {
        if (bankImport.pending_count === 0) return;

        if (!window.confirm(`Convert all ${bankImport.pending_count} pending transactions? Expenses use their suggested category (or "Other"); income rows use their own description as the source.`)) {
            return;
        }

        setConvertingAll(true);
        router.post(
            route('admin.finance.bank-imports.convert-all', bankImport.id),
            {},
            { preserveScroll: true, onSuccess: () => setSelectedIds([]), onFinish: () => setConvertingAll(false) },
        );
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="jv-display jv-display--sm break-words">{bankImport.original_filename}</h2>
                    <div className="flex flex-wrap items-center gap-2">
                        {bankImport.pending_count > 0 && (
                            <button
                                type="button"
                                onClick={convertAll}
                                disabled={convertingAll}
                                className="jv-btn jv-btn--primary jv-btn--sm"
                            >
                                {convertingAll ? 'Converting…' : `Convert All (${bankImport.pending_count} Pending)`}
                            </button>
                        )}
                        <Link
                            href={route('admin.finance.bank-imports.index')}
                            className="jv-btn jv-btn--ghost jv-btn--sm"
                        >
                            Back to Imports
                        </Link>
                    </div>
                </div>
            }
        >
            <Head title={`Import: ${bankImport.original_filename}`} />

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
                        <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                            <div>
                                <p className="text-xs uppercase tracking-wide text-white/45">Account</p>
                                <p className="font-semibold text-white">{bankImport.account_name || 'N/A'}</p>
                                <p className="text-xs text-white/45">{bankImport.account_number}</p>
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-wide text-white/45">Period</p>
                                <p className="font-semibold text-white">
                                    {bankImport.period_start} → {bankImport.period_end}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-wide text-white/45">Opening / Closing Balance</p>
                                <p className="font-semibold text-white">
                                    {formatMoney(bankImport.opening_balance, bankImport.currency)} → {formatMoney(bankImport.closing_balance, bankImport.currency)}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-wide text-white/45">Total Rows</p>
                                <p className="font-semibold text-white">{bankImport.total_rows}</p>
                            </div>
                        </div>
                    </Card>

                    <StatGrid>
                        <StatCard icon={Wallet} label="Pending Review" value={bankImport.pending_count} tone="amber" />
                        <StatCard icon={Check} label="Converted" value={bankImport.converted_count} tone="emerald" />
                        <StatCard icon={Ban} label="Ignored" value={bankImport.ignored_count} tone="slate" />
                        <StatCard icon={AlertTriangle} label="Flagged for Review" value={bankImport.flagged_rows} tone="red" />
                    </StatGrid>

                    <Card className="p-4 sm:p-5">
                        <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
                            <div className="flex items-center gap-2">
                                <Select
                                    value={status}
                                    onChange={(event) => setStatus(event.target.value)}
                                    aria-label="Status"
                                    className="w-full lg:w-auto"
                                >
                                    {statusOptions.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </Select>
                                {isSyncing && <Loader2 className="h-4 w-4 animate-spin text-jv-accent" />}
                            </div>

                            <Select
                                value={type}
                                onChange={(event) => setType(event.target.value)}
                                aria-label="Type"
                                className="w-full lg:w-auto"
                            >
                                {typeOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </Select>

                            {selectablePendingIds.length > 0 && (
                                <label className="flex items-center gap-2 text-sm text-white/70">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.length === selectablePendingIds.length}
                                        onChange={toggleSelectAll}
                                        className={checkboxClass}
                                    />
                                    Select all pending rows on this page
                                </label>
                            )}
                        </div>

                        {selectedIds.length > 0 && (
                            <div className="mt-3 space-y-3 rounded-jv-sm border border-jv-accent/30 bg-jv-accent/10 p-3">
                                <span className="text-sm font-semibold text-white">{selectedIds.length} selected</span>

                                {selectedExpenseIds.length > 0 && (
                                    <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-3">
                                        <button
                                            type="button"
                                            onClick={submitBulkConvertExpenses}
                                            className="jv-btn jv-btn--primary jv-btn--sm"
                                        >
                                            Convert {selectedExpenseIds.length} Selected to Expense
                                        </button>
                                        <span className="text-xs text-white/45">
                                            Each row uses its own suggested category (falls back to "Other").
                                        </span>
                                    </div>
                                )}

                                {selectedIncomeIds.length > 0 && (
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={submitBulkConvertIncome}
                                            className="jv-btn jv-btn--sm border-transparent bg-emerald-600 text-white hover:bg-emerald-500"
                                        >
                                            Confirm {selectedIncomeIds.length} Selected as Income
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </Card>

                    <Card className="overflow-hidden">
                        <div className="hidden overflow-x-auto md:block">
                            <table className="min-w-full text-sm">
                                <thead className="border-b border-jv-line">
                                    <tr>
                                        <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-white/45"></th>
                                        <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-white/45">Date</th>
                                        <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-white/45">Description</th>
                                        <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-white/45">Type</th>
                                        <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide text-white/45">Amount</th>
                                        <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-white/45">Status</th>
                                        <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-white/45">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.length === 0 && (
                                        <tr className="border-b border-jv-line/70">
                                            <td className="px-3 py-4 text-white/45" colSpan={7}>
                                                No transactions match these filters.
                                            </td>
                                        </tr>
                                    )}

                                    {rows.map((row) => (
                                        <tr
                                            key={row.id}
                                            className={`border-b border-jv-line/70 transition hover:bg-white/[0.04] ${row.needs_review ? 'bg-red-500/10' : ''}`}
                                        >
                                            <td className="px-3 py-3 align-top">
                                                {row.status === 'pending' && (
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedIds.includes(row.id)}
                                                        onChange={() => toggleSelected(row.id)}
                                                        className={checkboxClass}
                                                    />
                                                )}
                                            </td>
                                            <td className="px-3 py-3 align-top text-white/80">{row.transaction_date}</td>
                                            <td className="px-3 py-3 align-top text-white">
                                                <p className="max-w-md">{row.description}</p>
                                                <p className="text-xs text-white/45">
                                                    {row.channel}
                                                    {row.needs_review && (
                                                        <span className="ml-2 inline-flex items-center gap-1 text-red-300">
                                                            <AlertTriangle className="h-3 w-3" /> Needs review
                                                        </span>
                                                    )}
                                                </p>
                                            </td>
                                            <td className="px-3 py-3 align-top">
                                                <TypeBadge type={row.type} />
                                            </td>
                                            <td className={`px-3 py-3 align-top text-right font-semibold ${row.type === 'income' ? 'text-emerald-300' : 'text-red-300'}`}>
                                                {row.type === 'income' ? '+' : '-'}{formatMoney(row.amount, bankImport.currency)}
                                            </td>
                                            <td className="px-3 py-3 align-top">
                                                <StatusBadge status={row.status} />
                                            </td>
                                            <td className="space-x-2 px-3 py-3 align-top whitespace-nowrap">
                                                {row.status === 'pending' && (
                                                    <>
                                                        <button
                                                            type="button"
                                                            onClick={() => openConvert(row)}
                                                            className="jv-btn jv-btn--outline jv-btn--sm"
                                                        >
                                                            {row.type === 'income' ? 'Confirm Income' : 'Convert to Expense'}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => ignoreRow(row.id)}
                                                            className="jv-btn jv-btn--ghost jv-btn--sm"
                                                        >
                                                            Ignore
                                                        </button>
                                                    </>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {rows.length === 0 ? (
                            <p className="p-5 text-sm text-white/45 md:hidden">No transactions match these filters.</p>
                        ) : (
                            <MobileCardList className="p-4">
                                {rows.map((row, index) => (
                                    <MobileCard key={row.id} index={index} className={row.needs_review ? 'border-red-500/30 bg-red-500/10' : ''}>
                                        <div className="flex items-start gap-3">
                                            {row.status === 'pending' && (
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.includes(row.id)}
                                                    onChange={() => toggleSelected(row.id)}
                                                    className={`mt-1 shrink-0 ${checkboxClass}`}
                                                />
                                            )}
                                            <div className="min-w-0 flex-1">
                                                <MobileCardHeader
                                                    title={row.description}
                                                    subtitle={`${row.transaction_date} · ${row.channel}`}
                                                    badge={<TypeBadge type={row.type} />}
                                                />
                                            </div>
                                        </div>
                                        <div className="mt-3 space-y-0.5 divide-y divide-jv-line">
                                            <MobileCardRow
                                                label="Amount"
                                                value={
                                                    <span className={row.type === 'income' ? 'text-emerald-300' : 'text-red-300'}>
                                                        {row.type === 'income' ? '+' : '-'}{formatMoney(row.amount, bankImport.currency)}
                                                    </span>
                                                }
                                            />
                                            <MobileCardRow label="Status" value={<StatusBadge status={row.status} />} />
                                            {row.needs_review && (
                                                <MobileCardRow
                                                    label="Flag"
                                                    value={
                                                        <span className="inline-flex items-center gap-1 text-red-300">
                                                            <AlertTriangle className="h-3 w-3" /> Needs review
                                                        </span>
                                                    }
                                                />
                                            )}
                                        </div>
                                        {row.status === 'pending' && (
                                            <MobileCardActions>
                                                <button
                                                    type="button"
                                                    onClick={() => openConvert(row)}
                                                    className="jv-btn jv-btn--outline jv-btn--sm flex-1"
                                                >
                                                    {row.type === 'income' ? 'Confirm Income' : 'Convert to Expense'}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => ignoreRow(row.id)}
                                                    className="jv-btn jv-btn--ghost jv-btn--sm flex-1"
                                                >
                                                    Ignore
                                                </button>
                                            </MobileCardActions>
                                        )}
                                    </MobileCard>
                                ))}
                            </MobileCardList>
                        )}

                        {transactions?.next_page_url ? (
                            <WhenVisible
                                always
                                data="transactions"
                                params={{ data: { page: (transactions?.current_page || 1) + 1 } }}
                            >
                                {({ fetching }) => (
                                    <div className="mt-4 flex items-center justify-center gap-2 border-t border-jv-line py-3 text-sm text-white/45">
                                        {fetching ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin text-jv-accent" />
                                                Loading more…
                                            </>
                                        ) : (
                                            <span className="text-white/30">Scroll for more</span>
                                        )}
                                    </div>
                                )}
                            </WhenVisible>
                        ) : (
                            rows.length > 0 && (
                                <p className="mt-4 border-t border-jv-line py-3 text-center text-sm text-white/40">
                                    You've reached the end — {transactions?.total ?? rows.length} transactions.
                                </p>
                            )
                        )}
                    </Card>
                </div>
            </div>

            <Modal show={convertTarget !== null} onClose={closeConvert} maxWidth="lg">
                {convertTarget && (
                    <form onSubmit={submitConvert} className="p-5 sm:p-6">
                        <h3 className="text-lg font-semibold text-white">
                            {convertTarget.type === 'income' ? 'Confirm as Income' : 'Convert to Expense'}
                        </h3>
                        <p className="mt-1 text-sm text-white/70">
                            {formatMoney(convertTarget.amount, bankImport.currency)} on {convertTarget.transaction_date}
                        </p>

                        <div className="mt-4 space-y-4">
                            {convertTarget.type === 'expense' ? (
                                <div>
                                    <Label className="mb-1 block">Category</Label>
                                    <Select
                                        value={convertCategory}
                                        onChange={(event) => setConvertCategory(event.target.value)}
                                    >
                                        {categories.map((category) => (
                                            <option key={category} value={category}>
                                                {category}
                                            </option>
                                        ))}
                                    </Select>
                                </div>
                            ) : (
                                <div>
                                    <Label className="mb-1 block">Source / Payer Name</Label>
                                    <Input
                                        value={convertSourceName}
                                        onChange={(event) => setConvertSourceName(event.target.value)}
                                        required
                                    />
                                </div>
                            )}

                            <div>
                                <Label className="mb-1 block">Description</Label>
                                <Textarea
                                    value={convertDescription}
                                    onChange={(event) => setConvertDescription(event.target.value)}
                                    rows={3}
                                />
                            </div>
                        </div>

                        <div className="mt-5 flex justify-end gap-3 border-t border-jv-line pt-4">
                            <button
                                type="button"
                                onClick={closeConvert}
                                className="jv-btn jv-btn--ghost"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="jv-btn jv-btn--primary"
                            >
                                {convertTarget.type === 'income' ? 'Confirm Income' : 'Save Expense'}
                            </button>
                        </div>
                    </form>
                )}
            </Modal>
        </AuthenticatedLayout>
    );
}

function TypeBadge({ type }) {
    const isIncome = type === 'income';
    const Icon = isIncome ? ArrowUpRight : ArrowDownRight;

    return (
        <Badge variant={isIncome ? 'success' : 'danger'} className="shrink-0 gap-1 font-medium">
            <Icon className="h-3 w-3" />
            {isIncome ? 'Income' : 'Expense'}
        </Badge>
    );
}

function StatusBadge({ status }) {
    const config = {
        pending: 'warning',
        converted: 'success',
        ignored: 'secondary',
    };

    return (
        <Badge variant={config[status] || config.pending} className="shrink-0 font-medium">
            {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
    );
}
