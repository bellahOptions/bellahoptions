<?php

namespace App\Http\Controllers;

use App\Models\Questionnaire;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class QuestionnaireController extends Controller
{
    public function show(string $token): Response
    {
        $questionnaire = $this->resolveByToken($token);

        return Inertia::render('Questionnaires/Submit', [
            'questionnaire' => [
                'service_name' => $questionnaire->serviceOrder?->service_name,
                'questions' => $questionnaire->template?->questions ?? [],
                'answers' => $questionnaire->answers,
                'is_completed' => $questionnaire->status === 'completed',
                'completed_at' => $questionnaire->completed_at?->toDateTimeString(),
            ],
            'token' => $token,
        ]);
    }

    public function store(Request $request, string $token): RedirectResponse
    {
        $questionnaire = $this->resolveByToken($token);

        if ($questionnaire->status === 'completed') {
            return back()->with('success', 'This questionnaire has already been submitted. Thank you.');
        }

        $questions = $questionnaire->template?->questions ?? [];
        $answers = (array) $request->input('answers', []);

        $errors = [];

        foreach ($questions as $question) {
            $questionId = (string) ($question['id'] ?? '');
            $answer = $answers[$questionId] ?? null;

            if ($questionId === '' || $answer === null || $answer === '') {
                $errors["answers.{$questionId}"] = 'This question requires an answer.';

                continue;
            }

            if (($question['type'] ?? null) === 'rating' && (! is_numeric($answer) || $answer < 1 || $answer > 5)) {
                $errors["answers.{$questionId}"] = 'Please select a rating between 1 and 5.';
            }

            if (($question['type'] ?? null) === 'choice' && ! in_array($answer, (array) ($question['options'] ?? []), true)) {
                $errors["answers.{$questionId}"] = 'Please choose one of the provided options.';
            }
        }

        if ($errors !== []) {
            throw ValidationException::withMessages($errors);
        }

        $questionnaire->update([
            'answers' => $answers,
            'status' => 'completed',
            'completed_at' => now(),
        ]);

        return back()->with('success', 'Thank you. Your answers have been submitted successfully.');
    }

    private function resolveByToken(string $token): Questionnaire
    {
        return Questionnaire::query()
            ->with(['template', 'serviceOrder'])
            ->where('token', $token)
            ->firstOrFail();
    }
}
