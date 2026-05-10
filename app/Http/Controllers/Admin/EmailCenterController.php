<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Mail\NewsletterCampaignMail;
use App\Models\Customer;
use App\Models\Newsletter;
use App\Models\ServiceOrder;
use App\Models\User;
use App\Models\Waitlist;
use App\Support\NewsletterTemplating;
use App\Support\PlatformSettings;
use App\Support\ServiceOrderCatalog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;
use Throwable;

class EmailCenterController extends Controller
{
    public function index(Request $request, ServiceOrderCatalog $catalog, NewsletterTemplating $templating): Response
    {
        abort_unless((bool) $request->user()?->canManageSettings(), 403);

        $services = collect($catalog->all())
            ->map(fn (array $service, string $slug): array => [
                'slug' => $slug,
                'name' => (string) ($service['name'] ?? ucfirst($slug)),
            ])
            ->values()
            ->all();

        return Inertia::render('Admin/EmailCenter', [
            'campaigns' => Newsletter::query()
                ->latest('id')
                ->limit(120)
                ->get()
                ->map(fn (Newsletter $campaign): array => [
                    'id' => $campaign->id,
                    'name' => (string) $campaign->name,
                    'audience' => (string) $campaign->audience,
                    'campaign_type' => (string) ($campaign->campaign_type ?: 'newsletter'),
                    'preview_text' => (string) ($campaign->preview_text ?: ''),
                    'from_email' => (string) ($campaign->from_email ?: ''),
                    'subject_template' => (string) $campaign->subject_template,
                    'html_template' => (string) $campaign->html_template,
                    'dynamic_fields' => is_array($campaign->dynamic_fields) ? $campaign->dynamic_fields : [],
                    'audience_filters' => is_array($campaign->audience_filters) ? $campaign->audience_filters : [],
                    'builder_layout' => is_array($campaign->builder_layout) ? $campaign->builder_layout : [],
                    'is_active' => (bool) $campaign->is_active,
                    'last_sent_at' => $campaign->last_sent_at?->toDateTimeString(),
                    'last_sent_count' => (int) ($campaign->last_sent_count ?? 0),
                    'created_at' => $campaign->created_at?->toDateTimeString(),
                ])
                ->values()
                ->all(),
            'placeholders' => $templating->placeholders(),
            'email_templates' => PlatformSettings::emailTemplateLibrary(),
            'invoice_style' => PlatformSettings::invoiceStyle(),
            'services' => $services,
            'audiences' => [
                ['value' => 'all', 'label' => 'All Contacts'],
                ['value' => 'purchasers', 'label' => 'Customers Who Purchased Before'],
                ['value' => 'prospects', 'label' => 'Prospects (No Paid Purchase Yet)'],
            ],
            'sources' => [
                ['value' => 'all', 'label' => 'All Sources'],
                ['value' => 'users', 'label' => 'Registered Users'],
                ['value' => 'customers', 'label' => 'Customers'],
                ['value' => 'waitlist', 'label' => 'Waitlist Leads'],
            ],
            'campaign_default_from_email' => (string) config('bellah.marketing.sender_email', 'sales@bellahoptions.com'),
        ]);
    }

    public function storeCampaign(Request $request): RedirectResponse
    {
        $user = $request->user();
        abort_unless((bool) $user?->canManageSettings(), 403);

        $payload = $this->validateCampaignPayload($request);

        Newsletter::query()->create([
            'name' => $payload['name'],
            'audience' => $payload['audience'],
            'campaign_type' => 'newsletter',
            'preview_text' => $payload['preview_text'],
            'from_email' => $payload['from_email'],
            'subject_template' => $payload['subject_template'],
            'html_template' => $payload['html_template'],
            'dynamic_fields' => $payload['dynamic_fields'],
            'audience_filters' => $payload['audience_filters'],
            'builder_layout' => $payload['builder_layout'],
            'is_active' => $payload['is_active'],
            'created_by' => $user?->id,
        ]);

        return back()->with('success', 'Email campaign created.');
    }

    public function updateCampaign(Request $request, Newsletter $newsletter): RedirectResponse
    {
        $user = $request->user();
        abort_unless((bool) $user?->canManageSettings(), 403);

        $payload = $this->validateCampaignPayload($request);

        $newsletter->update([
            'name' => $payload['name'],
            'audience' => $payload['audience'],
            'preview_text' => $payload['preview_text'],
            'from_email' => $payload['from_email'],
            'subject_template' => $payload['subject_template'],
            'html_template' => $payload['html_template'],
            'dynamic_fields' => $payload['dynamic_fields'],
            'audience_filters' => $payload['audience_filters'],
            'builder_layout' => $payload['builder_layout'],
            'is_active' => $payload['is_active'],
        ]);

        return back()->with('success', 'Email campaign updated.');
    }

    public function destroyCampaign(Request $request, Newsletter $newsletter): RedirectResponse
    {
        abort_unless((bool) $request->user()?->canManageSettings(), 403);

        $newsletter->delete();

        return back()->with('success', 'Email campaign deleted.');
    }

    public function previewAudience(Request $request, Newsletter $newsletter): JsonResponse
    {
        abort_unless((bool) $request->user()?->canManageSettings(), 403);

        $contacts = $this->resolveAudienceRecipients(
            (string) $newsletter->audience,
            is_array($newsletter->audience_filters) ? $newsletter->audience_filters : [],
        );

        return response()->json([
            'count' => $contacts->count(),
            'sample' => $contacts
                ->take(10)
                ->map(fn (array $contact): array => [
                    'name' => (string) $contact['name'],
                    'email' => (string) $contact['email'],
                    'source' => (string) $contact['source'],
                    'is_purchaser' => (bool) $contact['is_purchaser'],
                ])
                ->values()
                ->all(),
        ]);
    }

    public function sendTest(Request $request, Newsletter $newsletter): RedirectResponse
    {
        abort_unless((bool) $request->user()?->canManageSettings(), 403);

        $validated = $request->validate([
            'test_email' => ['required', 'email:rfc', 'max:255'],
        ]);

        $recipientEmail = strtolower(trim((string) $validated['test_email']));
        $sampleRecipient = [
            'name' => 'Sample Recipient',
            'first_name' => 'Sample',
            'last_name' => 'Recipient',
            'email' => $recipientEmail,
            'source' => 'test',
            'is_purchaser' => false,
        ];

        [$subject, $html] = $this->renderCampaignForRecipient($newsletter, $sampleRecipient);

        Mail::to($recipientEmail)->send(new NewsletterCampaignMail($subject, $html, $newsletter->from_email));

        return back()->with('success', 'Test email sent.');
    }

    public function sendCampaign(Request $request, Newsletter $newsletter): RedirectResponse
    {
        abort_unless((bool) $request->user()?->canManageSettings(), 403);

        $validated = $request->validate([
            'limit' => ['nullable', 'integer', 'min:1', 'max:5000'],
        ]);

        $limit = (int) ($validated['limit'] ?? 0);
        $contacts = $this->resolveAudienceRecipients(
            (string) $newsletter->audience,
            is_array($newsletter->audience_filters) ? $newsletter->audience_filters : [],
        );

        if ($limit > 0) {
            $contacts = $contacts->take($limit);
        }

        $sentCount = 0;

        foreach ($contacts as $recipient) {
            try {
                [$subject, $html] = $this->renderCampaignForRecipient($newsletter, $recipient);
                Mail::to((string) $recipient['email'])->send(new NewsletterCampaignMail($subject, $html, $newsletter->from_email));
                $sentCount++;
            } catch (Throwable $exception) {
                Log::warning('Campaign send failed for recipient.', [
                    'campaign_id' => $newsletter->id,
                    'recipient_email' => (string) ($recipient['email'] ?? ''),
                    'error' => $exception->getMessage(),
                ]);
            }
        }

        $newsletter->update([
            'last_sent_at' => now(),
            'last_sent_count' => $sentCount,
            'last_sent_by' => $request->user()?->id,
        ]);

        return back()->with('success', "Campaign sent to {$sentCount} recipients.");
    }

    public function updateTemplateLibrary(Request $request): RedirectResponse
    {
        abort_unless((bool) $request->user()?->canManageSettings(), 403);

        $validated = $request->validate([
            'email_templates' => ['required', 'array'],
            'email_templates.*.name' => ['nullable', 'string', 'max:120'],
            'email_templates.*.subject_template' => ['nullable', 'string', 'max:255'],
            'email_templates.*.from_email' => ['nullable', 'email:rfc', 'max:255'],
            'email_templates.*.html_template' => ['nullable', 'string', 'max:200000'],
            'email_templates.*.builder_layout' => ['nullable', 'array'],
        ]);

        $templates = [];

        foreach ((array) $validated['email_templates'] as $key => $template) {
            if (! is_string($key) || ! is_array($template)) {
                continue;
            }

            $htmlTemplate = trim((string) ($template['html_template'] ?? ''));
            $builderLayout = is_array($template['builder_layout'] ?? null)
                ? $template['builder_layout']
                : [];

            if ($htmlTemplate === '' && $builderLayout !== []) {
                $htmlTemplate = $this->renderBlocksToHtml($builderLayout);
            }

            $templates[$key] = [
                'name' => (string) ($template['name'] ?? ''),
                'subject_template' => (string) ($template['subject_template'] ?? ''),
                'from_email' => (string) ($template['from_email'] ?? ''),
                'html_template' => $htmlTemplate,
                'builder_layout' => $builderLayout,
            ];
        }

        PlatformSettings::setEmailTemplateLibrary($templates);

        return back()->with('success', 'System email templates updated.');
    }

    public function uploadHeaderImage(Request $request): JsonResponse
    {
        abort_unless((bool) $request->user()?->canManageSettings(), 403);

        $validated = $request->validate([
            'file' => ['required', 'file', 'mimetypes:image/jpeg,image/png,image/gif,image/webp,image/bmp,image/x-ms-bmp,image/avif', 'max:8192'],
        ]);

        $file = $validated['file'] ?? null;
        if (! $file instanceof UploadedFile) {
            throw ValidationException::withMessages([
                'file' => 'Please upload a valid image file.',
            ]);
        }

        try {
            $publicPath = $this->storeEmailHeaderImage($file);
        } catch (RuntimeException $exception) {
            throw ValidationException::withMessages([
                'file' => $exception->getMessage(),
            ]);
        }

        return response()->json([
            'path' => $publicPath,
            'url' => $publicPath,
            'message' => 'Header image uploaded and optimized successfully.',
        ], 201);
    }

    public function updateInvoiceStyle(Request $request): RedirectResponse
    {
        abort_unless((bool) $request->user()?->canManageSettings(), 403);

        $validated = $request->validate([
            'invoice_style' => ['required', 'array'],
            'invoice_style.primary_color' => ['nullable', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'invoice_style.accent_color' => ['nullable', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'invoice_style.text_color' => ['nullable', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'invoice_style.company_lines' => ['nullable', 'array', 'max:8'],
            'invoice_style.company_lines.*' => ['nullable', 'string', 'max:140'],
            'invoice_style.footer_note' => ['nullable', 'string', 'max:320'],
        ]);

        PlatformSettings::setInvoiceStyle((array) $validated['invoice_style']);

        return back()->with('success', 'Invoice/receipt style updated.');
    }

    /**
     * @return array{
     *  name:string,
     *  audience:string,
     *  preview_text:?string,
     *  from_email:?string,
     *  subject_template:string,
     *  html_template:string,
     *  dynamic_fields:array<string,string>,
     *  audience_filters:array<string,mixed>,
     *  builder_layout:array<int, array<string,mixed>>,
     *  is_active:bool
     * }
     */
    private function validateCampaignPayload(Request $request): array
    {
        $defaultFromEmail = strtolower(trim((string) config('bellah.marketing.sender_email', 'sales@bellahoptions.com')));
        $validated = $request->validate([
            'name' => ['required', 'string', 'min:3', 'max:160'],
            'audience' => ['required', 'string', 'in:all,purchasers,prospects'],
            'preview_text' => ['nullable', 'string', 'max:255'],
            'from_email' => ['nullable', 'email:rfc', 'max:255'],
            'subject_template' => ['required', 'string', 'min:3', 'max:255'],
            'html_template' => ['nullable', 'string', 'max:200000'],
            'dynamic_fields' => ['nullable', 'array'],
            'dynamic_fields.*' => ['nullable', 'string', 'max:1000'],
            'audience_filters' => ['nullable', 'array'],
            'audience_filters.source' => ['nullable', 'string', 'in:all,users,customers,waitlist'],
            'audience_filters.service_slug' => ['nullable', 'string', 'max:80'],
            'builder_layout' => ['nullable', 'array'],
            'is_active' => ['required', 'boolean'],
        ]);

        $htmlTemplate = trim((string) ($validated['html_template'] ?? ''));
        $builderLayout = is_array($validated['builder_layout'] ?? null) ? $validated['builder_layout'] : [];

        if ($htmlTemplate === '' && $builderLayout !== []) {
            $htmlTemplate = $this->renderBlocksToHtml($builderLayout);
        }

        if ($htmlTemplate === '') {
            $htmlTemplate = '<p>Hello {{customer_name}},</p><p>Thank you for being part of Bellah Options.</p>';
        }

        $dynamicFields = [];
        foreach ((array) ($validated['dynamic_fields'] ?? []) as $key => $value) {
            $resolvedKey = trim((string) $key);

            if ($resolvedKey === '' || preg_match('/^[a-zA-Z][a-zA-Z0-9_]{1,50}$/', $resolvedKey) !== 1) {
                continue;
            }

            $dynamicFields[$resolvedKey] = trim((string) $value);
        }

        return [
            'name' => trim((string) $validated['name']),
            'audience' => trim((string) $validated['audience']),
            'preview_text' => trim((string) ($validated['preview_text'] ?? '')) ?: null,
            'from_email' => strtolower(trim((string) ($validated['from_email'] ?? ''))) ?: $defaultFromEmail,
            'subject_template' => trim((string) $validated['subject_template']),
            'html_template' => mb_substr($htmlTemplate, 0, 200000),
            'dynamic_fields' => $dynamicFields,
            'audience_filters' => is_array($validated['audience_filters'] ?? null) ? $validated['audience_filters'] : [],
            'builder_layout' => $builderLayout,
            'is_active' => (bool) $validated['is_active'],
        ];
    }

    /**
     * @param  array<int, array<string, mixed>>  $blocks
     */
    private function renderBlocksToHtml(array $blocks): string
    {
        $html = '';

        foreach ($blocks as $block) {
            if (! is_array($block)) {
                continue;
            }

            $type = strtolower(trim((string) ($block['type'] ?? '')));
            $content = trim((string) ($block['content'] ?? ''));
            $url = trim((string) ($block['url'] ?? ''));
            $alt = trim((string) ($block['alt'] ?? ''));
            $buttonLabel = trim((string) ($block['label'] ?? ''));

            if ($type === 'heading') {
                $html .= '<h2 style="font-family:Arial,sans-serif;color:#0f172a;">'.e($content).'</h2>';
                continue;
            }

            if ($type === 'text') {
                $html .= '<p style="font-family:Arial,sans-serif;color:#334155;line-height:1.7;">'.e($content).'</p>';
                continue;
            }

            if ($type === 'image' && $url !== '') {
                $safeUrl = e($url);
                $safeAlt = e($alt !== '' ? $alt : 'Email image');
                $html .= '<p><img src="'.$safeUrl.'" alt="'.$safeAlt.'" style="max-width:100%;height:auto;border-radius:10px;" /></p>';
                continue;
            }

            if ($type === 'button' && $url !== '' && $buttonLabel !== '') {
                $html .= '<p><a href="'.e($url).'" style="display:inline-block;background:#000285;color:#ffffff;text-decoration:none;padding:12px 16px;border-radius:8px;font-weight:700;">'.e($buttonLabel).'</a></p>';
                continue;
            }

            if ($type === 'divider') {
                $html .= '<hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0;" />';
                continue;
            }

            if ($type === 'spacer') {
                $height = max(8, min(64, (int) ($block['height'] ?? 20)));
                $html .= '<div style="height:'.$height.'px;"></div>';
            }
        }

        return $html;
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return Collection<int, array{name:string,first_name:string,last_name:string,email:string,source:string,is_purchaser:bool}>
     */
    private function resolveAudienceRecipients(string $audience, array $filters): Collection
    {
        $sourceFilter = strtolower(trim((string) ($filters['source'] ?? 'all')));
        $serviceSlug = strtolower(trim((string) ($filters['service_slug'] ?? '')));

        $paidEmails = ServiceOrder::query()
            ->where('payment_status', 'paid')
            ->when($serviceSlug !== '', fn ($query) => $query->where('service_slug', $serviceSlug))
            ->pluck('email')
            ->map(fn (string $email): string => strtolower(trim($email)))
            ->filter()
            ->unique()
            ->values();

        $paidLookup = $paidEmails->flip();

        $users = User::query()
            ->whereNotIn('role', [User::ROLE_SUPER_ADMIN, User::ROLE_CUSTOMER_REP, 'admin', 'staff', 'system'])
            ->whereNotNull('email')
            ->get(['name', 'first_name', 'last_name', 'email'])
            ->map(fn (User $user): array => [
                'name' => (string) ($user->name ?: trim(($user->first_name ?: '').' '.($user->last_name ?: ''))),
                'first_name' => (string) ($user->first_name ?: ''),
                'last_name' => (string) ($user->last_name ?: ''),
                'email' => strtolower(trim((string) $user->email)),
                'source' => 'users',
            ]);

        $customers = Customer::query()
            ->whereNotNull('email')
            ->get(['name', 'first_name', 'last_name', 'email'])
            ->map(fn (Customer $customer): array => [
                'name' => (string) ($customer->name ?: trim(($customer->first_name ?: '').' '.($customer->last_name ?: ''))),
                'first_name' => (string) ($customer->first_name ?: ''),
                'last_name' => (string) ($customer->last_name ?: ''),
                'email' => strtolower(trim((string) $customer->email)),
                'source' => 'customers',
            ]);

        $waitlist = Waitlist::query()
            ->whereNotNull('email')
            ->get(['name', 'email'])
            ->map(fn (Waitlist $lead): array => [
                'name' => (string) ($lead->name ?: ''),
                'first_name' => (string) Str::of((string) $lead->name)->before(' '),
                'last_name' => '',
                'email' => strtolower(trim((string) $lead->email)),
                'source' => 'waitlist',
            ]);

        $contacts = $users
            ->concat($customers)
            ->concat($waitlist)
            ->filter(fn (array $contact): bool => $contact['email'] !== '')
            ->groupBy('email')
            ->map(function (Collection $group, string $email) use ($paidLookup): array {
                $best = $group->first(fn (array $contact): bool => $contact['source'] === 'users')
                    ?? $group->first(fn (array $contact): bool => $contact['source'] === 'customers')
                    ?? $group->first();

                $name = trim((string) ($best['name'] ?? ''));
                $firstName = trim((string) ($best['first_name'] ?? ''));
                $lastName = trim((string) ($best['last_name'] ?? ''));

                if ($name === '') {
                    $name = trim($firstName.' '.$lastName);
                }

                if ($name === '') {
                    $name = 'Customer';
                }

                if ($firstName === '') {
                    $firstName = (string) Str::of($name)->before(' ');
                }

                return [
                    'name' => $name,
                    'first_name' => $firstName,
                    'last_name' => $lastName,
                    'email' => $email,
                    'source' => (string) ($best['source'] ?? 'customers'),
                    'is_purchaser' => $paidLookup->has($email),
                ];
            })
            ->values();

        if (in_array($sourceFilter, ['users', 'customers', 'waitlist'], true)) {
            $contacts = $contacts->where('source', $sourceFilter)->values();
        }

        $audience = strtolower(trim($audience));

        if ($audience === 'purchasers') {
            $contacts = $contacts->where('is_purchaser', true)->values();
        } elseif ($audience === 'prospects') {
            $contacts = $contacts->where('is_purchaser', false)->values();
        }

        return $contacts->values();
    }

    /**
     * @param  array{name:string,first_name:string,last_name:string,email:string,source:string,is_purchaser:bool}  $recipient
     * @return array{0:string,1:string}
     */
    private function renderCampaignForRecipient(Newsletter $newsletter, array $recipient): array
    {
        $templating = app(NewsletterTemplating::class);
        $dynamicFields = is_array($newsletter->dynamic_fields) ? $newsletter->dynamic_fields : [];

        $fields = [
            ...$dynamicFields,
            'customer_name' => (string) $recipient['name'],
            'customer_first_name' => (string) $recipient['first_name'],
            'customer_last_name' => (string) $recipient['last_name'],
            'customer_email' => (string) $recipient['email'],
            'recipient_name' => (string) $recipient['name'],
            'recipient_first_name' => (string) $recipient['first_name'],
            'recipient_last_name' => (string) $recipient['last_name'],
            'recipient_email' => (string) $recipient['email'],
            'audience_segment' => (string) ($recipient['is_purchaser'] ? 'purchaser' : 'prospect'),
            'lead_source' => (string) $recipient['source'],
            'main_website_url' => PlatformSettings::siteUrl(),
            'contact_email' => (string) (PlatformSettings::contactInfo()['email'] ?? ''),
            'contact_phone' => (string) (PlatformSettings::contactInfo()['phone'] ?? ''),
            'contact_whatsapp_url' => (string) (PlatformSettings::contactInfo()['whatsapp_url'] ?? ''),
            'current_year' => now()->format('Y'),
            'sent_at' => now()->toDateTimeString(),
        ];

        $subject = $templating->renderSubject((string) $newsletter->subject_template, $fields);
        $html = $templating->renderHtml((string) $newsletter->html_template, $fields);

        $resolvedSubject = $subject !== '' ? $subject : 'Bellah Options Update';
        $resolvedHtml = $html !== '' ? $html : '<p>Hello {{recipient_name}},</p><p>Thank you.</p>';

        return [$resolvedSubject, $resolvedHtml];
    }

    private function storeEmailHeaderImage(UploadedFile $file): string
    {
        $maxWidth = 1200;
        $quality = 78;

        $binary = class_exists(\Imagick::class)
            ? $this->convertHeaderWithImagick($file, $maxWidth, $quality)
            : $this->convertHeaderWithGd($file, $maxWidth, $quality);

        $path = 'email-headers/'.Str::uuid().'.jpg';
        Storage::disk('public')->put($path, $binary, ['visibility' => 'public']);

        return '/storage/'.$path;
    }

    private function convertHeaderWithImagick(UploadedFile $file, int $maxWidth, int $quality): string
    {
        $path = $file->getRealPath() ?: '';
        if ($path === '' || ! is_file($path)) {
            throw new RuntimeException('Image upload failed. Please try again.');
        }

        $imagick = new \Imagick();

        try {
            $imagick->readImage($path);
            $imagick->autoOrient();
            $imagick->setImageBackgroundColor('white');
            $imagick = $imagick->mergeImageLayers(\Imagick::LAYERMETHOD_FLATTEN);

            $width = (int) $imagick->getImageWidth();
            $height = (int) $imagick->getImageHeight();

            if ($width <= 0 || $height <= 0) {
                throw new RuntimeException('Unsupported image dimensions.');
            }

            if ($width > $maxWidth) {
                $newHeight = max(1, (int) round(($height * $maxWidth) / $width));
                $imagick->resizeImage($maxWidth, $newHeight, \Imagick::FILTER_LANCZOS, 1, true);
            }

            $imagick->setImageFormat('jpeg');
            $imagick->setImageCompression(\Imagick::COMPRESSION_JPEG);
            $imagick->setImageCompressionQuality($quality);
            $imagick->setInterlaceScheme(\Imagick::INTERLACE_PLANE);
            $imagick->stripImage();

            $blob = $imagick->getImageBlob();
            if (! is_string($blob) || $blob === '') {
                throw new RuntimeException('Could not optimize image for email.');
            }

            return $blob;
        } catch (Throwable $exception) {
            throw new RuntimeException('Could not optimize image for email.', previous: $exception);
        } finally {
            $imagick->clear();
            $imagick->destroy();
        }
    }

    private function convertHeaderWithGd(UploadedFile $file, int $maxWidth, int $quality): string
    {
        if (! function_exists('imagejpeg')) {
            throw new RuntimeException('Image processing is not enabled on this server.');
        }

        $source = $this->makeImageResourceFromUpload($file);
        if ($source === false) {
            throw new RuntimeException('Unsupported image format. Please upload JPG, PNG, GIF, or WebP.');
        }

        $sourceWidth = imagesx($source);
        $sourceHeight = imagesy($source);
        if ($sourceWidth <= 0 || $sourceHeight <= 0) {
            imagedestroy($source);
            throw new RuntimeException('Unsupported image dimensions.');
        }

        $targetWidth = $sourceWidth > $maxWidth ? $maxWidth : $sourceWidth;
        $targetHeight = max(1, (int) round(($sourceHeight * $targetWidth) / $sourceWidth));

        $canvas = imagecreatetruecolor($targetWidth, $targetHeight);
        $white = imagecolorallocate($canvas, 255, 255, 255);
        imagefill($canvas, 0, 0, $white);
        imagecopyresampled($canvas, $source, 0, 0, 0, 0, $targetWidth, $targetHeight, $sourceWidth, $sourceHeight);

        ob_start();
        $written = imagejpeg($canvas, null, $quality);
        $binary = ob_get_clean();

        imagedestroy($canvas);
        imagedestroy($source);

        if (! $written || ! is_string($binary) || $binary === '') {
            throw new RuntimeException('Could not optimize image for email.');
        }

        return $binary;
    }

    private function makeImageResourceFromUpload(UploadedFile $file): mixed
    {
        $path = $file->getRealPath() ?: '';
        $mime = strtolower(trim((string) $file->getMimeType()));

        if ($path === '' || ! is_file($path)) {
            return false;
        }

        return match ($mime) {
            'image/jpeg', 'image/jpg' => @imagecreatefromjpeg($path),
            'image/png' => @imagecreatefrompng($path),
            'image/gif' => @imagecreatefromgif($path),
            'image/webp' => function_exists('imagecreatefromwebp') ? @imagecreatefromwebp($path) : false,
            'image/bmp', 'image/x-ms-bmp' => function_exists('imagecreatefrombmp') ? @imagecreatefrombmp($path) : false,
            'image/avif' => function_exists('imagecreatefromavif') ? @imagecreatefromavif($path) : false,
            default => false,
        };
    }
}
