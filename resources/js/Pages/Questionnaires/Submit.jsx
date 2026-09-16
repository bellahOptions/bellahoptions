import { Eyebrow } from '@/Components/PublicUI';
import { Card } from '@/Components/ui/card';
import { Label } from '@/Components/ui/label';
import { Textarea } from '@/Components/ui/textarea';
import PageTheme from '@/Layouts/PageTheme';
import { Head, useForm, usePage } from '@inertiajs/react';

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
                <main className="py-12 sm:py-16">
                    <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
                        <Card className="p-6 sm:p-8">
                            <Eyebrow>Questionnaire</Eyebrow>
                            <h1 className="jv-display jv-display--md mt-5">
                                {questionnaire?.service_name ? `How was your ${questionnaire.service_name}?` : 'Tell us about your experience'}
                            </h1>
                            <p className="jv-lead mt-4">
                                Thanks for working with Bellah Options. Please answer a few short questions about the service you ordered.
                            </p>

                            {flash?.success ? (
                                <div className="mt-4 rounded-jv-sm border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                                    {flash.success}
                                </div>
                            ) : null}

                            {isCompleted ? (
                                <div className="mt-6 rounded-jv-sm border border-jv-line bg-white/[0.03] p-5 text-sm text-white/70">
                                    You&apos;ve already submitted this questionnaire. Thank you for your feedback.
                                </div>
                            ) : (
                                <form onSubmit={submit} className="mt-6 space-y-5">
                                    {questions.map((question) => (
                                        <div key={question.id}>
                                            <Label className="mb-1 block">{question.label}</Label>

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
                                                            <span className={Number(data.answers[question.id]) >= value ? 'text-amber-400' : 'text-white/20'}>★</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}

                                            {question.type === 'text' && (
                                                <Textarea
                                                    rows="4"
                                                    value={data.answers[question.id] || ''}
                                                    onChange={(event) => setAnswer(question.id, event.target.value)}
                                                />
                                            )}

                                            {question.type === 'choice' && (
                                                <div className="space-y-2">
                                                    {(question.options || []).map((option) => (
                                                        <label key={option} className="flex items-center gap-2 text-sm text-white/70">
                                                            <input
                                                                type="radio"
                                                                name={question.id}
                                                                value={option}
                                                                checked={data.answers[question.id] === option}
                                                                onChange={(event) => setAnswer(question.id, event.target.value)}
                                                                className="h-4 w-4 border-jv-line-strong bg-white/[0.06] text-jv-accent accent-jv-accent focus:ring-2 focus:ring-jv-accent/40 focus:ring-offset-0"
                                                            />
                                                            {option}
                                                        </label>
                                                    ))}
                                                </div>
                                            )}

                                            {errors[`answers.${question.id}`] && (
                                                <p className="mt-1 text-xs text-red-300">{errors[`answers.${question.id}`]}</p>
                                            )}
                                        </div>
                                    ))}

                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="jv-btn jv-btn--primary disabled:opacity-60"
                                    >
                                        {processing ? 'Submitting...' : 'Submit Answers'}
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
