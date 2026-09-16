<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ImportQuestionnaireQuestionsRequest;
use App\Http\Requests\Admin\StoreQuestionnaireTemplateRequest;
use App\Http\Requests\Admin\UpdateQuestionnaireTemplateRequest;
use App\Models\QuestionnaireTemplate;
use App\Support\QuestionImportParser;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;
use Throwable;

class QuestionnaireTemplateController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless((bool) $request->user()?->isSuperAdmin(), 403);

        $templates = QuestionnaireTemplate::query()
            ->orderBy('service_slug')
            ->get()
            ->map(fn (QuestionnaireTemplate $template): array => $this->mapTemplate($template))
            ->all();

        return Inertia::render('Admin/QuestionnaireTemplates/Index', [
            'serviceSlugs' => StoreQuestionnaireTemplateRequest::SERVICE_SLUGS,
            'templates' => $templates,
        ]);
    }

    public function import(ImportQuestionnaireQuestionsRequest $request): JsonResponse
    {
        $file = $request->file('file');
        $extension = strtolower((string) $file->getClientOriginalExtension());
        $parser = new QuestionImportParser();

        try {
            $questions = $extension === 'pdf'
                ? $parser->parsePdf($file->getRealPath())
                : $parser->parseCsv($file->getRealPath());
        } catch (RuntimeException $exception) {
            return response()->json(['message' => $exception->getMessage()], 422);
        } catch (Throwable $exception) {
            Log::error('Questionnaire question import failed unexpectedly.', ['error' => $exception->getMessage()]);

            return response()->json(['message' => 'Unable to parse this file. Please check it and try again.'], 422);
        }

        return response()->json(['questions' => $questions]);
    }

    public function store(StoreQuestionnaireTemplateRequest $request): RedirectResponse
    {
        $data = $request->validated();

        QuestionnaireTemplate::updateOrCreate(
            ['service_slug' => $data['service_slug']],
            [
                'name' => $data['name'],
                'questions' => $data['questions'],
                'is_active' => $data['is_active'],
            ],
        );

        return back()->with('success', 'Questionnaire template saved successfully.');
    }

    public function update(UpdateQuestionnaireTemplateRequest $request, QuestionnaireTemplate $questionnaireTemplate): RedirectResponse
    {
        $questionnaireTemplate->update($request->validated());

        return back()->with('success', 'Questionnaire template updated successfully.');
    }

    public function destroy(Request $request, QuestionnaireTemplate $questionnaireTemplate): RedirectResponse
    {
        abort_unless((bool) $request->user()?->isSuperAdmin(), 403);

        $questionnaireTemplate->delete();

        return back()->with('success', 'Questionnaire template deleted successfully.');
    }

    private function mapTemplate(QuestionnaireTemplate $template): array
    {
        return [
            'id' => $template->id,
            'service_slug' => $template->service_slug,
            'name' => $template->name,
            'questions' => $template->questions,
            'is_active' => (bool) $template->is_active,
        ];
    }
}
