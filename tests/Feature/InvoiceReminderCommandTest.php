<?php

namespace Tests\Feature;

use App\Mail\InvoiceReminderMail;
use App\Models\Invoice;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class InvoiceReminderCommandTest extends TestCase
{
    use RefreshDatabase;

    public function test_command_sends_automatic_reminder_for_eligible_unpaid_invoice(): void
    {
        Mail::fake();

        $staff = User::factory()->create([
            'role' => 'staff',
        ]);

        $invoice = $this->createInvoice([
            'created_by' => $staff->id,
            'issued_at' => now()->subDays(2),
            'automatic_reminders_sent' => 0,
            'status' => 'sent',
        ]);

        $this->artisan('invoices:send-reminders')->assertExitCode(0);

        Mail::assertSent(InvoiceReminderMail::class, function (InvoiceReminderMail $mail) use ($invoice): bool {
            return $mail->invoice->id === $invoice->id
                && $mail->isAutomatic === true
                && $mail->reminderNumber === 1;
        });

        $invoice->refresh();

        $this->assertSame(1, $invoice->automatic_reminders_sent);
        $this->assertNotNull($invoice->last_automatic_reminder_sent_at);
    }

    public function test_command_skips_paid_maxed_and_recently_reminded_invoices(): void
    {
        Mail::fake();

        $staff = User::factory()->create([
            'role' => 'staff',
        ]);

        $paidInvoice = $this->createInvoice([
            'created_by' => $staff->id,
            'status' => 'paid',
            'automatic_reminders_sent' => 0,
            'issued_at' => now()->subDays(3),
        ]);

        $maxedInvoice = $this->createInvoice([
            'invoice_number' => '201',
            'created_by' => $staff->id,
            'status' => 'sent',
            'automatic_reminders_sent' => 13,
            'issued_at' => now()->subDays(10),
        ]);

        $recentInvoice = $this->createInvoice([
            'invoice_number' => '202',
            'created_by' => $staff->id,
            'status' => 'sent',
            'automatic_reminders_sent' => 2,
            'issued_at' => now()->subDays(5),
            'last_automatic_reminder_sent_at' => now()->subHours(8),
        ]);

        $this->artisan('invoices:send-reminders')->assertExitCode(0);

        Mail::assertNothingSent();

        $paidInvoice->refresh();
        $maxedInvoice->refresh();
        $recentInvoice->refresh();

        $this->assertSame(0, $paidInvoice->automatic_reminders_sent);
        $this->assertSame(13, $maxedInvoice->automatic_reminders_sent);
        $this->assertSame(2, $recentInvoice->automatic_reminders_sent);
    }

    public function test_staff_can_send_manual_invoice_reminder(): void
    {
        Mail::fake();

        $staff = User::factory()->create([
            'role' => 'staff',
        ]);

        $invoice = $this->createInvoice([
            'created_by' => $staff->id,
            'status' => 'sent',
            'automatic_reminders_sent' => 3,
        ]);

        $response = $this->actingAs($staff)
            ->from(route('admin.invoices.index'))
            ->post(route('admin.invoices.remind', $invoice));

        $response->assertRedirect(route('admin.invoices.index'));

        Mail::assertSent(InvoiceReminderMail::class, function (InvoiceReminderMail $mail) use ($invoice): bool {
            return $mail->invoice->id === $invoice->id
                && $mail->isAutomatic === false
                && $mail->reminderNumber === 3;
        });

        $invoice->refresh();

        $this->assertSame(3, $invoice->automatic_reminders_sent);
        $this->assertNotNull($invoice->last_manual_reminder_sent_at);
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    private function createInvoice(array $overrides = []): Invoice
    {
        return Invoice::create(array_merge([
            'invoice_number' => '200',
            'customer_name' => 'Reminder User',
            'customer_email' => 'reminder@example.com',
            'customer_occupation' => 'Engineer',
            'title' => 'Reminder Test Invoice',
            'description' => 'Testing reminders',
            'amount' => 1200,
            'currency' => 'NGN',
            'status' => 'sent',
            'issued_at' => now()->subDays(2),
            'created_by' => User::factory()->create()->id,
            'automatic_reminders_sent' => 0,
            'last_automatic_reminder_sent_at' => null,
            'last_manual_reminder_sent_at' => null,
        ], $overrides));
    }
}
