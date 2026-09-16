import { Head, useForm, usePage } from '@inertiajs/react';
import PageTheme from '@/Layouts/PageTheme';

const starOptions = [1, 2, 3, 4, 5];

export default function SubmitQuestionnaire({ questionnaire = {}, token = '' }) {
    const { flash } = usePage().props;
    const questions = questionnaire?.questions || [];
    const isCompleted = Boolean(questionnaire?.is_completed);

    const { data, setData, post, processing, errors } = useForm({
        answers: questionnaire?.answers || {},
    });

    const setAnswer = (questionId, value) => {
        setData('answers', { ...data.answers, [questionId]: value });
    };

    const submit = (event) => {
        event.preventDefault();

        post(route('questionnaires.submit.store', token), {
            preserveScroll: true,
        });
    };

    return (
        <>
            <Head title="Service Questionnaire" />

            <PageTheme>
                <main className="bg-gray-50 py-16 sm:py-20">
                    <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
                        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
                            <h1 className="text-2xl font-black text-gray-950 sm:text-3xl">
                                {questionnaire?.service_name ? `How was your ${questionnaire.service_name}?` : 'Tell us about your experience'}
                            </h1>
                            <p className="mt-3 text-sm leading-7 text-gray-600">
                                Thanks for working with Bellah Options. Please answer a few short questions about the service you ordered.
                            </p>

                            {flash?.success ? (
                                <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                                    {flash.success}
                                </div>
                            ) : null}

                            {isCompleted ? (
                                <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-5 text-sm text-gray-700">
                                    You&apos;ve already submitted this questionnaire. Thank you for your feedback.
                                </div>
                            ) : (
                                <form onSubmit={submit} className="mt-6 space-y-5">
                                    {questions.map((question) => (
                                        <div key={question.id}>
                                            <label className="mb-1 block text-sm font-semibold text-gray-800">
                                                {question.label}
                                            </label>

                                            {question.type === 'rating' && (
                                                <div className="flex items-center gap-2">
                                                    {starOptions.map((value) => (
                                                        <button
                                                            key={`${question.id}-star-${value}`}
                                                            type="button"
                                                            onClick={() => setAnswer(question.id, value)}
                                                            className="text-2xl leading-none"
                                                            aria-label={`${value} stars`}
                                                        >
                                                            <span className={Number(data.answers[question.id]) >= value ? 'text-amber-500' : 'text-gray-300'}>★</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}

                                            {question.type === 'text' && (
                                                <textarea
                                                    rows="4"
                                                    value={data.answers[question.id] || ''}
                                                    onChange={(event) => setAnswer(question.id, event.target.value)}
                                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30"
                                                />
                                            )}

                                            {question.type === 'choice' && (
                                                <div className="space-y-2">
                                                    {(question.options || []).map((option) => (
                                                        <label key={option} className="flex items-center gap-2 text-sm text-gray-700">
                                                            <input
                                                                type="radio"
                                                                name={question.id}
                                                                value={option}
                                                                checked={data.answers[question.id] === option}
                                                                onChange={(event) => setAnswer(question.id, event.target.value)}
                                                            />
                                                            {option}
                                                        </label>
                                                    ))}
                                                </div>
                                            )}

                                            {errors[`answers.${question.id}`] && (
                                                <p className="mt-1 text-xs text-red-600">{errors[`answers.${question.id}`]}</p>
                                            )}
                                        </div>
                                    ))}

                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="inline-flex items-center rounded-md bg-brand px-5 py-2.5 text-sm font-black text-white transition hover:bg-brand-dark disabled:opacity-60"
                                    >
                                        {processing ? 'Submitting...' : 'Submit Answers'}
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
