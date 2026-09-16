<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreServiceBriefRequest;
use App\Mail\ServiceBriefAdminAlertMail;
use App\Mail\ServiceBriefReceivedMail;
use App\Models\ServiceBrief;
use App\Models\ServiceBriefFile;
use App\Support\HumanVerification;
use App\Support\ServiceBriefSchema;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class ServiceBriefController extends Controller
{
    /**
     * @var array<int, string>
     */
    public const SERVICE_SLUGS = [
        'social-media-design',
        'graphic-design',
        'brand-design',
        'web-design',
        'special-service',
        'mobile-app-development',
        'ui-ux',
        'manage-hires',
    ];

    public function choose(): Response
    {
        $services = [];

        foreach (self::SERVICE_SLUGS as $slug) {
            $meta = (array) config("service_briefs.service_meta.{$slug}", []);

            $services[] = [
                'slug' => $slug,
                'name' => (string) ($meta['name'] ?? ucfirst($slug)),
                'intro' => (string) ($meta['intro'] ?? ''),
                'estimated_minutes' => (int) ($meta['estimated_minutes'] ?? 5),
            ];
        }

        return Inertia::render('ServiceBriefs/Choose', [
            'services' => $services,
        ]);
    }

    public function create(Request $request, string $serviceSlug, ServiceBriefSchema $schema): Response
    {
        $template = $schema->activeTemplate($serviceSlug);
        $steps = $schema->steps($serviceSlug, $template);
        $meta = (array) config("service_briefs.service_meta.{$serviceSlug}", []);
        $user = $request->user();

        return Inertia::render('ServiceBriefs/Create', [
            'serviceSlug' => $serviceSlug,
            'serviceName' => (string) ($meta['name'] ?? ucfirst($serviceSlug)),
            'intro' => (string) ($meta['intro'] ?? ''),
            'estimatedMinutes' => (int) ($meta['estimated_minutes'] ?? 5),
            'steps' => $steps,
            'uploadSessionToken' => (string) Str::uuid(),
            'profileDefaults' => $user ? [
                'client_name' => $user->name,
                'email' => $user->email,
            ] : [],
            ...HumanVerification::createChallenge($request, 'brief_human_check'),
        ]);
    }

    public function store(StoreServiceBriefRequest $request, string $serviceSlug, ServiceBriefSchema $schema): RedirectResponse
    {
        $answers = (array) $request->validated('answers');
        $template = $schema->activeTemplate($serviceSlug);
        $steps = $schema->steps($serviceSlug, $template);
        $fields = $schema->flattenFields($steps);

        $isRush = false;
        $ndaRequired = false;
        $hasUnsureAnswers = false;

        foreach ($fields as $field) {
            $key = (string) $field['key'];
            $value = $answers[$key] ?? null;

            if (isset($field['flag_on']) && is_array($field['flag_on']) && is_string($value) && isset($field['flag_on'][$value])) {
                $flag = (string) $field['flag_on'][$value];

                if ($flag === 'is_rush') {
                    $isRush = true;
                }

                if ($flag === 'nda_required') {
                    $ndaRequired = true;
                }
            }

            if (is_string($value) && (str_contains(strtolower($value), 'not sure') || str_contains(strtolower($value), 'advise me'))) {
                $hasUnsureAnswers = true;
            }
        }

        $responseSlaHours = (int) config("service_briefs.response_sla_hours.{$serviceSlug}", config('service_briefs.response_sla_hours.default', 24));

        $brief = ServiceBrief::create([
            'reference_number' => $this->generateReferenceNumber($serviceSlug),
            'service_brief_template_id' => $template?->id,
            'service_slug' => $serviceSlug,
            'customer_id' => null,
            'status' => ServiceBrief::STATUS_NEW,
            'answers' => $answers,
            'is_rush' => $isRush,
            'nda_required' => $ndaRequired,
            'has_unsure_answers' => $hasUnsureAnswers,
            'consent_ndpa_at' => now(),
            'consent_ndpa_ip' => $request->ip(),
            'consent_marketing' => (bool) ($answers['consent_marketing'] ?? false),
            'customer_name' => (string) ($answers['client_name'] ?? ''),
            'customer_email' => strtolower(trim((string) ($answers['email'] ?? ''))),
            'customer_phone' => (string) ($answers['phone'] ?? ''),
            'response_due_at' => now()->addHours($responseSlaHours),
        ]);

        $uploadSessionToken = trim((string) $request->input('upload_session_token'));

        if ($uploadSessionToken !== '') {
            ServiceBriefFile::query()
                ->where('upload_session_token', $uploadSessionToken)
                ->whereNull('service_brief_id')
                ->update(['service_brief_id' => $brief->id]);
        }

        try {
            Mail::to($brief->customer_email)->send(new ServiceBriefReceivedMail($brief->fresh()));
        } catch (Throwable $exception) {
            Log::warning('Service brief confirmation email failed.', [
                'service_brief_id' => $brief->id,
                'error' => $exception->getMessage(),
            ]);
        }

        $this->notifyAdmins($brief);

        return redirect()->route('brief.confirmation', ['serviceSlug' => $serviceSlug, 'referenceNumber' => $brief->reference_number]);
    }

    public function confirmation(string $serviceSlug, string $referenceNumber): Response
    {
        $brief = ServiceBrief::query()
            ->where('service_slug', $serviceSlug)
            ->where('reference_number', $referenceNumber)
            ->firstOrFail();

        $meta = (array) config("service_briefs.service_meta.{$serviceSlug}", []);

        return Inertia::render('ServiceBriefs/Confirmation', [
            'referenceNumber' => $brief->reference_number,
            'serviceName' => (string) ($meta['name'] ?? ucfirst($serviceSlug)),
            'responseDueAt' => $brief->response_due_at?->toDateTimeString(),
        ]);
    }

    private function notifyAdmins(ServiceBrief $brief): void
    {
        $recipients = array_values(array_unique(array_filter(array_map(
            static fn (mixed $email): string => strtolower(trim((string) $email)),
            (array) config('bellah.invoice.admin_notification_emails', []),
        ))));

        if ($recipients === []) {
            return;
        }

        try {
            Mail::to($recipients)->send(new ServiceBriefAdminAlertMail($brief));
        } catch (Throwable $exception) {
            Log::warning('Service brief admin alert email failed.', [
                'service_brief_id' => $brief->id,
                'error' => $exception->getMessage(),
            ]);
        }
    }

    private function generateReferenceNumber(string $serviceSlug): string
    {
        $code = (string) config("service_briefs.service_codes.{$serviceSlug}", strtoupper(substr($serviceSlug, 0, 3)));
        $yearMonth = now()->format('Ym');
        $prefix = "BO-{$code}-{$yearMonth}-";

        $count = ServiceBrief::query()->where('reference_number', 'like', $prefix.'%')->count();

        do {
            $count++;
            $candidate = $prefix.str_pad((string) $count, 4, '0', STR_PAD_LEFT);
        } while (ServiceBrief::query()->where('reference_number', $candidate)->exists());

        return $candidate;
    }
}
