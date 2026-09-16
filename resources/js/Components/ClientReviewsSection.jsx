import { usePage } from '@inertiajs/react';
import { Button, Card, Section, SectionHeading } from '@/Components/PublicUI';

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
        <div className="flex items-center gap-1" aria-label={`Rated ${rounded} out of 5`}>
            {Array.from({ length: 5 }).map((_, index) => (
                <span
                    key={`star-${index}`}
                    className={index < rounded ? 'text-jv-accent' : 'text-white/20'}
                    aria-hidden="true"
                >
                    ★
                </span>
            ))}
            <span className="ml-1.5 text-xs font-medium text-white/45">
                {(Number(rating) || 0).toFixed(1)}/5
            </span>
        </div>
    );
}

function ReviewCard({ review }) {
    const hasComment = Boolean(review.comment);
    const hasScreenshot = Boolean(review.screenshot_url);

    return (
        <Card hover className="flex h-full flex-col">
            <div className="flex items-center justify-between gap-4">
                <div>
                    <p className="text-sm font-semibold text-white">
                        {review.reviewer_name || 'Anonymous'}
                    </p>
                    <p className="jv-mono mt-1 text-white/35">{formatReviewDate(review.published_at)}</p>
                </div>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-jv-line bg-white/[0.05] text-xs font-semibold text-white/50">
                    {(review.reviewer_name || 'A').slice(0, 1).toUpperCase()}
                </span>
            </div>

            <div className="mt-4">
                <StarRating rating={review.rating} />
            </div>

            {hasScreenshot ? (
                <img
                    src={review.screenshot_url}
                    alt={`Review screenshot from ${review.reviewer_name || 'a client'}`}
                    className="mt-4 w-full rounded-jv-sm border border-jv-line object-cover"
                    loading="lazy"
                />
            ) : null}

            {hasComment || !hasScreenshot ? (
                <p className="jv-body mt-4 line-clamp-6">
                    {review.comment || 'No review text provided.'}
                </p>
            ) : null}
        </Card>
    );
}

export default function ClientReviewsSection({
    title = 'Client Reviews',
    subtitle = 'Recent feedback submitted by Bellah Options clients.',
    className = '',
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
            <Section className={className}>
                <Card className="text-center">
                    <p className="jv-body">
                        Public client reviews will appear here as new feedback is submitted.
                    </p>
                </Card>
            </Section>
        );
    }

    const mobileSlides = chunkReviews(visible, 1);
    const desktopSlides = chunkReviews(visible, 3);

    return (
        <Section className={className}>
            <SectionHeading
                eyebrow="Client Reviews"
                title={title}
                description={subtitle}
            />

            <div className="mt-12 md:hidden">
                <div className="jv-scroll-x">
                    {mobileSlides.map((slide, slideIndex) => (
                        <div key={`client-mobile-${slideIndex}`} className="w-[85vw] max-w-sm">
                            {slide.map((review) => (
                                <ReviewCard key={`client-review-mobile-${review.id}`} review={review} />
                            ))}
                        </div>
                    ))}
                </div>
            </div>

            <div className="mt-12 hidden md:block">
                <div className="jv-scroll-x">
                    {desktopSlides.map((slide, slideIndex) => (
                        <div key={`client-desktop-${slideIndex}`} className="w-full">
                            <div className="grid grid-cols-3 gap-5">
                                {slide.map((review) => (
                                    <ReviewCard key={`client-review-desktop-${review.id}`} review={review} />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="mt-10 flex justify-center">
                <Button href="/reviews" variant="ghost">
                    View All Reviews
                </Button>
            </div>
        </Section>
    );
}
