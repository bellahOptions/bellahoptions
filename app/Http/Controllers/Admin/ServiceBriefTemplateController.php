<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Controllers\ServiceBriefController as PublicServiceBriefController;
use App\Models\ServiceBriefTemplate;
use App\Support\ServiceBriefSchema;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ServiceBriefTemplateController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless((bool) $request->user()?->isSuperAdmin(), 403);

        $templates = ServiceBriefTemplate::query()
            ->where('is_active', true)
            ->orderBy('service_slug')
            ->get()
            ->map(fn (ServiceBriefTemplate $template): array => $this->mapTemplate($template))
            ->keyBy('service_slug')
            ->all();

        return Inertia::render('Admin/ServiceBriefTemplates/Index', [
            'serviceSlugs' => PublicServiceBriefController::SERVICE_SLUGS,
            'templates' => $templates,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        abort_unless((bool) $request->user()?->isSuperAdmin(), 403);

        $data = $request->validate([
            'service_slug' => ['required', 'string', Rule::in(PublicServiceBriefController::SERVICE_SLUGS)],
            'name' => ['required', 'string', 'max:160'],
            'intro_copy' => ['nullable', 'string', 'max:2000'],
            'estimated_minutes' => ['required', 'integer', 'min:1', 'max:60'],
            'steps' => ['required', 'array'],
            'steps.*.title' => ['required', 'string', 'max:160'],
            'steps.*.fields' => ['required', 'array', 'min:1'],
            'steps.*.fields.*.key' => ['required', 'string', 'max:100'],
            'steps.*.fields.*.label' => ['required', 'string', 'max:255'],
            'steps.*.fields.*.type' => ['required', Rule::in(['text', 'textarea', 'email', 'tel', 'number', 'date', 'url', 'select', 'multiselect', 'radio', 'checkbox', 'scale', 'file'])],
        ]);

        $serviceSlug = (string) $data['service_slug'];

        $nextVersion = 1 + (int) ServiceBriefTemplate::query()->where('service_slug', $serviceSlug)->max('version');

        ServiceBriefTemplate::query()->where('service_slug', $serviceSlug)->update(['is_active' => false]);

        ServiceBriefTemplate::create([
            'service_slug' => $serviceSlug,
            'version' => $nextVersion,
            'name' => $data['name'],
            'intro_copy' => $data['intro_copy'] ?? null,
            'estimated_minutes' => $data['estimated_minutes'],
            'steps' => $data['steps'],
            'is_active' => true,
            'created_by' => $request->user()->id,
        ]);

        return back()->with('success', "Template saved as version {$nextVersion}. Previously submitted briefs keep their original version.");
    }

    public function preview(Request $request, string $serviceSlug, ServiceBriefSchema $schema): Response
    {
        abort_unless((bool) $request->user()?->isSuperAdmin(), 403);
        abort_unless(in_array($serviceSlug, PublicServiceBriefController::SERVICE_SLUGS, true), 404);

        $template = $schema->activeTemplate($serviceSlug);
        $steps = $schema->steps($serviceSlug, $template);
        $meta = (array) config("service_briefs.service_meta.{$serviceSlug}", []);

        return Inertia::render('ServiceBriefs/Create', [
            'serviceSlug' => $serviceSlug,
            'serviceName' => (string) ($meta['name'] ?? ucfirst($serviceSlug)),
            'intro' => (string) ($meta['intro'] ?? ''),
            'estimatedMinutes' => (int) ($meta['estimated_minutes'] ?? 5),
            'steps' => $steps,
            'uploadSessionToken' => (string) Str::uuid(),
            'profileDefaults' => [],
            'previewMode' => true,
            'humanVerificationMode' => 'math',
            'humanCheckQuestion' => '',
            'humanCheckNonce' => '',
            'turnstileSiteKey' => '',
            'formRenderedAt' => now()->timestamp,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function mapTemplate(ServiceBriefTemplate $template): array
    {
        return [
            'id' => $template->id,
            'service_slug' => $template->service_slug,
            'version' => $template->version,
            'name' => $template->name,
            'intro_copy' => $template->intro_copy,
            'estimated_minutes' => $template->estimated_minutes,
            'steps' => $template->steps,
        ];
    }
}
