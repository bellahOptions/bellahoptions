import Modal from '@/Components/Modal';
import { MobileCard, MobileCardActions, MobileCardHeader, MobileCardList, MobileCardRow } from '@/Components/ui/mobile-cards';
import { StatCard, StatGrid } from '@/Components/ui/stat-card';
import FinanceTabs from '@/Components/finance/FinanceTabs';
import { useDebouncedFilterSync } from '@/hooks/use-debounced-filter-sync';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { AlertTriangle, ArrowDownRight, ArrowUpRight, Ban, Check, Loader2, Wallet } from 'lucide-react';
import { useMemo, useState } from 'react';

const statusOptions = [
    { value: '', label: 'All statuses' },
    { value: 'pending', label: 'Pending' },
    { value: 'converted', label: 'Converted' },
    { value: 'ignored', label: 'Ignored' },
];

const typeOptions = [
    { value: '', label: 'All types' },
    { value: 'income', label: 'Income' },
    { value: 'expense', label: 'Expense' },
];

export default function BankImportShow({ import: bankImport, filters = {}, categories = [], transactions }) {
    const { flash } = usePage().props;
    const [status, setStatus] = useState(filters.status || '');
    const [type, setType] = useState(filters.type || '');
    const [selectedIds, setSelectedIds] = useState([]);
    const [bulkCategory, setBulkCategory] = useState(categories[0] || '');
    const [convertTarget, setConvertTarget] = useState(null);
    const [convertCategory, setConvertCategory] = useState('');
    const [convertSourceName, setConvertSourceName] = useState('');
    const [convertDescription, setConvertDescription] = useState('');

    const isSyncing = useDebouncedFilterSync('admin.finance.bank-imports.show', { status, type }, 200, bankImport.id);

    const rows = transactions?.data || [];
    const selectablePendingExpenseIds = useMemo(
        () => rows.filter((row) => row.status === 'pending' && row.type === 'expense').map((row) => row.id),
        [rows],
    );

    const toggleSelected = (id) => {
        setSelectedIds((previous) => (previous.includes(id) ? previous.filter((current) => current !== id) : [...previous, id]));
    };

    const toggleSelectAll = () => {
        setSelectedIds((previous) => (previous.length === selectablePendingExpenseIds.length ? [] : selectablePendingExpenseIds));
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

    const submitBulkConvert = () => {
        if (selectedIds.length === 0 || !bulkCategory) return;

        router.post(
            route('admin.finance.bank-imports.bulk-convert', bankImport.id),
            { ids: selectedIds, category: bulkCategory },
            { preserveScroll: true, onSuccess: () => setSelectedIds([]) },
        );
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-xl font-semibold leading-tight text-gray-800">{bankImport.original_filename}</h2>
                    <Link
                        href={route('admin.finance.bank-imports.index')}
                        className="rounded-md border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                    >
                        Back to Imports
                    </Link>
                </div>
            }
        >
            <Head title={`Import: ${bankImport.original_filename}`} />

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
                        <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                            <div>
                                <p className="text-xs uppercase tracking-wide text-gray-500">Account</p>
                                <p className="font-semibold text-gray-900">{bankImport.account_name || 'N/A'}</p>
                                <p className="text-xs text-gray-500">{bankImport.account_number}</p>
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-wide text-gray-500">Period</p>
                                <p className="font-semibold text-gray-900">
                                    {bankImport.period_start} → {bankImport.period_end}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-wide text-gray-500">Opening / Closing Balance</p>
                                <p className="font-semibold text-gray-900">
                                    {formatMoney(bankImport.opening_balance, bankImport.currency)} → {formatMoney(bankImport.closing_balance, bankImport.currency)}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-wide text-gray-500">Total Rows</p>
                                <p className="font-semibold text-gray-900">{bankImport.total_rows}</p>
                            </div>
                        </div>
                    </section>

                    <StatGrid>
                        <StatCard icon={Wallet} label="Pending Review" value={bankImport.pending_count} tone="amber" />
                        <StatCard icon={Check} label="Converted" value={bankImport.converted_count} tone="emerald" />
                        <StatCard icon={Ban} label="Ignored" value={bankImport.ignored_count} tone="slate" />
                        <StatCard icon={AlertTriangle} label="Flagged for Review" value={bankImport.flagged_rows} tone="red" />
                    </StatGrid>

                    <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
                        <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
                            <div className="flex items-center gap-2">
                                <select
                                    value={status}
                                    onChange={(event) => setStatus(event.target.value)}
                                    aria-label="Status"
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30 lg:w-auto"
                                >
                                    {statusOptions.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                                {isSyncing && <Loader2 className="h-4 w-4 animate-spin text-brand" />}
                            </div>

                            <select
                                value={type}
                                onChange={(event) => setType(event.target.value)}
                                aria-label="Type"
                                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30 lg:w-auto"
                            >
                                {typeOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>

                            {selectablePendingExpenseIds.length > 0 && (
                                <label className="flex items-center gap-2 text-sm text-gray-700">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.length === selectablePendingExpenseIds.length}
                                        onChange={toggleSelectAll}
                                        className="rounded border-gray-300 text-brand focus:ring-brand/30"
                                    />
                                    Select all pending expenses on this page
                                </label>
                            )}
                        </div>

                        {selectedIds.length > 0 && (
                            <div className="mt-3 flex flex-col gap-2 rounded-lg border border-brand/30 bg-brand-light/40 p-3 sm:flex-row sm:items-center">
                                <span className="text-sm font-semibold text-brand">{selectedIds.length} selected</span>
                                <select
                                    value={bulkCategory}
                                    onChange={(event) => setBulkCategory(event.target.value)}
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm sm:w-auto"
                                >
                                    {categories.map((category) => (
                                        <option key={category} value={category}>
                                            {category}
                                        </option>
                                    ))}
                                </select>
                                <button
                                    type="button"
                                    onClick={submitBulkConvert}
                                    className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
                                >
                                    Convert Selected to Expense
                                </button>
                            </div>
                        )}
                    </section>

                    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                        <div className="hidden overflow-x-auto md:block">
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-3 py-2 text-left"></th>
                                        <th className="px-3 py-2 text-left font-semibold text-gray-600">Date</th>
                                        <th className="px-3 py-2 text-left font-semibold text-gray-600">Description</th>
                                        <th className="px-3 py-2 text-left font-semibold text-gray-600">Type</th>
                                        <th className="px-3 py-2 text-right font-semibold text-gray-600">Amount</th>
                                        <th className="px-3 py-2 text-left font-semibold text-gray-600">Status</th>
                                        <th className="px-3 py-2 text-left font-semibold text-gray-600">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {rows.length === 0 && (
                                        <tr>
                                            <td className="px-3 py-4 text-gray-500" colSpan={7}>
                                                No transactions match these filters.
                                            </td>
                                        </tr>
                                    )}

                                    {rows.map((row) => (
                                        <tr key={row.id} className={row.needs_review ? 'bg-red-50/50' : ''}>
                                            <td className="px-3 py-3 align-top">
                                                {row.status === 'pending' && row.type === 'expense' && (
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedIds.includes(row.id)}
                                                        onChange={() => toggleSelected(row.id)}
                                                        className="rounded border-gray-300 text-brand focus:ring-brand/30"
                                                    />
                                                )}
                                            </td>
                                            <td className="px-3 py-3 align-top text-gray-700">{row.transaction_date}</td>
                                            <td className="px-3 py-3 align-top text-gray-900">
                                                <p className="max-w-md">{row.description}</p>
                                                <p className="text-xs text-gray-500">
                                                    {row.channel}
                                                    {row.needs_review && (
                                                        <span className="ml-2 inline-flex items-center gap-1 text-red-600">
                                                            <AlertTriangle className="h-3 w-3" /> Needs review
                                                        </span>
                                                    )}
                                                </p>
                                            </td>
                                            <td className="px-3 py-3 align-top">
                                                <TypeBadge type={row.type} />
                                            </td>
                                            <td className={`px-3 py-3 align-top text-right font-semibold ${row.type === 'income' ? 'text-emerald-700' : 'text-red-700'}`}>
                                                {row.type === 'income' ? '+' : '-'}{formatMoney(row.amount, bankImport.currency)}
                                            </td>
                                            <td className="px-3 py-3 align-top">
                                                <StatusBadge status={row.status} />
                                            </td>
                                            <td className="space-x-2 px-3 py-3 align-top">
                                                {row.status === 'pending' && (
                                                    <>
                                                        <button
                                                            type="button"
                                                            onClick={() => openConvert(row)}
                                                            className="rounded-md border border-brand/30 px-2 py-1 text-xs font-semibold text-brand hover:bg-brand-light"
                                                        >
                                                            {row.type === 'income' ? 'Confirm Income' : 'Convert to Expense'}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => ignoreRow(row.id)}
                                                            className="rounded-md border border-gray-200 px-2 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-50"
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
                            <p className="text-sm text-gray-500 md:hidden">No transactions match these filters.</p>
                        ) : (
                            <MobileCardList>
                                {rows.map((row, index) => (
                                    <MobileCard key={row.id} index={index} className={row.needs_review ? 'border-red-200 bg-red-50/40' : ''}>
                                        <MobileCardHeader
                                            title={row.description}
                                            subtitle={`${row.transaction_date} · ${row.channel}`}
                                            badge={<TypeBadge type={row.type} />}
                                        />
                                        <div className="mt-3 space-y-0.5 divide-y divide-gray-50">
                                            <MobileCardRow
                                                label="Amount"
                                                value={
                                                    <span className={row.type === 'income' ? 'text-emerald-700' : 'text-red-700'}>
                                                        {row.type === 'income' ? '+' : '-'}{formatMoney(row.amount, bankImport.currency)}
                                                    </span>
                                                }
                                            />
                                            <MobileCardRow label="Status" value={<StatusBadge status={row.status} />} />
                                            {row.needs_review && (
                                                <MobileCardRow
                                                    label="Flag"
                                                    value={
                                                        <span className="inline-flex items-center gap-1 text-red-600">
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
                                                    className="flex-1 rounded-md border border-brand/30 px-3 py-2 text-xs font-semibold text-brand hover:bg-brand-light"
                                                >
                                                    {row.type === 'income' ? 'Confirm Income' : 'Convert to Expense'}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => ignoreRow(row.id)}
                                                    className="flex-1 rounded-md border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                                                >
                                                    Ignore
                                                </button>
                                            </MobileCardActions>
                                        )}
                                    </MobileCard>
                                ))}
                            </MobileCardList>
                        )}

                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-gray-600">
                            <p>
                                Page {transactions?.current_page || 1} of {transactions?.last_page || 1}
                            </p>
                            <div className="flex items-center gap-2">
                                {transactions?.prev_page_url ? (
                                    <Link href={transactions.prev_page_url} className="rounded-md border border-gray-300 px-3 py-1.5 text-gray-700 hover:bg-gray-50" preserveScroll>
                                        Previous
                                    </Link>
                                ) : (
                                    <span className="cursor-not-allowed rounded-md border border-gray-200 px-3 py-1.5 text-gray-400">Previous</span>
                                )}
                                {transactions?.next_page_url ? (
                                    <Link href={transactions.next_page_url} className="rounded-md border border-gray-300 px-3 py-1.5 text-gray-700 hover:bg-gray-50" preserveScroll>
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

            <Modal show={convertTarget !== null} onClose={closeConvert} maxWidth="lg">
                {convertTarget && (
                    <form onSubmit={submitConvert} className="p-5 sm:p-6">
                        <h3 className="text-lg font-semibold text-gray-900">
                            {convertTarget.type === 'income' ? 'Confirm as Income' : 'Convert to Expense'}
                        </h3>
                        <p className="mt-1 text-sm text-gray-600">
                            {formatMoney(convertTarget.amount, bankImport.currency)} on {convertTarget.transaction_date}
                        </p>

                        <div className="mt-4 space-y-4">
                            {convertTarget.type === 'expense' ? (
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">Category</label>
                                    <select
                                        value={convertCategory}
                                        onChange={(event) => setConvertCategory(event.target.value)}
                                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
                                    >
                                        {categories.map((category) => (
                                            <option key={category} value={category}>
                                                {category}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            ) : (
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-gray-700">Source / Payer Name</label>
                                    <input
                                        value={convertSourceName}
                                        onChange={(event) => setConvertSourceName(event.target.value)}
                                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
                                        required
                                    />
                                </div>
                            )}

                            <div>
                                <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
                                <textarea
                                    value={convertDescription}
                                    onChange={(event) => setConvertDescription(event.target.value)}
                                    rows={3}
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
                                />
                            </div>
                        </div>

                        <div className="mt-5 flex justify-end gap-3 border-t border-gray-100 pt-4">
                            <button
                                type="button"
                                onClick={closeConvert}
                                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="rounded-md bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
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
        <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${isIncome ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
            <Icon className="h-3 w-3" />
            {isIncome ? 'Income' : 'Expense'}
        </span>
    );
}

function StatusBadge({ status }) {
    const config = {
        pending: 'bg-amber-100 text-amber-700',
        converted: 'bg-emerald-100 text-emerald-700',
        ignored: 'bg-gray-100 text-gray-600',
    };

    return (
        <span className={`inline-flex shrink-0 rounded-full px-2 py-1 text-xs font-medium ${config[status] || config.pending}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
    );
}

function formatMoney(amount, currency = 'NGN') {
    const formattedAmount = Number(amount || 0).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
    const normalizedCurrency = String(currency || '').toUpperCase();

    if (normalizedCurrency === 'NGN' || normalizedCurrency === '') {
        return `₦${formattedAmount}`;
    }

    return `${normalizedCurrency} ${formattedAmount}`;
}
