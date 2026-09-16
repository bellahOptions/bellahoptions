<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\MarkInvoicePaidRequest;
use App\Http\Requests\Admin\StoreInvoiceRequest;
use App\Mail\InvoiceCommissionInvalidatedMail;
use App\Mail\InvoiceDeletedMail;
use App\Mail\InvoiceIssuedAdminAlertMail;
use App\Mail\InvoiceIssuedMail;
use App\Mail\InvoicePaidReceiptMail;
use App\Mail\InvoiceReminderMail;
use App\Models\Customer;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\ServiceOrderUpdate;
use App\Support\ClientReviewService;
use App\Support\QuestionnaireService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
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
                'can_delete_invoices' => (bool) $request->user()?->canManageInvoices(),
                'can_delete_paid_invoices' => (bool) $request->user()?->isSuperAdmin(),
            ],
            'occupations' => config('occupations.list', []),
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

        $invoice->load([
            'creator:id,name',
            'items',
            'customer:id,name,first_name,last_name,email,occupation,phone,company,address,notes',
            'serviceOrder:id,invoice_id,service_name,package_name',
            'questionnaires' => fn ($query) => $query->latest('id')->limit(1),
        ]);

        return Inertia::render('Admin/Invoices/Show', [
            'permissions' => [
                'can_delete_invoices' => (bool) $request->user()?->canManageInvoices(),
                'can_delete_paid_invoices' => (bool) $request->user()?->isSuperAdmin(),
                'can_send_questionnaire' => (bool) $request->user()?->canManageInvoices(),
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

        $items = array_values((array) $data['items']);
        $totalAmount = array_reduce(
            $items,
            fn (float $carry, array $item): float => $carry + ((int) $item['quantity'] * (float) $item['unit_price']),
            0.0,
        );

        $customerEmail = $customer?->email ?? strtolower((string) $data['customer_email']);
        $guardKey = $this->makeInvoiceTriggerGuardKey(
            'issue',
            (int) $request->user()->id,
            $customerEmail,
            (string) $data['title'],
            (string) $totalAmount,
            strtoupper((string) $data['currency']),
        );

        if (! Cache::add($guardKey, now()->timestamp, now()->addSeconds(12))) {
            return back()->with('error', 'Duplicate invoice trigger detected. Please wait a moment before trying again.');
        }

        try {
            $invoice = DB::transaction(function () use ($data, $customer, $customerName, $customerEmail, $totalAmount, $items, $request): Invoice {
                $invoice = Invoice::create([
                    'invoice_number' => $this->generateInvoiceNumber(),
                    'customer_id' => $customer?->id,
                    'customer_name' => $customerName ?: $data['customer_name'],
                    'customer_email' => $customerEmail,
                    'customer_occupation' => $customer?->occupation ?? ($data['customer_occupation'] ?? null),
                    'title' => $data['title'],
                    'description' => $data['description'] ?? null,
                    'amount' => $totalAmount,
                    'currency' => strtoupper($data['currency']),
                    'due_date' => $data['due_date'] ?? null,
                    'status' => 'sent',
                    'issued_at' => now(),
                    'created_by' => $request->user()->id,
                ]);

                $invoice->items()->createMany(array_map(
                    fn (array $item, int $index): array => [
                        'description' => (string) $item['description'],
                        'quantity' => (int) $item['quantity'],
                        'unit_price' => (float) $item['unit_price'],
                        'amount' => (int) $item['quantity'] * (float) $item['unit_price'],
                        'sort_order' => $index,
                    ],
                    $items,
                    array_keys($items),
                ));

                return $invoice;
            });
        } catch (Throwable $exception) {
            Cache::forget($guardKey);

            Log::error('Invoice creation failed.', [
                'customer_email' => $customerEmail,
                'error' => $exception->getMessage(),
                'trace' => $exception->getTraceAsString(),
            ]);

            return back()->with('error', 'Invoice creation failed. Please check the form and try again.');
        }

        try {
            Mail::to($invoice->customer_email)->send(new InvoiceIssuedMail($invoice));
        } catch (Throwable $exception) {
            Log::warning('Invoice email failed.', [
                'invoice_id' => $invoice->id,
                'customer_email' => $customerEmail,
                'error' => $exception->getMessage(),
            ]);

            return back()->with('error', "Invoice {$invoice->invoice_number} was created, but the email to the customer failed to send. Check mail configuration, then use Resend to try again.");
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

    /**
     * Return this invoice's details as a template so staff can review and edit
     * them before creating (and sending) a new invoice from it. This performs
     * no writes and sends no email — the new invoice is only created, and the
     * customer only notified, when the rep explicitly submits the pre-filled
     * "New Invoice" form via store().
     */
    public function duplicate(Request $request, Invoice $invoice): JsonResponse
    {
        abort_unless((bool) $request->user()?->canManageInvoices(), 403);

        if ($invoice->status !== 'paid') {
            return response()->json([
                'message' => 'Only paid invoices can be duplicated.',
            ], 422);
        }

        $invoice->loadMissing('items');

        return response()->json([
            'invoice' => [
                'customer_id' => $invoice->customer_id,
                'customer_name' => $invoice->customer_name,
                'customer_email' => $invoice->customer_email,
                'customer_occupation' => $invoice->customer_occupation,
                'title' => $invoice->title,
                'description' => $invoice->description,
                'currency' => $invoice->currency,
                'due_date' => now()->addDays(7)->toDateString(),
                'items' => $invoice->items->map(fn (InvoiceItem $item): array => [
                    'description' => $item->description,
                    'quantity' => $item->quantity,
                    'unit_price' => (string) $item->unit_price,
                ])->all(),
            ],
        ]);
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

        $paymentReference = $request->validated('payment_reference');
        $paymentMethod = $request->validated('payment_method');

        DB::transaction(function () use ($invoice, $paymentReference, $paymentMethod): void {
            $invoice->update([
                'status' => 'paid',
                'paid_at' => now(),
                'payment_reference' => $paymentReference,
                'payment_method' => $paymentMethod,
            ]);

            $serviceOrder = $invoice->serviceOrder;

            if ($serviceOrder && $serviceOrder->payment_status !== 'paid') {
                $serviceOrder->update([
                    'payment_status' => 'paid',
                    'order_status' => 'queued',
                    'progress_percent' => max(20, (int) $serviceOrder->progress_percent),
                    'paid_at' => now(),
                    'paystack_reference' => $paymentReference,
                ]);

                ServiceOrderUpdate::create([
                    'service_order_id' => $serviceOrder->id,
                    'status' => 'queued',
                    'progress_percent' => max(20, (int) $serviceOrder->progress_percent),
                    'note' => 'Payment confirmed by the Bellah Options team. Your project has been queued for production.',
                    'is_public' => true,
                    'created_by' => $serviceOrder->user_id,
                ]);
            }
        });

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

    public function sendQuestionnaire(Request $request, Invoice $invoice, QuestionnaireService $questionnaireService): RedirectResponse
    {
        abort_unless((bool) $request->user()?->canManageInvoices(), 403);

        if ($invoice->status !== 'paid' || $invoice->payment_method !== 'whatsapp') {
            return back()->with('error', 'Questionnaires can only be sent for invoices paid via WhatsApp.');
        }

        $result = $questionnaireService->sendForInvoice($invoice, $request->user());

        return match ($result['status']) {
            'sent' => back()->with('success', "Questionnaire sent to {$invoice->customer_email}."),
            'no_template' => back()->with('error', 'No questionnaire template is configured for this service yet. Add one under Questionnaire Templates.'),
            'no_service_order' => back()->with('error', 'This invoice is not linked to a service order, so a questionnaire cannot be sent.'),
            'no_email' => back()->with('error', 'This invoice has no customer email on file.'),
            default => back()->with('error', 'Failed to send the questionnaire. Check mail configuration and try again.'),
        };
    }

    public function destroy(Request $request, Invoice $invoice): RedirectResponse
    {
        $user = $request->user();

        abort_unless((bool) $user?->canManageInvoices(), 403);

        // Deleting a paid invoice removes a real payment record, so that stays
        // restricted to super admins. Any staff member who can manage invoices
        // may delete a not-yet-paid one that was sent in error.
        if ($invoice->status === 'paid') {
            abort_unless((bool) $user?->isSuperAdmin(), 403);
        }

        $invoiceNumber = $invoice->invoice_number;
        $customerEmail = $invoice->customer_email;
        $reason = trim((string) $request->input('reason', ''));
        $customerNotified = true;

        try {
            Mail::to($customerEmail)->send(new InvoiceDeletedMail($invoice, $user, $reason !== '' ? $reason : null));
        } catch (Throwable $exception) {
            $customerNotified = false;

            Log::warning('Invoice deletion apology email failed.', [
                'invoice_id' => $invoice->id,
                'customer_email' => $customerEmail,
                'error' => $exception->getMessage(),
            ]);
        }

        // A paid invoice may already have staff commissions recorded against it —
        // those earnings are no longer real once the invoice is gone, so every
        // staff member who earned one must be told before the rows cascade-delete.
        $commissions = $invoice->staffCommissions()->with('user')->get();
        $staffNotifiedCount = 0;

        foreach ($commissions as $commission) {
            if ($commission->user?->email === null) {
                continue;
            }

            try {
                Mail::to($commission->user->email)->send(new InvoiceCommissionInvalidatedMail($commission, $invoice));
                $staffNotifiedCount++;
            } catch (Throwable $exception) {
                Log::warning('Invoice commission invalidation email failed.', [
                    'invoice_id' => $invoice->id,
                    'user_id' => $commission->user->id,
                    'error' => $exception->getMessage(),
                ]);
            }
        }

        // Delete dependent financial records explicitly rather than trusting the
        // database's ON DELETE CASCADE alone — ledger integrity is too important
        // to leave to FK enforcement that could be bypassed by config state, a
        // different DB engine, or a tool that touches the DB outside Eloquent.
        DB::transaction(function () use ($invoice): void {
            $invoice->staffCommissions()->delete();
            $invoice->incomeSplit()->delete();
            $invoice->delete();
        });

        $message = $customerNotified
            ? "Invoice {$invoiceNumber} has been deleted and the customer notified by email."
            : "Invoice {$invoiceNumber} has been deleted, but the customer notification email failed to send.";

        if ($commissions->isNotEmpty()) {
            $message .= $staffNotifiedCount === $commissions->count()
                ? " {$staffNotifiedCount} staff member(s) were notified that their commission on it is void."
                : " {$staffNotifiedCount} of {$commissions->count()} staff member(s) were notified that their commission on it is void.";
        }

        return redirect()
            ->route('admin.invoices.index')
            ->with($customerNotified ? 'success' : 'error', $message);
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
            'uuid' => $invoice->uuid,
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
            'payment_method' => $invoice->payment_method,
            'automatic_reminders_sent' => (int) $invoice->automatic_reminders_sent,
            'last_automatic_reminder_sent_at' => $invoice->last_automatic_reminder_sent_at?->toDateTimeString(),
            'last_manual_reminder_sent_at' => $invoice->last_manual_reminder_sent_at?->toDateTimeString(),
            'creator' => $invoice->creator?->name,
            'created_at' => $invoice->created_at?->toDateTimeString(),
            'updated_at' => $invoice->updated_at?->toDateTimeString(),
            'items' => $withRelations && $invoice->relationLoaded('items')
                ? $invoice->items->map(fn (InvoiceItem $item): array => [
                    'id' => $item->id,
                    'description' => $item->description,
                    'quantity' => $item->quantity,
                    'unit_price' => (string) $item->unit_price,
                    'amount' => (string) $item->amount,
                ])->all()
                : [],
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
            'service_order' => $withRelations && $invoice->relationLoaded('serviceOrder') && $invoice->serviceOrder ? [
                'service_name' => $invoice->serviceOrder->service_name,
                'package_name' => $invoice->serviceOrder->package_name,
            ] : null,
            'latest_questionnaire' => $withRelations && $invoice->relationLoaded('questionnaires') && $invoice->questionnaires->isNotEmpty() ? [
                'status' => $invoice->questionnaires->first()->status,
                'requested_at' => $invoice->questionnaires->first()->requested_at?->toDateTimeString(),
                'completed_at' => $invoice->questionnaires->first()->completed_at?->toDateTimeString(),
            ] : null,
        ];
    }
}
