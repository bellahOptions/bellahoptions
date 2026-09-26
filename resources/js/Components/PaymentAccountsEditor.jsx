import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CheckBadgeIcon, ExclamationTriangleIcon, PencilSquareIcon } from '@heroicons/react/24/outline';

/**
 * Editor for the bank-transfer fallback accounts.
 *
 * Entering an account number and choosing a bank makes the server ask Paystack
 * to resolve the registered account name, which is then written into the form.
 * That is the point of the whole flow: an operator cannot publish a mistyped
 * account number to customers, because Paystack either confirms the name or the
 * row stays visibly unverified.
 *
 * The account name is always editable. Resolution fills it in as a convenience,
 * never as a lock, so a bank Paystack cannot resolve can still be entered by
 * hand. Three rules keep that honest:
 *
 *  - A reply from Paystack never overwrites a name the operator has typed since
 *    the request was sent. Without this, clicking from the account-number field
 *    into the name field fires the blur-resolve and then clobbers the first few
 *    characters a moment later, which reads as the field being read-only.
 *  - Writes are applied to the newest account list, not the one captured when
 *    the request started, so a concurrent edit is not silently discarded.
 *  - The "verified" badge is derived from the exact (bank code, number, name)
 *    triple Paystack returned. Typing over the name therefore drops the badge
 *    on its own rather than leaving a false claim of verification.
 *
 * Two deliberate degradations, because this screen must stay usable when
 * Paystack is down or unconfigured:
 *
 *  - If the bank list cannot be loaded the bank becomes a free-text field and
 *    resolution is simply unavailable, rather than the form refusing to render.
 *  - A failed resolution never clears what the operator typed.
 */

const inputClassName =
    'w-full rounded-jv-sm border border-jv-line-strong bg-white/[0.05] px-3 py-2 text-sm text-white transition placeholder:text-white/30 focus:border-jv-accent focus:outline-none focus:ring-4 focus:ring-jv-accent/15';

const MAX_ACCOUNTS = 10;

/** Digits only, so a pasted "0123 456 789" still resolves. */
const digitsOnly = (value) => String(value || '').replace(/\D/g, '');

/**
 * Paystack bank names rarely match what an operator typed by hand, so matching
 * is deliberately loose: it only needs to be good enough to pre-select the right
 * bank when upgrading a record saved before bank codes existed.
 */
const normalizeBankName = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');

/**
 * Identifies a name that Paystack actually returned for a given bank + number.
 * Comparing the name too is what lets a manual override invalidate the badge.
 */
const verificationKey = (bankCode, accountNumber, accountName) =>
    `${bankCode}:${accountNumber}:${String(accountName || '').trim().toUpperCase()}`;

/** Identifies a bank + number pair, regardless of the name. */
const lookupKey = (bankCode, accountNumber) => `${bankCode}:${accountNumber}`;

export default function PaymentAccountsEditor({ accounts = [], errors = {}, onChange }) {
    const [banks, setBanks] = useState([]);
    const [bankListState, setBankListState] = useState({
        loading: true,
        available: false,
        message: '',
    });
    const [rowStatus, setRowStatus] = useState({});

    // Resolutions already attempted, so leaving and re-entering the account
    // number field does not spend another API call (or another overwrite).
    const attemptedRef = useRef(new Set());
    // Names that genuinely came back from Paystack, used to decide the badge.
    const verifiedRef = useRef(new Set());

    // Handlers run from event callbacks and from awaited responses, both of which
    // can outlive the render that created them. Reading the newest list from a
    // ref keeps a late reply from writing over a newer edit.
    const accountsRef = useRef(accounts);
    accountsRef.current = accounts;

    useEffect(() => {
        let cancelled = false;

        window.axios
            .get(route('admin.paystack.banks'))
            .then((response) => {
                if (cancelled) {
                    return;
                }

                const list = Array.isArray(response?.data?.banks) ? response.data.banks : [];

                setBanks(list);
                setBankListState({
                    loading: false,
                    available: Boolean(response?.data?.available) && list.length > 0,
                    message: String(response?.data?.message || ''),
                });
            })
            .catch(() => {
                if (cancelled) {
                    return;
                }

                setBanks([]);
                setBankListState({
                    loading: false,
                    available: false,
                    message: 'The Paystack bank list could not be loaded.',
                });
            });

        return () => {
            cancelled = true;
        };
    }, []);

    const bankCodeByName = useMemo(() => {
        const map = new Map();

        banks.forEach((bank) => {
            map.set(normalizeBankName(bank.name), bank.code);
        });

        return map;
    }, [banks]);

    /**
     * The code to resolve with: the stored one, or one recovered from the bank
     * name for records saved before codes were kept.
     */
    const effectiveBankCode = useCallback(
        (account) => {
            const stored = digitsOnly(account?.bank_code);

            if (stored !== '') {
                return stored;
            }

            return bankCodeByName.get(normalizeBankName(account?.bank_name)) || '';
        },
        [bankCodeByName],
    );

    const isVerified = (account) => {
        const bankCode = effectiveBankCode(account);
        const accountNumber = digitsOnly(account?.account_number);
        const accountName = String(account?.account_name || '').trim();

        if (bankCode === '' || accountNumber === '' || accountName === '') {
            return false;
        }

        return verifiedRef.current.has(verificationKey(bankCode, accountNumber, accountName));
    };

    const setAccount = (index, patch) => {
        const next = accountsRef.current.map((account, position) =>
            position === index ? { ...account, ...patch } : account,
        );

        accountsRef.current = next;
        onChange(next);
    };

    const setStatus = (index, state, message = '') => {
        setRowStatus((previous) => ({ ...previous, [index]: { state, message } }));
    };

    /**
     * @param {number} index
     * @param {object|null} override  Row values to use instead of the stored ones
     *                               (used when the bank was just changed).
     * @param {boolean} force         Re-check even if this bank + number was
     *                               already looked up.
     */
    const resolveAccount = useCallback(
        async (index, override = null, force = false) => {
            const source = override || accountsRef.current[index] || {};
            const bankCode = effectiveBankCode(source);
            const accountNumber = digitsOnly(source.account_number);
            const pairKey = lookupKey(bankCode, accountNumber);

            if (bankCode === '') {
                setStatus(index, 'error', 'Choose a bank first so the name can be verified.');

                return;
            }

            if (accountNumber.length < 6) {
                setStatus(index, 'error', 'Enter the full account number first.');

                return;
            }

            if (!force && attemptedRef.current.has(pairKey)) {
                return;
            }

            attemptedRef.current.add(pairKey);

            // What the row looked like when the request went out. A change to
            // either the target or the typed name means the operator has moved
            // on, and the reply must not undo that.
            const nameAtRequest = String(source.account_name || '').trim();

            setStatus(index, 'loading', 'Checking with Paystack...');

            try {
                const response = await window.axios.post(route('admin.paystack.resolve-account'), {
                    account_number: accountNumber,
                    bank_code: bankCode,
                });

                const accountName = String(response?.data?.account_name || '').trim();

                if (accountName === '') {
                    attemptedRef.current.delete(pairKey);
                    setStatus(index, 'error', 'Paystack returned no account name for that number.');

                    return;
                }

                const latest = accountsRef.current[index] || {};
                const targetUnchanged =
                    digitsOnly(latest.account_number) === accountNumber
                    && effectiveBankCode(latest) === bankCode;

                if (!targetUnchanged) {
                    // The row now points somewhere else; whatever it points at
                    // will resolve on its own.
                    setStatus(index, 'idle', '');

                    return;
                }

                const nameUnchanged =
                    String(latest.account_name || '').trim() === nameAtRequest;

                const patch = { account_number: accountNumber };

                if (digitsOnly(latest.bank_code) === '') {
                    // Persist the recovered code so the next edit resolves
                    // without the operator re-picking the bank.
                    patch.bank_code = bankCode;
                }

                if (nameUnchanged) {
                    patch.account_name = accountName;
                    verifiedRef.current.add(
                        verificationKey(bankCode, accountNumber, accountName),
                    );
                    setStatus(index, 'ok', `Verified by Paystack: ${accountName}`);
                } else {
                    // The operator typed their own name while this was in
                    // flight. Keep theirs and say what Paystack found.
                    setStatus(
                        index,
                        'manual',
                        `Paystack returned "${accountName}" but your own value was kept.`,
                    );
                }

                setAccount(index, patch);
            } catch (error) {
                attemptedRef.current.delete(pairKey);

                const message =
                    error?.response?.data?.message
                    || 'The account name could not be verified. Check the bank and number.';

                setStatus(index, 'error', String(message));
            }
        },
        [effectiveBankCode],
    );

    const handleBankChange = (index, code) => {
        const bank = banks.find((candidate) => candidate.code === code);
        const current = accountsRef.current[index] || {};

        // Read the outgoing pair before mutating, so the attempt recorded for it
        // can be cleared. A different bank is a different lookup.
        const previousBankCode = effectiveBankCode(current);
        const previousNumber = digitsOnly(current.account_number);

        if (previousBankCode !== '' && previousNumber !== '') {
            attemptedRef.current.delete(lookupKey(previousBankCode, previousNumber));
        }

        const account = { ...current, bank_code: code, bank_name: bank?.name || '' };

        setAccount(index, { bank_code: code, bank_name: bank?.name || '' });
        setStatus(index, 'idle', '');

        // Changing the bank invalidates any previous verification, so re-resolve
        // immediately when the number is already long enough to check.
        if (code !== '' && previousNumber.length >= 6) {
            resolveAccount(index, account);
        }
    };

    const handleAccountNumberChange = (index, value) => {
        const previous = digitsOnly(accountsRef.current[index]?.account_number);
        const next = digitsOnly(value);

        // A different number is a different lookup.
        if (previous !== next) {
            attemptedRef.current.delete(
                lookupKey(effectiveBankCode(accountsRef.current[index]), previous),
            );
        }

        setAccount(index, { account_number: value });
        setStatus(index, 'idle', '');
    };

    const handleAccountNumberBlur = (index) => {
        const account = accountsRef.current[index];

        if (account && digitsOnly(account.account_number).length >= 6 && effectiveBankCode(account) !== '') {
            resolveAccount(index);
        }
    };

    const handleAccountNameChange = (index, value) => {
        // Typing over the name drops the verified badge by itself, because the
        // name no longer matches the triple Paystack returned.
        setAccount(index, { account_name: value });

        const current = rowStatus[index];

        if (current && (current.state === 'ok' || current.state === 'manual')) {
            setStatus(index, 'idle', '');
        }
    };

    const addAccount = () => {
        onChange([
            ...accountsRef.current,
            { bank_name: '', bank_code: '', account_name: '', account_number: '' },
        ]);
    };

    const removeAccount = (index) => {
        const next = accountsRef.current.filter((_, position) => position !== index);

        setRowStatus({});
        onChange(
            next.length > 0
                ? next
                : [{ bank_name: '', bank_code: '', account_name: '', account_number: '' }],
        );
    };

    const isComplete = (account) =>
        String(account?.bank_name || '').trim() !== ''
        && String(account?.account_name || '').trim() !== ''
        && digitsOnly(account?.account_number) !== '';

    return (
        <div className="mt-5 space-y-4">
            {bankListState.loading && (
                <p className="text-xs text-white/45">Loading the Paystack bank list...</p>
            )}

            {!bankListState.loading && !bankListState.available && (
                <p className="rounded-jv-sm border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-200">
                    Account name verification is unavailable
                    {bankListState.message ? ` (${bankListState.message})` : ''}. Enter the bank name
                    and account name manually — customers only ever see what you save here.
                </p>
            )}

            {accounts.map((account, index) => {
                const status = rowStatus[index] || { state: 'idle', message: '' };
                const complete = isComplete(account);
                const verified = isVerified(account);

                return (
                    <div
                        key={`bank-account-${index}`}
                        className="rounded-jv-sm border border-jv-line bg-white/[0.03] p-4"
                    >
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                            <p className="text-xs font-black uppercase tracking-[0.16em] text-white/45">
                                Account {index + 1}
                            </p>

                            <div className="flex flex-wrap items-center gap-2">
                                {verified && (
                                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-300">
                                        <CheckBadgeIcon className="h-3.5 w-3.5" />
                                        Paystack verified
                                    </span>
                                )}
                                <span
                                    className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                                        complete
                                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                                            : 'border-amber-500/30 bg-amber-500/10 text-amber-200'
                                    }`}
                                >
                                    {complete ? 'Shown to customers' : 'Incomplete — hidden'}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => removeAccount(index)}
                                    className="rounded-full border border-red-500/40 bg-red-500/10 px-2.5 py-1 text-[11px] font-semibold text-red-300 transition hover:bg-red-500/20"
                                >
                                    Remove
                                </button>
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-3">
                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-white/65">
                                    Bank
                                </label>

                                {bankListState.available ? (
                                    <select
                                        value={digitsOnly(account.bank_code)}
                                        onChange={(event) => handleBankChange(index, event.target.value)}
                                        className={inputClassName}
                                    >
                                        <option value="">
                                            {account.bank_name
                                                ? `${account.bank_name} — pick to enable verification`
                                                : 'Select a bank'}
                                        </option>
                                        {banks.map((bank) => (
                                            <option key={bank.code} value={bank.code}>
                                                {bank.name}
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <input
                                        type="text"
                                        value={account.bank_name || ''}
                                        onChange={(event) =>
                                            setAccount(index, {
                                                bank_name: event.target.value,
                                                bank_code: '',
                                            })
                                        }
                                        placeholder="Fidelity Bank"
                                        className={inputClassName}
                                    />
                                )}

                                {errors[`payment_fallback.accounts.${index}.bank_code`] && (
                                    <p className="mt-1 text-xs text-red-300">
                                        {errors[`payment_fallback.accounts.${index}.bank_code`]}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-white/65">
                                    Account Number
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        value={account.account_number || ''}
                                        onChange={(event) =>
                                            handleAccountNumberChange(index, event.target.value)
                                        }
                                        onBlur={() => handleAccountNumberBlur(index)}
                                        placeholder="4210082961"
                                        className={inputClassName}
                                    />
                                    {bankListState.available && (
                                        <button
                                            type="button"
                                            onClick={() => resolveAccount(index, null, true)}
                                            disabled={status.state === 'loading'}
                                            className="jv-btn jv-btn--sm shrink-0 border border-jv-accent-line bg-jv-accent/10 text-[#a9c4ff] hover:bg-jv-accent/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {status.state === 'loading' ? 'Checking...' : 'Verify'}
                                        </button>
                                    )}
                                </div>
                                {errors[`payment_fallback.accounts.${index}.account_number`] && (
                                    <p className="mt-1 text-xs text-red-300">
                                        {errors[`payment_fallback.accounts.${index}.account_number`]}
                                    </p>
                                )}
                                <p className="mt-1 text-xs text-white/45">
                                    Digits only. Stored without spaces or dashes.
                                </p>
                            </div>

                            <div>
                                <label className="mb-1.5 block text-sm font-medium text-white/65">
                                    Account Name
                                </label>
                                <input
                                    type="text"
                                    value={account.account_name || ''}
                                    onChange={(event) =>
                                        handleAccountNameChange(index, event.target.value)
                                    }
                                    placeholder="Bellah Options"
                                    className={inputClassName}
                                />
                                {errors[`payment_fallback.accounts.${index}.account_name`] && (
                                    <p className="mt-1 text-xs text-red-300">
                                        {errors[`payment_fallback.accounts.${index}.account_name`]}
                                    </p>
                                )}
                                <p className="mt-1 flex items-center gap-1.5 text-xs text-white/45">
                                    <PencilSquareIcon className="h-3.5 w-3.5 shrink-0" />
                                    Type here to override what Paystack returns.
                                </p>
                            </div>
                        </div>

                        {status.state === 'ok' && (
                            <p className="mt-3 flex items-start gap-2 text-xs text-emerald-300">
                                <CheckBadgeIcon className="mt-0.5 h-4 w-4 shrink-0" />
                                <span>{status.message}</span>
                            </p>
                        )}

                        {status.state === 'manual' && (
                            <p className="mt-3 flex items-start gap-2 text-xs text-white/60">
                                <PencilSquareIcon className="mt-0.5 h-4 w-4 shrink-0" />
                                <span>{status.message}</span>
                            </p>
                        )}

                        {status.state === 'error' && (
                            <p className="mt-3 flex items-start gap-2 text-xs text-amber-200">
                                <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 shrink-0" />
                                <span>{status.message}</span>
                            </p>
                        )}
                    </div>
                );
            })}

            <button
                type="button"
                onClick={addAccount}
                disabled={accounts.length >= MAX_ACCOUNTS}
                className="jv-btn jv-btn--ghost disabled:cursor-not-allowed disabled:opacity-50"
            >
                Add another account
            </button>
            <p className="text-xs text-white/45">
                Customers are shown every complete account, so more than one gives them a choice of
                bank. A row left completely blank is not saved.
            </p>
        </div>
    );
}
