import { Eyebrow } from '@/Components/PublicUI';
import { Card } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Textarea } from '@/Components/ui/textarea';
import PageTheme from '@/Layouts/PageTheme';
import { Head, useForm, usePage } from '@inertiajs/react';

const starOptions = [1, 2, 3, 4, 5];

export default function SubmitReview({ review = {}, token = '' }) {
    const { flash } = usePage().props;
    const isSubmitted = Boolean(review?.is_submitted);

    const { data, setData, post, processing, errors } = useForm({
        reviewer_name: review?.reviewer_name || '',
        reviewer_email: review?.reviewer_email || '',
        rating: review?.rating || 5,
        comment: review?.comment || '',
    });

    const submit = (event) => {
        event.preventDefault();

        post(route('reviews.submit.store', token), {
            preserveScroll: true,
        });
    };

    return (
        <>
            <Head title="Submit Review" />

            <PageTheme>
                <main className="py-12 sm:py-16">
                    <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
                        <Card className="p-6 sm:p-8">
                            <Eyebrow>Review</Eyebrow>
                            <h1 className="jv-display jv-display--md mt-5">Share your experience</h1>
                            <p className="jv-lead mt-4">
                                Thanks for working with Bellah Options. Please rate your experience and leave a short review.
                            </p>

                            {flash?.success ? (
                                <div className="mt-4 rounded-jv-sm border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                                    {flash.success}
                                </div>
                            ) : null}

                            {isSubmitted ? (
                                <div className="mt-6 rounded-jv-sm border border-jv-line bg-white/[0.03] p-5 text-sm text-white/70">
                                    Your review has already been submitted. Thank you for your feedback.
                                </div>
                            ) : (
                                <form onSubmit={submit} className="mt-6 space-y-4">
                                    <div>
                                        <Label className="mb-1 block">Full Name</Label>
                                        <Input
                                            type="text"
                                            value={data.reviewer_name}
                                            onChange={(event) => setData('reviewer_name', event.target.value)}
                                        />
                                        {errors.reviewer_name && <p className="mt-1 text-xs text-red-300">{errors.reviewer_name}</p>}
                                    </div>

                                    <div>
                                        <Label className="mb-1 block">Email (optional)</Label>
                                        <Input
                                            type="email"
                                            value={data.reviewer_email}
                                            onChange={(event) => setData('reviewer_email', event.target.value)}
                                        />
                                        {errors.reviewer_email && <p className="mt-1 text-xs text-red-300">{errors.reviewer_email}</p>}
                                    </div>

                                    <div>
                                        <Label className="mb-1 block">Star Rating</Label>
                                        <div className="flex items-center gap-2">
                                            {starOptions.map((value) => (
                                                <button
                                                    key={`star-option-${value}`}
                                                    type="button"
                                                    onClick={() => setData('rating', value)}
                                                    className="text-2xl leading-none"
                                                    aria-label={`${value} stars`}
                                                >
                                                    <span className={Number(data.rating) >= value ? 'text-amber-400' : 'text-white/20'}>★</span>
                                                </button>
                                            ))}
                                            <span className="text-sm font-semibold text-white/70">{Number(data.rating || 0).toFixed(1)}/5</span>
                                        </div>
                                        {errors.rating && <p className="mt-1 text-xs text-red-300">{errors.rating}</p>}
                                    </div>

                                    <div>
                                        <Label className="mb-1 block">Your Review</Label>
                                        <Textarea
                                            rows="5"
                                            value={data.comment}
                                            onChange={(event) => setData('comment', event.target.value)}
                                        />
                                        {errors.comment && <p className="mt-1 text-xs text-red-300">{errors.comment}</p>}
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="jv-btn jv-btn--primary disabled:opacity-60"
                                    >
                                        {processing ? 'Submitting...' : 'Submit Review'}
                                    </button>
                                </form>
                            )}
                        </Card>
                    </div>
                </main>
            </PageTheme>
        </>
    );
}
