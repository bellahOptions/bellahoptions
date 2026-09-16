import BriefFieldRenderer from '@/Components/BriefFieldRenderer';
import HumanVerificationField from '@/Components/HumanVerificationField';
import PageTheme from '@/Layouts/PageTheme';
import { Head, useForm, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';

const draftStoragePrefix = 'bellah_brief_draft_v1';

function includesAny(haystack, needleOrNeedles) {
    const needles = Array.isArray(needleOrNeedles) ? needleOrNeedles : [needleOrNeedles];
    const hay = (Array.isArray(haystack) ? haystack : [haystack]).map((v) => String(v));

    return needles.some((needle) => hay.includes(String(needle)));
}

function looseEquals(actual, expected) {
    if (Array.isArray(actual)) {
        return includesAny(actual, expected);
    }

    return String(actual ?? '') === String(expected);
}

function isFieldVisible(field, answers) {
    if (!field.condition) {
        return true;
    }

    const { field: refKey, operator, value } = field.condition;
    const actual = answers[refKey];

    switch (operator) {
        case 'equals':
            return looseEquals(actual, value);
        case 'not_equals':
            return !looseEquals(actual, value);
        case 'includes':
            return includesAny(actual, value);
        case 'not_includes':
            return !includesAny(actual, value);
        case 'in':
            return includesAny(value, actual);
        default:
            return true;
    }
}

function isFieldFilled(field, answers) {
    const value = answers[field.key];

    if (field.type === 'checkbox') {
        return field.required ? Boolean(value) : true;
    }

    if (Array.isArray(value)) {
        return value.length > 0;
    }

    return value !== undefined && value !== null && String(value).trim() !== '';
}

export default function CreateServiceBrief({
    serviceSlug,
    serviceName,
    intro = '',
    estimatedMinutes = 5,
    steps = [],
    uploadSessionToken = '',
    profileDefaults = {},
    previewMode = false,
    humanVerificationMode = 'math',
    humanCheckQuestion = '',
    humanCheckNonce = '',
    turnstileSiteKey = '',
    formRenderedAt = 0,
}) {
    const { flash } = usePage().props;
    const draftKey = `${draftStoragePrefix}:${serviceSlug}`;

    const [currentStep, setCurrentStep] = useState(0);
    const [stepErrors, setStepErrors] = useState({});

    const { data, setData, post, processing, errors, reset } = useForm({
        answers: { ...profileDefaults },
        human_check_answer: '',
        human_check_nonce: humanCheckNonce,
        turnstile_token: '',
        form_rendered_at: formRenderedAt,
        upload_session_token: uploadSessionToken,
        website_confirm: '',
    });

    useEffect(() => {
        if (previewMode) {
            return;
        }

        try {
            const raw = window.sessionStorage.getItem(draftKey);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed?.answers) {
                    setData('answers', { ...profileDefaults, ...parsed.answers });
                }
                if (typeof parsed?.currentStep === 'number') {
                    setCurrentStep(parsed.currentStep);
                }
            }
        } catch {
            // Ignore a corrupt/unavailable draft — start fresh.
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (previewMode) {
            return;
        }

        try {
            window.sessionStorage.setItem(draftKey, JSON.stringify({ answers: data.answers, currentStep }));
        } catch {
            // Ignore storage failures (private browsing, quota, etc.).
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data.answers, currentStep]);

    const totalSteps = steps.length + 1;
    const isReviewStep = currentStep === steps.length;

    const keyToStepIndex = useMemo(() => {
        const map = {};
        steps.forEach((step, index) => {
            (step.fields || []).forEach((field) => {
                map[field.key] = index;
            });
        });
        return map;
    }, [steps]);

    useEffect(() => {
        const keys = Object.keys(errors || {});
        if (keys.length === 0) {
            return;
        }

        const firstKey = keys[0];
        const answerKey = firstKey.startsWith('answers.') ? firstKey.slice('answers.'.length) : firstKey;
        const targetStep = keyToStepIndex[answerKey] ?? steps.length;
        setCurrentStep(targetStep);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [errors]);

    const updateAnswer = (key, value) => {
        setData('answers', { ...data.answers, [key]: value });
    };

    const visibleFieldsForStep = (stepIndex) => (steps[stepIndex]?.fields || []).filter((field) => isFieldVisible(field, data.answers));

    const goNext = () => {
        const fields = visibleFieldsForStep(currentStep);
        const missing = fields.filter((field) => field.required && !isFieldFilled(field, data.answers));

        if (missing.length > 0) {
            setStepErrors({ [currentStep]: missing.map((f) => f.key) });
            return;
        }

        setStepErrors({});
        setCurrentStep((step) => Math.min(step + 1, totalSteps - 1));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const goBack = () => {
        setCurrentStep((step) => Math.max(step - 1, 0));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const submit = (event) => {
        event.preventDefault();

        if (previewMode) {
            window.alert('Preview mode — nothing was submitted.');
            return;
        }

        post(route('brief.store', serviceSlug), {
            preserveScroll: true,
            onSuccess: () => {
                try {
                    window.sessionStorage.removeItem(draftKey);
                } catch {
                    // Ignore.
                }
                reset();
            },
        });
    };

    return (
        <>
            <Head title={`Brief — ${serviceName}`} />

            <PageTheme>
                <main className="bg-gray-50 py-12 sm:py-16">
                    <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
                        {previewMode && (
                            <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-center text-sm font-semibold text-amber-800">
                                Preview mode — this will not be submitted.
                            </div>
                        )}

                        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
                            <h1 className="text-2xl font-black text-gray-950 sm:text-3xl">{serviceName} Brief</h1>
                            {currentStep === 0 && (
                                <>
                                    <p className="mt-3 text-sm leading-7 text-gray-600">{intro}</p>
                                    <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-brand">
                                        About {estimatedMinutes} minutes
                                    </p>
                                </>
                            )}

                            <div className="mt-6">
                                <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
                                    <span>Step {currentStep + 1} of {totalSteps}</span>
                                    <span>{isReviewStep ? 'Review & Submit' : steps[currentStep]?.title}</span>
                                </div>
                                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                                    <div
                                        className="h-full rounded-full bg-brand transition-all"
                                        style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
                                    />
                                </div>
                            </div>

                            {flash?.error && (
                                <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                    {flash.error}
                                </div>
                            )}

                            <form onSubmit={submit} className="mt-6 space-y-5">
                                {!isReviewStep ? (
                                    <>
                                        <h2 className="text-base font-bold text-gray-900">{steps[currentStep]?.title}</h2>
                                        {visibleFieldsForStep(currentStep).map((field) => (
                                            <BriefFieldRenderer
                                                key={field.key}
                                                field={field}
                                                value={data.answers[field.key]}
                                                error={
                                                    errors[`answers.${field.key}`]
                                                    || (stepErrors[currentStep]?.includes(field.key) ? 'This field is required.' : '')
                                                }
                                                onChange={(value) => updateAnswer(field.key, value)}
                                                uploadSessionToken={data.upload_session_token}
                                            />
                                        ))}

                                        <input
                                            type="text"
                                            name="website_confirm"
                                            value={data.website_confirm}
                                            onChange={(e) => setData('website_confirm', e.target.value)}
                                            autoComplete="off"
                                            tabIndex={-1}
                                            aria-hidden="true"
                                            style={{ position: 'absolute', left: '-9999px', width: '1px', height: '1px', opacity: 0 }}
                                        />

                                        <div className="flex justify-between pt-2">
                                            {currentStep > 0 ? (
                                                <button
                                                    type="button"
                                                    onClick={goBack}
                                                    className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                                                >
                                                    Back
                                                </button>
                                            ) : <span />}
                                            <button
                                                type="button"
                                                onClick={goNext}
                                                className="rounded-md bg-brand px-5 py-2 text-sm font-black text-white hover:bg-brand-dark"
                                            >
                                                Next
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        {steps.map((step, index) => {
                                            const fields = visibleFieldsForStep(index).filter((field) => data.answers[field.key] !== undefined && data.answers[field.key] !== '' && data.answers[field.key] !== null);

                                            if (fields.length === 0) {
                                                return null;
                                            }

                                            return (
                                                <div key={step.title + index} className="rounded-lg border border-gray-200 p-4">
                                                    <div className="flex items-center justify-between">
                                                        <h3 className="text-sm font-bold text-gray-900">{step.title}</h3>
                                                        <button
                                                            type="button"
                                                            onClick={() => setCurrentStep(index)}
                                                            className="text-xs font-semibold text-brand hover:underline"
                                                        >
                                                            Edit
                                                        </button>
                                                    </div>
                                                    <dl className="mt-2 space-y-1.5">
                                                        {fields.map((field) => (
                                                            <div key={field.key} className="text-xs">
                                                                <dt className="font-semibold text-gray-500">{field.label}</dt>
                                                                <dd className="text-gray-800">
                                                                    {field.type === 'file'
                                                                        ? `${(Array.isArray(data.answers[field.key]) ? data.answers[field.key].length : 0)} file(s) attached`
                                                                        : field.type === 'checkbox'
                                                                            ? (data.answers[field.key] ? 'Yes' : 'No')
                                                                            : Array.isArray(data.answers[field.key])
                                                                                ? data.answers[field.key].join(', ')
                                                                                : String(data.answers[field.key])}
                                                                </dd>
                                                            </div>
                                                        ))}
                                                    </dl>
                                                </div>
                                            );
                                        })}

                                        <div className="border-t border-gray-100 pt-4">
                                            <HumanVerificationField
                                                mode={humanVerificationMode}
                                                question={humanCheckQuestion}
                                                turnstileSiteKey={turnstileSiteKey}
                                                mathValue={data.human_check_answer}
                                                onMathChange={(value) => setData('human_check_answer', value)}
                                                onTurnstileChange={(token) => setData('turnstile_token', token)}
                                                mathError={errors.human_check_answer}
                                                turnstileError={errors.turnstile_token}
                                            />
                                        </div>

                                        <div className="flex justify-between pt-2">
                                            <button
                                                type="button"
                                                onClick={goBack}
                                                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                                            >
                                                Back
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={processing}
                                                className="rounded-md bg-brand px-6 py-2.5 text-sm font-black text-white hover:bg-brand-dark disabled:opacity-60"
                                            >
                                                {processing ? 'Submitting...' : 'Submit Brief'}
                                            </button>
                                        </div>
                                    </>
                                )}
                            </form>
                        </div>
                    </div>
                </main>
            </PageTheme>
        </>
    );
}
