<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ServiceBrief;
use App\Models\ServiceBriefFile;
use App\Support\ServiceBriefSchema;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ServiceBriefController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless((bool) $request->user()?->canManageInvoices(), 403);

        $statusFilter = trim((string) $request->query('status', 'all'));
        $search = trim((string) $request->query('search', ''));

        $briefs = ServiceBrief::query()
            ->when($statusFilter !== 'all', fn ($query) => $query->where('status', $statusFilter))
            ->when($search !== '', function ($query) use ($search): void {
                $like = '%'.$search.'%';
                $query->where(function ($inner) use ($like): void {
                    $inner->where('reference_number', 'like', $like)
                        ->orWhere('customer_name', 'like', $like)
                        ->orWhere('customer_email', 'like', $like);
                });
            })
            ->latest('id')
            ->paginate(20)
            ->through(fn (ServiceBrief $brief): array => $this->mapBrief($brief))
            ->withQueryString();

        return Inertia::render('Admin/ServiceBriefs/Index', [
            'filters' => ['status' => $statusFilter, 'search' => $search],
            'statuses' => ServiceBrief::statuses(),
            'summary' => collect(ServiceBrief::statuses())
                ->mapWithKeys(fn (string $status): array => [$status => ServiceBrief::query()->where('status', $status)->count()])
                ->all(),
            'briefs' => $briefs,
        ]);
    }

    public function show(Request $request, ServiceBrief $serviceBrief, ServiceBriefSchema $schema): Response
    {
        abort_unless((bool) $request->user()?->canManageInvoices(), 403);

        $serviceBrief->load(['files', 'quotedInvoice:id,uuid,invoice_number,status']);

        $labels = $schema->labels($serviceBrief->service_slug, $serviceBrief->template);
        $steps = $schema->steps($serviceBrief->service_slug, $serviceBrief->template);

        $sections = [];
        foreach ($steps as $step) {
            $rows = [];

            foreach ((array) ($step['fields'] ?? []) as $field) {
                $key = (string) ($field['key'] ?? '');
                $value = $serviceBrief->answers[$key] ?? null;

                if ($key === '' || $value === null || $value === '' || $key === 'consent_ndpa' || $key === 'consent_marketing') {
                    continue;
                }

                $rows[] = [
                    'label' => $labels[$key] ?? $key,
                    'value' => is_array($value) ? implode(', ', $value) : (string) $value,
                ];
            }

            if ($rows !== []) {
                $sections[] = ['title' => (string) ($step['title'] ?? ''), 'rows' => $rows];
            }
        }

        return Inertia::render('Admin/ServiceBriefs/Show', [
            'statuses' => ServiceBrief::statuses(),
            'brief' => [
                ...$this->mapBrief($serviceBrief),
                'consent_marketing' => (bool) $serviceBrief->consent_marketing,
                'consent_ndpa_at' => $serviceBrief->consent_ndpa_at?->toDateTimeString(),
                'sections' => $sections,
                'files' => $serviceBrief->files->map(fn (ServiceBriefFile $file): array => [
                    'id' => $file->id,
                    'field_label' => $labels[$file->field_key] ?? $file->field_key,
                    'original_filename' => $file->original_filename,
                    'size_bytes' => $file->size_bytes,
                ])->values()->all(),
                'quoted_invoice' => $serviceBrief->quotedInvoice ? [
                    'uuid' => $serviceBrief->quotedInvoice->uuid,
                    'invoice_number' => $serviceBrief->quotedInvoice->invoice_number,
                    'status' => $serviceBrief->quotedInvoice->status,
                ] : null,
            ],
        ]);
    }

    public function updateStatus(Request $request, ServiceBrief $serviceBrief): RedirectResponse
    {
        abort_unless((bool) $request->user()?->canManageInvoices(), 403);

        $validated = $request->validate([
            'status' => ['required', Rule::in(ServiceBrief::statuses())],
        ]);

        $serviceBrief->forceFill(['status' => $validated['status']])->save();

        return back()->with('success', 'Brief status updated.');
    }

    /**
     * Returns a New-Invoice-form prefill payload, the same "duplicate" JSON
     * shape InvoiceController::duplicate() already returns, so the admin
     * Invoices page can reuse its existing prefillFromInvoiceTemplate() flow
     * to manually build the quote — nothing is created here.
     */
    public function quoteTemplate(Request $request, ServiceBrief $serviceBrief): JsonResponse
    {
        abort_unless((bool) $request->user()?->canManageInvoices(), 403);

        $serviceName = (string) config("service_briefs.service_meta.{$serviceBrief->service_slug}.name", $serviceBrief->service_slug);

        return response()->json([
            'invoice' => [
                'customer_name' => $serviceBrief->customer_name,
                'customer_email' => $serviceBrief->customer_email,
                'title' => "{$serviceName} — Quote ({$serviceBrief->reference_number})",
                'description' => "Quote prepared from service brief {$serviceBrief->reference_number}.",
                'currency' => 'NGN',
                'items' => [],
            ],
        ]);
    }

    public function downloadFile(Request $request, ServiceBrief $serviceBrief, ServiceBriefFile $serviceBriefFile): StreamedResponse
    {
        abort_unless((bool) $request->user()?->canManageInvoices(), 403);
        abort_unless($serviceBriefFile->service_brief_id === $serviceBrief->id, 404);
        abort_unless(Storage::disk('local')->exists($serviceBriefFile->disk_path), 404);

        return Storage::disk('local')->download($serviceBriefFile->disk_path, $serviceBriefFile->original_filename);
    }

    /**
     * @return array<string, mixed>
     */
    private function mapBrief(ServiceBrief $brief): array
    {
        return [
            'uuid' => $brief->uuid,
            'reference_number' => $brief->reference_number,
            'service_slug' => $brief->service_slug,
            'service_name' => (string) config("service_briefs.service_meta.{$brief->service_slug}.name", $brief->service_slug),
            'status' => $brief->status,
            'customer_name' => $brief->customer_name,
            'customer_email' => $brief->customer_email,
            'customer_phone' => $brief->customer_phone,
            'is_rush' => (bool) $brief->is_rush,
            'nda_required' => (bool) $brief->nda_required,
            'has_unsure_answers' => (bool) $brief->has_unsure_answers,
            'response_due_at' => $brief->response_due_at?->toDateTimeString(),
            'created_at' => $brief->created_at?->toDateTimeString(),
        ];
    }
}
