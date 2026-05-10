<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Resources\Dashboard\AdminDashboardPageResource;
use App\Http\Resources\Dashboard\UserDashboardPageResource;
use App\Models\Invoice;
use App\Models\LiveChatStaffPresence;
use App\Models\LiveChatThread;
use App\Models\ServiceOrder;
use App\Models\ServiceOrderUpdate;
use App\Models\SupportTicket;
use App\Models\User;
use App\Support\PlatformSettings;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $user = $request->user();

        if (! $user) {
            abort(403);
        }

        if ($user->isStaff()) {
            return Inertia::render('Admin/AdminDashboard', AdminDashboardPageResource::make($this->adminPayload($user))->resolve());
        }

        return Inertia::render('Dashboard/UserDashboard', UserDashboardPageResource::make($this->userPayload($user))->resolve());
    }

    private function userPayload(User $user): array
    {
        $orders = ServiceOrder::query()
            ->where('user_id', $user->id)
            ->with(['updates' => static fn (Builder $query) => $query->where('is_public', true)->latest('id')])
            ->latest('id')
            ->limit(60)
            ->get();

        $totalJobs = $orders->count();
        $activeProjects = $orders->whereNotIn('order_status', ['completed', 'cancelled'])->count();
        $completedJobs = $orders->where('order_status', 'completed')->count();

        $uploadedToday = ServiceOrderUpdate::query()
            ->whereDate('created_at', now()->toDateString())
            ->whereHas('serviceOrder', static fn (Builder $query) => $query->where('user_id', $user->id))
            ->count();

        $hasPaidActiveOrder = $orders
            ->where('payment_status', 'paid')
            ->whereNotIn('order_status', ['completed', 'cancelled'])
            ->isNotEmpty();

        $recentProjects = $orders
            ->take(10)
            ->map(function (ServiceOrder $order): array {
                $estimatedDelivery = $order->created_at?->copy()->addDays(7);

                return [
                    'order_id' => (string) ($order->order_code ?: $order->uuid),
                    'description' => trim("{$order->service_name} - {$order->package_name}"),
                    'amount' => (float) $order->amount,
                    'paid_on' => $order->paid_at?->toDateString(),
                    'est_delivery_date' => $estimatedDelivery?->toDateString(),
                    'status' => $order->order_status === 'completed' ? 'delivered' : 'ongoing',
                ];
            })
            ->values()
            ->all();

        $chatThread = LiveChatThread::query()
            ->where('customer_user_id', $user->id)
            ->latest('id')
            ->first();

        $unreadCount = 0;
        if ($chatThread) {
            $unreadCount = $chatThread->messages()
                ->where('sender_type', 'staff')
                ->where('id', '>', (int) ($chatThread->customer_last_read_message_id ?? 0))
                ->count();
        }

        $contactInfo = PlatformSettings::contactInfo();
        $communityUrl = trim((string) ($contactInfo['whatsapp_url'] ?? ''));
        if ($communityUrl === '') {
            $communityUrl = 'https://wa.me/2340000000000';
        }

        $referralMonthly = collect(range(5, 0))
            ->map(function (int $offset) use ($orders): array {
                $pointDate = now()->subMonths($offset);
                $count = $orders->filter(
                    static fn (ServiceOrder $order): bool => $order->created_at?->isSameMonth($pointDate) ?? false
                )->count();

                return [
                    'month' => $pointDate->format('M'),
                    'count' => max(0, (int) floor($count / 2)),
                ];
            })
            ->values()
            ->all();

        return [
            'user' => [
                'id' => (string) ($user->uuid ?: $user->id),
                'uuid' => (string) ($user->uuid ?: $user->id),
                'name' => $user->name,
                'email' => $user->email,
            ],
            'timezone' => 'Africa/Lagos',
            'stats' => [
                'total_jobs' => $totalJobs,
                'active_projects' => $activeProjects,
                'loyalty_emblem' => $this->loyaltyEmblem($completedJobs),
                'uploaded_today' => $uploadedToday,
            ],
            'projects_chart' => $this->userProjectsChart($orders),
            'recent_projects' => $recentProjects,
            'quick_actions' => [
                'order_service_url' => route('orders.create', 'social-media-design'),
                'retainer_url' => route('services').'#retainer',
                'community_url' => $communityUrl,
            ],
            'referral' => [
                'link' => url('/register?ref='.($user->uuid ?: $user->id)),
                'friends_referred' => 0,
                'discount_earned' => round($completedJobs * 15, 2),
                'monthly' => $referralMonthly,
            ],
            'notifications' => [
                'unread_count' => $unreadCount,
            ],
            'has_paid_active_order' => $hasPaidActiveOrder,
        ];
    }

    private function adminPayload(User $user): array
    {
        $today = now()->startOfDay();
        $isSuperAdmin = $user->isSuperAdmin();

        $chatScope = LiveChatThread::query()
            ->when(! $isSuperAdmin, static fn (Builder $query) => $query->where('assigned_staff_id', $user->id));

        $pendingChats = (clone $chatScope)
            ->where('status', 'open')
            ->count();

        $unreadChats = (clone $chatScope)
            ->where('status', 'open')
            ->whereNotNull('last_customer_message_at')
            ->where(function (Builder $query): void {
                $query->whereNull('last_staff_message_at')
                    ->orWhereColumn('last_customer_message_at', '>', 'last_staff_message_at');
            })
            ->count();

        $totalInvoices = Invoice::query()->count();
        $paidInvoiceTotal = (float) Invoice::query()->where('status', 'paid')->sum('amount');
        $pendingInvoiceTotal = (float) Invoice::query()->where('status', 'sent')->sum('amount');
        $totalCustomers = User::query()->where(function (Builder $query): void {
            $query->whereNull('role')->orWhere('role', 'user');
        })->count();

        $openSupportTickets = SupportTicket::query()
            ->where('status', SupportTicket::STATUS_OPEN)
            ->count();

        $kpis = [
            $this->kpiPayload('total_invoice', 'Total Invoice', $totalInvoices),
            $this->kpiPayload('paid_invoice_ngn', 'Paid Invoice (NGN)', $paidInvoiceTotal),
            $this->kpiPayload('pending_invoice_ngn', 'Pending Invoice (NGN)', $pendingInvoiceTotal),
            $this->kpiPayload('pending_chats', 'Pending Chats', $pendingChats),
            $this->kpiPayload('total_customers', 'Total Customers', $totalCustomers),
            $this->kpiPayload('open_support_tickets', 'Open Support Tickets', $openSupportTickets),
        ];

        $revenueSeries = $this->buildRevenueSeries();
        $userGrowth = $this->buildUserGrowthSeries();

        $pendingPayments = ServiceOrder::query()
            ->where('payment_status', '!=', 'paid')
            ->latest('id')
            ->limit(12)
            ->get()
            ->map(static fn (ServiceOrder $order): array => [
                'id' => $order->id,
                'user' => $order->full_name,
                'amount' => (float) $order->amount,
                'method' => strtoupper((string) ($order->payment_provider ?: 'wallet')),
                'date' => $order->created_at?->toDateString() ?: '',
            ])
            ->values()
            ->all();

        $pendingInvoices = ServiceOrder::query()
            ->whereIn('payment_status', ['pending', 'unpaid'])
            ->where('created_at', '<=', now()->subHours(6))
            ->latest('id')
            ->limit(12)
            ->get()
            ->map(static fn (ServiceOrder $order): array => [
                'id' => $order->id,
                'user' => $order->full_name,
                'amount' => (float) $order->amount,
                'wallet' => strtoupper((string) ($order->currency ?: 'USD')),
                'email' => $order->email,
                'date' => $order->created_at?->toDateString() ?: '',
            ])
            ->values()
            ->all();

        $todayOrders = ServiceOrder::query()
            ->whereDate('created_at', $today->toDateString())
            ->get();

        $deliveredToday = $todayOrders->where('order_status', 'completed')->count();
        $totalTradesToday = max(1, $todayOrders->count());
        $remainingToday = max(0, $totalTradesToday - $deliveredToday);
        $winRate = round(($deliveredToday / $totalTradesToday) * 100, 2);

        $leaderboard = ServiceOrder::query()
            ->where('payment_status', 'paid')
            ->selectRaw('email, full_name, SUM(amount) as total_volume, AVG(progress_percent) as avg_progress, COUNT(*) as total_orders')
            ->groupBy('email', 'full_name')
            ->orderByDesc('total_volume')
            ->limit(10)
            ->get()
            ->values()
            ->map(function ($row, int $index): array {
                $name = trim((string) $row->full_name);

                return [
                    'rank' => $index + 1,
                    'name' => $name !== '' ? $name : 'Unnamed Client',
                    'avatar' => strtoupper(substr($name !== '' ? $name : 'U', 0, 1)),
                    'total_volume' => (float) $row->total_volume,
                    'win_rate' => round((float) $row->avg_progress, 2),
                    'total_profit' => round((float) $row->total_volume * 0.12, 2),
                ];
            })
            ->all();

        $staffUsers = User::query()
            ->whereIn('role', [User::ROLE_SUPER_ADMIN, User::ROLE_CUSTOMER_REP, 'admin', 'staff'])
            ->orderBy('name')
            ->get(['id', 'name']);

        $presenceMap = LiveChatStaffPresence::query()
            ->whereIn('user_id', $staffUsers->pluck('id'))
            ->get()
            ->keyBy('user_id');

        $staffPresence = $staffUsers->map(function (User $staff) use ($presenceMap): array {
            $presence = $presenceMap->get($staff->id);
            $lastSeen = $presence?->last_seen_at;

            return [
                'id' => $staff->id,
                'name' => $staff->name,
                'online' => (bool) ($presence?->is_online && $lastSeen?->greaterThan(now()->subMinutes(2))),
                'last_seen_at' => $lastSeen?->toDateTimeString(),
                'open_chats' => LiveChatThread::query()
                    ->where('assigned_staff_id', $staff->id)
                    ->where('status', 'open')
                    ->count(),
            ];
        })->values()->all();

        return [
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ],
            'timezone' => 'Africa/Lagos',
            'notifications' => [
                'unread_chats' => $unreadChats,
            ],
            'kpis' => $kpis,
            'revenue_series' => $revenueSeries,
            'user_growth' => $userGrowth,
            'pending_payments' => $pendingPayments,
            'pending_invoices' => $pendingInvoices,
            'completion' => [
                'total_trades_today' => $totalTradesToday,
                'delivered' => $deliveredToday,
                'remaining' => $remainingToday,
                'win_rate' => $winRate,
                'loss_rate' => round(100 - $winRate, 2),
            ],
            'leaderboard' => $leaderboard,
            'staff_presence' => $staffPresence,
        ];
    }

    private function userProjectsChart(Collection $orders): array
    {
        $points = [];
        $start = now()->subHours(23)->startOfHour();

        for ($i = 0; $i < 24; $i++) {
            $slot = $start->copy()->addHours($i);
            $next = $slot->copy()->addHour();

            $hourOrders = $orders->filter(static fn (ServiceOrder $order): bool => $order->updated_at?->betweenIncluded($slot, $next) ?? false);
            $deliveredCount = $hourOrders->where('order_status', 'completed')->count();
            $activeCount = $hourOrders->whereNotIn('order_status', ['completed', 'cancelled'])->count();
            $progressAverage = (int) round((float) $hourOrders->avg('progress_percent'));

            $points[] = [
                'time' => $slot->format('H:i'),
                'jobs_delivered' => $deliveredCount,
                'estimated_delivery' => max(0, $activeCount),
                'design_value' => (float) $hourOrders->sum('amount'),
                'progress_percent' => max(0, min(100, $progressAverage)),
            ];
        }

        return $points;
    }

    private function loyaltyEmblem(int $completedJobs): string
    {
        if ($completedJobs >= 25) {
            return 'Platinum';
        }

        if ($completedJobs >= 12) {
            return 'Gold';
        }

        if ($completedJobs >= 5) {
            return 'Silver';
        }

        return 'Bronze';
    }

    private function kpiPayload(string $key, string $label, float|int $value): array
    {
        $currentWindowStart = now()->subDays(30)->startOfDay();
        $previousWindowStart = now()->subDays(60)->startOfDay();
        $previousWindowEnd = now()->subDays(30)->startOfDay();

        $current = match ($key) {
            'total_invoice' => Invoice::query()->where('created_at', '>=', $currentWindowStart)->count(),
            'paid_invoice_ngn' => (float) Invoice::query()->where('status', 'paid')->where('created_at', '>=', $currentWindowStart)->sum('amount'),
            'pending_invoice_ngn' => (float) Invoice::query()->where('status', 'sent')->where('created_at', '>=', $currentWindowStart)->sum('amount'),
            'pending_chats' => LiveChatThread::query()->where('status', 'open')->where('created_at', '>=', $currentWindowStart)->count(),
            'total_customers' => User::query()->where(function (Builder $query): void {
                $query->whereNull('role')->orWhere('role', 'user');
            })->where('created_at', '>=', $currentWindowStart)->count(),
            'open_support_tickets' => SupportTicket::query()->where('status', SupportTicket::STATUS_OPEN)->where('created_at', '>=', $currentWindowStart)->count(),
            default => 0,
        };

        $previous = match ($key) {
            'total_invoice' => Invoice::query()->whereBetween('created_at', [$previousWindowStart, $previousWindowEnd])->count(),
            'paid_invoice_ngn' => (float) Invoice::query()->where('status', 'paid')->whereBetween('created_at', [$previousWindowStart, $previousWindowEnd])->sum('amount'),
            'pending_invoice_ngn' => (float) Invoice::query()->where('status', 'sent')->whereBetween('created_at', [$previousWindowStart, $previousWindowEnd])->sum('amount'),
            'pending_chats' => LiveChatThread::query()->where('status', 'open')->whereBetween('created_at', [$previousWindowStart, $previousWindowEnd])->count(),
            'total_customers' => User::query()->where(function (Builder $query): void {
                $query->whereNull('role')->orWhere('role', 'user');
            })->whereBetween('created_at', [$previousWindowStart, $previousWindowEnd])->count(),
            'open_support_tickets' => SupportTicket::query()->where('status', SupportTicket::STATUS_OPEN)->whereBetween('created_at', [$previousWindowStart, $previousWindowEnd])->count(),
            default => 0,
        };

        $changePercent = $previous > 0 ? (($current - $previous) / $previous) * 100 : ($current > 0 ? 100 : 0);

        return [
            'key' => $key,
            'label' => $label,
            'value' => (float) $value,
            'change_percent' => round($changePercent, 2),
            'trend' => $this->kpiTrendLast7Days($key),
        ];
    }

    private function kpiTrendLast7Days(string $key): array
    {
        $trend = [];

        for ($offset = 6; $offset >= 0; $offset--) {
            $day = now()->subDays($offset);
            $date = $day->toDateString();

            $trend[] = match ($key) {
                'total_invoice' => (float) Invoice::query()->whereDate('created_at', $date)->count(),
                'paid_invoice_ngn' => (float) Invoice::query()->where('status', 'paid')->whereDate('created_at', $date)->sum('amount'),
                'pending_invoice_ngn' => (float) Invoice::query()->where('status', 'sent')->whereDate('created_at', $date)->sum('amount'),
                'pending_chats' => (float) LiveChatThread::query()->where('status', 'open')->whereDate('created_at', $date)->count(),
                'total_customers' => (float) User::query()->where(function (Builder $query): void {
                    $query->whereNull('role')->orWhere('role', 'user');
                })->whereDate('created_at', $date)->count(),
                'open_support_tickets' => (float) SupportTicket::query()->where('status', SupportTicket::STATUS_OPEN)->whereDate('created_at', $date)->count(),
                default => 0.0,
            };
        }

        return $trend;
    }

    private function buildRevenueSeries(): array
    {
        $paidInvoices = Invoice::query()
            ->where('status', 'paid')
            ->whereDate('created_at', '>=', now()->subYear()->toDateString())
            ->get(['amount', 'created_at']);

        $allInvoices = Invoice::query()
            ->whereDate('created_at', '>=', now()->subYear()->toDateString())
            ->get(['amount', 'created_at']);

        $series = [];
        for ($offset = 364; $offset >= 0; $offset--) {
            $pointDate = now()->subDays($offset);
            $dateValue = $pointDate->toDateString();

            $dayPaid = $paidInvoices->filter(
                static fn (Invoice $invoice): bool => $invoice->created_at?->toDateString() === $dateValue
            );
            $dayAll = $allInvoices->filter(
                static fn (Invoice $invoice): bool => $invoice->created_at?->toDateString() === $dateValue
            );

            $series[] = [
                'label' => $pointDate->format('M d'),
                'revenue' => (float) $dayPaid->sum('amount'),
                'invoice_volume' => (float) $dayAll->sum('amount'),
                'invoice_count' => $dayAll->count(),
            ];
        }

        return $series;
    }

    private function buildUserGrowthSeries(): array
    {
        $start = now()->subDays(89)->startOfDay();
        $priorTotal = User::query()->where('created_at', '<', $start)->count();

        $dailySignups = User::query()
            ->where('created_at', '>=', $start)
            ->get(['created_at'])
            ->groupBy(static fn (User $user): string => $user->created_at?->toDateString() ?? '');

        $running = $priorTotal;
        $series = [];

        for ($offset = 89; $offset >= 0; $offset--) {
            $pointDate = now()->subDays($offset);
            $dateValue = $pointDate->toDateString();
            $newSignups = $dailySignups->get($dateValue)?->count() ?? 0;
            $running += $newSignups;

            $series[] = [
                'date' => $pointDate->format('M d'),
                'new_signups' => $newSignups,
                'total_users' => $running,
                'is_weekend' => in_array($pointDate->dayOfWeekIso, [6, 7], true),
            ];
        }

        return $series;
    }
}
