<?php

namespace App\Http\Resources\Dashboard;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AdminDashboardPageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $data = is_array($this->resource) ? $this->resource : [];

        return [
            'user' => [
                'id' => (int) ($data['user']['id'] ?? 0),
                'name' => (string) ($data['user']['name'] ?? ''),
                'email' => (string) ($data['user']['email'] ?? ''),
            ],
            'timezone' => (string) ($data['timezone'] ?? 'Africa/Lagos'),
            'notifications' => [
                'unread_chats' => (int) ($data['notifications']['unread_chats'] ?? 0),
            ],
            'kpis' => array_values(array_map(static fn ($kpi): array => [
                'key' => (string) ($kpi['key'] ?? ''),
                'label' => (string) ($kpi['label'] ?? ''),
                'value' => (float) ($kpi['value'] ?? 0),
                'change_percent' => (float) ($kpi['change_percent'] ?? 0),
                'trend' => array_values(array_map(static fn ($value): float => (float) $value, is_array($kpi['trend'] ?? null) ? $kpi['trend'] : [])),
            ], is_array($data['kpis'] ?? null) ? $data['kpis'] : [])),
            'revenue_series' => array_values(array_map(static fn ($item): array => [
                'label' => (string) ($item['label'] ?? ''),
                'revenue' => (float) ($item['revenue'] ?? 0),
                'invoice_volume' => (float) ($item['invoice_volume'] ?? 0),
                'invoice_count' => (int) ($item['invoice_count'] ?? 0),
            ], is_array($data['revenue_series'] ?? null) ? $data['revenue_series'] : [])),
            'user_growth' => array_values(array_map(static fn ($item): array => [
                'date' => (string) ($item['date'] ?? ''),
                'new_signups' => (int) ($item['new_signups'] ?? 0),
                'total_users' => (int) ($item['total_users'] ?? 0),
                'is_weekend' => (bool) ($item['is_weekend'] ?? false),
            ], is_array($data['user_growth'] ?? null) ? $data['user_growth'] : [])),
            'pending_payments' => array_values(array_map(static fn ($item): array => [
                'id' => (int) ($item['id'] ?? 0),
                'user' => (string) ($item['user'] ?? ''),
                'amount' => (float) ($item['amount'] ?? 0),
                'method' => (string) ($item['method'] ?? ''),
                'date' => (string) ($item['date'] ?? ''),
            ], is_array($data['pending_payments'] ?? null) ? $data['pending_payments'] : [])),
            'pending_invoices' => array_values(array_map(static fn ($item): array => [
                'id' => (int) ($item['id'] ?? 0),
                'user' => (string) ($item['user'] ?? ''),
                'amount' => (float) ($item['amount'] ?? 0),
                'wallet' => (string) ($item['wallet'] ?? ''),
                'email' => (string) ($item['email'] ?? ''),
                'date' => (string) ($item['date'] ?? ''),
            ], is_array($data['pending_invoices'] ?? null) ? $data['pending_invoices'] : [])),
            'completion' => [
                'total_trades_today' => (int) ($data['completion']['total_trades_today'] ?? 0),
                'delivered' => (int) ($data['completion']['delivered'] ?? 0),
                'remaining' => (int) ($data['completion']['remaining'] ?? 0),
                'win_rate' => (float) ($data['completion']['win_rate'] ?? 0),
                'loss_rate' => (float) ($data['completion']['loss_rate'] ?? 0),
            ],
            'leaderboard' => array_values(array_map(static fn ($client): array => [
                'rank' => (int) ($client['rank'] ?? 0),
                'name' => (string) ($client['name'] ?? ''),
                'avatar' => (string) ($client['avatar'] ?? ''),
                'total_volume' => (float) ($client['total_volume'] ?? 0),
                'win_rate' => (float) ($client['win_rate'] ?? 0),
                'total_profit' => (float) ($client['total_profit'] ?? 0),
            ], is_array($data['leaderboard'] ?? null) ? $data['leaderboard'] : [])),
            'staff_presence' => array_values(array_map(static fn ($staff): array => [
                'id' => (int) ($staff['id'] ?? 0),
                'name' => (string) ($staff['name'] ?? ''),
                'online' => (bool) ($staff['online'] ?? false),
                'last_seen_at' => $staff['last_seen_at'] ? (string) $staff['last_seen_at'] : null,
                'open_chats' => (int) ($staff['open_chats'] ?? 0),
            ], is_array($data['staff_presence'] ?? null) ? $data['staff_presence'] : [])),
        ];
    }
}
