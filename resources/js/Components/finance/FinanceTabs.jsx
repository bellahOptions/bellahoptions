import { Link } from '@inertiajs/react';

const tabs = [
    { key: 'overview', label: 'Overview', routeName: 'admin.finance.index', pattern: 'admin.finance.index' },
    { key: 'income-splits', label: 'Income Splits', routeName: 'admin.finance.income-splits', pattern: 'admin.finance.income-splits*' },
    { key: 'ledger', label: 'Transactions', routeName: 'admin.finance.ledger', pattern: 'admin.finance.ledger*' },
    { key: 'expenses', label: 'Expenses', routeName: 'admin.finance.expenses.index', pattern: 'admin.finance.expenses.*' },
    { key: 'payouts', label: 'Payouts', routeName: 'admin.finance.payouts.index', pattern: 'admin.finance.payouts.*' },
    { key: 'bank-imports', label: 'Bank Import', routeName: 'admin.finance.bank-imports.index', pattern: 'admin.finance.bank-imports.*' },
];

export default function FinanceTabs({ active }) {
    return (
        <div className="jv-card flex gap-1 overflow-x-auto rounded-full p-1.5">
            {tabs.map((tab) => {
                const isActive = tab.key === active;

                return (
                    <Link
                        key={tab.key}
                        href={route(tab.routeName)}
                        className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
                            isActive
                                ? 'bg-jv-accent text-white'
                                : 'text-white/60 hover:bg-white/[0.07] hover:text-white'
                        }`}
                    >
                        {tab.label}
                    </Link>
                );
            })}
        </div>
    );
}
