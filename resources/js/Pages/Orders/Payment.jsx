import { Head, Link, router, usePage } from "@inertiajs/react";
import { useMemo, useState } from "react";
import PageTheme from "@/Layouts/PageTheme";
import { RevealSection } from "@/Components/MotionReveal";
import { ArrowRightIcon, CreditCardIcon, LifebuoyIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { formatDate, formatMoney, statusLabel } from "./orderUtils";
import { termsSections } from "@/Pages/Legal/policyData";
import { resolvePolicySections } from "@/Pages/Legal/policyParser";

export default function OrderPayment({
    order,
    canPay = false,
    paymentProvider = "paystack",
    paymentGatewayIssue = null,
    transferPayment = null,
    term = null,
}) {
    const { flash, localization } = usePage().props;
    const locale = localization?.locale?.replace("_", "-") || "en-NG";
    const [showTermsModal, setShowTermsModal] = useState(false);
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [pendingAction, setPendingAction] = useState(null);
    const [transferReference, setTransferReference] = useState("");
    const termsPreview = useMemo(
        () => resolvePolicySections(term?.content, termsSections).slice(0, 6),
        [term?.content],
    );
    const transferEnabled = Boolean(
        transferPayment?.enabled
        && transferPayment?.account_number
        && transferPayment?.account_name
        && transferPayment?.bank_name,
    );

    const startPayment = () => {
        router.post(route("orders.payment.initialize", order.order_code), {}, { preserveScroll: true });
    };

    const startTransferPayment = () => {
        router.post(route("orders.payment.transfer", order.order_code), {
            transfer_reference: transferReference.trim(),
        }, { preserveScroll: true });
    };

    const requestTermsThen = (action) => {
        if (!termsAccepted) {
            setPendingAction(action);
            setShowTermsModal(true);

            return;
        }

        action();
    };

    const handlePayNow = () => requestTermsThen(startPayment);
    const handleTransferSubmit = () => requestTermsThen(startTransferPayment);

    const agreeAndContinue = () => {
        setTermsAccepted(true);
        setShowTermsModal(false);

        if (pendingAction) {
            pendingAction();
        }

        setPendingAction(null);
    };

    return (
        <>
            <Head title="Secure Payment" />

            <PageTheme>
                <main className="bg-white text-gray-950">
                    <RevealSection className="bg-[#000285] py-16 text-white sm:py-20 lg:py-24">
                        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                            <p className="text-sm font-black uppercase tracking-[0.22em] text-cyan-300">Secure Checkout</p>
                            <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
                                Complete payment for {order.service_name}
                            </h1>
                            <p className="mt-5 text-base leading-8 text-blue-100">Order ID: {order.order_code}</p>
                        </div>
                    </RevealSection>

                    <RevealSection className="bg-gray-50 py-16 sm:py-20">
                        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
                            <div className="bg-white p-6 shadow-sm ring-1 ring-gray-200">
                                <h2 className="text-2xl font-black text-gray-950">Order Summary</h2>
                                <div className="mt-6 space-y-3 text-sm text-gray-700">
                                    <SummaryRow label="Service" value={order.service_name} />
                                    <SummaryRow label="Package" value={order.package_name} />
                                    <SummaryRow label="Customer" value={order.full_name} />
                                    <SummaryRow label="Email" value={order.email} />
                                    <SummaryRow label="Invoice" value={order.invoice?.invoice_number || "Pending"} />
                                    <SummaryRow label="Status" value={statusLabel(order.payment_status)} />
                                </div>

                                <div className="mt-6 border border-gray-200 bg-gray-50 p-5">
                                    <p className="text-xs font-black uppercase tracking-[0.18em] text-gray-500">Amount Breakdown</p>
                                    <div className="mt-4 space-y-2 text-sm text-gray-700">
                                        <SummaryRow label="Base Price" value={formatMoney(order.base_amount || order.amount, order.currency, locale)} />
                                        {order.logo_addon?.name && (
                                            <SummaryRow label="Logo Add-on" value={order.logo_addon.name} />
                                        )}
                                        {Number(order.discount_amount || 0) > 0 && (
                                            <SummaryRow label={`Discount${order.discount_code ? ` (${order.discount_code})` : ""}`} value={`-${formatMoney(order.discount_amount, order.currency, locale)}`} />
                                        )}
                                    </div>
                                    <p className="mt-5 text-3xl font-black text-[#000285]">{formatMoney(order.amount, order.currency, locale)}</p>
                                </div>
                            </div>

                            <div className="bg-white p-6 shadow-sm ring-1 ring-gray-200">
                                {flash?.success && <Flash tone="success">{flash.success}</Flash>}
                                {flash?.error && <Flash tone="error">{flash.error}</Flash>}
                                {paymentGatewayIssue && <Flash tone="error">{paymentGatewayIssue}</Flash>}

                                <h2 className="text-2xl font-black text-gray-950">Choose Payment Method</h2>
                                <p className="mt-2 text-sm leading-7 text-gray-600">
                                    Complete payment online or pay via direct bank transfer using Bellah Options account details below.
                                </p>

                                <div className="mt-6 border border-blue-100 bg-blue-50 px-4 py-3 text-sm leading-7 text-blue-900">
                                    Before payment continues, you must review and accept the Bellah Options Terms of Service.
                                </div>

                                <div className="mt-6 border border-gray-200 bg-gray-50 p-5">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-[#000285]">
                                            <CreditCardIcon className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-gray-950">{String(paymentProvider).toUpperCase()} Checkout</h3>
                                            <p className="text-sm text-gray-600">Fast card or transfer payment handled on the secure provider page.</p>
                                        </div>
                                    </div>

                                    {canPay ? (
                                        <button type="button" onClick={handlePayNow} className="mt-5 inline-flex w-full items-center justify-center gap-2 bg-[#000285] px-6 py-3 text-sm font-black text-white">
                                            Pay Online With {String(paymentProvider).toUpperCase()}
                                            <ArrowRightIcon className="h-4 w-4" />
                                        </button>
                                    ) : (
                                        <div className="mt-5 border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                                            {paymentGatewayIssue
                                                ? "Online payment is temporarily unavailable while gateway setup is completed."
                                                : order.payment_status === "not_required"
                                                ? "This order is in consultation mode and does not require immediate online payment."
                                                : "Payment has already been completed for this order."}
                                        </div>
                                    )}
                                </div>

                                {transferEnabled && (
                                    <div className="mt-5 border border-gray-200 bg-white p-5">
                                        <p className="text-xs font-black uppercase tracking-[0.18em] text-gray-500">Pay By Transfer</p>
                                        <div className="mt-3 space-y-2 text-sm text-gray-700">
                                            <SummaryRow label="Bank Name" value={transferPayment.bank_name} />
                                            <SummaryRow label="Account Name" value={transferPayment.account_name} />
                                            <SummaryRow label="Account Number" value={transferPayment.account_number} />
                                        </div>
                                        {transferPayment.instructions && (
                                            <p className="mt-3 text-sm leading-7 text-gray-600">{transferPayment.instructions}</p>
                                        )}

                                        {canPay && (
                                            <>
                                                <label htmlFor="transfer-reference" className="mt-4 block text-xs font-black uppercase tracking-[0.12em] text-gray-500">
                                                    Transfer Reference (optional)
                                                </label>
                                                <input
                                                    id="transfer-reference"
                                                    type="text"
                                                    value={transferReference}
                                                    onChange={(event) => setTransferReference(event.target.value)}
                                                    placeholder="Example: INV-12345"
                                                    className="mt-2 w-full border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-[#000285]"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={handleTransferSubmit}
                                                    className="mt-4 inline-flex w-full items-center justify-center border border-[#000285] px-6 py-3 text-sm font-black text-[#000285]"
                                                >
                                                    I Have Paid By Transfer
                                                </button>
                                            </>
                                        )}
                                    </div>
                                )}

                                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                                    <Link href={route("orders.show", order.order_code)} className="inline-flex items-center justify-center border border-gray-300 px-5 py-3 text-sm font-black text-gray-700">
                                        View Order Progress
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setPendingAction(null);
                                            setShowTermsModal(true);
                                        }}
                                        className="inline-flex items-center justify-center border border-gray-300 px-5 py-3 text-sm font-black text-gray-700"
                                    >
                                        Review Terms
                                    </button>
                                    <Link href="/contact-us" className="inline-flex items-center justify-center gap-2 border border-gray-300 px-5 py-3 text-sm font-black text-gray-700">
                                        Need Help?
                                        <LifebuoyIcon className="h-4 w-4" />
                                    </Link>
                                </div>

                                <p className="mt-6 text-xs text-gray-500">
                                    Created {formatDate(order.created_at, locale)}
                                </p>
                            </div>
                        </div>
                    </RevealSection>
                </main>
            </PageTheme>

            {showTermsModal && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-gray-950/70 px-4 py-8">
                    <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden bg-white shadow-2xl">
                        <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-6 py-5">
                            <div>
                                <p className="text-sm font-black uppercase tracking-[0.18em] text-cyan-600">
                                    Terms Confirmation
                                </p>
                                <h2 className="mt-2 text-2xl font-black text-gray-950">
                                    Review and accept before payment
                                </h2>
                                <p className="mt-2 text-sm leading-7 text-gray-600">
                                    By proceeding, you confirm that you have read and agreed to the Bellah Options Terms of Service for this order.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowTermsModal(false)}
                                className="flex h-10 w-10 items-center justify-center border border-gray-200 text-gray-600 transition hover:bg-gray-50"
                                aria-label="Close terms modal"
                            >
                                <XMarkIcon className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="overflow-y-auto px-6 py-6">
                            <div className="space-y-5">
                                {termsPreview.map((section, index) => (
                                    <section key={section.id} className="border border-gray-200 bg-gray-50 p-5">
                                        <p className="text-xs font-black uppercase tracking-[0.18em] text-[#000285]">
                                            Section {index + 1}
                                        </p>
                                        <h3 className="mt-2 text-xl font-black text-gray-950">
                                            {section.title}
                                        </h3>
                                        <div className="mt-3 space-y-3">
                                            {(section.body || []).map((paragraph) => (
                                                <p key={paragraph} className="text-sm leading-7 text-gray-600">
                                                    {paragraph}
                                                </p>
                                            ))}
                                        </div>
                                        {(section.bullets || []).length > 0 && (
                                            <ul className="mt-4 space-y-2">
                                                {section.bullets.map((bullet) => (
                                                    <li key={bullet} className="flex items-start gap-3 text-sm leading-7 text-gray-600">
                                                        <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#000285]" />
                                                        <span>{bullet}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </section>
                                ))}
                            </div>

                            <div className="mt-6 border border-blue-100 bg-blue-50 px-4 py-3 text-sm leading-7 text-blue-900">
                                Need the full document?{" "}
                                <Link href="/terms-of-service" className="font-black text-[#000285] underline underline-offset-2">
                                    Open the full Terms of Service page
                                </Link>
                                .
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 border-t border-gray-200 px-6 py-5 sm:flex-row sm:justify-end">
                            <button
                                type="button"
                                onClick={() => {
                                    setTermsAccepted(false);
                                    setPendingAction(null);
                                    setShowTermsModal(false);
                                }}
                                className="border border-gray-300 px-5 py-3 text-sm font-black text-gray-700"
                            >
                                Reject Terms
                            </button>
                            <button
                                type="button"
                                onClick={agreeAndContinue}
                                className="bg-[#000285] px-5 py-3 text-sm font-black text-white"
                            >
                                {pendingAction ? "Agree and Continue" : "Agree to Terms"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

function SummaryRow({ label, value }) {
    return (
        <div className="flex items-start justify-between gap-4">
            <span className="font-bold text-gray-500">{label}</span>
            <span className="text-right font-black text-gray-950">{value}</span>
        </div>
    );
}

function Flash({ tone, children }) {
    const className = tone === "success"
        ? "mb-5 border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
        : "mb-5 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700";

    return <div className={className}>{children}</div>;
}
