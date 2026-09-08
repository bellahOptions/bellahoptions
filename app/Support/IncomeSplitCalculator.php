<?php

namespace App\Support;

use App\Mail\IncomeSplitPartnerNotificationMail;
use App\Models\IncomeSplit;
use App\Models\Invoice;
use App\Models\InvoiceStaffCommission;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

/**
 * Splits every paid invoice into: three fixed reserve percentages (ads /
 * data / AI savings), a fixed partner percentage, a commission percentage
 * for every staff member flagged commission-eligible, and an owner
 * percentage that absorbs whatever remains — so the buckets always
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

        $eligibleStaff = User::query()
            ->where('commission_eligible', true)
            ->where('commission_percent', '>', 0)
            ->get(['id', 'commission_percent']);

        $staffCommissionPercent = (float) $eligibleStaff->sum(fn (User $user): float => (float) $user->commission_percent);
        $staffCommissionAmounts = $eligibleStaff->mapWithKeys(
            fn (User $user): array => [$user->id => round($total * (float) $user->commission_percent / 100, 2)]
        );
        $staffCommissionTotal = (float) $staffCommissionAmounts->sum();

        // The owner absorbs whatever is left after the fixed buckets and every staff
        // commission, so the split always reconciles exactly to the invoice total
        // regardless of rounding — no fraction of a kobo goes unaccounted for. If the
        // configured percentages ever add up to more than 100%, the owner's share is
        // floored at zero rather than going negative.
        $ownerAmount = max(0.0, round($total - $adsSavings - $dataSavings - $aiSavings - $partnerAmount - $staffCommissionTotal, 2));
        $ownerPercent = $total > 0
            ? max(0.0, round(100 - $config['ads_savings_percent'] - $config['data_savings_percent'] - $config['ai_savings_percent'] - $config['partner_percent'] - $staffCommissionPercent, 2))
            : 0.0;

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

        foreach ($eligibleStaff as $staff) {
            InvoiceStaffCommission::create([
                'invoice_id' => $invoice->id,
                'user_id' => $staff->id,
                'currency' => $invoice->currency,
                'commission_percent' => $staff->commission_percent,
                'commission_amount' => $staffCommissionAmounts->get($staff->id, 0.0),
            ]);
        }

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
