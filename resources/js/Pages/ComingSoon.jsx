import ApplicationLogo from '@/Components/ApplicationLogo';
import HumanVerificationField from '@/Components/HumanVerificationField';
import { Button } from '@/Components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Head, useForm, usePage } from '@inertiajs/react';
import {
    BriefcaseBusiness,
    CheckCircle2,
    Clock3,
    Mail,
    ShieldCheck,
    User,
} from 'lucide-react';
import { useEffect } from 'react';

export default function ComingSoon({
    occupations = [],
    humanVerificationMode = 'math',
    humanCheckQuestion = '',
    humanCheckNonce = '',
    turnstileSiteKey = '',
    formRenderedAt = 0,
}) {
    const { flash } = usePage().props;

    const { data, setData, post, processing, errors, reset, clearErrors } =
        useForm({
            name: '',
            email: '',
            occupation: '',
            human_check_answer: '',
            turnstile_token: '',
            human_check_nonce: humanCheckNonce,
            form_rendered_at: formRenderedAt,
        });

    useEffect(() => {
        setData((previous) => ({
            ...previous,
            human_check_nonce: humanCheckNonce,
            form_rendered_at: formRenderedAt,
            human_check_answer: '',
            turnstile_token: '',
        }));
    }, [formRenderedAt, humanCheckNonce, setData]);

    const submit = (event) => {
        event.preventDefault();

        post(route('waitlist.store'), {
            preserveScroll: true,
            onSuccess: () => {
                reset('name', 'email', 'occupation', 'human_check_answer', 'turnstile_token');
                clearErrors();
            },
        });
    };

    return (
        <>
            <Head title="Coming Soon" />

            <div className="jv-canvas font-body relative min-h-screen overflow-hidden">
                <div
                    aria-hidden="true"
                    className="jv-grid-bg pointer-events-none absolute inset-0"
                />
                <div
                    aria-hidden="true"
                    className="animate-float pointer-events-none absolute -left-24 -top-20 h-80 w-80 rounded-full bg-jv-accent/20 blur-3xl"
                />
                <div
                    aria-hidden="true"
                    className="animate-float animation-delay-200 pointer-events-none absolute -bottom-20 right-0 h-96 w-96 rounded-full bg-jv-accent/15 blur-3xl"
                />

                <main className="jv-container relative flex min-h-screen items-center py-16 sm:py-20">
                    <div className="grid w-full items-center gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
                        <section className="jv-rise">
                            <ApplicationLogo className="h-12 w-auto brightness-0 invert sm:h-14" />

                            <span className="jv-kicker jv-kicker--center mt-8">
                                Coming soon
                            </span>

                            <h1 className="jv-display jv-display--xl mt-6">
                                Our new website is almost here.
                            </h1>

                            <p className="jv-lead mt-6 max-w-xl">
                                A better way to book our services and keep track of your bookings. Join the waitlist and be first to access the
                                platform when we open early access.
                            </p>

                            <div className="mt-8 grid max-w-xl gap-3 sm:grid-cols-2">
                                <div className="rounded-jv-sm border border-jv-line bg-white/[0.04] p-4 backdrop-blur-sm">
                                    <p className="jv-mono text-white/45">
                                        Early Access
                                    </p>
                                    <p className="mt-2 flex items-center gap-2 text-sm font-medium text-white/85">
                                        <Clock3 className="h-4 w-4 text-jv-accent" />
                                        Priority invite drops first.
                                    </p>
                                </div>
                                <div className="rounded-jv-sm border border-jv-line bg-white/[0.04] p-4 backdrop-blur-sm">
                                    <p className="jv-mono text-white/45">
                                        Security First
                                    </p>
                                    <p className="mt-2 flex items-center gap-2 text-sm font-medium text-white/85">
                                        <ShieldCheck className="h-4 w-4 text-jv-accent" />
                                        Human verification enabled.
                                    </p>
                                </div>
                            </div>
                        </section>

                        <section className="jv-rise animation-delay-200">
                            <Card className="jv-card--featured p-6 sm:p-8">
                                <CardHeader className="p-0 pb-5">
                                    <CardTitle className="jv-display jv-display--sm">
                                        Join the Waitlist
                                    </CardTitle>
                                    <CardDescription className="mt-3">
                                        Save your spot and receive a confirmation email instantly.
                                    </CardDescription>
                                </CardHeader>

                                <CardContent className="p-0">
                                    {flash?.success && (
                                        <div className="mb-5 flex items-start gap-2 rounded-jv-sm border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
                                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                                            <span>{flash.success}</span>
                                        </div>
                                    )}

                                    {flash?.error && (
                                        <div className="mb-5 rounded-jv-sm border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                                            {flash.error}
                                        </div>
                                    )}

                                    <form onSubmit={submit} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Full Name</Label>
                                            <div className="relative">
                                                <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                                                <Input
                                                    id="name"
                                                    name="name"
                                                    value={data.name}
                                                    onChange={(event) => setData('name', event.target.value)}
                                                    className="pl-10"
                                                    placeholder="Aisha Bello"
                                                    required
                                                />
                                            </div>
                                            {errors.name && (
                                                <p className="text-sm text-red-300">{errors.name}</p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="email">Email Address</Label>
                                            <div className="relative">
                                                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                                                <Input
                                                    id="email"
                                                    type="email"
                                                    name="email"
                                                    value={data.email}
                                                    onChange={(event) => setData('email', event.target.value)}
                                                    className="pl-10"
                                                    placeholder="you@example.com"
                                                    required
                                                />
                                            </div>
                                            {errors.email && (
                                                <p className="text-sm text-red-300">{errors.email}</p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="occupation">Occupation</Label>
                                            <div className="relative">
                                                <BriefcaseBusiness className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-white/35" />
                                                <select
                                                    id="occupation"
                                                    name="occupation"
                                                    value={data.occupation}
                                                    onChange={(event) => setData('occupation', event.target.value)}
                                                    className="jv-select pl-10"
                                                    required
                                                >
                                                    <option value="">Select your occupation</option>
                                                    {occupations.map((occupation) => (
                                                        <option key={occupation} value={occupation}>
                                                            {occupation}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            {errors.occupation && (
                                                <p className="text-sm text-red-300">{errors.occupation}</p>
                                            )}
                                        </div>

                                        <HumanVerificationField
                                            mode={humanVerificationMode}
                                            question={humanCheckQuestion}
                                            turnstileSiteKey={turnstileSiteKey}
                                            mathValue={data.human_check_answer}
                                            onMathChange={(value) => setData('human_check_answer', value)}
                                            onTurnstileChange={(token) => setData('turnstile_token', token)}
                                            mathError={errors.human_check_answer}
                                            turnstileError={errors.turnstile_token}
                                            labelPrefix="Identify yourself"
                                            inputClassName="jv-input"
                                        />

                                        <Button
                                            type="submit"
                                            size="lg"
                                            className="w-full"
                                            disabled={processing}
                                        >
                                            {processing ? 'Saving your spot...' : 'Join Waitlist'}
                                        </Button>

                                        <p className="text-center text-xs leading-6 text-white/45">
                                            We only send launch-related updates. No spam, ever.
                                        </p>
                                    </form>
                                </CardContent>
                            </Card>
                        </section>
                    </div>
                </main>
            </div>
        </>
    );
}
