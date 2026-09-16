import { Head, Link, router, usePage } from "@inertiajs/react";
import { useMemo, useState } from "react";
import PageTheme from "@/Layouts/PageTheme";
import { RevealSection } from "@/Components/MotionReveal";
import { Eyebrow } from "@/Components/PublicUI";
import { Button, buttonVariants } from "@/Components/ui/button";
import { Card } from "@/Components/ui/card";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";
import { cn } from "@/lib/utils";
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
                <main className="text-white">
                    <RevealSection className="jv-glow jv-grid-bg relative overflow-hidden py-16 sm:py-20 lg:py-24">
                        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                            <Eyebrow>Secure Checkout</Eyebrow>
                            <h1 className="jv-display jv-display--lg mt-6">
                                Complete payment for {order.service_name}
                            </h1>
                            <p className="jv-lead mt-5">Order ID: {order.order_code}</p>
                        </div>
                    </RevealSection>

                    <RevealSection className="py-16 sm:py-20">
                        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
                            <Card className="p-6">
                                <h2 className="text-2xl font-semibold tracking-tight text-white">Order Summary</h2>
                                <div className="mt-6 space-y-3 text-sm text-white/80">
                                    <SummaryRow label="Service" value={order.service_name} />
                                    <SummaryRow label="Package" value={order.package_name} />
                                    {Number(order.package_quantity || 0) > 1 && (
                                        <SummaryRow label="Quantity" value={order.package_quantity} />
                                    )}
                                    <SummaryRow label="Customer" value={order.full_name} />
                                    <SummaryRow label="Email" value={order.email} />
                                    <SummaryRow label="Invoice" value={order.invoice?.invoice_number || "Pending"} />
                                    <SummaryRow label="Status" value={statusLabel(order.payment_status)} />
                                </div>

                                <div className="mt-6 rounded-jv-sm border border-jv-line bg-white/[0.04] p-5">
                                    <p className="text-xs font-black uppercase tracking-[0.18em] text-white/45">Amount Breakdown</p>
                                    <div className="mt-4 space-y-2 text-sm text-white/80">
                                        <SummaryRow label="Base Price" value={formatMoney(order.base_amount || order.amount, order.currency, locale)} />
                                        {order.logo_addon?.name && (
                                            <SummaryRow label="Logo Add-on" value={order.logo_addon.name} />
                                        )}
                                        {Number(order.discount_amount || 0) > 0 && (
                                            <SummaryRow label={`Discount${order.discount_code ? ` (${order.discount_code})` : ""}`} value={`-${formatMoney(order.discount_amount, order.currency, locale)}`} />
                                        )}
                                    </div>
                                    <p className="mt-5 text-3xl font-semibold text-jv-accent">{formatMoney(order.amount, order.currency, locale)}</p>
                                </div>
                            </Card>

                            <Card className="p-6">
                                {flash?.success && <Flash tone="success">{flash.success}</Flash>}
                                {flash?.error && <Flash tone="error">{flash.error}</Flash>}
                                {paymentGatewayIssue && <Flash tone="error">{paymentGatewayIssue}</Flash>}

                                <h2 className="text-2xl font-semibold tracking-tight text-white">Choose Payment Method</h2>
                                <p className="mt-2 text-sm leading-7 text-white/70">
                                    Complete payment online or pay via direct bank transfer using Bellah Options account details below.
                                </p>

                                <div className="mt-6 rounded-jv-sm border border-jv-accent-line bg-jv-accent/10 px-4 py-3 text-sm leading-7 text-white/80">
                                    Before payment continues, you must review and accept the Bellah Options Terms of Service.
                                </div>

                                <div className="mt-6 rounded-jv-sm border border-jv-line bg-white/[0.04] p-5">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-jv-accent/15 text-jv-accent">
                                            <CreditCardIcon className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-semibold text-white">{String(paymentProvider).toUpperCase()} Checkout</h3>
                                            <p className="text-sm text-white/70">Fast card or transfer payment handled on the secure provider page.</p>
                                        </div>
                                    </div>

                                    {canPay ? (
                                        <>
                                            <Button type="button" onClick={handlePayNow} className="mt-5 w-full rounded-full px-6 py-3">
                                                Pay Online With {String(paymentProvider).toUpperCase()}
                                                <ArrowRightIcon className="h-4 w-4" />
                                            </Button>
                                            <p className="mt-2 text-xs text-white/45">
                                                You'll be redirected to {String(paymentProvider).toUpperCase()}'s secure page to complete payment, then brought back here automatically.
                                            </p>
                                        </>
                                    ) : (
                                        <div className="mt-5 rounded-jv-sm border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                                            {paymentGatewayIssue
                                                ? "Online payment is temporarily unavailable while gateway setup is completed."
                                                : order.payment_status === "not_required"
                                                ? "This order is in consultation mode and does not require immediate online payment."
                                                : "Payment has already been completed for this order."}
                                        </div>
                                    )}
                                </div>

                                {transferEnabled && (
                                    <div className="mt-5 rounded-jv-sm border border-jv-line bg-white/[0.04] p-5">
                                        <p className="text-xs font-black uppercase tracking-[0.18em] text-white/45">Pay By Transfer</p>
                                        <div className="mt-3 space-y-2 text-sm text-white/80">
                                            <SummaryRow label="Bank Name" value={transferPayment.bank_name} />
                                            <SummaryRow label="Account Name" value={transferPayment.account_name} />
                                            <SummaryRow label="Account Number" value={transferPayment.account_number} />
                                        </div>
                                        {transferPayment.instructions && (
                                            <p className="mt-3 text-sm leading-7 text-white/70">{transferPayment.instructions}</p>
                                        )}

                                        {canPay && (
                                            <>
                                                <Label htmlFor="transfer-reference" className="mt-4 block text-xs font-black uppercase tracking-[0.12em] text-white/45">
                                                    Transfer Reference (optional)
                                                </Label>
                                                <Input
                                                    id="transfer-reference"
                                                    type="text"
                                                    value={transferReference}
                                                    onChange={(event) => setTransferReference(event.target.value)}
                                                    placeholder="Example: INV-12345"
                                                    className="mt-2"
                                                />
                                                <p className="mt-1 text-xs text-white/45">
                                                    Add your bank's transaction reference if you have it — this helps us confirm your payment faster.
                                                </p>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={handleTransferSubmit}
                                                    className="mt-4 w-full rounded-full border-jv-accent-line px-6 py-3 text-[#a9c4ff]"
                                                >
                                                    I Have Paid By Transfer
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                )}

                                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                                    <Link href={route("orders.show", order.order_code)} className={cn(buttonVariants({ variant: "outline" }), "rounded-full px-5 py-3")}>
                                        View Order Progress
                                    </Link>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            setPendingAction(null);
                                            setShowTermsModal(true);
                                        }}
                                        className="rounded-full px-5 py-3"
                                    >
                                        Review Terms
                                    </Button>
                                    <Link href="/contact-us" className={cn(buttonVariants({ variant: "outline" }), "rounded-full px-5 py-3")}>
                                        Need Help?
                                        <LifebuoyIcon className="h-4 w-4" />
                                    </Link>
                                </div>

                                <p className="mt-6 text-xs text-white/45">
                                    Created {formatDate(order.created_at, locale)}
                                </p>
                            </Card>
                        </div>
                    </RevealSection>
                </main>
            </PageTheme>

            {showTermsModal && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-gray-950/70 px-4 py-8">
                    <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-jv border border-jv-line bg-jv-ink shadow-2xl shadow-black/70">
                        <div className="flex items-start justify-between gap-4 border-b border-jv-line px-6 py-5">
                            <div>
                                <p className="jv-mono text-jv-accent">
                                    Terms Confirmation
                                </p>
                                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">
                                    Review and accept before payment
                                </h2>
                                <p className="mt-2 text-sm leading-7 text-white/70">
                                    By proceeding, you confirm that you have read and agreed to the Bellah Options Terms of Service for this order.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowTermsModal(false)}
                                className="flex h-10 w-10 items-center justify-center rounded-jv-sm border border-jv-line-strong text-white/60 transition hover:bg-white/[0.06] hover:text-white"
                                aria-label="Close terms modal"
                            >
                                <XMarkIcon className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="overflow-y-auto px-6 py-6">
                            <div className="space-y-5">
                                {termsPreview.map((section, index) => (
                                    <section key={section.id} className="rounded-jv-sm border border-jv-line bg-white/[0.04] p-5">
                                        <p className="text-xs font-black uppercase tracking-[0.18em] text-jv-accent">
                                            Section {index + 1}
                                        </p>
                                        <h3 className="mt-2 text-xl font-semibold text-white">
                                            {section.title}
                                        </h3>
                                        <div className="mt-3 space-y-3">
                                            {(section.body || []).map((paragraph) => (
                                                <p key={paragraph} className="text-sm leading-7 text-white/70">
                                                    {paragraph}
                                                </p>
                                            ))}
                                        </div>
                                        {(section.bullets || []).length > 0 && (
                                            <ul className="mt-4 space-y-2">
                                                {section.bullets.map((bullet) => (
                                                    <li key={bullet} className="flex items-start gap-3 text-sm leading-7 text-white/70">
                                                        <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-jv-accent" />
                                                        <span>{bullet}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </section>
                                ))}
                            </div>

                            <div className="mt-6 rounded-jv-sm border border-jv-accent-line bg-jv-accent/10 px-4 py-3 text-sm leading-7 text-white/80">
                                Need the full document?{" "}
                                <Link href="/terms-of-service" className="font-semibold text-[#a9c4ff] underline underline-offset-2">
                                    Open the full Terms of Service page
                                </Link>
                                .
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 border-t border-jv-line px-6 py-5 sm:flex-row sm:justify-end">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setTermsAccepted(false);
                                    setPendingAction(null);
                                    setShowTermsModal(false);
                                }}
                                className="rounded-full px-5 py-3"
                            >
                                Reject Terms
                            </Button>
                            <Button type="button" onClick={agreeAndContinue} className="rounded-full px-5 py-3">
                                {pendingAction ? "Agree and Continue" : "Agree to Terms"}
                            </Button>
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
            <span className="font-bold text-white/45">{label}</span>
            <span className="text-right font-semibold text-white">{value}</span>
        </div>
    );
}

function Flash({ tone, children }) {
    const className = tone === "success"
        ? "mb-5 rounded-jv-sm border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300"
        : "mb-5 rounded-jv-sm border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300";

    return <div className={className}>{children}</div>;
}
