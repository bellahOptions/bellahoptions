<?php

namespace App\Http\Resources\Dashboard;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserDashboardPageResource extends JsonResource
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
            'stats' => [
                'total_jobs' => (int) ($data['stats']['total_jobs'] ?? 0),
                'active_projects' => (int) ($data['stats']['active_projects'] ?? 0),
                'loyalty_emblem' => (string) ($data['stats']['loyalty_emblem'] ?? 'Starter'),
                'uploaded_today' => (int) ($data['stats']['uploaded_today'] ?? 0),
            ],
            'projects_chart' => array_values(array_map(static fn ($point): array => [
                'time' => (string) ($point['time'] ?? ''),
                'jobs_delivered' => (int) ($point['jobs_delivered'] ?? 0),
                'estimated_delivery' => (int) ($point['estimated_delivery'] ?? 0),
                'design_value' => (float) ($point['design_value'] ?? 0),
                'progress_percent' => (int) ($point['progress_percent'] ?? 0),
            ], is_array($data['projects_chart'] ?? null) ? $data['projects_chart'] : [])),
            'recent_projects' => array_values(array_map(static fn ($project): array => [
                'order_id' => (string) ($project['order_id'] ?? ''),
                'description' => (string) ($project['description'] ?? ''),
                'amount' => (float) ($project['amount'] ?? 0),
                'paid_on' => $project['paid_on'] ? (string) $project['paid_on'] : null,
                'est_delivery_date' => $project['est_delivery_date'] ? (string) $project['est_delivery_date'] : null,
                'status' => (string) ($project['status'] ?? 'ongoing'),
            ], is_array($data['recent_projects'] ?? null) ? $data['recent_projects'] : [])),
            'quick_actions' => [
                'order_service_url' => (string) ($data['quick_actions']['order_service_url'] ?? ''),
                'retainer_url' => (string) ($data['quick_actions']['retainer_url'] ?? ''),
                'community_url' => (string) ($data['quick_actions']['community_url'] ?? ''),
            ],
            'referral' => [
                'link' => (string) ($data['referral']['link'] ?? ''),
                'friends_referred' => (int) ($data['referral']['friends_referred'] ?? 0),
                'discount_earned' => (float) ($data['referral']['discount_earned'] ?? 0),
                'monthly' => array_values(array_map(static fn ($month): array => [
                    'month' => (string) ($month['month'] ?? ''),
                    'count' => (int) ($month['count'] ?? 0),
                ], is_array($data['referral']['monthly'] ?? null) ? $data['referral']['monthly'] : [])),
            ],
            'notifications' => [
                'unread_count' => (int) ($data['notifications']['unread_count'] ?? 0),
            ],
            'has_paid_active_order' => (bool) ($data['has_paid_active_order'] ?? false),
        ];
    }
}
