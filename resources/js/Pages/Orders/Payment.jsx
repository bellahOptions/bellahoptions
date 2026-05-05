import { Head, Link, router, usePage } from "@inertiajs/react";
import PageTheme from "@/Layouts/PageTheme";
import { RevealSection } from "@/Components/MotionReveal";
import { ArrowRightIcon, CreditCardIcon, LifebuoyIcon } from "@heroicons/react/24/outline";
import { formatDate, formatMoney, statusLabel } from "./orderUtils";

export default function OrderPayment({ order, canPay = false, paymentProvider = "paystack" }) {
    const { flash, localization } = usePage().props;
    const locale = localization?.locale?.replace("_", "-") || "en-NG";

    const startPayment = () => {
        router.post(route("orders.payment.initialize", order.order_code), {}, { preserveScroll: true });
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

                                <div className="flex items-center gap-3">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-[#000285]">
                                        <CreditCardIcon className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black text-gray-950">{String(paymentProvider).toUpperCase()} Payment</h2>
                                        <p className="text-sm text-gray-600">Handled securely by your localized payment provider.</p>
                                    </div>
                                </div>

                                <p className="mt-6 text-sm leading-7 text-gray-600">
                                    Card and transfer details are completed on {String(paymentProvider).toUpperCase()} checkout. We only store the payment reference and verification status.
                                </p>

                                {canPay ? (
                                    <button type="button" onClick={startPayment} className="mt-8 inline-flex w-full items-center justify-center gap-2 bg-[#000285] px-6 py-3 text-sm font-black text-white">
                                        Pay Now With {String(paymentProvider).toUpperCase()}
                                        <ArrowRightIcon className="h-4 w-4" />
                                    </button>
                                ) : (
                                    <div className="mt-8 border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                                        {order.payment_status === "not_required"
                                            ? "This order is in consultation mode and does not require immediate online payment."
                                            : "Payment has already been completed for this order."}
                                    </div>
                                )}

                                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                                    <Link href={route("orders.show", order.order_code)} className="inline-flex items-center justify-center border border-gray-300 px-5 py-3 text-sm font-black text-gray-700">
                                        View Order Progress
                                    </Link>
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
