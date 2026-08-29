import { Link } from '@inertiajs/react';

const tabs = [
    { key: 'overview', label: 'Overview', routeName: 'admin.finance.index', pattern: 'admin.finance.index' },
    { key: 'ledger', label: 'Transactions', routeName: 'admin.finance.ledger', pattern: 'admin.finance.ledger*' },
    { key: 'expenses', label: 'Expenses', routeName: 'admin.finance.expenses.index', pattern: 'admin.finance.expenses.*' },
    { key: 'payouts', label: 'Payouts', routeName: 'admin.finance.payouts.index', pattern: 'admin.finance.payouts.*' },
    { key: 'bank-imports', label: 'Bank Import', routeName: 'admin.finance.bank-imports.index', pattern: 'admin.finance.bank-imports.*' },
];

export default function FinanceTabs({ active }) {
    return (
        <div className="flex gap-1 overflow-x-auto rounded-xl border border-gray-200 bg-white p-1.5 shadow-sm">
            {tabs.map((tab) => {
                const isActive = tab.key === active;

                return (
                    <Link
                        key={tab.key}
                        href={route(tab.routeName)}
                        className={`shrink-0 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                            isActive ? 'bg-brand text-white shadow-sm' : 'text-gray-600 hover:bg-gray-50 hover:text-brand'
                        }`}
                    >
                        {tab.label}
                    </Link>
                );
            })}
        </div>
    );
}
