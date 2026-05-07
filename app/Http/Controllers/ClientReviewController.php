<?php

namespace App\Http\Controllers;

use App\Http\Requests\SubmitClientReviewRequest;
use App\Models\ClientReview;
use App\Support\ClientReviewService;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class ClientReviewController extends Controller
{
    public function show(string $token): Response
    {
        $review = $this->resolveByToken($token);

        return Inertia::render('Reviews/Submit', [
            'review' => [
                'reviewer_name' => $review->reviewer_name,
                'reviewer_email' => $review->reviewer_email,
                'rating' => $review->rating !== null ? (float) $review->rating : null,
                'comment' => $review->comment,
                'is_submitted' => $review->review_submitted_at !== null,
                'submitted_at' => $review->review_submitted_at?->toDateTimeString(),
                'is_public' => (bool) $review->is_public,
            ],
            'token' => $token,
        ]);
    }

    public function store(SubmitClientReviewRequest $request, string $token, ClientReviewService $clientReviewService): RedirectResponse
    {
        $review = $this->resolveByToken($token);

        if ($review->review_submitted_at !== null) {
            return back()->with('success', 'Your review has already been submitted. Thank you.');
        }

        $data = $request->validated();
        $rating = round((float) $data['rating'], 1);
        $canBePublic = $clientReviewService->shouldBePublic($rating);

        $review->update([
            'source' => 'client',
            'reviewer_name' => $data['reviewer_name'],
            'reviewer_email' => ($data['reviewer_email'] ?? '') !== ''
                ? strtolower((string) $data['reviewer_email'])
                : $review->reviewer_email,
            'rating' => $rating,
            'comment' => $data['comment'],
            'review_submitted_at' => now(),
            'is_public' => $canBePublic,
            'is_featured' => $canBePublic ? (bool) $review->is_featured : false,
            'published_at' => $canBePublic ? now() : null,
        ]);

        return back()->with('success', $canBePublic
            ? 'Thank you. Your review has been submitted successfully.'
            : 'Thank you. Your review has been submitted successfully.');
    }

    private function resolveByToken(string $token): ClientReview
    {
        return ClientReview::query()
            ->where('review_token', $token)
            ->firstOrFail();
    }
}
