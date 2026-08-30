<?php

namespace App\Observers;

use App\Models\Invoice;
use App\Support\IncomeSplitCalculator;
use Illuminate\Support\Facades\Log;
use Throwable;

class InvoiceObserver
{
    /**
     * Apply the invoice income split the moment an invoice's status becomes
     * "paid" — regardless of which code path marked it paid (admin action,
     * Paystack webhook, Flutterwave webhook, etc.), so this can never be
     * missed by a future payment path forgetting to trigger it explicitly.
     */
    public function updated(Invoice $invoice): void
    {
        if (! $invoice->wasChanged('status') || $invoice->status !== 'paid') {
            return;
        }

        try {
            app(IncomeSplitCalculator::class)->applyForInvoice($invoice);
        } catch (Throwable $exception) {
            Log::error('Failed to apply income split for a paid invoice.', [
                'invoice_id' => $invoice->id,
                'error' => $exception->getMessage(),
            ]);
        }
    }
}
