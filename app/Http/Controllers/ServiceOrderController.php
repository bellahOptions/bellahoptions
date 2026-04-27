<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreServiceOrderRequest;
use App\Http\Requests\StoreServiceOrderUpdateRequest;
use App\Models\Customer;
use App\Models\DiscountCode;
use App\Models\Invoice;
use App\Models\ServiceOrder;
use App\Models\ServiceOrderUpdate;
use App\Models\User;
use App\Services\PaystackService;
use App\Support\ServiceOrderCatalog;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Illuminate\View\View;
use Throwable;

class ServiceOrderController extends Controller
{
    public function create(Request $request, string $serviceSlug, ServiceOrderCatalog $catalog): View
    {
        $service = $catalog->service($serviceSlug);
        abort_unless(is_array($service), 404);

        $selectedPackageCode = trim((string) $request->query('package', ''));
        if ($selectedPackageCode !== '' && ! is_array($catalog->package($serviceSlug, $selectedPackageCode))) {
            $selectedPackageCode = '';
        }

        $discount = $this->resolveCheckoutDiscountCandidate($request, $serviceSlug);

        $request->session()->put('service_order_guard', [
            'issued_at' => now()->timestamp,
            'nonce' => Str::random(32),
            'service_slug' => $serviceSlug,
        ]);

        return view('orders.create', [
            'serviceSlug' => $serviceSlug,
            'service' => $service,
            'formGuard' => $request->session()->get('service_order_guard'),
            'isAuthenticated' => $request->user() !== null,
            'discountCode' => $discount?->code,
            'discountSummary' => $discount ? $this->discountSummary($discount) : null,
            'selectedPackageCode' => $selectedPackageCode !== '' ? $selectedPackageCode : null,
        ]);
    }

    /**
     * @throws ValidationException
     */
    public function store(StoreServiceOrderRequest $request, string $serviceSlug, ServiceOrderCatalog $catalog): RedirectResponse
    {
        $service = $catalog->service($serviceSlug);
        abort_unless(is_array($service), 404);

        $payload = $request->validated();
        $packageCode = (string) $payload['service_package'];
        $package = $catalog->package($serviceSlug, $packageCode);

        if (! is_array($package)) {
            throw ValidationException::withMessages([
                'service_package' => 'The selected package is invalid.',
            ]);
        }

        $user = $request->user();

        if ($user === null && (bool) ($payload['create_account'] ?? false)) {
            $user = $this->registerCustomerAccount($payload);
            Auth::login($user);
            event(new Registered($user));
        }

        $creator = $user ?? $this->resolveSystemUser();
        $customer = $this->resolveOrCreateCustomer($payload, $creator->id);

        $currency = strtoupper((string) config('bellah.invoice.currency', 'NGN'));
        $baseAmount = round((float) ($package['price'] ?? 0), 2);

        if ($baseAmount <= 0) {
            throw ValidationException::withMessages([
                'service_package' => 'The selected package is currently unavailable. Please choose another package.',
            ]);
        }

        $submittedDiscountCode = strtoupper(trim((string) ($payload['discount_code'] ?? '')));
        if ($submittedDiscountCode === '') {
            $submittedDiscountCode = strtoupper(trim((string) $request->session()->get('checkout_discount_code', '')));
        }

        $discount = null;
        $discountAmount = 0.0;
        $finalAmount = $baseAmount;

        DB::beginTransaction();

        try {
            if ($submittedDiscountCode !== '') {
                $discount = DiscountCode::query()
                    ->whereRaw('UPPER(code) = ?', [$submittedDiscountCode])
                    ->lockForUpdate()
                    ->first();

                if (! $discount || ! $discount->isApplicableTo($serviceSlug, $packageCode)) {
                    throw ValidationException::withMessages([
                        'discount_code' => 'The discount code is invalid or no longer available for this package.',
                    ]);
                }

                $discountAmount = $discount->discountAmountFor($baseAmount, $currency);
                $finalAmount = max(round($baseAmount - $discountAmount, 2), 0.01);
                $discountAmount = round($baseAmount - $finalAmount, 2);
            }

            $order = ServiceOrder::create([
                'uuid' => (string) Str::uuid(),
                'user_id' => $user?->id,
                'customer_id' => $customer?->id,
                'service_slug' => $serviceSlug,
                'service_name' => (string) ($service['name'] ?? $serviceSlug),
                'package_code' => $packageCode,
                'package_name' => (string) ($package['name'] ?? ucfirst($packageCode)),
                'currency' => $currency,
                'base_amount' => $baseAmount,
                'discount_code_id' => $discount?->id,
                'discount_code' => $discount?->code,
                'discount_name' => $discount?->name,
                'discount_type' => $discount?->discount_type,
                'discount_value' => $discount?->discount_value,
                'discount_amount' => $discountAmount,
                'amount' => $finalAmount,
                'payment_status' => 'pending',
                'order_status' => 'awaiting_payment',
                'progress_percent' => 5,
                'full_name' => (string) $payload['full_name'],
                'email' => (string) $payload['email'],
                'phone' => (string) $payload['phone'],
                'business_name' => (string) $payload['business_name'],
                'position' => $payload['position'] ?? null,
                'business_website' => $payload['business_website'] ?? null,
                'project_summary' => (string) $payload['project_summary'],
                'project_goals' => $payload['project_goals'] ?? null,
                'target_audience' => $payload['target_audience'] ?? null,
                'preferred_style' => $payload['preferred_style'] ?? null,
                'deliverables' => $payload['deliverables'] ?? null,
                'additional_details' => $payload['additional_details'] ?? null,
                'brief_payload' => [
                    'timeline_preference' => $payload['timeline_preference'] ?? null,
                    'primary_platforms' => $payload['primary_platforms'] ?? null,
                    'monthly_design_volume' => isset($payload['monthly_design_volume']) ? (int) $payload['monthly_design_volume'] : null,
                ],
                'wants_account' => (bool) ($payload['create_account'] ?? false),
                'created_by_ip' => $request->ip(),
                'user_agent' => Str::limit((string) $request->userAgent(), 1000),
            ]);

            $invoice = Invoice::create([
                'invoice_number' => $this->generateInvoiceNumber(),
                'customer_id' => $customer?->id,
                'customer_name' => $customer?->name ?: (string) $payload['full_name'],
                'customer_email' => (string) $payload['email'],
                'customer_occupation' => $payload['position'] ?? null,
                'title' => (string) ($service['name'] ?? 'Service').' - '.(string) ($package['name'] ?? 'Package'),
                'description' => Str::limit((string) $payload['project_summary'], 500),
                'amount' => $finalAmount,
                'currency' => $currency,
                'due_date' => now()->addDays(7)->toDateString(),
                'status' => 'sent',
                'issued_at' => now(),
                'created_by' => $creator->id,
            ]);

            if ($discount) {
                $discount->incrementRedemptions();
            }

            $order->update([
                'invoice_id' => $invoice->id,
            ]);

            ServiceOrderUpdate::create([
                'service_order_id' => $order->id,
                'status' => 'submitted',
                'progress_percent' => 5,
                'note' => 'Order was submitted successfully and is awaiting payment confirmation.',
                'is_public' => true,
                'created_by' => $creator->id,
            ]);

            DB::commit();
        } catch (Throwable $exception) {
            DB::rollBack();

            Log::warning('Service order creation failed.', [
                'service_slug' => $serviceSlug,
                'email' => $payload['email'] ?? null,
                'error' => $exception->getMessage(),
            ]);

            return back()->withInput()->with('error', 'Unable to create your order right now. Please try again.');
        }

        $request->session()->forget('service_order_guard');
        $request->session()->forget('checkout_discount_code');
        $request->session()->put('service_order_access.'.$order->uuid, true);

        return redirect()
            ->route('orders.payment.show', $order)
            ->with('success', 'Order created successfully. Please complete payment to start your project.');
    }

    public function payment(Request $request, ServiceOrder $serviceOrder): View
    {
        $this->authorizeOrderAccess($request, $serviceOrder);

        return view('orders.payment', [
            'order' => $serviceOrder->load('invoice'),
            'canPay' => $serviceOrder->payment_status !== 'paid',
        ]);
    }

    public function initializePayment(Request $request, ServiceOrder $serviceOrder, PaystackService $paystackService): RedirectResponse
    {
        $this->authorizeOrderAccess($request, $serviceOrder);

        if ($serviceOrder->payment_status === 'paid') {
            return redirect()->route('orders.show', $serviceOrder)->with('success', 'This order has already been paid.');
        }

        $reference = $serviceOrder->paystack_reference ?: strtoupper('BO-'.$serviceOrder->id.'-'.now()->timestamp.'-'.Str::random(6));

        try {
            $payment = $paystackService->initialize(
                $serviceOrder->email,
                (int) round((float) $serviceOrder->amount * 100),
                $reference,
                route('orders.payment.callback'),
                [
                    'service_order_uuid' => $serviceOrder->uuid,
                    'service' => $serviceOrder->service_name,
                    'package' => $serviceOrder->package_name,
                    'invoice_number' => $serviceOrder->invoice?->invoice_number,
                ],
            );
        } catch (Throwable $exception) {
            Log::warning('Paystack initialization failed.', [
                'order_id' => $serviceOrder->id,
                'reference' => $reference,
                'error' => $exception->getMessage(),
            ]);

            return back()->with('error', 'Unable to start payment right now. Please try again shortly.');
        }

        $serviceOrder->update([
            'paystack_reference' => $payment['reference'],
            'paystack_access_code' => $payment['access_code'],
            'payment_status' => 'processing',
        ]);

        return redirect()->away($payment['authorization_url']);
    }

    public function paymentCallback(Request $request, PaystackService $paystackService): RedirectResponse
    {
        $reference = trim((string) $request->query('reference', ''));

        if ($reference === '') {
            return redirect()->route('home')->with('error', 'Missing payment reference.');
        }

        $serviceOrder = ServiceOrder::query()->with('invoice')->where('paystack_reference', $reference)->first();

        if (! $serviceOrder) {
            return redirect()->route('home')->with('error', 'Payment order was not found.');
        }

        $request->session()->put('service_order_access.'.$serviceOrder->uuid, true);

        try {
            $verification = $paystackService->verify($reference);
            $data = (array) ($verification['data'] ?? []);

            $status = (string) ($data['status'] ?? '');
            $amount = (int) ($data['amount'] ?? 0);
            $currency = strtoupper((string) ($data['currency'] ?? ''));

            $expectedAmount = (int) round((float) $serviceOrder->amount * 100);
            $expectedCurrency = strtoupper((string) $serviceOrder->currency);

            if ($status === 'success' && $amount >= $expectedAmount && $currency === $expectedCurrency) {
                $this->markOrderPaid($serviceOrder, $reference, $data);

                return redirect()->route('orders.show', $serviceOrder)->with('success', 'Payment confirmed successfully.');
            }

            $serviceOrder->update([
                'payment_status' => 'failed',
            ]);

            return redirect()->route('orders.payment.show', $serviceOrder)->with('error', 'Payment could not be verified. Please try again.');
        } catch (Throwable $exception) {
            Log::warning('Paystack callback verification failed.', [
                'order_id' => $serviceOrder->id,
                'reference' => $reference,
                'error' => $exception->getMessage(),
            ]);

            return redirect()->route('orders.payment.show', $serviceOrder)->with('error', 'Payment verification is temporarily unavailable.');
        }
    }

    public function webhook(Request $request, PaystackService $paystackService): JsonResponse
    {
        $payload = (string) $request->getContent();
        $signature = trim((string) $request->header('x-paystack-signature', ''));
        $secret = trim((string) config('services.paystack.webhook_secret', ''));

        if ($payload === '' || $signature === '' || $secret === '') {
            return response()->json(['message' => 'Invalid webhook request.'], 400);
        }

        $expectedSignature = hash_hmac('sha512', $payload, $secret);

        if (! hash_equals($expectedSignature, $signature)) {
            return response()->json(['message' => 'Invalid webhook signature.'], 401);
        }

        /** @var array<string, mixed> $event */
        $event = (array) $request->json()->all();

        if (($event['event'] ?? null) !== 'charge.success') {
            return response()->json(['message' => 'Ignored event.']);
        }

        $reference = trim((string) data_get($event, 'data.reference', ''));
        if ($reference === '') {
            return response()->json(['message' => 'Missing reference.'], 400);
        }

        $serviceOrder = ServiceOrder::query()->with('invoice')->where('paystack_reference', $reference)->first();
        if (! $serviceOrder) {
            return response()->json(['message' => 'Order not found.'], 404);
        }

        if ($serviceOrder->payment_status === 'paid') {
            return response()->json(['message' => 'Already processed.']);
        }

        try {
            $verification = $paystackService->verify($reference);
            $data = (array) ($verification['data'] ?? []);

            $status = (string) ($data['status'] ?? '');
            $amount = (int) ($data['amount'] ?? 0);
            $currency = strtoupper((string) ($data['currency'] ?? ''));

            $expectedAmount = (int) round((float) $serviceOrder->amount * 100);
            $expectedCurrency = strtoupper((string) $serviceOrder->currency);

            if ($status === 'success' && $amount >= $expectedAmount && $currency === $expectedCurrency) {
                $this->markOrderPaid($serviceOrder, $reference, $data);

                return response()->json(['message' => 'Payment recorded.']);
            }

            return response()->json(['message' => 'Verification failed.'], 422);
        } catch (Throwable $exception) {
            Log::warning('Paystack webhook verification failed.', [
                'order_id' => $serviceOrder->id,
                'reference' => $reference,
                'error' => $exception->getMessage(),
            ]);

            return response()->json(['message' => 'Verification failed.'], 500);
        }
    }

    public function show(Request $request, ServiceOrder $serviceOrder): View
    {
        $this->authorizeOrderAccess($request, $serviceOrder);

        $serviceOrder->load([
            'invoice',
            'updates' => static fn ($query) => $query->where('is_public', true)->latest('id'),
        ]);

        return view('orders.show', [
            'order' => $serviceOrder,
        ]);
    }

    public function storeUpdate(StoreServiceOrderUpdateRequest $request, ServiceOrder $serviceOrder): RedirectResponse
    {
        abort_unless((bool) $request->user()?->isStaff(), 403);

        $data = $request->validated();

        $serviceOrder->update([
            'order_status' => $data['status'],
            'progress_percent' => (int) $data['progress_percent'],
        ]);

        ServiceOrderUpdate::create([
            'service_order_id' => $serviceOrder->id,
            'status' => $data['status'],
            'progress_percent' => (int) $data['progress_percent'],
            'note' => $data['note'] ?? null,
            'is_public' => (bool) ($data['is_public'] ?? true),
            'created_by' => $request->user()?->id,
        ]);

        return back()->with('success', 'Service order progress has been updated.');
    }

    private function resolveCheckoutDiscountCandidate(Request $request, string $serviceSlug): ?DiscountCode
    {
        $incomingCode = strtoupper(trim((string) $request->query('discount', '')));
        $sessionCode = strtoupper(trim((string) $request->session()->get('checkout_discount_code', '')));
        $code = $incomingCode !== '' ? $incomingCode : $sessionCode;

        if ($code === '') {
            return null;
        }

        $discount = DiscountCode::query()
            ->whereRaw('UPPER(code) = ?', [$code])
            ->first();

        if (! $discount || ! $discount->isApplicableTo($serviceSlug)) {
            if ($incomingCode !== '') {
                $request->session()->forget('checkout_discount_code');
            }

            return null;
        }

        $request->session()->put('checkout_discount_code', $discount->code);

        return $discount;
    }

    private function discountSummary(DiscountCode $discount): string
    {
        if (strtolower((string) $discount->discount_type) === 'percentage') {
            return rtrim(rtrim((string) $discount->discount_value, '0'), '.').'% off';
        }

        $currency = strtoupper((string) ($discount->currency ?: config('bellah.invoice.currency', 'NGN')));
        $prefix = $currency === 'NGN' ? '₦' : $currency.' ';

        return $prefix.number_format((float) $discount->discount_value, 2).' off';
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function registerCustomerAccount(array $payload): User
    {
        [$firstName, $lastName] = $this->splitFullName((string) $payload['full_name']);

        return User::create([
            'name' => trim((string) $payload['full_name']),
            'first_name' => $firstName,
            'last_name' => $lastName,
            'email' => strtolower(trim((string) $payload['email'])),
            'password' => Hash::make((string) $payload['password']),
            'role' => 'user',
            'address' => null,
        ]);
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function resolveOrCreateCustomer(array $payload, int $createdBy): ?Customer
    {
        $email = strtolower(trim((string) ($payload['email'] ?? '')));

        if ($email === '') {
            return null;
        }

        $customer = Customer::query()->whereRaw('LOWER(email) = ?', [$email])->first();

        if ($customer) {
            return $customer;
        }

        [$firstName, $lastName] = $this->splitFullName((string) ($payload['full_name'] ?? ''));

        return Customer::create([
            'name' => trim((string) ($payload['full_name'] ?? 'Guest Customer')),
            'first_name' => $firstName,
            'last_name' => $lastName,
            'email' => $email,
            'occupation' => $payload['position'] ?? null,
            'phone' => $payload['phone'] ?? null,
            'company' => $payload['business_name'] ?? null,
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

    private function resolveSystemUser(): User
    {
        $systemEmail = strtolower(trim((string) env('BELLAH_SYSTEM_USER_EMAIL', 'system@bellahoptions.com')));

        return User::query()->firstOrCreate(
            ['email' => $systemEmail],
            [
                'name' => 'Bellah System',
                'first_name' => 'Bellah',
                'last_name' => 'System',
                'password' => Hash::make(Str::random(40)),
                'role' => 'system',
                'address' => null,
            ],
        );
    }

    private function authorizeOrderAccess(Request $request, ServiceOrder $serviceOrder): void
    {
        $user = $request->user();

        if ($user && ($user->isStaff() || $serviceOrder->user_id === $user->id)) {
            return;
        }

        $hasSessionAccess = (bool) $request->session()->get('service_order_access.'.$serviceOrder->uuid, false);

        abort_unless($hasSessionAccess, 403);
    }

    /**
     * @param  array<string, mixed>  $gatewayData
     */
    private function markOrderPaid(ServiceOrder $serviceOrder, string $reference, array $gatewayData): void
    {
        if ($serviceOrder->payment_status === 'paid') {
            return;
        }

        DB::transaction(function () use ($serviceOrder, $reference, $gatewayData): void {
            $serviceOrder->update([
                'payment_status' => 'paid',
                'order_status' => 'queued',
                'progress_percent' => max(20, (int) $serviceOrder->progress_percent),
                'paid_at' => now(),
                'paystack_reference' => $reference,
            ]);

            if ($serviceOrder->invoice) {
                $serviceOrder->invoice->update([
                    'status' => 'paid',
                    'paid_at' => now(),
                    'payment_reference' => $reference,
                ]);
            }

            ServiceOrderUpdate::create([
                'service_order_id' => $serviceOrder->id,
                'status' => 'queued',
                'progress_percent' => max(20, (int) $serviceOrder->progress_percent),
                'note' => 'Payment confirmed via Paystack. Your project has been queued for production.',
                'is_public' => true,
                'created_by' => $serviceOrder->user_id,
            ]);

            Log::info('Service order marked as paid.', [
                'service_order_id' => $serviceOrder->id,
                'reference' => $reference,
                'gateway_status' => $gatewayData['status'] ?? null,
            ]);
        });
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
