<?php

namespace App\Console\Commands;

use App\Mail\InvoiceReminderMail;
use App\Models\Invoice;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

class SendUnpaidInvoiceReminders extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'invoices:send-reminders {--dry-run : Preview reminders without sending emails}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Send daily reminder emails for unpaid invoices up to 13 times';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $cutoff = now()->subDay();

        $invoices = Invoice::query()
            ->where('status', 'sent')
            ->where('automatic_reminders_sent', '<', 13)
            ->where(function ($query) use ($cutoff): void {
                $query
                    ->where(function ($subQuery) use ($cutoff): void {
                        $subQuery
                            ->whereNotNull('last_automatic_reminder_sent_at')
                            ->where('last_automatic_reminder_sent_at', '<=', $cutoff);
                    })
                    ->orWhere(function ($subQuery) use ($cutoff): void {
                        $subQuery
                            ->whereNull('last_automatic_reminder_sent_at')
                            ->where(function ($timingQuery) use ($cutoff): void {
                                $timingQuery
                                    ->where(function ($issuedQuery) use ($cutoff): void {
                                        $issuedQuery
                                            ->whereNotNull('issued_at')
                                            ->where('issued_at', '<=', $cutoff);
                                    })
                                    ->orWhere(function ($createdQuery) use ($cutoff): void {
                                        $createdQuery
                                            ->whereNull('issued_at')
                                            ->where('created_at', '<=', $cutoff);
                                    });
                            });
                    });
            })
            ->orderBy('id')
            ->get();

        if ($invoices->isEmpty()) {
            $this->info('No unpaid invoices are due for reminders right now.');

            return self::SUCCESS;
        }

        $isDryRun = (bool) $this->option('dry-run');
        $sentCount = 0;
        $failedCount = 0;

        foreach ($invoices as $invoice) {
            $reminderNumber = $invoice->automatic_reminders_sent + 1;

            if ($isDryRun) {
                $this->line(sprintf(
                    '[DRY RUN] Invoice %s => reminder %d/13 to %s',
                    $invoice->invoice_number,
                    $reminderNumber,
                    $invoice->customer_email,
                ));

                continue;
            }

            try {
                Mail::to($invoice->customer_email)->send(
                    new InvoiceReminderMail($invoice, true, $reminderNumber),
                );

                $invoice->update([
                    'automatic_reminders_sent' => $reminderNumber,
                    'last_automatic_reminder_sent_at' => now(),
                ]);

                $sentCount++;
            } catch (Throwable $exception) {
                $failedCount++;

                Log::warning('Automatic invoice reminder failed.', [
                    'invoice_id' => $invoice->id,
                    'invoice_number' => $invoice->invoice_number,
                    'customer_email' => $invoice->customer_email,
                    'error' => $exception->getMessage(),
                ]);
            }
        }

        if ($isDryRun) {
            $this->info(sprintf('Dry run complete. %d reminder(s) matched.', $invoices->count()));

            return self::SUCCESS;
        }

        $this->info(sprintf(
            'Reminder job finished. Sent: %d. Failed: %d.',
            $sentCount,
            $failedCount,
        ));

        return $failedCount > 0 ? self::FAILURE : self::SUCCESS;
    }
}
