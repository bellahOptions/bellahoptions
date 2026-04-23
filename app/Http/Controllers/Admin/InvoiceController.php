<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\MarkInvoicePaidRequest;
use App\Http\Requests\Admin\StoreInvoiceRequest;
use App\Mail\InvoiceIssuedMail;
use App\Mail\InvoicePaidReceiptMail;
use App\Models\Customer;
use App\Models\Invoice;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

class InvoiceController extends Controller
{
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

        if ($customer && blank($customerName)) {
            $customerName = trim("{$customer->first_name} {$customer->last_name}");
        }

        $invoice = Invoice::create([
            'invoice_number' => $this->generateInvoiceNumber(),
            'customer_id' => $customer?->id,
            'customer_name' => $customerName ?: $data['customer_name'],
            'customer_email' => $customer?->email ?? strtolower($data['customer_email']),
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

        try {
            Mail::to($invoice->customer_email)->send(new InvoiceIssuedMail($invoice));
        } catch (Throwable $exception) {
            Log::warning('Invoice email failed.', [
                'invoice_id' => $invoice->id,
                'customer_email' => $invoice->customer_email,
                'error' => $exception->getMessage(),
            ]);

            return back()->with('success', "Invoice {$invoice->invoice_number} created, but email delivery failed.");
        }

        return back()->with('success', "Invoice {$invoice->invoice_number} created and emailed successfully.");
    }

    public function resend(Invoice $invoice): RedirectResponse
    {
        try {
            Mail::to($invoice->customer_email)->send(new InvoiceIssuedMail($invoice));
        } catch (Throwable $exception) {
            Log::warning('Invoice resend failed.', [
                'invoice_id' => $invoice->id,
                'customer_email' => $invoice->customer_email,
                'error' => $exception->getMessage(),
            ]);

            return back()->with('success', 'Invoice resend failed. Check mail configuration.');
        }

        return back()->with('success', "Invoice {$invoice->invoice_number} resent to {$invoice->customer_email}.");
    }

    public function markPaid(MarkInvoicePaidRequest $request, Invoice $invoice): RedirectResponse
    {
        if ($invoice->status === 'paid') {
            return back()->with('success', "Invoice {$invoice->invoice_number} is already marked as paid.");
        }

        $invoice->update([
            'status' => 'paid',
            'paid_at' => now(),
            'payment_reference' => $request->validated('payment_reference'),
        ]);

        try {
            Mail::to($invoice->customer_email)->send(new InvoicePaidReceiptMail($invoice->fresh()));
        } catch (Throwable $exception) {
            Log::warning('Invoice receipt email failed.', [
                'invoice_id' => $invoice->id,
                'customer_email' => $invoice->customer_email,
                'error' => $exception->getMessage(),
            ]);

            return back()->with('success', "Invoice {$invoice->invoice_number} marked as paid, but receipt email failed.");
        }

        return back()->with('success', "Invoice {$invoice->invoice_number} marked as paid and receipt emailed.");
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
}
