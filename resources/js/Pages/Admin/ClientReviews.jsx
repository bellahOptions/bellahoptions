import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import MediaSelectorModal, { mediaPreviewUrl, useMediaSelector } from '@/Components/MediaSelectorModal';
import { Eyebrow } from '@/Components/PublicUI';
import { Badge } from '@/Components/ui/badge';
import { MobileCard, MobileCardActions, MobileCardList } from '@/Components/ui/mobile-cards';
import { Head, router, useForm } from '@inertiajs/react';
import { StarIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

/**
 * Client reviews manager.
 *
 * Unlike the other screens split out of Platform Settings, this one never
 * autosaves: reviews are their own model with dedicated create/update/delete
 * endpoints, so every action here writes immediately.
 */

const inputClassName =
    'w-full rounded-jv-sm border border-jv-line-strong bg-white/[0.05] px-3 py-2 text-sm text-white transition placeholder:text-white/30 focus:border-jv-accent focus:outline-none focus:ring-4 focus:ring-jv-accent/15';

export default function ClientReviews({ clientReviews = [] }) {
    const reviewForm = useForm({
        reviewer_name: '',
        reviewer_email: '',
        rating: 5,
        comment: '',
        screenshot_path: '',
        is_public: true,
        is_featured: false,
    });

    const [screenshotUploading, setScreenshotUploading] = useState(false);
    const selector = useMediaSelector();

    const uploadScreenshot = async (file) => {
        if (!file) {
            return;
        }

        setScreenshotUploading(true);

        try {
            const path = await selector.upload(file);
            if (path) {
                reviewForm.setData('screenshot_path', path);
            }
        } finally {
            setScreenshotUploading(false);
        }
    };

    const submit = (event) => {
        event.preventDefault();

        reviewForm.post(route('admin.client-reviews.store'), {
            preserveScroll: true,
            onSuccess: () => {
                reviewForm.reset();
                reviewForm.setData('rating', 5);
                reviewForm.setData('is_public', true);
                reviewForm.setData('is_featured', false);
            },
        });
    };

    const toggleVisibility = (review) => {
        router.patch(
            route('admin.client-reviews.update', review.id),
            { is_public: !review.is_public },
            { preserveScroll: true },
        );
    };

    const toggleFeatured = (review) => {
        router.patch(
            route('admin.client-reviews.update', review.id),
            { is_featured: !review.is_featured },
            { preserveScroll: true },
        );
    };

    const destroy = (review) => {
        if (!window.confirm('Delete this review?')) {
            return;
        }

        router.delete(route('admin.client-reviews.destroy', review.id), {
            preserveScroll: true,
        });
    };

    const publicCount = clientReviews.filter((review) => review.is_public).length;
    const featuredCount = clientReviews.filter((review) => review.is_featured).length;

    const renderStars = (rating) =>
        '★'.repeat(Math.max(1, Math.min(5, Math.round(Number(rating || 0)))));

    return (
        <AuthenticatedLayout>
            <Head title="Client Reviews" />

            <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
                <section className="jv-card jv-card--pad">
                    <Eyebrow>Social proof</Eyebrow>
                    <h1 className="jv-display jv-display--md mt-5">Client Reviews Manager</h1>
                    <p className="jv-lead mt-4 max-w-2xl">
                        Add internal reviews with star ratings and control which ones appear publicly.
                        Reviews rated below 4.0 stay private automatically.
                    </p>

                    <div className="mt-6 flex flex-wrap gap-3">
                        <span className="inline-flex items-center gap-2 rounded-full border border-jv-line bg-white/[0.06] px-3 py-1.5 text-xs font-semibold text-white/70">
                            <StarIcon className="h-4 w-4 text-jv-accent" />
                            {clientReviews.length} total
                        </span>
                        <span className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300">
                            {publicCount} public
                        </span>
                        <span className="inline-flex items-center gap-2 rounded-full border border-jv-accent-line bg-jv-accent/10 px-3 py-1.5 text-xs font-semibold text-[#a9c4ff]">
                            {featuredCount} featured
                        </span>
                    </div>
                </section>

                <div className="jv-card jv-card--pad">
                    <h3 className="text-lg font-semibold tracking-tight text-white">Add a Review</h3>

                    <form onSubmit={submit} className="mt-5 grid gap-4 md:grid-cols-2">
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-white/65">
                                Reviewer Name
                            </label>
                            <input
                                type="text"
                                value={reviewForm.data.reviewer_name}
                                onChange={(event) =>
                                    reviewForm.setData('reviewer_name', event.target.value)
                                }
                                className={inputClassName}
                            />
                            {reviewForm.errors.reviewer_name && (
                                <p className="mt-1 text-xs text-red-300">
                                    {reviewForm.errors.reviewer_name}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-white/65">
                                Reviewer Email (optional)
                            </label>
                            <input
                                type="email"
                                value={reviewForm.data.reviewer_email}
                                onChange={(event) =>
                                    reviewForm.setData('reviewer_email', event.target.value)
                                }
                                className={inputClassName}
                            />
                            {reviewForm.errors.reviewer_email && (
                                <p className="mt-1 text-xs text-red-300">
                                    {reviewForm.errors.reviewer_email}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-white/65">
                                Star Rating
                            </label>
                            <input
                                type="number"
                                min="1"
                                max="5"
                                step="0.1"
                                value={reviewForm.data.rating}
                                onChange={(event) =>
                                    reviewForm.setData('rating', event.target.value)
                                }
                                className={inputClassName}
                            />
                            {reviewForm.errors.rating && (
                                <p className="mt-1 text-xs text-red-300">
                                    {reviewForm.errors.rating}
                                </p>
                            )}
                        </div>

                        <div className="flex flex-wrap items-center gap-4">
                            <label className="inline-flex items-center gap-2 text-sm text-white/70">
                                <input
                                    type="checkbox"
                                    checked={Boolean(reviewForm.data.is_public)}
                                    onChange={(event) =>
                                        reviewForm.setData('is_public', event.target.checked)
                                    }
                                    className="h-4 w-4 rounded border-jv-line-strong bg-white/[0.06] text-jv-accent focus:ring-jv-accent/30"
                                />
                                Public
                            </label>
                            <label className="inline-flex items-center gap-2 text-sm text-white/70">
                                <input
                                    type="checkbox"
                                    checked={Boolean(reviewForm.data.is_featured)}
                                    onChange={(event) =>
                                        reviewForm.setData('is_featured', event.target.checked)
                                    }
                                    className="h-4 w-4 rounded border-jv-line-strong bg-white/[0.06] text-jv-accent focus:ring-jv-accent/30"
                                />
                                Featured
                            </label>
                        </div>

                        <div className="md:col-span-2">
                            <label className="mb-1.5 block text-sm font-medium text-white/65">
                                Review Comment{' '}
                                {reviewForm.data.screenshot_path
                                    ? '(optional — a screenshot is attached)'
                                    : ''}
                            </label>
                            <textarea
                                rows="4"
                                value={reviewForm.data.comment}
                                onChange={(event) =>
                                    reviewForm.setData('comment', event.target.value)
                                }
                                className={inputClassName}
                            />
                            {reviewForm.errors.comment && (
                                <p className="mt-1 text-xs text-red-300">
                                    {reviewForm.errors.comment}
                                </p>
                            )}
                        </div>

                        <div className="md:col-span-2">
                            <label className="mb-1.5 block text-sm font-medium text-white/65">
                                WhatsApp Screenshot (optional)
                            </label>
                            <p className="mb-2 text-xs text-white/45">
                                Provide a comment, a screenshot, or both. Upload a screenshot of a
                                WhatsApp testimonial to show it as the review.
                            </p>
                            <div className="flex flex-wrap items-center gap-3">
                                <label className="jv-btn jv-btn--ghost cursor-pointer">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(event) =>
                                            uploadScreenshot(event.target.files?.[0] ?? null)
                                        }
                                    />
                                    {screenshotUploading ? 'Uploading...' : 'Choose Screenshot'}
                                </label>

                                <button
                                    type="button"
                                    onClick={async () => {
                                        const path = await selector.pick('review_screenshot');
                                        if (path) {
                                            reviewForm.setData('screenshot_path', path);
                                        }
                                    }}
                                    className="jv-btn jv-btn--ghost"
                                >
                                    Media Selector
                                </button>

                                {reviewForm.data.screenshot_path && (
                                    <div className="flex items-center gap-2">
                                        <img
                                            src={mediaPreviewUrl(reviewForm.data.screenshot_path)}
                                            alt="Review screenshot preview"
                                            className="h-16 w-16 rounded-md border border-jv-line object-cover"
                                        />
                                        <button
                                            type="button"
                                            onClick={() =>
                                                reviewForm.setData('screenshot_path', '')
                                            }
                                            className="text-xs font-semibold text-red-300 transition hover:text-red-200 hover:underline"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                )}
                            </div>
                            {reviewForm.errors.screenshot_path && (
                                <p className="mt-1 text-xs text-red-300">
                                    {reviewForm.errors.screenshot_path}
                                </p>
                            )}
                        </div>

                        <div className="md:col-span-2">
                            <button
                                type="submit"
                                disabled={reviewForm.processing || screenshotUploading}
                                className="jv-btn jv-btn--primary disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {reviewForm.processing ? 'Saving...' : 'Add Review'}
                            </button>
                        </div>
                    </form>
                </div>

                <div className="jv-card jv-card--pad">
                    <h3 className="text-lg font-semibold tracking-tight text-white">
                        All Reviews
                    </h3>

                    <div className="mt-5 hidden overflow-x-auto md:block">
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="border-b border-jv-line text-left text-xs uppercase tracking-wide text-white/45">
                                    <th className="px-3 py-3 font-medium">Reviewer</th>
                                    <th className="px-3 py-3 font-medium">Rating</th>
                                    <th className="px-3 py-3 font-medium">Source</th>
                                    <th className="px-3 py-3 font-medium">Status</th>
                                    <th className="px-3 py-3 font-medium">Review</th>
                                    <th className="px-3 py-3 font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {clientReviews.length === 0 && (
                                    <tr>
                                        <td
                                            className="px-3 py-4 text-sm text-white/45"
                                            colSpan={6}
                                        >
                                            No client reviews yet.
                                        </td>
                                    </tr>
                                )}

                                {clientReviews.map((review) => (
                                    <tr
                                        key={`client-review-${review.id}`}
                                        className="border-b border-jv-line/70 transition hover:bg-white/[0.04]"
                                    >
                                        <td className="px-3 py-3">
                                            <p className="font-semibold text-white">
                                                {review.reviewer_name || 'Anonymous'}
                                            </p>
                                            <p className="text-xs text-white/45">
                                                {review.reviewer_email || 'No email'}
                                            </p>
                                        </td>
                                        <td className="px-3 py-3">
                                            <p className="text-amber-300">
                                                {renderStars(review.rating)}
                                            </p>
                                            <p className="text-xs text-white/45">
                                                {Number(review.rating || 0).toFixed(1)}/5
                                            </p>
                                        </td>
                                        <td className="px-3 py-3">
                                            <Badge
                                                variant={
                                                    review.source === 'admin'
                                                        ? 'default'
                                                        : 'secondary'
                                                }
                                            >
                                                {review.source === 'admin' ? 'Admin' : 'Client'}
                                            </Badge>
                                        </td>
                                        <td className="px-3 py-3">
                                            <div className="flex flex-wrap gap-1.5">
                                                <Badge
                                                    variant={
                                                        review.is_public ? 'success' : 'warning'
                                                    }
                                                >
                                                    {review.is_public ? 'Public' : 'Private'}
                                                </Badge>
                                                <Badge
                                                    variant={
                                                        review.is_featured
                                                            ? 'default'
                                                            : 'secondary'
                                                    }
                                                >
                                                    {review.is_featured
                                                        ? 'Featured'
                                                        : 'Not Featured'}
                                                </Badge>
                                            </div>
                                        </td>
                                        <td className="px-3 py-3 text-xs leading-6 text-white/55">
                                            {review.screenshot_path && (
                                                <img
                                                    src={mediaPreviewUrl(review.screenshot_path)}
                                                    alt="Review screenshot"
                                                    className="mb-1 h-12 w-12 rounded-jv-sm border border-jv-line object-cover"
                                                />
                                            )}
                                            {String(review.comment || '').slice(0, 140)}
                                            {String(review.comment || '').length > 140 ? '...' : ''}
                                        </td>
                                        <td className="px-3 py-3">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => toggleVisibility(review)}
                                                    className="jv-btn jv-btn--ghost jv-btn--sm"
                                                >
                                                    {review.is_public
                                                        ? 'Make Private'
                                                        : 'Make Public'}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => toggleFeatured(review)}
                                                    className="jv-btn jv-btn--sm border border-jv-accent-line bg-jv-accent/10 text-[#a9c4ff] hover:bg-jv-accent/20 hover:text-white"
                                                >
                                                    {review.is_featured ? 'Unfeature' : 'Feature'}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => destroy(review)}
                                                    className="jv-btn jv-btn--sm border border-red-500/40 bg-red-500/10 text-red-300 hover:bg-red-500/20"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {clientReviews.length === 0 ? (
                        <p className="mt-6 text-sm text-white/45 md:hidden">
                            No client reviews yet.
                        </p>
                    ) : (
                        <MobileCardList className="mt-6">
                            {clientReviews.map((review, index) => (
                                <MobileCard key={`client-review-mobile-${review.id}`} index={index}>
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-semibold text-white">
                                                {review.reviewer_name || 'Anonymous'}
                                            </p>
                                            <p className="truncate text-xs text-white/45">
                                                {review.reviewer_email || 'No email'}
                                            </p>
                                        </div>
                                        <Badge
                                            variant={
                                                review.source === 'admin' ? 'default' : 'secondary'
                                            }
                                            className="shrink-0"
                                        >
                                            {review.source === 'admin' ? 'Admin' : 'Client'}
                                        </Badge>
                                    </div>

                                    <p className="mt-2 text-amber-300">
                                        {renderStars(review.rating)}
                                        <span className="ml-1 text-xs text-white/45">
                                            {Number(review.rating || 0).toFixed(1)}/5
                                        </span>
                                    </p>

                                    <div className="mt-2 flex flex-wrap gap-1.5">
                                        <Badge variant={review.is_public ? 'success' : 'warning'}>
                                            {review.is_public ? 'Public' : 'Private'}
                                        </Badge>
                                        <Badge
                                            variant={
                                                review.is_featured ? 'default' : 'secondary'
                                            }
                                        >
                                            {review.is_featured ? 'Featured' : 'Not Featured'}
                                        </Badge>
                                    </div>

                                    {review.screenshot_path && (
                                        <img
                                            src={mediaPreviewUrl(review.screenshot_path)}
                                            alt="Review screenshot"
                                            className="mt-3 h-20 w-20 rounded-jv-sm border border-jv-line object-cover"
                                        />
                                    )}
                                    <p className="mt-3 text-xs leading-6 text-white/55">
                                        {String(review.comment || '').slice(0, 140)}
                                        {String(review.comment || '').length > 140 ? '...' : ''}
                                    </p>

                                    <MobileCardActions>
                                        <button
                                            type="button"
                                            onClick={() => toggleVisibility(review)}
                                            className="jv-btn jv-btn--ghost jv-btn--sm"
                                        >
                                            {review.is_public ? 'Make Private' : 'Make Public'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => toggleFeatured(review)}
                                            className="jv-btn jv-btn--sm border border-jv-accent-line bg-jv-accent/10 text-[#a9c4ff] hover:bg-jv-accent/20 hover:text-white"
                                        >
                                            {review.is_featured ? 'Unfeature' : 'Feature'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => destroy(review)}
                                            className="jv-btn jv-btn--sm border border-red-500/40 bg-red-500/10 text-red-300 hover:bg-red-500/20"
                                        >
                                            Delete
                                        </button>
                                    </MobileCardActions>
                                </MobileCard>
                            ))}
                        </MobileCardList>
                    )}
                </div>
            </div>

            <MediaSelectorModal controller={selector} />
        </AuthenticatedLayout>
    );
}
