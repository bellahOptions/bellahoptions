import { useMemo } from 'react';
import { Link, usePage } from '@inertiajs/react';
import { ReactGoogleReviews } from 'react-google-reviews';
import 'react-google-reviews/dist/index.css';
import { RevealSection } from '@/Components/MotionReveal';

const reviewDateFormatter = new Intl.DateTimeFormat('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
});

function normalizeReview(rawReview) {
    const source = rawReview && typeof rawReview === 'object' ? rawReview : {};
    const reviewId = String(source?.reviewId || source?.id || '').trim();
    const reviewerName = String(
        source?.reviewer?.displayName
        || source?.author?.name
        || source?.reviewerName
        || 'Anonymous',
    ).trim();
    const reviewerPhoto = String(
        source?.reviewer?.profilePhotoUrl
        || source?.author?.photoUrl
        || source?.author?.avatarUrl
        || '',
    ).trim();
    const ratingNumber = Number(
        source?.starRating
        ?? source?.rating?.value
        ?? source?.rating
        ?? 0,
    );
    const rating = Math.max(1, Math.min(5, Number.isFinite(ratingNumber) ? Math.round(ratingNumber) : 0));
    const comment = String(source?.comment || source?.text || '').trim();
    const createdAt = source?.createTime || source?.publishedAt || source?.published_at || null;

    if (reviewId === '') {
        return null;
    }

    return {
        reviewId,
        reviewerName,
        reviewerPhoto,
        rating,
        comment,
        createdAt,
    };
}

function formatReviewDate(value) {
    if (!value) {
        return '';
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : reviewDateFormatter.format(date);
}

function chunkReviews(reviews, size) {
    if (!Array.isArray(reviews) || size <= 0) {
        return [];
    }

    const chunks = [];
    for (let index = 0; index < reviews.length; index += size) {
        chunks.push(reviews.slice(index, index + size));
    }

    return chunks;
}

export default function GoogleReviewsSection({
    title = 'What Clients Say',
    subtitle = 'Verified Google reviews from Bellah Options clients.',
    className = 'bg-gray-50 py-16 sm:py-20 lg:py-24',
    maxVisible = 6,
    useFeaturedSelection = true,
}) {
    const { googleReviews = {} } = usePage().props;
    const widgetId = String(googleReviews?.widget_id || '').trim();
    const widgetVersion = String(googleReviews?.widget_version || 'v2').trim() || 'v2';
    const featuredReviewIds = Array.isArray(googleReviews?.featured_review_ids)
        ? googleReviews.featured_review_ids.map((value) => String(value || '').trim()).filter(Boolean)
        : [];

    const featuredReviewIdSet = useMemo(
        () => new Set(featuredReviewIds),
        [featuredReviewIds],
    );

    if (widgetId === '') {
        return null;
    }

    return (
        <RevealSection className={className}>
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-3xl text-center">
                    <p className="text-sm font-black uppercase tracking-[0.22em] text-[#000285]">Google Reviews</p>
                    <h2 className="mt-4 text-3xl font-black tracking-tight text-gray-950 sm:text-4xl">
                        {title}
                    </h2>
                    <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-gray-600">
                        {subtitle}
                    </p>
                </div>

                <div className="mt-8">
                    <ReactGoogleReviews
                        featurableId={widgetId}
                        widgetVersion={widgetVersion}
                        layout="custom"
                        dateDisplay="absolute"
                        nameDisplay="fullNames"
                        maxCharacters={320}
                        hideEmptyReviews
                        renderer={(reviews) => {
                            const normalized = (Array.isArray(reviews) ? reviews : [])
                                .map((review) => normalizeReview(review))
                                .filter(Boolean);

                            const source = useFeaturedSelection && featuredReviewIds.length > 0
                                ? featuredReviewIds
                                    .map((id) => normalized.find((review) => review.reviewId === id))
                                    .filter(Boolean)
                                : normalized;

                            const visible = Number.isFinite(Number(maxVisible)) && Number(maxVisible) > 0
                                ? source.slice(0, Number(maxVisible))
                                : source;

                            const fallback = visible.length > 0
                                ? visible
                                : (Number.isFinite(Number(maxVisible)) && Number(maxVisible) > 0
                                    ? normalized.slice(0, Number(maxVisible))
                                    : normalized);

                            if (fallback.length === 0) {
                                return (
                                    <div className="rounded-lg border border-gray-200 bg-white p-6 text-center text-sm text-gray-600">
                                        Reviews are loading. Please check back shortly.
                                    </div>
                                );
                            }

                            const mobileSlides = chunkReviews(fallback, 1);
                            const desktopSlides = chunkReviews(fallback, 3);

                            return (
                                <>
                                    <div className="md:hidden">
                                        <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3">
                                            {mobileSlides.map((slide, slideIndex) => (
                                                <div key={`mobile-slide-${slideIndex}`} className="w-full shrink-0 snap-start">
                                                    {slide.map((review) => {
                                                        const reviewId = review.reviewId;
                                                        const reviewerName = review.reviewerName;
                                                        const reviewerPhoto = review.reviewerPhoto;
                                                        const rating = review.rating;
                                                        const comment = review.comment;

                                                        return (
                                                            <article key={reviewId} className="h-full rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                                                                <div className="flex items-center gap-3">
                                                                    {reviewerPhoto ? (
                                                                        <img src={reviewerPhoto} alt={reviewerName} className="h-10 w-10 rounded-full object-cover" />
                                                                    ) : (
                                                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-black text-[#000285]">
                                                                            {reviewerName.slice(0, 1).toUpperCase()}
                                                                        </div>
                                                                    )}
                                                                    <div>
                                                                        <p className="text-sm font-semibold text-gray-900">{reviewerName}</p>
                                                                        <p className="text-xs text-gray-500">{formatReviewDate(review.createdAt)}</p>
                                                                    </div>
                                                                </div>
                                                                <p className="mt-3 text-sm text-amber-600">{'★'.repeat(rating)}</p>
                                                                <p className="mt-3 text-sm leading-7 text-gray-700">
                                                                    {comment || 'No review text provided.'}
                                                                </p>
                                                            </article>
                                                        );
                                                    })}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="hidden md:block">
                                        <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3">
                                            {desktopSlides.map((slide, slideIndex) => (
                                                <div key={`desktop-slide-${slideIndex}`} className="w-full shrink-0 snap-start">
                                                    <div className="grid grid-cols-3 gap-4">
                                                        {slide.map((review) => {
                                                            const reviewId = review.reviewId;
                                                            const reviewerName = review.reviewerName;
                                                            const reviewerPhoto = review.reviewerPhoto;
                                                            const rating = review.rating;
                                                            const comment = review.comment;

                                                            return (
                                                                <article key={reviewId} className="h-full rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                                                                    <div className="flex items-center gap-3">
                                                                        {reviewerPhoto ? (
                                                                            <img src={reviewerPhoto} alt={reviewerName} className="h-10 w-10 rounded-full object-cover" />
                                                                        ) : (
                                                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-black text-[#000285]">
                                                                                {reviewerName.slice(0, 1).toUpperCase()}
                                                                            </div>
                                                                        )}
                                                                        <div>
                                                                            <p className="text-sm font-semibold text-gray-900">{reviewerName}</p>
                                                                            <p className="text-xs text-gray-500">{formatReviewDate(review.createdAt)}</p>
                                                                        </div>
                                                                    </div>
                                                                    <p className="mt-3 text-sm text-amber-600">{'★'.repeat(rating)}</p>
                                                                    <p className="mt-3 text-sm leading-7 text-gray-700">
                                                                        {comment || 'No review text provided.'}
                                                                    </p>
                                                                </article>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            );
                        }}
                    />
                </div>

                {useFeaturedSelection && featuredReviewIdSet.size > 0 ? (
                    <p className="mt-5 text-center text-xs text-gray-500">
                        Showing featured reviews selected by the Bellah Options team.
                    </p>
                ) : null}

                <div className="mt-6 text-center">
                    <Link
                        href="/contact-us"
                        className="inline-flex items-center justify-center rounded-md border border-gray-300 px-5 py-2.5 text-sm font-black text-gray-900 transition hover:border-[#000285] hover:text-[#000285]"
                    >
                        Start Your Project
                    </Link>
                </div>
            </div>
        </RevealSection>
    );
}
