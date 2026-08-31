<?php

namespace App\Support;

use App\Models\Invoice;
use App\Models\ServiceOrder;
use App\Models\ServiceOrderUpdate;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ServiceOrderRenewal
{
    /**
     * Create a new ServiceOrder + Invoice cloned from a previous order, for either
     * a manual customer-triggered renewal (pending, awaiting payment) or an
     * automatic Paystack subscription renewal charge (already paid).
     *
     * @param  array<string, mixed>  $overrides
     * @return array{order: ServiceOrder, invoice: Invoice}
     */
    public static function renew(ServiceOrder $previous, array $overrides = []): array
    {
        $paymentStatus = (string) ($overrides['payment_status'] ?? 'pending');
        $isPrePaid = $paymentStatus === 'paid';

        $order = null;
        $invoice = null;

        DB::transaction(function () use ($previous, $overrides, $paymentStatus, $isPrePaid, &$order, &$invoice): void {
            $order = ServiceOrder::create(array_merge([
                'uuid' => (string) Str::uuid(),
                'order_code' => self::generateOrderCode(),
                'user_id' => $previous->user_id,
                'customer_id' => $previous->customer_id,
                'service_slug' => $previous->service_slug,
                'service_name' => $previous->service_name,
                'package_code' => $previous->package_code,
                'package_name' => $previous->package_name,
                'currency' => $previous->currency,
                'base_amount' => $previous->amount,
                'amount' => $previous->amount,
                'payment_provider' => $previous->payment_provider ?: 'paystack',
                'subscription_plan_id' => $previous->subscription_plan_id,
                'payment_status' => $paymentStatus,
                'order_status' => $isPrePaid ? 'queued' : 'awaiting_payment',
                'progress_percent' => $isPrePaid ? 20 : 5,
                'full_name' => $previous->full_name,
                'email' => $previous->email,
                'phone' => $previous->phone,
                'business_name' => $previous->business_name,
                'position' => $previous->position,
                'business_website' => $previous->business_website,
                'project_summary' => $previous->project_summary,
                'project_goals' => $previous->project_goals,
                'target_audience' => $previous->target_audience,
                'preferred_style' => $previous->preferred_style,
                'deliverables' => $previous->deliverables,
                'additional_details' => $previous->additional_details,
                'brief_payload' => $previous->brief_payload,
                'wants_account' => false,
            ], $overrides));

            $invoice = Invoice::create([
                'invoice_number' => self::generateInvoiceNumber(),
                'customer_id' => $previous->customer_id,
                'customer_name' => $previous->full_name,
                'customer_email' => $previous->email,
                'title' => $previous->service_name.' - '.$previous->package_name.' (Renewal)',
                'description' => 'Renewal of order '.$previous->order_code.'.',
                'amount' => $previous->amount,
                'currency' => $previous->currency,
                'due_date' => now()->addDays(7)->toDateString(),
                'status' => $isPrePaid ? 'paid' : 'sent',
                'issued_at' => now(),
                'paid_at' => $isPrePaid ? now() : null,
                'payment_reference' => $isPrePaid ? ($overrides['paystack_reference'] ?? null) : null,
                'created_by' => $previous->user_id,
            ]);

            $order->update(['invoice_id' => $invoice->id]);

            ServiceOrderUpdate::create([
                'service_order_id' => $order->id,
                'status' => $order->order_status,
                'progress_percent' => $order->progress_percent,
                'note' => $isPrePaid
                    ? 'Subscription renewal payment received. Order created from '.$previous->order_code.'.'
                    : 'Renewal order created from '.$previous->order_code.' and is awaiting payment confirmation.',
                'is_public' => true,
                'created_by' => $previous->user_id,
            ]);
        });

        return ['order' => $order, 'invoice' => $invoice];
    }

    private static function generateOrderCode(): string
    {
        do {
            $orderCode = 'BO'.strtoupper(Str::random(6));
        } while (ServiceOrder::query()->where('order_code', $orderCode)->exists());

        return $orderCode;
    }

    private static function generateInvoiceNumber(): string
    {
        $startNumber = 200;

        $highestNumericInvoiceNumber = Invoice::query()
            ->pluck('invoice_number')
            ->map(static fn (mixed $invoiceNumber): string => trim((string) $invoiceNumber))
            ->filter(static fn (string $invoiceNumber): bool => ctype_digit($invoiceNumber))
            ->map(static fn (string $invoiceNumber): int => (int) $invoiceNumber)
            ->max();

        $nextNumber = max(
            $startNumber,
            ($highestNumericInvoiceNumber ?? ($startNumber - 1)) + 1,
        );

        do {
            $number = (string) $nextNumber;
            $nextNumber++;
        } while (Invoice::query()->where('invoice_number', $number)->exists());

        return $number;
    }
}
