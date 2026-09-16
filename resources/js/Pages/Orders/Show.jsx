import { Head, Link, router } from "@inertiajs/react";
import { useEffect } from "react";
import PageTheme from "@/Layouts/PageTheme";
import { RevealSection } from "@/Components/MotionReveal";
import { Eyebrow } from "@/Components/PublicUI";
import { buttonVariants } from "@/Components/ui/button";
import { Card } from "@/Components/ui/card";
import { cn } from "@/lib/utils";
import { ArrowRightIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import { formatDate, formatMoney, statusLabel } from "./orderUtils";

const livePaymentStatuses = new Set(["pending", "processing", "awaiting_confirmation"]);

export default function OrderShow({ order, serviceBriefLabels = {}, serviceBriefData = {} }) {
    const locale = "en-NG";
    const serviceBriefEntries = Object.entries(serviceBriefData || {}).filter(([, value]) => value !== null && value !== "");
    const isWatchingForPayment = livePaymentStatuses.has(String(order.payment_status || "").toLowerCase());

    useEffect(() => {
        if (!isWatchingForPayment) {
            return undefined;
        }

        const timer = window.setInterval(() => {
            router.reload({
                only: ["order"],
                preserveScroll: true,
                preserveState: true,
            });
        }, 6000);

        return () => window.clearInterval(timer);
    }, [isWatchingForPayment]);

    return (
        <>
            <Head title="Order Progress" />

            <PageTheme>
                <main className="text-white">
                    <RevealSection className="jv-glow jv-grid-bg relative overflow-hidden py-16 sm:py-20 lg:py-24">
                        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                            <Eyebrow>Order Tracking</Eyebrow>
                            <h1 className="jv-display jv-display--lg mt-6">
                                {order.service_name} progress
                            </h1>
                            <p className="jv-lead mt-5 max-w-2xl">
                                Track project status, payment records, and delivery milestones in one place.
                            </p>
                        </div>
                    </RevealSection>

                    <RevealSection className="py-16 sm:py-20">
                        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
                            <Card className="p-6">
                                <h2 className="text-2xl font-semibold tracking-tight text-white">Order Information</h2>
                                <div className="mt-6 space-y-3 text-sm text-white/80">
                                    <SummaryRow label="Order ID" value={order.order_code} />
                                    <SummaryRow label="Service" value={order.service_name} />
                                    <SummaryRow label="Package" value={order.package_name} />
                                    {Number(order.package_quantity || 0) > 1 && (
                                        <SummaryRow label="Quantity" value={order.package_quantity} />
                                    )}
                                    {order.logo_addon?.name && <SummaryRow label="Logo Add-on" value={order.logo_addon.name} />}
                                    <SummaryRow label="Payment Status" value={statusLabel(order.payment_status)} />
                                    <SummaryRow label="Order Status" value={statusLabel(order.order_status)} />
                                    <SummaryRow label="Created" value={formatDate(order.created_at, locale)} />
                                    {order.paid_at && <SummaryRow label="Paid At" value={formatDate(order.paid_at, locale)} />}
                                </div>

                                <div className="mt-6 rounded-jv-sm border border-jv-line bg-white/[0.04] p-5">
                                    <div className="flex items-center justify-between gap-4">
                                        <p className="font-semibold text-jv-accent">Progress</p>
                                        <p className="font-semibold text-white">{order.progress_percent}%</p>
                                    </div>
                                    <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-white/[0.08]">
                                        <div className="h-3 bg-jv-accent" style={{ width: `${Math.max(0, Math.min(100, order.progress_percent || 0))}%` }} />
                                    </div>
                                </div>

                                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                                    {order.payment_status !== "paid" && order.payment_status !== "not_required" && Number(order.amount || 0) > 0 && (
                                        <Link href={route("orders.payment.show", order.order_code)} className={cn(buttonVariants({ variant: "default" }), "rounded-full px-5 py-3")}>
                                            Complete Payment
                                            <ArrowRightIcon className="h-4 w-4" />
                                        </Link>
                                    )}
                                    <Link href="/services" className={cn(buttonVariants({ variant: "outline" }), "rounded-full px-5 py-3")}>
                                        Order Another Service
                                    </Link>
                                </div>
                                {isWatchingForPayment && (
                                    <p className="mt-3 text-xs text-white/45">
                                        This page refreshes automatically every few seconds while your payment is being confirmed.
                                    </p>
                                )}
                            </Card>

                            <Card className="p-6">
                                <h2 className="text-2xl font-semibold tracking-tight text-white">Invoice and Updates</h2>

                                {serviceBriefEntries.length > 0 && (
                                    <div className="mt-6 rounded-jv-sm border border-jv-line bg-white/[0.04] p-5">
                                        <p className="font-semibold text-jv-accent">Submitted Service Brief</p>
                                        <div className="mt-4 space-y-3 text-sm text-white/80">
                                            {serviceBriefEntries.map(([key, value]) => (
                                                <SummaryRow
                                                    key={key}
                                                    label={serviceBriefLabels[key] || statusLabel(key)}
                                                    value={Array.isArray(value) ? value.join(", ") : String(value)}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {order.invoice && (
                                    <div className="mt-6 rounded-jv-sm border border-jv-line bg-white/[0.04] p-5">
                                        <p className="font-semibold text-jv-accent">Invoice Snapshot</p>
                                        <div className="mt-4 space-y-3 text-sm text-white/80">
                                            <SummaryRow label="Invoice Number" value={order.invoice.invoice_number} />
                                            <SummaryRow label="Amount" value={formatMoney(order.invoice.amount, order.invoice.currency, locale)} />
                                            <SummaryRow label="Status" value={statusLabel(order.invoice.status)} />
                                            {order.invoice.payment_reference && <SummaryRow label="Payment Reference" value={order.invoice.payment_reference} />}
                                        </div>
                                    </div>
                                )}

                                <div className="mt-6">
                                    <p className="text-lg font-semibold tracking-tight text-white">Progress Timeline</p>
                                    <div className="mt-4 space-y-4">
                                        {(order.updates || []).length > 0 ? (
                                            order.updates.map((update) => (
                                                <article key={update.id} className="rounded-jv-sm border border-jv-line bg-white/[0.04] p-4">
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div>
                                                            <p className="font-semibold text-jv-accent">{statusLabel(update.status)}</p>
                                                            <p className="mt-2 text-sm leading-6 text-white/70">{update.note || "Progress updated."}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-sm font-semibold text-white">{update.progress_percent}%</p>
                                                            <p className="mt-1 text-xs text-white/45">{formatDate(update.created_at, locale)}</p>
                                                        </div>
                                                    </div>
                                                </article>
                                            ))
                                        ) : (
                                            <div className="rounded-jv-sm border border-jv-line bg-white/[0.04] p-4 text-sm text-white/70">
                                                No progress updates yet. Your timeline updates will appear here.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        </div>
                    </RevealSection>
                </main>
            </PageTheme>
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
