<?php

namespace App\Support;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

class GooglePlacesReviews
{
    /**
     * @return array{
     *   success: bool,
     *   place_id: string,
     *   profile_url: string|null,
     *   total_review_count: int|null,
     *   average_rating: float|null,
     *   reviews: array<int, array{review_id: string, reviewer_name: string, reviewer_avatar: string|null, rating: int, comment: string, published_at: string|null, review_url: string|null}>,
     *   error: string|null
     * }
     */
    public static function fetchPreview(string $placeId, bool $forceFresh = false): array
    {
        $normalizedPlaceId = trim($placeId);
        if ($normalizedPlaceId === '') {
            return self::emptyResponse(
                success: false,
                placeId: '',
                error: 'Add your Google Place ID to load Google reviews.',
            );
        }

        $apiKey = trim((string) config('services.google_maps.places_api_key', ''));
        if ($apiKey === '') {
            return self::emptyResponse(
                success: false,
                placeId: $normalizedPlaceId,
                error: 'Set GOOGLE_MAPS_PLACES_API_KEY in your server environment to enable Google reviews.',
            );
        }

        $cacheKey = 'google-places-reviews:'.sha1($normalizedPlaceId);
        if (! $forceFresh) {
            /** @var array<string, mixed> $cached */
            $cached = Cache::get($cacheKey, []);
            if (is_array($cached) && $cached !== []) {
                return $cached;
            }
        }

        try {
            $response = Http::acceptJson()
                ->timeout(10)
                ->withHeaders([
                    'X-Goog-Api-Key' => $apiKey,
                    'X-Goog-FieldMask' => implode(',', [
                        'id',
                        'displayName',
                        'googleMapsUri',
                        'rating',
                        'userRatingCount',
                        'reviews',
                    ]),
                ])
                ->get("https://places.googleapis.com/v1/places/{$normalizedPlaceId}", [
                    'languageCode' => 'en',
                    'regionCode' => 'NG',
                ]);
        } catch (Throwable $exception) {
            Log::warning('Google Places reviews request failed.', [
                'place_id' => $normalizedPlaceId,
                'message' => $exception->getMessage(),
            ]);

            return self::emptyResponse(
                success: false,
                placeId: $normalizedPlaceId,
                error: 'Unable to reach Google Places right now.',
            );
        }

        if (! $response->ok()) {
            return self::emptyResponse(
                success: false,
                placeId: $normalizedPlaceId,
                error: 'Could not load reviews for this Google Place ID.',
            );
        }

        $payload = $response->json();
        if (! is_array($payload)) {
            return self::emptyResponse(
                success: false,
                placeId: $normalizedPlaceId,
                error: 'Google Places returned an invalid response.',
            );
        }

        $rawReviews = (array) ($payload['reviews'] ?? []);
        $reviews = collect($rawReviews)
            ->filter(fn (mixed $review): bool => is_array($review))
            ->map(function (array $review): array {
                $rawName = trim((string) ($review['name'] ?? ''));
                $rawPublishTime = trim((string) ($review['publishTime'] ?? ''));
                $rawText = trim((string) data_get($review, 'text.text', ''));
                $ratingValue = (int) round((float) ($review['rating'] ?? 0));
                $stableIdInput = $rawName !== ''
                    ? $rawName
                    : implode('|', [
                        trim((string) data_get($review, 'authorAttribution.displayName', '')),
                        $rawPublishTime,
                        $rawText,
                    ]);

                return [
                    'review_id' => mb_substr($stableIdInput !== '' ? sha1($stableIdInput) : sha1((string) microtime(true)), 0, 220),
                    'reviewer_name' => mb_substr(trim((string) data_get($review, 'authorAttribution.displayName', 'Anonymous')), 0, 160),
                    'reviewer_avatar' => self::sanitizeHttpUrl(data_get($review, 'authorAttribution.photoUri')),
                    'rating' => max(1, min(5, $ratingValue)),
                    'comment' => mb_substr($rawText, 0, 3000),
                    'published_at' => self::normalizeDateString($rawPublishTime),
                    'review_url' => self::sanitizeHttpUrl(
                        data_get($review, 'googleMapsUri')
                            ?: data_get($review, 'authorAttribution.uri')
                    ),
                ];
            })
            ->values()
            ->all();

        $result = [
            'success' => true,
            'place_id' => $normalizedPlaceId,
            'profile_url' => self::sanitizeHttpUrl($payload['googleMapsUri'] ?? null),
            'total_review_count' => is_numeric($payload['userRatingCount'] ?? null)
                ? (int) $payload['userRatingCount']
                : null,
            'average_rating' => is_numeric($payload['rating'] ?? null)
                ? round((float) $payload['rating'], 2)
                : null,
            'reviews' => $reviews,
            'error' => null,
        ];

        Cache::put($cacheKey, $result, now()->addMinutes(30));

        return $result;
    }

    /**
     * @return array{
     *   success: bool,
     *   place_id: string,
     *   profile_url: string|null,
     *   total_review_count: int|null,
     *   average_rating: float|null,
     *   reviews: array<int, array{review_id: string, reviewer_name: string, reviewer_avatar: string|null, rating: int, comment: string, published_at: string|null, review_url: string|null}>,
     *   error: string|null
     * }
     */
    private static function emptyResponse(bool $success, string $placeId, ?string $error): array
    {
        return [
            'success' => $success,
            'place_id' => $placeId,
            'profile_url' => null,
            'total_review_count' => null,
            'average_rating' => null,
            'reviews' => [],
            'error' => $error,
        ];
    }

    private static function sanitizeHttpUrl(mixed $value): ?string
    {
        $candidate = trim((string) $value);

        if ($candidate === '' || ! filter_var($candidate, FILTER_VALIDATE_URL)) {
            return null;
        }

        $scheme = strtolower((string) parse_url($candidate, PHP_URL_SCHEME));

        return in_array($scheme, ['http', 'https'], true) ? $candidate : null;
    }

    private static function normalizeDateString(string $value): ?string
    {
        $candidate = trim($value);
        if ($candidate === '') {
            return null;
        }

        try {
            return \Carbon\Carbon::parse($candidate)->toIso8601String();
        } catch (Throwable) {
            return null;
        }
    }
}
