<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\IncomeSplit;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class MyEarningsController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        abort_unless((bool) $user?->isStaff(), 403);

        $userId = $user->id;

        $splits = IncomeSplit::query()
            ->where(function ($query) use ($userId): void {
                $query->where('partner_user_id', $userId)->orWhere('owner_user_id', $userId);
            })
            ->with('invoice:id,invoice_number,title,paid_at')
            ->latest('id')
            ->paginate(20)
            ->through(function (IncomeSplit $split) use ($userId): array {
                $isPartner = $split->partner_user_id === $userId;

                return [
                    'id' => $split->id,
                    'invoice_number' => $split->invoice?->invoice_number,
                    'invoice_title' => $split->invoice?->title,
                    'paid_at' => $split->invoice?->paid_at?->toDateString(),
                    'currency' => $split->currency,
                    'total_amount' => (string) $split->total_amount,
                    'your_amount' => (string) ($isPartner ? $split->partner_amount : $split->owner_amount),
                    'your_percent' => (string) ($isPartner ? $split->partner_percent : $split->owner_percent),
                    'role' => $isPartner ? 'partner' : 'owner',
                ];
            })
            ->withQueryString();

        $asPartnerTotal = (float) IncomeSplit::query()->where('partner_user_id', $userId)->sum('partner_amount');
        $asOwnerTotal = (float) IncomeSplit::query()->where('owner_user_id', $userId)->sum('owner_amount');

        $monthStart = now()->startOfMonth();
        $asPartnerThisMonth = (float) IncomeSplit::query()
            ->where('partner_user_id', $userId)
            ->where('created_at', '>=', $monthStart)
            ->sum('partner_amount');
        $asOwnerThisMonth = (float) IncomeSplit::query()
            ->where('owner_user_id', $userId)
            ->where('created_at', '>=', $monthStart)
            ->sum('owner_amount');

        return Inertia::render('Admin/MyEarnings', [
            'stats' => [
                'total_earned' => (string) ($asPartnerTotal + $asOwnerTotal),
                'this_month' => (string) ($asPartnerThisMonth + $asOwnerThisMonth),
                'invoice_count' => IncomeSplit::query()
                    ->where(function ($query) use ($userId): void {
                        $query->where('partner_user_id', $userId)->orWhere('owner_user_id', $userId);
                    })
                    ->count(),
            ],
            'splits' => $splits,
        ]);
    }
}
