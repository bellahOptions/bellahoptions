<?php

namespace App\Http\Middleware;

use App\Models\ClientReview;
use App\Support\GooglePlacesReviews;
use App\Support\PlatformSettings;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();
        $visitorLocalization = (array) $request->attributes->get('visitor_localization', []);
        $googleReviewsConfig = PlatformSettings::googleReviewsConfig();
        $googleReviewsPreview = GooglePlacesReviews::fetchPreview((string) ($googleReviewsConfig['place_id'] ?? ''));

        return [
            ...parent::share($request),
            'localization' => [
                'country_code' => (string) ($visitorLocalization['country_code'] ?? 'NG'),
                'country' => (string) ($visitorLocalization['country'] ?? 'Nigeria'),
                'locale' => (string) ($visitorLocalization['locale'] ?? 'en_NG'),
                'language' => (string) ($visitorLocalization['language'] ?? 'en'),
                'currency' => (string) ($visitorLocalization['currency'] ?? 'NGN'),
                'payment_processor' => (string) ($visitorLocalization['payment_processor'] ?? 'paystack'),
            ],
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'first_name' => $user->first_name,
                    'last_name' => $user->last_name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'address' => $user->address,
                    'is_staff' => $user->isStaff(),
                    'is_super_admin' => $user->isSuperAdmin(),
                    'can_manage_invoices' => $user->canManageInvoices(),
                    'can_manage_settings' => $user->canManageSettings(),
                    'can_manage_slides' => $user->canManageSlides(),
                    'can_manage_public_content' => $user->canManagePublicContent(),
                    'can_manage_users' => $user->canManageUsers(),
                    'can_manage_waitlist' => $user->canManageWaitlist(),
                ] : null,
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
            'branding' => PlatformSettings::brandAssets(),
            'publicPageHeaders' => PlatformSettings::publicPageHeaders(),
            'googleReviews' => [
                ...$googleReviewsConfig,
                'success' => (bool) ($googleReviewsPreview['success'] ?? false),
                'profile_url' => $googleReviewsPreview['profile_url'] ?? null,
                'total_review_count' => $googleReviewsPreview['total_review_count'] ?? null,
                'average_rating' => $googleReviewsPreview['average_rating'] ?? null,
                'reviews' => is_array($googleReviewsPreview['reviews'] ?? null) ? $googleReviewsPreview['reviews'] : [],
                'error' => $googleReviewsPreview['error'] ?? null,
            ],
            'publicClientReviews' => fn (): array => ! Schema::hasTable('client_reviews')
                ? []
                : ClientReview::query()
                    ->publiclyVisible()
                    ->orderByDesc('is_featured')
                    ->orderByDesc('published_at')
                    ->latest('id')
                    ->limit(80)
                    ->get()
                    ->map(fn (ClientReview $review): array => [
                        'id' => $review->id,
                        'reviewer_name' => $review->reviewer_name ?: 'Anonymous',
                        'rating' => $review->rating !== null ? (float) $review->rating : 0,
                        'comment' => $review->comment ?: '',
                        'published_at' => $review->published_at?->toDateString(),
                        'is_featured' => (bool) $review->is_featured,
                    ])
                    ->values()
                    ->all(),
        ];
    }
}
