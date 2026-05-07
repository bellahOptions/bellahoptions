<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\MarkInvoicePaidRequest;
use App\Http\Requests\Admin\StoreInvoiceRequest;
use App\Mail\InvoiceIssuedAdminAlertMail;
use App\Mail\InvoiceIssuedMail;
use App\Mail\InvoicePaidReceiptMail;
use App\Mail\InvoiceReminderMail;
use App\Models\Customer;
use App\Models\Invoice;
use App\Support\ClientReviewService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class InvoiceController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless((bool) $request->user()?->canManageInvoices(), 403);

        $search = trim((string) $request->query('search', ''));
        $status = trim((string) $request->query('status', ''));

        $query = Invoice::query()
            ->with('creator:id,name')
            ->latest('id');

        if ($search !== '') {
            $query->where(function ($searchQuery) use ($search): void {
                $like = '%'.$search.'%';

                $searchQuery
                    ->where('invoice_number', 'like', $like)
                    ->orWhere('customer_name', 'like', $like)
                    ->orWhere('customer_email', 'like', $like)
                    ->orWhere('title', 'like', $like);
            });
        }

        if (in_array($status, ['sent', 'paid'], true)) {
            $query->where('status', $status);
        }

        $invoices = $query
            ->paginate(20)
            ->through(fn (Invoice $invoice): array => $this->mapInvoice($invoice))
            ->withQueryString();

        return Inertia::render('Admin/Invoices/Index', [
            'filters' => [
                'search' => $search,
                'status' => $status,
            ],
            'permissions' => [
                'can_delete_invoices' => (bool) $request->user()?->isSuperAdmin(),
            ],
            'stats' => [
                'total_invoices' => Invoice::count(),
                'pending_invoices' => Invoice::where('status', 'sent')->count(),
                'paid_invoices' => Invoice::where('status', 'paid')->count(),
                'pending_total' => Invoice::where('status', 'sent')->sum('amount'),
                'paid_total' => Invoice::where('status', 'paid')->sum('amount'),
            ],
            'invoices' => $invoices,
        ]);
    }

    public function show(Request $request, Invoice $invoice): Response
    {
        abort_unless((bool) $request->user()?->canManageInvoices(), 403);

        $invoice->load('creator:id,name', 'customer:id,name,first_name,last_name,email,occupation,phone,company,address,notes');

        return Inertia::render('Admin/Invoices/Show', [
            'permissions' => [
                'can_delete_invoices' => (bool) $request->user()?->isSuperAdmin(),
            ],
            'invoice' => $this->mapInvoice($invoice, true),
        ]);
    }

    public function store(StoreInvoiceRequest $request): RedirectResponse
    {
        $data = $request->validated();
        $customer = null;

        if (isset($data['customer_id'])) {
            $customer = Customer::query()->findOrFail($data['customer_id']);
        } else {
            $customer = $this->resolveOrCreateCustomerFromInvoiceInput($data, $request->user()->id);
        }

        $customerName = $customer?->name;
        $invoice = null;

        if ($customer && blank($customerName)) {
            $customerName = trim("{$customer->first_name} {$customer->last_name}");
        }

        $customerEmail = $customer?->email ?? strtolower((string) $data['customer_email']);
        $guardKey = $this->makeInvoiceTriggerGuardKey(
            'issue',
            (int) $request->user()->id,
            $customerEmail,
            (string) $data['title'],
            (string) $data['amount'],
            strtoupper((string) $data['currency']),
        );

        if (! Cache::add($guardKey, now()->timestamp, now()->addSeconds(12))) {
            return back()->with('error', 'Duplicate invoice trigger detected. Please wait a moment before trying again.');
        }

        try {
            $invoice = Invoice::create([
                'invoice_number' => $this->generateInvoiceNumber(),
                'customer_id' => $customer?->id,
                'customer_name' => $customerName ?: $data['customer_name'],
                'customer_email' => $customerEmail,
                'customer_occupation' => $customer?->occupation ?? ($data['customer_occupation'] ?? null),
                'title' => $data['title'],
                'description' => $data['description'] ?? null,
                'amount' => $data['amount'],
                'currency' => strtoupper($data['currency']),
                'due_date' => $data['due_date'] ?? null,
                'status' => 'sent',
                'issued_at' => now(),
                'created_by' => $request->user()->id,
            ]);

            Mail::to($invoice->customer_email)->send(new InvoiceIssuedMail($invoice));
        } catch (Throwable $exception) {
            Cache::forget($guardKey);

            Log::warning('Invoice email failed.', [
                'invoice_id' => $invoice->id ?? null,
                'customer_email' => $customerEmail,
                'error' => $exception->getMessage(),
            ]);

            return back()->with('error', 'Invoice creation succeeded, but email delivery failed.');
        }

        try {
            $this->sendInvoiceIssuedAdminAlert($invoice, 'issued');
        } catch (Throwable $exception) {
            Log::warning('Invoice admin alert failed.', [
                'invoice_id' => $invoice->id,
                'customer_email' => $invoice->customer_email,
                'error' => $exception->getMessage(),
            ]);
        }

        return back()->with('success', "Invoice {$invoice->invoice_number} created and emailed successfully.");
    }

    public function resend(Invoice $invoice): RedirectResponse
    {
        $guardKey = $this->makeInvoiceTriggerGuardKey('resend', (string) $invoice->id);

        if (! Cache::add($guardKey, now()->timestamp, now()->addSeconds(12))) {
            return back()->with('error', 'Duplicate resend trigger detected. Please wait a moment before trying again.');
        }

        try {
            Mail::to($invoice->customer_email)->send(new InvoiceIssuedMail($invoice));
        } catch (Throwable $exception) {
            Cache::forget($guardKey);

            Log::warning('Invoice resend failed.', [
                'invoice_id' => $invoice->id,
                'customer_email' => $invoice->customer_email,
                'error' => $exception->getMessage(),
            ]);

            return back()->with('error', 'Invoice resend failed. Check mail configuration.');
        }

        try {
            $this->sendInvoiceIssuedAdminAlert($invoice, 'resent');
        } catch (Throwable $exception) {
            Log::warning('Invoice resend admin alert failed.', [
                'invoice_id' => $invoice->id,
                'customer_email' => $invoice->customer_email,
                'error' => $exception->getMessage(),
            ]);
        }

        return back()->with('success', "Invoice {$invoice->invoice_number} resent to {$invoice->customer_email}.");
    }

    public function sendReminder(Invoice $invoice): RedirectResponse
    {
        if ($invoice->status === 'paid') {
            return back()->with('success', "Invoice {$invoice->invoice_number} is already paid.");
        }

        $reminderNumber = max(1, (int) $invoice->automatic_reminders_sent);
        $trackingUpdated = false;

        try {
            Mail::to($invoice->customer_email)->send(new InvoiceReminderMail($invoice, false, $reminderNumber));

            if (Schema::hasColumn('invoices', 'last_manual_reminder_sent_at')) {
                $invoice->update([
                    'last_manual_reminder_sent_at' => now(),
                ]);

                $trackingUpdated = true;
            } else {
                Log::warning('Manual reminder timestamp column is missing on invoices table.', [
                    'invoice_id' => $invoice->id,
                    'invoice_number' => $invoice->invoice_number,
                ]);
            }
        } catch (Throwable $exception) {
            Log::warning('Manual invoice reminder failed.', [
                'invoice_id' => $invoice->id,
                'customer_email' => $invoice->customer_email,
                'error' => $exception->getMessage(),
            ]);

            return back()->with('error', 'Invoice reminder failed. Check mail configuration.');
        }

        if (! $trackingUpdated) {
            return back()->with('success', "Reminder sent to {$invoice->customer_email}, but reminder tracking is unavailable until migrations are synced.");
        }

        return back()->with('success', "Reminder sent to {$invoice->customer_email}.");
    }

    public function markPaid(
        MarkInvoicePaidRequest $request,
        Invoice $invoice,
        ClientReviewService $clientReviewService
    ): RedirectResponse
    {
        if ($invoice->status === 'paid') {
            return back()->with('success', "Invoice {$invoice->invoice_number} is already marked as paid.");
        }

        $invoice->update([
            'status' => 'paid',
            'paid_at' => now(),
            'payment_reference' => $request->validated('payment_reference'),
        ]);

        $receiptDeliveryFailed = false;

        try {
            Mail::to($invoice->customer_email)->send(new InvoicePaidReceiptMail($invoice->fresh()));
        } catch (Throwable $exception) {
            $receiptDeliveryFailed = true;

            Log::warning('Invoice receipt email failed.', [
                'invoice_id' => $invoice->id,
                'customer_email' => $invoice->customer_email,
                'error' => $exception->getMessage(),
            ]);
        }

        $clientReviewService->requestFromInvoice($invoice->fresh());

        if ($receiptDeliveryFailed) {
            return back()->with('success', "Invoice {$invoice->invoice_number} marked as paid, but receipt email failed.");
        }

        return back()->with('success', "Invoice {$invoice->invoice_number} marked as paid and receipt emailed.");
    }

    public function destroy(Request $request, Invoice $invoice): RedirectResponse
    {
        abort_unless((bool) $request->user()?->isSuperAdmin(), 403);

        $invoiceNumber = $invoice->invoice_number;
        $invoice->delete();

        return redirect()
            ->route('admin.invoices.index')
            ->with('success', "Invoice {$invoiceNumber} has been deleted.");
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function resolveOrCreateCustomerFromInvoiceInput(array $data, int $createdBy): ?Customer
    {
        $email = strtolower(trim((string) ($data['customer_email'] ?? '')));

        if ($email === '') {
            return null;
        }

        $existingCustomer = Customer::query()
            ->whereRaw('LOWER(email) = ?', [$email])
            ->first();

        if ($existingCustomer) {
            return $existingCustomer;
        }

        $fullName = trim((string) ($data['customer_name'] ?? ''));

        if ($fullName === '') {
            return null;
        }

        [$firstName, $lastName] = $this->splitFullName($fullName);

        return Customer::create([
            'name' => $fullName,
            'first_name' => $firstName,
            'last_name' => $lastName,
            'email' => $email,
            'occupation' => $data['customer_occupation'] ?? null,
            'created_by' => $createdBy,
        ]);
    }

    /**
     * @return array{0: string|null, 1: string|null}
     */
    private function splitFullName(string $fullName): array
    {
        $parts = preg_split('/\s+/', trim($fullName));

        if (! is_array($parts) || $parts === []) {
            return [null, null];
        }

        $firstName = array_shift($parts);
        $lastName = $parts !== [] ? implode(' ', $parts) : null;

        return [$firstName, $lastName];
    }

    private function sendInvoiceIssuedAdminAlert(Invoice $invoice, string $action): void
    {
        $adminRecipients = $this->invoiceAdminRecipients();

        if ($adminRecipients === []) {
            return;
        }

        Mail::to($adminRecipients)->send(new InvoiceIssuedAdminAlertMail($invoice, $action));
    }

    /**
     * @return array<int, string>
     */
    private function invoiceAdminRecipients(): array
    {
        $rawRecipients = (array) config('bellah.invoice.admin_notification_emails', []);

        return array_values(array_unique(array_filter(array_map(
            static fn (mixed $email): string => strtolower(trim((string) $email)),
            $rawRecipients,
        ))));
    }

    private function makeInvoiceTriggerGuardKey(string ...$parts): string
    {
        return 'invoice:trigger:'.hash('sha256', implode('|', $parts));
    }

    private function generateInvoiceNumber(): string
    {
        $startNumber = 200;

        $highestNumericInvoiceNumber = Invoice::query()
            ->pluck('invoice_number')
            ->map(static fn (mixed $invoiceNumber): string => trim((string) $invoiceNumber))
            ->filter(static fn (string $invoiceNumber): bool => ctype_digit($invoiceNumber))
            ->map(static fn (string $invoiceNumber): int => (int) $invoiceNumber)
            ->max();

        $nextNumber = max(
            $startNumber,
            ($highestNumericInvoiceNumber ?? ($startNumber - 1)) + 1,
        );

        do {
            $number = (string) $nextNumber;
            $nextNumber++;
        } while (Invoice::query()->where('invoice_number', $number)->exists());

        return $number;
    }

    private function mapInvoice(Invoice $invoice, bool $withRelations = false): array
    {
        return [
            'id' => $invoice->id,
            'invoice_number' => $invoice->invoice_number,
            'customer_id' => $invoice->customer_id,
            'customer_name' => $invoice->customer_name,
            'customer_email' => $invoice->customer_email,
            'customer_occupation' => $invoice->customer_occupation,
            'title' => $invoice->title,
            'description' => $invoice->description,
            'amount' => (string) $invoice->amount,
            'currency' => $invoice->currency,
            'status' => $invoice->status,
            'due_date' => $invoice->due_date?->toDateString(),
            'issued_at' => $invoice->issued_at?->toDateTimeString(),
            'paid_at' => $invoice->paid_at?->toDateTimeString(),
            'payment_reference' => $invoice->payment_reference,
            'automatic_reminders_sent' => (int) $invoice->automatic_reminders_sent,
            'last_automatic_reminder_sent_at' => $invoice->last_automatic_reminder_sent_at?->toDateTimeString(),
            'last_manual_reminder_sent_at' => $invoice->last_manual_reminder_sent_at?->toDateTimeString(),
            'creator' => $invoice->creator?->name,
            'created_at' => $invoice->created_at?->toDateTimeString(),
            'updated_at' => $invoice->updated_at?->toDateTimeString(),
            'customer' => $withRelations && $invoice->relationLoaded('customer') && $invoice->customer ? [
                'id' => $invoice->customer->id,
                'name' => $invoice->customer->name,
                'first_name' => $invoice->customer->first_name,
                'last_name' => $invoice->customer->last_name,
                'email' => $invoice->customer->email,
                'occupation' => $invoice->customer->occupation,
                'phone' => $invoice->customer->phone,
                'company' => $invoice->customer->company,
                'address' => $invoice->customer->address,
                'notes' => $invoice->customer->notes,
            ] : null,
        ];
    }
}
