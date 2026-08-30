<?php

namespace App\Support;

use App\Mail\IncomeSplitPartnerNotificationMail;
use App\Models\IncomeSplit;
use App\Models\Invoice;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

/**
 * Splits every paid invoice five ways: three fixed reserve percentages
 * (ads / data / AI savings), a fixed partner percentage, and an owner
 * percentage that absorbs whatever remains — so the five buckets always
 * reconcile to exactly 100% of the invoice, with no rounding dust lost.
 */
class IncomeSplitCalculator
{
    public function applyForInvoice(Invoice $invoice): ?IncomeSplit
    {
        // Idempotent: a webhook retry or double-save must never double-split an invoice.
        $existing = IncomeSplit::query()->where('invoice_id', $invoice->id)->first();

        if ($existing !== null) {
            return $existing;
        }

        $config = config('finance.income_split');
        $total = (float) $invoice->amount;

        $adsSavings = round($total * $config['ads_savings_percent'] / 100, 2);
        $dataSavings = round($total * $config['data_savings_percent'] / 100, 2);
        $aiSavings = round($total * $config['ai_savings_percent'] / 100, 2);
        $partnerAmount = round($total * $config['partner_percent'] / 100, 2);

        // The owner absorbs whatever is left after the four fixed buckets, so the
        // split always reconciles exactly to the invoice total regardless of
        // rounding — no fraction of a kobo goes unaccounted for.
        $ownerAmount = round($total - $adsSavings - $dataSavings - $aiSavings - $partnerAmount, 2);
        $ownerPercent = $total > 0 ? round(100 - $config['ads_savings_percent'] - $config['data_savings_percent'] - $config['ai_savings_percent'] - $config['partner_percent'], 2) : 0.0;

        $partner = $this->resolveUserByEmail($config['partner_email']);
        $owner = $this->resolveUserByEmail($config['owner_email']);

        $split = IncomeSplit::create([
            'invoice_id' => $invoice->id,
            'currency' => $invoice->currency,
            'total_amount' => $total,
            'ads_savings_percent' => $config['ads_savings_percent'],
            'ads_savings_amount' => $adsSavings,
            'data_savings_percent' => $config['data_savings_percent'],
            'data_savings_amount' => $dataSavings,
            'ai_savings_percent' => $config['ai_savings_percent'],
            'ai_savings_amount' => $aiSavings,
            'partner_user_id' => $partner?->id,
            'partner_percent' => $config['partner_percent'],
            'partner_amount' => $partnerAmount,
            'owner_user_id' => $owner?->id,
            'owner_percent' => $ownerPercent,
            'owner_amount' => $ownerAmount,
        ]);

        if ($partner !== null) {
            $this->notifyPartner($split->fresh(), $partner, $invoice);
        }

        return $split;
    }

    private function resolveUserByEmail(?string $email): ?User
    {
        $email = strtolower(trim((string) $email));

        if ($email === '') {
            return null;
        }

        return User::query()->whereRaw('LOWER(email) = ?', [$email])->first();
    }

    private function notifyPartner(IncomeSplit $split, User $partner, Invoice $invoice): void
    {
        try {
            Mail::to($partner->email)->send(new IncomeSplitPartnerNotificationMail($split, $invoice));

            $split->update(['partner_notified_at' => now()]);
        } catch (Throwable $exception) {
            Log::warning('Income split partner notification email failed.', [
                'income_split_id' => $split->id,
                'invoice_id' => $invoice->id,
                'partner_email' => $partner->email,
                'error' => $exception->getMessage(),
            ]);
        }
    }
}
