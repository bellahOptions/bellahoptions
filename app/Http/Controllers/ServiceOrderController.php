<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreServiceOrderRequest;
use App\Http\Requests\StoreServiceOrderUpdateRequest;
use App\Mail\InvoicePaidReceiptMail;
use App\Mail\InvoiceIssuedMail;
use App\Mail\ServiceOrderContentAssetRequestMail;
use App\Mail\ServiceOrderClientSummaryMail;
use App\Mail\ServiceOrderPaymentThankYouMail;
use App\Mail\ServiceOrderSubmittedAdminAlertMail;
use App\Models\Customer;
use App\Models\DiscountCode;
use App\Models\Invoice;
use App\Models\OrderProspect;
use App\Models\ServiceOrder;
use App\Models\ServiceOrderUpdate;
use App\Models\Term;
use App\Services\FlutterwaveService;
use App\Models\User;
use App\Services\PaystackService;
use App\Support\ClientReviewService;
use App\Support\PlatformSettings;
use App\Support\VisitorLocalization;
use App\Support\ServiceOrderCatalog;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class ServiceOrderController extends Controller
{
    private const TRIAL_PACKAGE_CODE = 'trial-request';

    /**
     * @var array<int, string>
     */
    private const TRIAL_SERVICE_SLUGS = [
        'social-media-design',
        'graphic-design',
    ];

    public function create(
        Request $request,
        string $serviceSlug,
        ServiceOrderCatalog $catalog,
        PaystackService $paystackService
    ): Response
    {
        $localization = app(VisitorLocalization::class)->resolve($request);
        $service = $catalog->service($serviceSlug);
        abort_unless(is_array($service), 404);

        $checkoutServiceSlugs = $this->checkoutServiceSlugs();
        $checkoutServices = [];
        foreach ($checkoutServiceSlugs as $slug) {
            $serviceEntry = $catalog->service($slug);
            if (! is_array($serviceEntry)) {
                continue;
            }

            $checkoutServices[$slug] = $this->localizeServicePackages(
                $serviceEntry,
                (string) $localization['currency'],
                $slug,
            );
        }

        $selectedServiceSlug = trim((string) $request->query('service', $serviceSlug));
        if (! isset($checkoutServices[$selectedServiceSlug])) {
            $selectedServiceSlug = $serviceSlug;
        }

        $selectedPackageCode = trim((string) $request->query('package', ''));
        if (
            $selectedPackageCode !== ''
            && ! is_array($catalog->package($selectedServiceSlug, $selectedPackageCode))
            && ! $this->isTrialPackageSelection($selectedServiceSlug, $selectedPackageCode)
        ) {
            $selectedPackageCode = '';
        }

        $logoAddons = $this->localizeLogoAddons($catalog->logoAddons(), (string) $localization['currency']);
        $discount = $this->isTrialPackageSelection($selectedServiceSlug, $selectedPackageCode)
            ? null
            : $this->resolveCheckoutDiscountCandidate($request, $selectedServiceSlug);

        $humanCheck = $this->createHumanVerificationChallenge($request);

        return Inertia::render('Orders/Create', [
            'serviceSlug' => $serviceSlug,
            ...$humanCheck,
            'isAuthenticated' => $request->user() !== null,
            'discountCode' => $discount?->code,
            'discountSummary' => $discount ? $this->discountSummary($discount) : null,
            'checkoutServices' => $checkoutServices,
            'logoAddons' => $logoAddons,
            'selectedServiceSlug' => $selectedServiceSlug,
            'selectedPackageCode' => $selectedPackageCode !== '' ? $selectedPackageCode : null,
            'visitorLocalization' => $localization,
            'paymentReadiness' => $this->orderFormPaymentReadiness($localization, $paystackService),
            'profileDefaults' => [
                'name' => $request->user()?->name,
                'email' => $request->user()?->email,
            ],
        ]);
    }

    public function saveProspectDraft(Request $request, string $serviceSlug, ServiceOrderCatalog $catalog): JsonResponse
    {
        if ($request->user() !== null) {
            return response()->json([
                'saved' => false,
                'reason' => 'authenticated-user',
            ]);
        }

        $service = $catalog->service($serviceSlug);
        abort_unless(is_array($service), 404);

        $validated = $request->validate([
            'draft_token' => ['nullable', 'uuid'],
            'current_step' => ['nullable', 'integer', 'min:1', 'max:6'],
            'service_package' => ['nullable', 'string', 'max:80'],
            'full_name' => ['nullable', 'string', 'max:120'],
            'email' => ['nullable', 'email:rfc', 'max:255'],
            'phone' => ['nullable', 'string', 'max:40'],
            'business_name' => ['nullable', 'string', 'max:180'],
            'draft_payload' => ['nullable', 'array'],
        ]);

        $fullName = trim((string) ($validated['full_name'] ?? ''));
        $email = strtolower(trim((string) ($validated['email'] ?? '')));
        $phone = trim((string) ($validated['phone'] ?? ''));
        $businessName = trim((string) ($validated['business_name'] ?? ''));

        if ($fullName === '' && $email === '' && $phone === '' && $businessName === '') {
            return response()->json([
                'saved' => false,
                'reason' => 'insufficient-data',
            ]);
        }

        $token = trim((string) ($validated['draft_token'] ?? ''));
        if ($token === '') {
            $token = (string) Str::uuid();
        }

        $prospect = OrderProspect::query()->where('uuid', $token)->first();
        if ($prospect && $prospect->status === OrderProspect::STATUS_CONVERTED) {
            $token = (string) Str::uuid();
            $prospect = null;
        }

        if (! $prospect) {
            $prospect = new OrderProspect();
            $prospect->uuid = $token;
        }

        $prospect->fill([
            'user_id' => null,
            'service_slug' => $serviceSlug,
            'service_name' => (string) ($service['name'] ?? ucfirst(str_replace('-', ' ', $serviceSlug))),
            'service_package' => trim((string) ($validated['service_package'] ?? '')) ?: null,
            'current_step' => (int) ($validated['current_step'] ?? 1),
            'status' => OrderProspect::STATUS_ACTIVE,
            'full_name' => $fullName !== '' ? $fullName : null,
            'email' => $email !== '' ? $email : null,
            'phone' => $phone !== '' ? $phone : null,
            'business_name' => $businessName !== '' ? $businessName : null,
            'draft_payload' => $this->sanitizeProspectDraftPayload((array) ($validated['draft_payload'] ?? [])),
            'source_url' => Str::limit((string) $request->headers->get('referer', ''), 255),
            'ip_address' => $request->ip(),
            'user_agent' => Str::limit((string) $request->userAgent(), 1000),
            'last_activity_at' => now(),
            'abandoned_at' => null,
        ]);

        $prospect->save();

        return response()->json([
            'saved' => true,
            'draft_token' => (string) $prospect->uuid,
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
        $localization = app(VisitorLocalization::class)->resolve($request);
        $packageCode = (string) $payload['service_package'];
        $isTrialOrder = $this->isTrialPackageSelection($serviceSlug, $packageCode);
        $package = $isTrialOrder
            ? $this->trialPackageData($serviceSlug)
            : $catalog->package($serviceSlug, $packageCode);
        $logoAddonCode = trim((string) ($payload['logo_addon_package'] ?? ''));
        $logoAddon = $logoAddonCode !== '' ? $catalog->logoAddon($logoAddonCode) : null;

        if (! is_array($package)) {
            throw ValidationException::withMessages([
                'service_package' => 'The selected package is invalid.',
            ]);
        }

        if ($logoAddonCode !== '' && ! is_array($logoAddon)) {
            throw ValidationException::withMessages([
                'logo_addon_package' => 'The selected logo package is invalid.',
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

        $currency = strtoupper((string) ($localization['currency'] ?? 'NGN'));
        $packageAmountNgn = round((float) ($package['price'] ?? 0), 2);
        $logoAddonAmountNgn = round((float) ($logoAddon['price'] ?? 0), 2);
        $baseAmountNgn = round($packageAmountNgn + $logoAddonAmountNgn, 2);
        $baseAmount = $this->convertAmountFromNgn($baseAmountNgn, $currency);
        $requiresConsultation = $baseAmount <= 0;

        if ($baseAmountNgn < 0) {
            throw ValidationException::withMessages([
                'service_package' => 'The selected package is currently unavailable. Please choose another package.',
            ]);
        }

        $submittedDiscountCode = strtoupper(trim((string) ($payload['discount_code'] ?? '')));
        if ($submittedDiscountCode === '' && ! $isTrialOrder) {
            $submittedDiscountCode = strtoupper(trim((string) $request->session()->get('checkout_discount_code', '')));
        }

        if ($isTrialOrder) {
            $submittedDiscountCode = '';
        }

        $discount = null;
        $discountAmount = 0.0;
        $finalAmount = $requiresConsultation ? 0.0 : $baseAmount;

        DB::beginTransaction();

        try {
            if ($submittedDiscountCode !== '' && ! $requiresConsultation) {
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
                'order_code' => $this->generateOrderCode(),
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
                'payment_provider' => (string) ($localization['payment_processor'] ?? 'paystack'),
                'payment_status' => $requiresConsultation ? 'not_required' : 'pending',
                'order_status' => $requiresConsultation ? 'pending_consultation' : 'awaiting_payment',
                'progress_percent' => $requiresConsultation ? 10 : 5,
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
                'brief_payload' => $this->serviceBriefPayload($payload, $serviceSlug, $catalog, $logoAddonCode, $logoAddonAmountNgn, $logoAddon, $isTrialOrder),
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
                'description' => Str::limit($this->invoiceDescription($payload, $logoAddon), 500),
                'amount' => $finalAmount,
                'currency' => $currency,
                'due_date' => now()->addDays(7)->toDateString(),
                'status' => 'sent',
                'issued_at' => now(),
                'paid_at' => null,
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
                'status' => $requiresConsultation ? 'pending_consultation' : 'submitted',
                'progress_percent' => $requiresConsultation ? 10 : 5,
                'note' => $requiresConsultation
                    ? 'Order was submitted successfully. Our team will contact you with a consultation quote.'
                    : 'Order was submitted successfully and is awaiting payment confirmation.',
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

        $request->session()->forget('service_order_human_check');
        $request->session()->forget('checkout_discount_code');
        $request->session()->put('service_order_access.'.$order->uuid, true);

        try {
            $this->sendOrderSubmittedAdminAlert($order->fresh('invoice'));
        } catch (Throwable $exception) {
            Log::warning('Service order admin alert email failed.', [
                'service_order_id' => $order->id,
                'service_slug' => $serviceSlug,
                'email' => $payload['email'] ?? null,
                'error' => $exception->getMessage(),
            ]);
        }

        try {
            $this->sendServiceOrderClientEmails($order->fresh('invoice.serviceOrder'));
        } catch (Throwable $exception) {
            Log::warning('Service order client email sequence failed.', [
                'service_order_id' => $order->id,
                'service_slug' => $serviceSlug,
                'email' => $payload['email'] ?? null,
                'error' => $exception->getMessage(),
            ]);
        }

        $this->markProspectAsConverted((string) ($payload['prospect_draft_token'] ?? ''), $order);

        if ($requiresConsultation) {
            return redirect()
                ->route('orders.show', $order)
                ->with('success', 'Order submitted successfully. Our team will contact you to finalize consultation scope and pricing.');
        }

        return redirect()
            ->route('orders.payment.show', $order)
            ->with('success', 'Order created successfully. Please complete payment to start your project.');
    }

    public function payment(Request $request, ServiceOrder $serviceOrder): Response
    {
        $this->authorizeOrderAccess($request, $serviceOrder);

        $serviceOrder->load('invoice');
        $paymentProvider = strtolower(trim((string) $serviceOrder->payment_provider)) ?: 'paystack';
        $gatewayIssue = $this->paymentGatewayIssue($paymentProvider);
        $gatewayReady = $gatewayIssue === null;

        return Inertia::render('Orders/Payment', [
            'order' => $this->orderPayload($serviceOrder),
            'canPay' => (float) $serviceOrder->amount > 0
                && ! in_array((string) $serviceOrder->payment_status, ['paid', 'not_required'], true)
                && $gatewayReady,
            'paymentProvider' => $paymentProvider,
            'paymentGatewayIssue' => $gatewayIssue,
            'transferPayment' => $this->resolveTransferPaymentPayload(),
            'term' => $this->resolveTermsPayload(),
        ]);
    }

    public function redirectBlockedPaymentInitialize(string $orderReference): RedirectResponse
    {
        return redirect()
            ->route('home')
            ->with('error', 'You are not allowed to jump the order process. Please use the approved order sequence.');
    }

    public function initializePayment(
        Request $request,
        ServiceOrder $serviceOrder,
        PaystackService $paystackService,
        FlutterwaveService $flutterwaveService
    ): RedirectResponse
    {
        if (! $this->hasOrderAccess($request, $serviceOrder)) {
            return redirect()
                ->route('home')
                ->with('error', 'You are not allowed to jump the order process. Please use the approved order sequence.');
        }

        if ($serviceOrder->payment_status === 'paid') {
            return redirect()->route('orders.show', $serviceOrder)->with('success', 'This order has already been paid.');
        }
        if ((float) $serviceOrder->amount <= 0 || (string) $serviceOrder->payment_status === 'not_required') {
            return redirect()->route('orders.show', $serviceOrder)->with('success', 'This order does not require online payment.');
        }

        $provider = strtolower(trim((string) ($serviceOrder->payment_provider ?: 'paystack')));
        $callbackUrl = route('orders.payment.callback', ['provider' => $provider]);
        $gatewayIssue = $this->paymentGatewayIssue($provider);

        if ($gatewayIssue !== null) {
            Log::warning('Payment initialization blocked because provider is not configured.', [
                'order_id' => $serviceOrder->id,
                'provider' => $provider,
                'issue' => $gatewayIssue,
            ]);

            return back()->with('error', $gatewayIssue);
        }

        if (app()->isProduction() && str_starts_with($callbackUrl, 'http://')) {
            $callbackUrl = 'https://'.ltrim(substr($callbackUrl, 7), '/');
        }

        $reference = $serviceOrder->paystack_reference ?: strtoupper('BO-'.Str::random(24));
        $encryptedMetadata = $this->buildEncryptedPaymentMetadata($serviceOrder, $provider);

        try {
            if ($provider === 'flutterwave') {
                $payment = $flutterwaveService->initialize(
                    $serviceOrder->email,
                    (float) $serviceOrder->amount,
                    $reference,
                    $callbackUrl,
                    (string) $serviceOrder->currency,
                    $encryptedMetadata,
                );
            } else {
                $payment = $paystackService->initialize(
                    $serviceOrder->email,
                    (int) round((float) $serviceOrder->amount * 100),
                    $reference,
                    $callbackUrl,
                    (string) $serviceOrder->currency,
                    $encryptedMetadata,
                );
            }
        } catch (Throwable $exception) {
            Log::warning('Payment initialization failed.', [
                'order_id' => $serviceOrder->id,
                'provider' => $provider,
                'reference' => $reference,
                'error' => $exception->getMessage(),
            ]);

            return back()->with('error', $this->paymentInitializationErrorMessage($exception, $provider));
        }

        $serviceOrder->update([
            'paystack_reference' => $payment['reference'],
            'paystack_access_code' => (string) ($payment['access_code'] ?? ''),
            'payment_status' => 'processing',
        ]);

        return redirect()->away($payment['authorization_url']);
    }

    public function submitTransferPayment(Request $request, ServiceOrder $serviceOrder): RedirectResponse
    {
        if (! $this->hasOrderAccess($request, $serviceOrder)) {
            return redirect()
                ->route('home')
                ->with('error', 'You are not allowed to jump the order process. Please use the approved order sequence.');
        }

        if ($serviceOrder->payment_status === 'paid') {
            return redirect()->route('orders.show', $serviceOrder)->with('success', 'This order has already been paid.');
        }

        if ((float) $serviceOrder->amount <= 0 || (string) $serviceOrder->payment_status === 'not_required') {
            return redirect()->route('orders.show', $serviceOrder)->with('success', 'This order does not require immediate payment.');
        }

        $transfer = $this->resolveTransferPaymentPayload();

        if (! (bool) ($transfer['enabled'] ?? false)) {
            return back()->with('error', 'Bank transfer is currently unavailable. Please use online checkout.');
        }

        $payload = $request->validate([
            'transfer_reference' => ['nullable', 'string', 'max:120'],
        ]);

        $reference = trim((string) ($payload['transfer_reference'] ?? ''));

        ServiceOrderUpdate::create([
            'service_order_id' => $serviceOrder->id,
            'status' => 'payment_pending_confirmation',
            'progress_percent' => (int) $serviceOrder->progress_percent,
            'note' => $reference !== ''
                ? 'Client reported bank transfer payment. Reference: '.$reference.'. Awaiting confirmation.'
                : 'Client selected bank transfer payment and is awaiting confirmation.',
            'is_public' => true,
            'created_by' => $request->user()?->id,
        ]);

        $serviceOrder->update([
            'payment_status' => 'processing',
        ]);

        $supportEmail = trim((string) config('bellah.invoice.company_email', 'support@bellahoptions.com'));

        return redirect()
            ->route('orders.show', $serviceOrder)
            ->with('success', 'Transfer payment has been submitted for confirmation. Please share your receipt via '.$supportEmail.'.');
    }

    private function paymentGatewayIssue(string $provider): ?string
    {
        $provider = strtolower(trim($provider));
        $appUrl = strtolower(trim((string) config('app.url', '')));

        if (app()->isProduction() && ! str_starts_with($appUrl, 'https://')) {
            return 'Secure HTTPS must be enabled before online payments can start.';
        }

        if ($provider === 'flutterwave') {
            $publicKey = trim((string) config('services.flutterwave.public_key', ''));
            $secretKey = trim((string) config('services.flutterwave.secret_key', ''));

            if ($publicKey === '' || $secretKey === '') {
                return 'Flutterwave is not configured yet. Please contact support.';
            }

            return null;
        }

        $publicKey = trim((string) config('services.paystack.public_key', ''));
        $secretKey = trim((string) config('services.paystack.secret_key', ''));

        if ($publicKey === '' || $secretKey === '') {
            return 'Paystack is not configured yet. Please contact support.';
        }

        return null;
    }

    /**
     * @return array<string, mixed>
     */
    private function buildEncryptedPaymentMetadata(ServiceOrder $serviceOrder, string $provider): array
    {
        $payload = json_encode([
            'order_uuid' => (string) $serviceOrder->uuid,
            'order_code' => (string) $serviceOrder->order_code,
            'provider' => strtolower(trim($provider)),
            'created_at' => now()->toIso8601String(),
        ]);

        $encryptedPayload = is_string($payload)
            ? Crypt::encryptString($payload)
            : Crypt::encryptString((string) $serviceOrder->uuid);

        return [
            'bo_payload' => $encryptedPayload,
            'bo_v' => '1',
        ];
    }

    private function paymentInitializationErrorMessage(Throwable $exception, string $provider): string
    {
        $message = trim($exception->getMessage());

        if ($message === '') {
            return 'Unable to start payment right now. Please try again shortly.';
        }

        $providerLabel = ucfirst(strtolower(trim($provider)));
        $normalized = strtolower($message);

        if (str_contains($normalized, 'secret key')) {
            return $providerLabel.' is not configured yet. Please contact support.';
        }

        if (str_contains($normalized, 'unable to connect')) {
            return 'Unable to reach '.$providerLabel.' right now. Please try again shortly.';
        }

        if (app()->isProduction()) {
            return 'Payment initialization failed: '.$message;
        }

        return $message;
    }

    /**
     * @return array{enabled:bool,account_number:string,account_name:string,bank_name:string,instructions:string}
     */
    private function resolveTransferPaymentPayload(): array
    {
        $accountNumber = trim((string) config('bellah.payment.transfer.account_number', ''));
        $accountName = trim((string) config('bellah.payment.transfer.account_name', ''));
        $bankName = trim((string) config('bellah.payment.transfer.bank_name', ''));
        $instructions = trim((string) config('bellah.payment.transfer.instructions', ''));
        $enabled = (bool) config('bellah.payment.transfer.enabled', true)
            && $accountNumber !== ''
            && $accountName !== ''
            && $bankName !== '';

        return [
            'enabled' => $enabled,
            'account_number' => $accountNumber,
            'account_name' => $accountName,
            'bank_name' => $bankName,
            'instructions' => $instructions,
        ];
    }

    /**
     * @param  array<string, mixed>  $localization
     * @return array{
     *   preferred_provider:string,
     *   paystack:array{available:bool,message:string},
     *   fallback_account:?array{
     *     account_number:string,
     *     account_name:string,
     *     bank_name:string,
     *     instructions:string,
     *     support_email:string
     *   }
     * }
     */
    private function orderFormPaymentReadiness(array $localization, PaystackService $paystackService): array
    {
        $preferredProvider = strtolower(trim((string) ($localization['payment_processor'] ?? 'paystack')));
        $paystack = $this->resolvePaystackReadiness($paystackService);
        $fallbackAccount = ! $paystack['available']
            ? $this->resolveTransferFallbackDetails()
            : null;

        return [
            'preferred_provider' => $preferredProvider,
            'paystack' => $paystack,
            'fallback_account' => $fallbackAccount,
        ];
    }

    /**
     * @return array{available:bool,message:string}
     */
    private function resolvePaystackReadiness(PaystackService $paystackService): array
    {
        $gatewayIssue = $this->paymentGatewayIssue('paystack');
        if ($gatewayIssue !== null) {
            return [
                'available' => false,
                'message' => $gatewayIssue,
            ];
        }

        if (app()->environment('testing')) {
            return [
                'available' => true,
                'message' => '',
            ];
        }

        if (! app()->isProduction()) {
            return [
                'available' => true,
                'message' => '',
            ];
        }

        $cacheKey = 'paystack:health-check:v1';

        return Cache::remember($cacheKey, now()->addMinutes(5), function () use ($paystackService): array {
            return $paystackService->healthCheck();
        });
    }

    /**
     * @return array{
     *   account_number:string,
     *   account_name:string,
     *   bank_name:string,
     *   instructions:string,
     *   support_email:string
     * }|null
     */
    private function resolveTransferFallbackDetails(): ?array
    {
        $accountNumber = trim((string) config('bellah.payment.transfer.account_number', ''));
        $accountName = trim((string) config('bellah.payment.transfer.account_name', ''));
        $bankName = trim((string) config('bellah.payment.transfer.bank_name', ''));
        $instructions = trim((string) config('bellah.payment.transfer.instructions', ''));
        $supportEmail = trim((string) config('bellah.invoice.company_email', 'support@bellahoptions.com'));

        if ($accountNumber === '' || $accountName === '' || $bankName === '') {
            return null;
        }

        return [
            'account_number' => $accountNumber,
            'account_name' => $accountName,
            'bank_name' => $bankName,
            'instructions' => $instructions,
            'support_email' => $supportEmail,
        ];
    }

    /**
     * @return array<int, string>
     */
    private function checkoutServiceSlugs(): array
    {
        return array_values(array_keys(config('service_orders.services', [])));
    }

    /**
     * @param  array<string, mixed>  $serviceEntry
     * @return array<string, mixed>
     */
    private function localizeServicePackages(array $serviceEntry, string $currency, string $serviceSlug): array
    {
        $packages = (array) ($serviceEntry['packages'] ?? []);
        $localizedPackages = [];

        foreach ($packages as $packageCode => $package) {
            if (! is_string($packageCode) || ! is_array($package)) {
                continue;
            }

            $priceNgn = round((float) ($package['price'] ?? 0), 2);
            $originalPriceNgn = round((float) ($package['original_price'] ?? $priceNgn), 2);
            $discountPriceNgn = isset($package['discount_price']) && is_numeric($package['discount_price'])
                ? round((float) $package['discount_price'], 2)
                : null;
            $localizedPackages[$packageCode] = [
                ...$package,
                'price' => $this->convertAmountFromNgn($priceNgn, $currency),
                'base_price_ngn' => $originalPriceNgn,
                'discount_price' => $discountPriceNgn !== null ? $this->convertAmountFromNgn($discountPriceNgn, $currency) : null,
            ];
        }

        $trialPackage = $this->trialPackageData($serviceSlug);
        if (is_array($trialPackage)) {
            $trialPriceNgn = round((float) ($trialPackage['price'] ?? 0), 2);
            $localizedPackages[self::TRIAL_PACKAGE_CODE] = [
                ...$trialPackage,
                'is_trial' => true,
                'price' => $this->convertAmountFromNgn($trialPriceNgn, $currency),
                'base_price_ngn' => $trialPriceNgn,
                'discount_price' => null,
            ];
        }

        return [
            ...$serviceEntry,
            'packages' => $localizedPackages,
        ];
    }

    private function convertAmountFromNgn(float $amountNgn, string $currency): float
    {
        return app(VisitorLocalization::class)->convertFromNgn($amountNgn, $currency);
    }

    /**
     * @param  array<string, array<string, mixed>>  $addons
     * @return array<string, array<string, mixed>>
     */
    private function localizeLogoAddons(array $addons, string $currency): array
    {
        $localizedAddons = [];

        foreach ($addons as $packageCode => $addon) {
            if (! is_string($packageCode) || ! is_array($addon)) {
                continue;
            }

            $priceNgn = round((float) ($addon['price'] ?? 0), 2);
            $localizedAddons[$packageCode] = [
                ...$addon,
                'price' => $this->convertAmountFromNgn($priceNgn, $currency),
                'base_price_ngn' => $priceNgn,
            ];
        }

        return $localizedAddons;
    }

    public function paymentCallback(
        Request $request,
        PaystackService $paystackService,
        FlutterwaveService $flutterwaveService
    ): RedirectResponse
    {
        $provider = strtolower(trim((string) $request->query('provider', 'paystack')));
        $reference = trim((string) $request->query($provider === 'flutterwave' ? 'tx_ref' : 'reference', ''));

        if ($reference === '') {
            return redirect()->route('home')->with('error', 'Missing payment reference.');
        }

        $serviceOrder = ServiceOrder::query()->with('invoice')->where('paystack_reference', $reference)->first();

        if (! $serviceOrder) {
            return redirect()->route('home')->with('error', 'Payment order was not found.');
        }

        try {
            $verification = $provider === 'flutterwave'
                ? $flutterwaveService->verify($reference)
                : $paystackService->verify($reference);
            $data = (array) ($verification['data'] ?? []);

            $status = strtolower(trim((string) ($data['status'] ?? '')));
            $amount = $provider === 'flutterwave'
                ? (float) ($data['amount'] ?? 0)
                : ((int) ($data['amount'] ?? 0) / 100);
            $currency = strtoupper((string) ($data['currency'] ?? ($data['currency_code'] ?? '')));

            $expectedAmount = round((float) $serviceOrder->amount, 2);
            $expectedCurrency = strtoupper((string) $serviceOrder->currency);

            $isSuccess = $provider === 'flutterwave'
                ? in_array($status, ['successful', 'completed', 'success'], true)
                : $status === 'success';
            $hasTrustedMetadata = $this->paymentMetadataMatchesOrder($serviceOrder, $provider, $data);

            if ($isSuccess && $amount >= $expectedAmount && $currency === $expectedCurrency && $hasTrustedMetadata) {
                $this->markOrderPaid($serviceOrder, $reference, $data);
                $request->session()->put('service_order_access.'.$serviceOrder->uuid, true);

                return redirect()->route('orders.show', $serviceOrder)->with('success', 'Payment confirmed successfully.');
            }

            $serviceOrder->update([
                'payment_status' => 'failed',
            ]);

            return $this->paymentVerificationFailedRedirect($request, $serviceOrder);
        } catch (Throwable $exception) {
            Log::warning('Payment callback verification failed.', [
                'order_id' => $serviceOrder->id,
                'provider' => $provider,
                'reference' => $reference,
                'error' => $exception->getMessage(),
            ]);

            return $this->paymentVerificationFailedRedirect($request, $serviceOrder, true);
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

    public function flutterwaveWebhook(Request $request, FlutterwaveService $flutterwaveService): JsonResponse
    {
        $payload = (array) $request->json()->all();
        $signature = trim((string) $request->header('verif-hash', ''));
        $secret = trim((string) config('services.flutterwave.webhook_hash', ''));

        if ($signature === '' || $secret === '' || ! hash_equals($secret, $signature)) {
            return response()->json(['message' => 'Invalid webhook signature.'], 401);
        }

        $reference = trim((string) data_get($payload, 'data.tx_ref', ''));
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
            $verification = $flutterwaveService->verify($reference);
            $data = (array) ($verification['data'] ?? []);

            $status = strtolower(trim((string) ($data['status'] ?? '')));
            $amount = (float) ($data['amount'] ?? 0);
            $currency = strtoupper((string) ($data['currency'] ?? ($data['currency_code'] ?? '')));
            $expectedAmount = round((float) $serviceOrder->amount, 2);
            $expectedCurrency = strtoupper((string) $serviceOrder->currency);

            if (in_array($status, ['successful', 'completed', 'success'], true) && $amount >= $expectedAmount && $currency === $expectedCurrency) {
                $this->markOrderPaid($serviceOrder, $reference, $data);

                return response()->json(['message' => 'Payment recorded.']);
            }

            return response()->json(['message' => 'Verification failed.'], 422);
        } catch (Throwable $exception) {
            Log::warning('Flutterwave webhook verification failed.', [
                'order_id' => $serviceOrder->id,
                'reference' => $reference,
                'error' => $exception->getMessage(),
            ]);

            return response()->json(['message' => 'Verification failed.'], 500);
        }
    }

    public function show(Request $request, ServiceOrder $serviceOrder, ServiceOrderCatalog $catalog): Response
    {
        $this->authorizeOrderAccess($request, $serviceOrder);

        $serviceOrder->load([
            'invoice',
            'updates' => static fn ($query) => $query->where('is_public', true)->latest('id'),
        ]);

        return Inertia::render('Orders/Show', [
            'order' => $this->orderPayload($serviceOrder, true),
            'serviceBriefLabels' => $catalog->intakeFieldLabels((string) $serviceOrder->service_slug),
            'serviceBriefData' => (array) data_get($serviceOrder->brief_payload, 'service_specific', []),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function orderPayload(ServiceOrder $order, bool $includeUpdates = false): array
    {
        $payload = [
            'id' => $order->id,
            'uuid' => $order->uuid,
            'order_code' => $order->order_code,
            'service_slug' => $order->service_slug,
            'service_name' => $order->service_name,
            'package_code' => $order->package_code,
            'package_name' => $order->package_name,
            'currency' => strtoupper((string) $order->currency),
            'base_amount' => (float) ($order->base_amount ?? 0),
            'discount_code' => $order->discount_code,
            'discount_amount' => (float) ($order->discount_amount ?? 0),
            'amount' => (float) $order->amount,
            'logo_addon' => data_get($order->brief_payload, 'logo_addon'),
            'payment_provider' => strtolower(trim((string) $order->payment_provider)) ?: 'paystack',
            'payment_status' => (string) $order->payment_status,
            'order_status' => (string) $order->order_status,
            'progress_percent' => (int) $order->progress_percent,
            'full_name' => $order->full_name,
            'email' => $order->email,
            'phone' => $order->phone,
            'business_name' => $order->business_name,
            'created_at' => $order->created_at?->toIso8601String(),
            'paid_at' => $order->paid_at?->toIso8601String(),
            'invoice' => $order->invoice ? [
                'invoice_number' => $order->invoice->invoice_number,
                'amount' => (float) $order->invoice->amount,
                'currency' => strtoupper((string) $order->invoice->currency),
                'status' => (string) $order->invoice->status,
                'payment_reference' => $order->invoice->payment_reference,
            ] : null,
        ];

        if ($includeUpdates) {
            $payload['updates'] = $order->updates->map(fn (ServiceOrderUpdate $update): array => [
                'id' => $update->id,
                'status' => (string) $update->status,
                'note' => $update->note,
                'progress_percent' => (int) $update->progress_percent,
                'created_at' => $update->created_at?->toIso8601String(),
            ])->values();
        }

        return $payload;
    }

    public function storeUpdate(
        StoreServiceOrderUpdateRequest $request,
        ServiceOrder $serviceOrder,
        ClientReviewService $clientReviewService
    ): RedirectResponse
    {
        abort_unless((bool) $request->user()?->isStaff(), 403);

        $data = $request->validated();
        $previousStatus = (string) $serviceOrder->order_status;

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

        if ($previousStatus !== 'completed' && $data['status'] === 'completed') {
            $clientReviewService->requestFromServiceOrder($serviceOrder->fresh());
        }

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
     * @return array{id:int,title:string,content:string,updated_at:?string}|null
     */
    private function resolveTermsPayload(): ?array
    {
        try {
            $term = Term::query()
                ->whereRaw('LOWER(title) LIKE ?', ['%terms%'])
                ->latest('updated_at')
                ->first();
        } catch (Throwable $exception) {
            Log::warning('Unable to load terms for order payment.', [
                'message' => $exception->getMessage(),
            ]);

            return null;
        }

        if (! $term instanceof Term) {
            return null;
        }

        return [
            'id' => $term->id,
            'title' => (string) $term->title,
            'content' => (string) $term->content,
            'updated_at' => $term->updated_at?->toIso8601String(),
        ];
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
        abort_unless($this->hasOrderAccess($request, $serviceOrder), 403);
    }

    private function hasOrderAccess(Request $request, ServiceOrder $serviceOrder): bool
    {
        $user = $request->user();

        if ($user && ($user->isStaff() || $serviceOrder->user_id === $user->id)) {
            return true;
        }

        return (bool) $request->session()->get('service_order_access.'.$serviceOrder->uuid, false);
    }

    private function paymentVerificationFailedRedirect(
        Request $request,
        ServiceOrder $serviceOrder,
        bool $isTemporary = false
    ): RedirectResponse {
        $message = $isTemporary
            ? 'Payment verification is temporarily unavailable. Please try again.'
            : 'Payment could not be verified. Please try again.';

        if ($this->hasOrderAccess($request, $serviceOrder)) {
            return redirect()->route('orders.payment.show', $serviceOrder)->with('error', $message);
        }

        return redirect()->route('home')->with('error', $message);
    }

    /**
     * @param  array<string, mixed>  $gatewayData
     */
    private function paymentMetadataMatchesOrder(ServiceOrder $serviceOrder, string $provider, array $gatewayData): bool
    {
        $metadataCandidates = [
            data_get($gatewayData, 'metadata'),
            data_get($gatewayData, 'meta'),
            data_get($gatewayData, 'meta_data'),
        ];

        foreach ($metadataCandidates as $metadataCandidate) {
            if (! is_array($metadataCandidate)) {
                continue;
            }

            $encryptedPayload = trim((string) ($metadataCandidate['bo_payload'] ?? ''));
            if ($encryptedPayload === '') {
                continue;
            }

            try {
                $decrypted = Crypt::decryptString($encryptedPayload);
                $decoded = json_decode($decrypted, true);
            } catch (Throwable) {
                return false;
            }

            if (! is_array($decoded)) {
                return false;
            }

            $payloadOrderUuid = trim((string) ($decoded['order_uuid'] ?? ''));
            $payloadProvider = strtolower(trim((string) ($decoded['provider'] ?? '')));
            $expectedProvider = strtolower(trim($provider));

            if (
                $payloadOrderUuid === ''
                || ! hash_equals((string) $serviceOrder->uuid, $payloadOrderUuid)
            ) {
                return false;
            }

            if ($payloadProvider !== '' && $payloadProvider !== $expectedProvider) {
                return false;
            }

            return true;
        }

        // Allow legacy transactions that were initialized before metadata was enforced.
        return true;
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

        try {
            $this->sendPostPaymentClientEmails($serviceOrder->fresh('invoice'));
        } catch (Throwable $exception) {
            Log::warning('Post-payment client email sequence failed.', [
                'service_order_id' => $serviceOrder->id,
                'reference' => $reference,
                'error' => $exception->getMessage(),
            ]);
        }
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

    private function generateOrderCode(): string
    {
        do {
            $orderCode = 'BO'.strtoupper(Str::random(6));
        } while (ServiceOrder::query()->where('order_code', $orderCode)->exists());

        return $orderCode;
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    private function serviceBriefPayload(
        array $payload,
        string $serviceSlug,
        ServiceOrderCatalog $catalog,
        string $logoAddonCode = '',
        float $logoAddonAmountNgn = 0.0,
        ?array $logoAddon = null,
        bool $isTrialOrder = false,
    ): array
    {
        $serviceSpecific = [];

        foreach ($catalog->intakeFields($serviceSlug) as $field) {
            $name = (string) ($field['name'] ?? '');

            if ($name === '' || ! array_key_exists($name, $payload)) {
                continue;
            }

            $value = $payload[$name];

            if ($value === null || $value === '') {
                continue;
            }

            $serviceSpecific[$name] = $value;
        }

        return array_filter([
            'is_trial_request' => $isTrialOrder,
            'has_logo' => $payload['has_logo'] ?? null,
            'has_content' => $payload['has_content'] ?? null,
            'content_development_interest' => $payload['content_development_interest'] ?? null,
            'logo_design_interest' => $payload['logo_design_interest'] ?? null,
            'logo_addon' => $logoAddonCode !== '' && is_array($logoAddon) ? [
                'package_code' => $logoAddonCode,
                'name' => (string) ($logoAddon['name'] ?? ucfirst(str_replace('-', ' ', $logoAddonCode))),
                'price_ngn' => round($logoAddonAmountNgn, 2),
                'description' => (string) ($logoAddon['description'] ?? ''),
            ] : null,
            'timeline_preference' => $payload['timeline_preference'] ?? null,
            'service_specific' => $serviceSpecific !== [] ? $serviceSpecific : null,
        ], static fn (mixed $value): bool => $value !== null && $value !== []);
    }

    private function isTrialPackageSelection(string $serviceSlug, string $packageCode): bool
    {
        return $packageCode === self::TRIAL_PACKAGE_CODE
            && is_array($this->trialPackageData($serviceSlug));
    }

    /**
     * @return array<string, mixed>|null
     */
    private function trialPackageData(string $serviceSlug): ?array
    {
        if (! in_array($serviceSlug, self::TRIAL_SERVICE_SLUGS, true)) {
            return null;
        }

        $feeNgn = PlatformSettings::socialGraphicTrialFeeNgn();

        if ($feeNgn <= 0) {
            return null;
        }

        return [
            'name' => 'Trial Design Request',
            'price' => $feeNgn,
            'description' => 'A one-off trial request outside regular plans and packs.',
            'features' => [
                'Single trial request',
                'Available for social media or graphic design',
            ],
        ];
    }

    /**
     * @param  array<string, mixed>  $payload
     * @param  array<string, mixed>|null  $logoAddon
     */
    private function invoiceDescription(array $payload, ?array $logoAddon = null): string
    {
        $description = trim((string) ($payload['project_summary'] ?? ''));

        if (! is_array($logoAddon)) {
            return $description;
        }

        $logoAddonName = trim((string) ($logoAddon['name'] ?? ''));

        if ($logoAddonName === '') {
            return $description;
        }

        return trim($description.' | Logo Add-on: '.$logoAddonName);
    }

    /**
     * @return array{
     *   humanVerificationMode:string,
     *   humanCheckQuestion:string,
     *   humanCheckNonce:string,
     *   turnstileSiteKey:string,
     *   formRenderedAt:int
     * }
     */
    private function createHumanVerificationChallenge(Request $request): array
    {
        if (app()->isProduction()) {
            $request->session()->forget('service_order_human_check');

            return [
                'humanVerificationMode' => 'turnstile',
                'humanCheckQuestion' => '',
                'humanCheckNonce' => '',
                'turnstileSiteKey' => trim((string) config('services.turnstile.site_key', '')),
                'formRenderedAt' => now()->timestamp,
            ];
        }

        $leftOperand = random_int(2, 12);
        $rightOperand = random_int(1, 12);
        $answer = $leftOperand + $rightOperand;
        $issuedAt = now()->timestamp;
        $nonce = Str::random(32);

        $request->session()->put('service_order_human_check', [
            'answer' => (string) $answer,
            'issued_at' => $issuedAt,
            'nonce' => $nonce,
        ]);

        return [
            'humanVerificationMode' => 'math',
            'humanCheckQuestion' => "{$leftOperand} + {$rightOperand} = ?",
            'humanCheckNonce' => $nonce,
            'turnstileSiteKey' => '',
            'formRenderedAt' => $issuedAt,
        ];
    }

    private function sendOrderSubmittedAdminAlert(ServiceOrder $order): void
    {
        $adminRecipients = $this->orderAdminRecipients();

        if ($adminRecipients === []) {
            return;
        }

        Mail::to($adminRecipients)->send(new ServiceOrderSubmittedAdminAlertMail($order));
    }

    private function sendServiceOrderClientEmails(ServiceOrder $order): void
    {
        $order->loadMissing('invoice.serviceOrder');

        if (! $order->invoice || blank($order->email)) {
            return;
        }

        Mail::to($order->email)->send(new InvoiceIssuedMail($order->invoice));
        Mail::to($order->email)->send(new ServiceOrderClientSummaryMail($order));
    }

    private function sendPostPaymentClientEmails(?ServiceOrder $order): void
    {
        if (! $order instanceof ServiceOrder) {
            return;
        }

        $order->loadMissing('invoice');
        $recipient = trim((string) $order->email);

        if ($recipient === '') {
            return;
        }

        if ($order->invoice) {
            Mail::to($recipient)->send(new InvoicePaidReceiptMail($order->invoice->fresh()));
        }

        Mail::to($recipient)->send(new ServiceOrderPaymentThankYouMail($order));

        $hasContentReady = data_get($order->brief_payload, 'has_content') === 'yes';
        $hasBrandAssetsReady = data_get($order->brief_payload, 'has_logo') === 'yes';

        if ($hasContentReady || $hasBrandAssetsReady) {
            Mail::to($recipient)->send(new ServiceOrderContentAssetRequestMail($order, $hasContentReady, $hasBrandAssetsReady));
        }
    }

    /**
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    private function sanitizeProspectDraftPayload(array $payload): array
    {
        $sensitiveKeys = [
            'password',
            'password_confirmation',
            'human_check_answer',
            'human_check_nonce',
            'form_rendered_at',
            'turnstile_token',
            'website',
            'company_name',
            'contact_notes',
            'prospect_draft_token',
            'draft_token',
        ];

        $clean = [];
        $count = 0;

        foreach ($payload as $key => $value) {
            if ($count >= 80) {
                break;
            }

            if (! is_string($key)) {
                continue;
            }

            $key = trim($key);
            if ($key === '' || in_array($key, $sensitiveKeys, true)) {
                continue;
            }

            $cleanValue = $this->sanitizeProspectDraftValue($value);

            if ($cleanValue === null || $cleanValue === '') {
                continue;
            }

            $clean[$key] = $cleanValue;
            $count++;
        }

        return $clean;
    }

    /**
     * @return array<string, mixed>|string|int|float|bool|null
     */
    private function sanitizeProspectDraftValue(mixed $value, int $depth = 0): array|string|int|float|bool|null
    {
        if ($depth > 3) {
            return null;
        }

        if ($value === null || is_bool($value) || is_int($value) || is_float($value)) {
            return $value;
        }

        if (is_string($value)) {
            $trimmed = trim($value);

            return $trimmed === '' ? null : Str::limit($trimmed, 3000, '');
        }

        if (! is_array($value)) {
            return null;
        }

        $clean = [];
        $index = 0;

        foreach ($value as $nestedKey => $nestedValue) {
            if ($index >= 40) {
                break;
            }

            if (! is_string($nestedKey) && ! is_int($nestedKey)) {
                continue;
            }

            $normalizedKey = is_string($nestedKey) ? trim($nestedKey) : $nestedKey;
            if ($normalizedKey === '') {
                continue;
            }

            $cleanValue = $this->sanitizeProspectDraftValue($nestedValue, $depth + 1);
            if ($cleanValue === null || $cleanValue === '') {
                continue;
            }

            $clean[$normalizedKey] = $cleanValue;
            $index++;
        }

        return $clean;
    }

    private function markProspectAsConverted(string $draftToken, ServiceOrder $order): void
    {
        $prospects = collect();
        $token = trim($draftToken);

        if ($token !== '' && Str::isUuid($token)) {
            $tokenMatch = OrderProspect::query()
                ->where('uuid', $token)
                ->first();

            if ($tokenMatch) {
                $prospects->push($tokenMatch);
            }
        }

        $email = strtolower(trim((string) $order->email));
        $phone = trim((string) $order->phone);

        if ($email !== '' || $phone !== '') {
            $fallbackMatches = OrderProspect::query()
                ->whereNull('converted_at')
                ->where('status', '!=', OrderProspect::STATUS_CONVERTED)
                ->where('service_slug', (string) $order->service_slug)
                ->where('created_at', '>=', now()->subDays(21))
                ->where(function ($query) use ($email, $phone): void {
                    if ($email !== '') {
                        $query->orWhereRaw('LOWER(email) = ?', [$email]);
                    }

                    if ($phone !== '') {
                        $query->orWhere('phone', $phone);
                    }
                })
                ->orderByDesc('id')
                ->limit(5)
                ->get();

            $prospects = $prospects->concat($fallbackMatches);
        }

        $prospects
            ->unique('id')
            ->each(function (OrderProspect $prospect) use ($order): void {
                $prospect->fill([
                    'user_id' => $order->user_id,
                    'service_order_id' => $order->id,
                    'service_slug' => (string) $order->service_slug,
                    'service_name' => (string) $order->service_name,
                    'service_package' => (string) $order->package_code,
                    'status' => OrderProspect::STATUS_CONVERTED,
                    'converted_at' => now(),
                    'abandoned_at' => null,
                ]);
                $prospect->save();
            });
    }

    /**
     * @return array<int, string>
     */
    private function orderAdminRecipients(): array
    {
        $rawRecipients = (array) config('bellah.orders.admin_notification_emails', []);

        return array_values(array_unique(array_filter(array_map(
            static fn (mixed $email): string => strtolower(trim((string) $email)),
            $rawRecipients,
        ))));
    }
}
