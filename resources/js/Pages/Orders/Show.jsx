import { Head, Link } from "@inertiajs/react";
import PageTheme from "@/Layouts/PageTheme";
import { RevealSection } from "@/Components/MotionReveal";
import { ArrowRightIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import { formatDate, formatMoney, statusLabel } from "./orderUtils";

export default function OrderShow({ order, serviceBriefLabels = {}, serviceBriefData = {} }) {
    const locale = "en-NG";
    const serviceBriefEntries = Object.entries(serviceBriefData || {}).filter(([, value]) => value !== null && value !== "");

    return (
        <>
            <Head title="Order Progress" />

            <PageTheme>
                <main className="bg-white text-gray-950">
                    <RevealSection className="bg-[#000285] py-16 text-white sm:py-20 lg:py-24">
                        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                            <p className="text-sm font-black uppercase tracking-[0.22em] text-cyan-300">Order Tracking</p>
                            <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
                                {order.service_name} progress
                            </h1>
                            <p className="mt-5 max-w-2xl text-base leading-8 text-blue-100">
                                Track project status, payment records, and delivery milestones in one place.
                            </p>
                        </div>
                    </RevealSection>

                    <RevealSection className="bg-gray-50 py-16 sm:py-20">
                        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
                            <div className="bg-white p-6 shadow-sm ring-1 ring-gray-200">
                                <h2 className="text-2xl font-black text-gray-950">Order Information</h2>
                                <div className="mt-6 space-y-3 text-sm text-gray-700">
                                    <SummaryRow label="Order ID" value={order.order_code} />
                                    <SummaryRow label="Service" value={order.service_name} />
                                    <SummaryRow label="Package" value={order.package_name} />
                                    {order.logo_addon?.name && <SummaryRow label="Logo Add-on" value={order.logo_addon.name} />}
                                    <SummaryRow label="Payment Status" value={statusLabel(order.payment_status)} />
                                    <SummaryRow label="Order Status" value={statusLabel(order.order_status)} />
                                    <SummaryRow label="Created" value={formatDate(order.created_at, locale)} />
                                    {order.paid_at && <SummaryRow label="Paid At" value={formatDate(order.paid_at, locale)} />}
                                </div>

                                <div className="mt-6 border border-gray-200 bg-gray-50 p-5">
                                    <div className="flex items-center justify-between gap-4">
                                        <p className="font-black text-[#000285]">Progress</p>
                                        <p className="font-black text-gray-950">{order.progress_percent}%</p>
                                    </div>
                                    <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-blue-100">
                                        <div className="h-3 bg-[#000285]" style={{ width: `${Math.max(0, Math.min(100, order.progress_percent || 0))}%` }} />
                                    </div>
                                </div>

                                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                                    {order.payment_status !== "paid" && order.payment_status !== "not_required" && Number(order.amount || 0) > 0 && (
                                        <Link href={route("orders.payment.show", order.order_code)} className="inline-flex items-center justify-center gap-2 bg-[#000285] px-5 py-3 text-sm font-black text-white">
                                            Complete Payment
                                            <ArrowRightIcon className="h-4 w-4" />
                                        </Link>
                                    )}
                                    <Link href="/services" className="inline-flex items-center justify-center border border-gray-300 px-5 py-3 text-sm font-black text-gray-700">
                                        Order Another Service
                                    </Link>
                                </div>
                            </div>

                            <div className="bg-white p-6 shadow-sm ring-1 ring-gray-200">
                                <h2 className="text-2xl font-black text-gray-950">Invoice and Updates</h2>

                                {serviceBriefEntries.length > 0 && (
                                    <div className="mt-6 border border-gray-200 bg-gray-50 p-5">
                                        <p className="font-black text-[#000285]">Submitted Service Brief</p>
                                        <div className="mt-4 space-y-3 text-sm text-gray-700">
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
                                    <div className="mt-6 border border-gray-200 bg-gray-50 p-5">
                                        <p className="font-black text-[#000285]">Invoice Snapshot</p>
                                        <div className="mt-4 space-y-3 text-sm text-gray-700">
                                            <SummaryRow label="Invoice Number" value={order.invoice.invoice_number} />
                                            <SummaryRow label="Amount" value={formatMoney(order.invoice.amount, order.invoice.currency, locale)} />
                                            <SummaryRow label="Status" value={statusLabel(order.invoice.status)} />
                                            {order.invoice.payment_reference && <SummaryRow label="Payment Reference" value={order.invoice.payment_reference} />}
                                        </div>
                                    </div>
                                )}

                                <div className="mt-6">
                                    <p className="text-lg font-black text-gray-950">Progress Timeline</p>
                                    <div className="mt-4 space-y-4">
                                        {(order.updates || []).length > 0 ? (
                                            order.updates.map((update) => (
                                                <article key={update.id} className="border border-gray-200 bg-gray-50 p-4">
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div>
                                                            <p className="font-black text-[#000285]">{statusLabel(update.status)}</p>
                                                            <p className="mt-2 text-sm leading-6 text-gray-600">{update.note || "Progress updated."}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-sm font-black text-gray-950">{update.progress_percent}%</p>
                                                            <p className="mt-1 text-xs text-gray-500">{formatDate(update.created_at, locale)}</p>
                                                        </div>
                                                    </div>
                                                </article>
                                            ))
                                        ) : (
                                            <div className="border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                                                No progress updates yet. Your timeline updates will appear here.
                                            </div>
                                        )}
                                    </div>
                                </div>
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
