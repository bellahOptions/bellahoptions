import { Link, usePage } from '@inertiajs/react';
import { RevealSection } from '@/Components/MotionReveal';

const reviewDateFormatter = new Intl.DateTimeFormat('en-NG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
});

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

function formatReviewDate(value) {
    if (!value) {
        return '';
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : reviewDateFormatter.format(date);
}

function StarRating({ rating = 0 }) {
    const rounded = Math.max(0, Math.min(5, Math.round(Number(rating) || 0)));

    return (
        <div className="mt-3 flex items-center gap-1" aria-label={`Rated ${rounded} out of 5`}>
            {Array.from({ length: 5 }).map((_, index) => (
                <span
                    key={`star-${index}`}
                    className={index < rounded ? 'text-amber-500' : 'text-gray-300'}
                    aria-hidden="true"
                >
                    ★
                </span>
            ))}
            <span className="ml-1 text-xs font-semibold text-gray-500">{(Number(rating) || 0).toFixed(1)}/5</span>
        </div>
    );
}

export default function ClientReviewsSection({
    title = 'Client Reviews',
    subtitle = 'Recent feedback submitted by Bellah Options clients.',
    className = 'bg-white py-16 sm:py-20 lg:py-24',
    maxVisible = 9,
    showEmptyState = false,
}) {
    const { publicClientReviews = [] } = usePage().props;

    const visible = Number(maxVisible) > 0
        ? publicClientReviews.slice(0, Number(maxVisible))
        : publicClientReviews;

    if (visible.length === 0) {
        if (!showEmptyState) {
            return null;
        }

        return (
            <RevealSection className={className}>
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="rounded-xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-600">
                        Public client reviews will appear here as new feedback is submitted.
                    </div>
                </div>
            </RevealSection>
        );
    }

    const mobileSlides = chunkReviews(visible, 1);
    const desktopSlides = chunkReviews(visible, 3);

    return (
        <RevealSection className={className}>
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-3xl text-center">
                    <p className="text-sm font-black uppercase tracking-[0.22em] text-[#000285]">Client Reviews</p>
                    <h2 className="mt-4 text-3xl font-black tracking-tight text-gray-950 sm:text-4xl">
                        {title}
                    </h2>
                    <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-gray-600">
                        {subtitle}
                    </p>
                </div>

                <div className="mt-8 md:hidden">
                    <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3">
                        {mobileSlides.map((slide, slideIndex) => (
                            <div key={`client-mobile-${slideIndex}`} className="w-full shrink-0 snap-start">
                                {slide.map((review) => (
                                    <article key={`client-review-mobile-${review.id}`} className="h-full rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                                        <div>
                                            <p className="text-sm font-semibold text-gray-900">{review.reviewer_name || 'Anonymous'}</p>
                                            <p className="text-xs text-gray-500">{formatReviewDate(review.published_at)}</p>
                                        </div>
                                        <StarRating rating={review.rating} />
                                        <p className="mt-3 text-sm leading-7 text-gray-700">
                                            {review.comment || 'No review text provided.'}
                                        </p>
                                    </article>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-8 hidden md:block">
                    <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3">
                        {desktopSlides.map((slide, slideIndex) => (
                            <div key={`client-desktop-${slideIndex}`} className="w-full shrink-0 snap-start">
                                <div className="grid grid-cols-3 gap-4">
                                    {slide.map((review) => (
                                        <article key={`client-review-desktop-${review.id}`} className="h-full rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                                            <div>
                                                <p className="text-sm font-semibold text-gray-900">{review.reviewer_name || 'Anonymous'}</p>
                                                <p className="text-xs text-gray-500">{formatReviewDate(review.published_at)}</p>
                                            </div>
                                            <StarRating rating={review.rating} />
                                            <p className="mt-3 text-sm leading-7 text-gray-700">
                                                {review.comment || 'No review text provided.'}
                                            </p>
                                        </article>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-6 text-center">
                    <Link
                        href="/reviews"
                        className="inline-flex items-center justify-center rounded-md border border-gray-300 px-5 py-2.5 text-sm font-black text-gray-900 transition hover:border-[#000285] hover:text-[#000285]"
                    >
                        View All Reviews
                    </Link>
                </div>
            </div>
        </RevealSection>
    );
}
