<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreClientReviewRequest;
use App\Http\Requests\Admin\UpdateClientReviewRequest;
use App\Models\ClientReview;
use App\Support\ClientReviewService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class ClientReviewController extends Controller
{
    /**
     * Reviews manager screen.
     *
     * This used to be a section inside the single Platform Settings page. Since
     * reviews are their own model with their own endpoints, the page that manages
     * them belongs here rather than on the settings controller.
     */
    public function index(): Response
    {
        return Inertia::render('Admin/ClientReviews', [
            'clientReviews' => $this->reviewsPayload(),
        ]);
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function reviewsPayload(): array
    {
        if (! Schema::hasTable('client_reviews')) {
            return [];
        }

        try {
            return ClientReview::query()
                ->with(['serviceOrder:id,order_code', 'invoice:id,invoice_number'])
                ->latest('id')
                ->limit(120)
                ->get()
                ->map(fn (ClientReview $review): array => [
                    'id' => $review->id,
                    'source' => $review->source,
                    'reviewer_name' => $review->reviewer_name,
                    'reviewer_email' => $review->reviewer_email,
                    'rating' => $review->rating !== null ? (float) $review->rating : null,
                    'comment' => $review->comment,
                    'screenshot_path' => $review->screenshot_path,
                    'is_public' => (bool) $review->is_public,
                    'is_featured' => (bool) $review->is_featured,
                    'review_requested_at' => $review->review_requested_at?->toDateTimeString(),
                    'review_submitted_at' => $review->review_submitted_at?->toDateTimeString(),
                    'published_at' => $review->published_at?->toDateTimeString(),
                    'service_order' => $review->serviceOrder ? [
                        'order_code' => $review->serviceOrder->order_code,
                    ] : null,
                    'invoice' => $review->invoice ? [
                        'invoice_number' => $review->invoice->invoice_number,
                    ] : null,
                ])
                ->values()
                ->all();
        } catch (Throwable $exception) {
            Log::warning('Unable to load client reviews for the admin screen.', [
                'message' => $exception->getMessage(),
            ]);

            return [];
        }
    }

    public function store(StoreClientReviewRequest $request, ClientReviewService $clientReviewService): RedirectResponse
    {
        $data = $request->validated();
        $rating = round((float) $data['rating'], 1);
        $requestedPublic = (bool) ($data['is_public'] ?? true);
        $isPublic = $requestedPublic && $clientReviewService->shouldBePublic($rating);
        $isFeatured = $isPublic && (bool) ($data['is_featured'] ?? false);

        ClientReview::create([
            'source' => 'admin',
            'created_by' => $request->user()?->id,
            'reviewer_name' => $data['reviewer_name'],
            'reviewer_email' => ($data['reviewer_email'] ?? '') !== ''
                ? strtolower((string) $data['reviewer_email'])
                : null,
            'rating' => $rating,
            'comment' => $data['comment'] ?: null,
            'screenshot_path' => $data['screenshot_path'] ?? null,
            'review_submitted_at' => now(),
            'is_public' => $isPublic,
            'is_featured' => $isFeatured,
            'published_at' => $isPublic ? now() : null,
        ]);

        return back()->with('success', $isPublic
            ? 'Review created successfully.'
            : 'Review saved privately. Only 4.0+ ratings can be shown publicly.');
    }

    public function update(UpdateClientReviewRequest $request, ClientReview $clientReview, ClientReviewService $clientReviewService): RedirectResponse
    {
        $data = $request->validated();

        $rating = array_key_exists('rating', $data)
            ? round((float) $data['rating'], 1)
            : (float) ($clientReview->rating ?? 0);

        $requestedPublic = array_key_exists('is_public', $data)
            ? (bool) $data['is_public']
            : (bool) $clientReview->is_public;

        $isPublic = $requestedPublic && $clientReviewService->shouldBePublic($rating);

        $requestedFeatured = array_key_exists('is_featured', $data)
            ? (bool) $data['is_featured']
            : (bool) $clientReview->is_featured;

        $isFeatured = $isPublic && $requestedFeatured;

        $nextPayload = [
            ...$data,
            'rating' => $rating,
            'is_public' => $isPublic,
            'is_featured' => $isFeatured,
            'published_at' => $isPublic
                ? ($clientReview->published_at ?? now())
                : null,
        ];

        if (($nextPayload['reviewer_email'] ?? '') === '') {
            $nextPayload['reviewer_email'] = null;
        }

        $clientReview->update($nextPayload);

        return back()->with('success', $isPublic
            ? 'Review updated successfully.'
            : 'Review updated. Public display requires at least a 4.0 rating.');
    }

    public function destroy(Request $request, ClientReview $clientReview): RedirectResponse
    {
        abort_unless((bool) $request->user()?->canManageSettings(), 403);

        $clientReview->delete();

        return back()->with('success', 'Review deleted successfully.');
    }
}
