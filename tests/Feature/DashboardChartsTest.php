<?php

namespace Tests\Feature;

use App\Models\Invoice;
use App\Models\ServiceOrder;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/**
 * Charts on the dashboards.
 *
 * The controllers have always computed `revenue_series`, `user_growth`,
 * `projects_chart`, `referral.monthly` and each KPI's 7-day `trend`, but nothing
 * rendered them — the dashboards were tables and numbers. These tests pin the
 * contract the chart components consume, so a rename on either side fails loudly
 * instead of silently producing an empty graph.
 */
class DashboardChartsTest extends TestCase
{
    use RefreshDatabase;

    private function superAdmin(): User
    {
        return User::factory()->create(['role' => User::ROLE_SUPER_ADMIN]);
    }

    public function test_admin_dashboard_exposes_every_series_the_charts_need(): void
    {
        $response = $this->actingAs($this->superAdmin())->get(route('dashboard'))->assertOk();

        $response->assertInertia(fn (Assert $page) => $page
            ->component('Admin/AdminDashboard')
            ->has('revenue_series', 365)
            ->has('user_growth', 90)
            ->has('completion')
        );

        $props = $response->viewData('page')['props'];

        // Shape assertions live here rather than in nested ->has() calls, because
        // the fluent helper rejects any extra key and these series legitimately
        // carry more fields than the chart reads.
        $this->assertSame(
            ['label', 'revenue', 'invoice_volume', 'invoice_count'],
            array_keys($props['revenue_series'][0]),
        );
        $this->assertSame(
            ['date', 'new_signups', 'total_users', 'is_weekend'],
            array_keys($props['user_growth'][0]),
        );
        $this->assertArrayHasKey('delivered', $props['completion']);
        $this->assertArrayHasKey('remaining', $props['completion']);
        $this->assertArrayHasKey('win_rate', $props['completion']);
    }

    public function test_every_kpi_carries_a_seven_day_trend_for_its_sparkline(): void
    {
        $this->actingAs($this->superAdmin())
            ->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(function (Assert $page): void {
                $kpis = $page->toArray()['props']['kpis'];

                $this->assertNotEmpty($kpis);

                foreach ($kpis as $kpi) {
                    $this->assertArrayHasKey('trend', $kpi, "KPI {$kpi['key']} is missing its trend series.");
                    $this->assertCount(7, $kpi['trend'], "KPI {$kpi['key']} trend should be 7 points.");
                    $this->assertArrayHasKey('change_percent', $kpi);
                }
            });
    }

    public function test_admin_revenue_series_reflects_a_paid_invoice(): void
    {
        $admin = $this->superAdmin();

        Invoice::query()->create([
            'invoice_number' => 'BO-CHART-0001',
            'customer_name' => 'Chart Tester',
            'customer_email' => 'chart@example.com',
            'title' => 'Chart Test Invoice',
            'description' => 'Invoice created to exercise the revenue chart.',
            'amount' => 150000,
            'currency' => 'NGN',
            'status' => 'paid',
            'issued_at' => now(),
            'created_by' => $admin->id,
        ]);

        $response = $this->actingAs($admin)->get(route('dashboard'))->assertOk();

        $series = $response->viewData('page')['props']['revenue_series'];

        // The final point is today.
        $today = end($series);

        $this->assertGreaterThan(0, $today['revenue']);
        $this->assertSame(150000.0, (float) $today['revenue']);
    }

    public function test_admin_charts_degrade_to_empty_series_on_a_fresh_install(): void
    {
        // A brand new install has no invoices or signups beyond the admin. The
        // pages must still render, with the chart components showing their empty
        // state rather than a broken axis.
        $this->actingAs($this->superAdmin())
            ->get(route('dashboard'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('revenue_series', 365)
                ->has('user_growth', 90)
            );
    }

    public function test_user_dashboard_exposes_project_and_referral_series(): void
    {
        $user = User::factory()->create(['role' => 'user']);

        $response = $this->actingAs($user)->get(route('dashboard'))->assertOk();

        $response->assertInertia(fn (Assert $page) => $page
            ->component('Dashboard/UserDashboard')
            ->has('projects_chart', 24)
            ->has('referral.monthly', 6)
            ->has('stats.total_jobs')
            ->has('stats.active_projects')
        );

        $props = $response->viewData('page')['props'];

        $this->assertSame(
            ['time', 'jobs_delivered', 'estimated_delivery', 'design_value', 'progress_percent'],
            array_keys($props['projects_chart'][0]),
        );
        $this->assertSame(['month', 'count'], array_keys($props['referral']['monthly'][0]));
    }

    public function test_user_projects_chart_counts_a_delivered_order(): void
    {
        $user = User::factory()->create(['role' => 'user']);

        ServiceOrder::query()->create([
            'uuid' => (string) \Illuminate\Support\Str::uuid(),
            'user_id' => $user->id,
            'service_slug' => 'social-media-design',
            'service_name' => 'Social Media Design',
            'package_code' => 'starter',
            'package_name' => 'Starter Plan',
            'full_name' => $user->name ?: 'Chart Tester',
            'business_name' => 'Chart Test Co',
            'email' => $user->email,
            'project_summary' => 'Order created to exercise the dashboard activity chart.',
            'order_status' => 'completed',
            'payment_status' => 'paid',
            'amount' => 50000,
            'currency' => 'NGN',
        ]);

        $response = $this->actingAs($user)->get(route('dashboard'))->assertOk();

        $chart = $response->viewData('page')['props']['projects_chart'];

        $this->assertCount(24, $chart);
        $this->assertGreaterThan(
            0,
            array_sum(array_column($chart, 'jobs_delivered')),
            'A completed order should appear in the activity chart.',
        );
    }

    public function test_staff_sees_the_admin_dashboard_and_customers_see_theirs(): void
    {
        $this->actingAs($this->superAdmin())
            ->get(route('dashboard'))
            ->assertInertia(fn (Assert $page) => $page->component('Admin/AdminDashboard'));

        $customer = User::factory()->create(['role' => 'user']);

        $this->actingAs($customer)
            ->get(route('dashboard'))
            ->assertInertia(fn (Assert $page) => $page->component('Dashboard/UserDashboard'));
    }
}
