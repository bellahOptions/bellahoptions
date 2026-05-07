import { Head, useForm, usePage } from '@inertiajs/react';
import PageTheme from '@/Layouts/PageTheme';

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
                <main className="bg-gray-50 py-16 sm:py-20">
                    <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
                        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
                            <h1 className="text-2xl font-black text-gray-950 sm:text-3xl">Share your experience</h1>
                            <p className="mt-3 text-sm leading-7 text-gray-600">
                                Thanks for working with Bellah Options. Please rate your experience and leave a short review.
                            </p>

                            {flash?.success ? (
                                <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                                    {flash.success}
                                </div>
                            ) : null}

                            {isSubmitted ? (
                                <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-5 text-sm text-gray-700">
                                    Your review has already been submitted. Thank you for your feedback.
                                </div>
                            ) : (
                                <form onSubmit={submit} className="mt-6 space-y-4">
                                    <div>
                                        <label className="mb-1 block text-sm font-semibold text-gray-800">Full Name</label>
                                        <input
                                            type="text"
                                            value={data.reviewer_name}
                                            onChange={(event) => setData('reviewer_name', event.target.value)}
                                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                                        />
                                        {errors.reviewer_name && <p className="mt-1 text-xs text-red-600">{errors.reviewer_name}</p>}
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-sm font-semibold text-gray-800">Email (optional)</label>
                                        <input
                                            type="email"
                                            value={data.reviewer_email}
                                            onChange={(event) => setData('reviewer_email', event.target.value)}
                                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                                        />
                                        {errors.reviewer_email && <p className="mt-1 text-xs text-red-600">{errors.reviewer_email}</p>}
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-sm font-semibold text-gray-800">Star Rating</label>
                                        <div className="flex items-center gap-2">
                                            {starOptions.map((value) => (
                                                <button
                                                    key={`star-option-${value}`}
                                                    type="button"
                                                    onClick={() => setData('rating', value)}
                                                    className="text-2xl leading-none"
                                                    aria-label={`${value} stars`}
                                                >
                                                    <span className={Number(data.rating) >= value ? 'text-amber-500' : 'text-gray-300'}>★</span>
                                                </button>
                                            ))}
                                            <span className="text-sm font-semibold text-gray-600">{Number(data.rating || 0).toFixed(1)}/5</span>
                                        </div>
                                        {errors.rating && <p className="mt-1 text-xs text-red-600">{errors.rating}</p>}
                                    </div>

                                    <div>
                                        <label className="mb-1 block text-sm font-semibold text-gray-800">Your Review</label>
                                        <textarea
                                            rows="5"
                                            value={data.comment}
                                            onChange={(event) => setData('comment', event.target.value)}
                                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                                        />
                                        {errors.comment && <p className="mt-1 text-xs text-red-600">{errors.comment}</p>}
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="inline-flex items-center rounded-md bg-[#000285] px-5 py-2.5 text-sm font-black text-white transition hover:bg-blue-800 disabled:opacity-60"
                                    >
                                        {processing ? 'Submitting...' : 'Submit Review'}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </main>
            </PageTheme>
        </>
    );
}
