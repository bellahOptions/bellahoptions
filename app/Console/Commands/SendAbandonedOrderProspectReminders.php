<?php

namespace App\Console\Commands;

use App\Mail\AbandonedOrderProspectAdminAlertMail;
use App\Mail\AbandonedOrderProspectReminderMail;
use App\Models\OrderProspect;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

class SendAbandonedOrderProspectReminders extends Command
{
    protected $signature = 'prospects:send-abandoned-order-reminders {--dry-run : Preview reminder candidates without sending}';

    protected $description = 'Send reminder emails for abandoned guest order drafts and notify admins';

    public function handle(): int
    {
        $abandonAfterHours = max(1, (int) config('bellah.prospects.abandon_after_hours', 24));
        $cutoff = now()->subHours($abandonAfterHours);
        $dryRun = (bool) $this->option('dry-run');

        $prospects = OrderProspect::query()
            ->where('status', OrderProspect::STATUS_ACTIVE)
            ->whereNotNull('last_activity_at')
            ->where('last_activity_at', '<=', $cutoff)
            ->where(function (Builder $query): void {
                $query
                    ->whereNull('converted_at')
                    ->orWhereNull('service_order_id');
            })
            ->orderBy('id')
            ->get();

        if ($prospects->isEmpty()) {
            $this->info('No abandoned order prospects found.');

            return self::SUCCESS;
        }

        $adminRecipients = $this->adminRecipients();
        $sentReminders = 0;
        $sentAdminAlerts = 0;
        $failed = 0;

        foreach ($prospects as $prospect) {
            $resumeUrl = route('orders.create', $prospect->service_slug).($prospect->service_package ? ('?package='.$prospect->service_package) : '');

            if ($dryRun) {
                $this->line(sprintf(
                    '[DRY RUN] Prospect %s | email=%s | service=%s',
                    $prospect->uuid,
                    (string) ($prospect->email ?: 'N/A'),
                    (string) $prospect->service_slug,
                ));

                continue;
            }

            try {
                if ($prospect->reminder_sent_at === null && filled($prospect->email)) {
                    Mail::to((string) $prospect->email)->send(new AbandonedOrderProspectReminderMail($prospect, $resumeUrl));
                    $prospect->reminder_sent_at = now();
                    $sentReminders++;
                }

                if ($prospect->admin_notified_at === null && $adminRecipients !== []) {
                    Mail::to($adminRecipients)->send(new AbandonedOrderProspectAdminAlertMail($prospect, $resumeUrl));
                    $prospect->admin_notified_at = now();
                    $sentAdminAlerts++;
                }

                $prospect->status = OrderProspect::STATUS_ABANDONED;
                $prospect->abandoned_at = $prospect->abandoned_at ?? now();
                $prospect->save();
            } catch (Throwable $exception) {
                $failed++;

                Log::warning('Abandoned order prospect follow-up failed.', [
                    'prospect_id' => $prospect->id,
                    'prospect_uuid' => $prospect->uuid,
                    'error' => $exception->getMessage(),
                ]);
            }
        }

        if ($dryRun) {
            $this->info(sprintf('Dry run complete. %d prospect(s) matched.', $prospects->count()));

            return self::SUCCESS;
        }

        $this->info(sprintf(
            'Prospect follow-up complete. Reminders: %d | Admin alerts: %d | Failed: %d',
            $sentReminders,
            $sentAdminAlerts,
            $failed,
        ));

        return $failed > 0 ? self::FAILURE : self::SUCCESS;
    }

    /**
     * @return array<int, string>
     */
    private function adminRecipients(): array
    {
        $configured = (array) config('bellah.prospects.admin_notification_emails', []);
        $configured = array_values(array_unique(array_filter(array_map(
            static fn (mixed $email): string => strtolower(trim((string) $email)),
            $configured,
        ))));

        if ($configured !== []) {
            return $configured;
        }

        return User::query()
            ->whereIn('role', [User::ROLE_SUPER_ADMIN, User::ROLE_CUSTOMER_REP, 'admin', 'staff'])
            ->whereNotNull('email')
            ->pluck('email')
            ->map(static fn (string $email): string => strtolower(trim($email)))
            ->filter(static fn (string $email): bool => $email !== '')
            ->unique()
            ->values()
            ->all();
    }
}
