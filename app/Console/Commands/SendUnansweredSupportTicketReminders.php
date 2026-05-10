<?php

namespace App\Console\Commands;

use App\Mail\SupportTicketUnansweredReminderMail;
use App\Models\SupportTicket;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

class SendUnansweredSupportTicketReminders extends Command
{
    protected $signature = 'support-tickets:send-unanswered-reminders {--dry-run : Preview reminders without sending emails}';

    protected $description = 'Send reminder emails for support tickets awaiting staff replies';

    public function handle(): int
    {
        $waitHours = max(1, (int) config('bellah.support.unanswered_reminder_after_hours', 24));
        $recurrenceHours = max(1, (int) config('bellah.support.reminder_recurrence_hours', 24));
        $maxReminders = max(1, (int) config('bellah.support.max_unanswered_reminders', 7));

        $cutoff = now()->subHours($waitHours);
        $resendCutoff = now()->subHours($recurrenceHours);

        $tickets = SupportTicket::query()
            ->with('user:id,name,email')
            ->where('status', SupportTicket::STATUS_OPEN)
            ->whereNotNull('last_customer_reply_at')
            ->where('last_customer_reply_at', '<=', $cutoff)
            ->where(function (Builder $query): void {
                $query
                    ->whereNull('last_staff_reply_at')
                    ->orWhereColumn('last_customer_reply_at', '>', 'last_staff_reply_at');
            })
            ->where('reminder_count', '<', $maxReminders)
            ->where(function (Builder $query) use ($resendCutoff): void {
                $query
                    ->whereNull('last_reminder_sent_at')
                    ->orWhere('last_reminder_sent_at', '<=', $resendCutoff);
            })
            ->orderBy('id')
            ->get();

        if ($tickets->isEmpty()) {
            $this->info('No unanswered support tickets require reminders right now.');

            return self::SUCCESS;
        }

        $adminRecipients = $this->adminRecipients();
        if ($adminRecipients === []) {
            $this->warn('No support recipients configured. Skipping reminder emails.');

            return self::SUCCESS;
        }

        $isDryRun = (bool) $this->option('dry-run');
        $sentCount = 0;
        $failedCount = 0;

        foreach ($tickets as $ticket) {
            if ($isDryRun) {
                $this->line(sprintf(
                    '[DRY RUN] Ticket %s => reminders:%d to %s',
                    $ticket->ticket_number,
                    (int) $ticket->reminder_count + 1,
                    implode(', ', $adminRecipients),
                ));

                continue;
            }

            try {
                Mail::to($adminRecipients)->send(new SupportTicketUnansweredReminderMail($ticket));

                $ticket->forceFill([
                    'reminder_count' => (int) $ticket->reminder_count + 1,
                    'last_reminder_sent_at' => now(),
                ])->save();

                $sentCount++;
            } catch (Throwable $exception) {
                $failedCount++;

                Log::warning('Support ticket unanswered reminder failed.', [
                    'ticket_id' => $ticket->id,
                    'ticket_number' => $ticket->ticket_number,
                    'error' => $exception->getMessage(),
                ]);
            }
        }

        if ($isDryRun) {
            $this->info(sprintf('Dry run complete. %d ticket(s) matched.', $tickets->count()));

            return self::SUCCESS;
        }

        $this->info(sprintf('Reminder job finished. Sent: %d. Failed: %d.', $sentCount, $failedCount));

        return $failedCount > 0 ? self::FAILURE : self::SUCCESS;
    }

    /**
     * @return array<int, string>
     */
    private function adminRecipients(): array
    {
        $configured = (array) config('bellah.support.admin_notification_emails', []);
        $recipients = array_values(array_unique(array_filter(array_map(
            static fn (mixed $email): string => strtolower(trim((string) $email)),
            $configured,
        ))));

        if ($recipients !== []) {
            return $recipients;
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
