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
    Sparkles,
    User,
} from 'lucide-react';
import { useEffect } from 'react';

export default function ComingSoon({
    occupations = [],
    humanCheckQuestion = '',
    humanCheckNonce = '',
    formRenderedAt = 0,
}) {
    const { flash } = usePage().props;

    const { data, setData, post, processing, errors, reset, clearErrors } =
        useForm({
            name: '',
            email: '',
            occupation: '',
            human_check_answer: '',
            human_check_nonce: humanCheckNonce,
            form_rendered_at: formRenderedAt,
            company_name: '',
        });

    useEffect(() => {
        setData((previous) => ({
            ...previous,
            human_check_nonce: humanCheckNonce,
            form_rendered_at: formRenderedAt,
            human_check_answer: '',
            company_name: '',
        }));
    }, [formRenderedAt, humanCheckNonce, setData]);

    const submit = (event) => {
        event.preventDefault();

        post(route('waitlist.store'), {
            preserveScroll: true,
            onSuccess: () => {
                reset('name', 'email', 'occupation', 'human_check_answer', 'company_name');
                clearErrors();
            },
        });
    };

    return (
        <>
            <Head title="Coming Soon" />

            <div className="font-body relative min-h-screen overflow-hidden bg-gradient-to-br from-[#edf1ff] via-white to-[#f2f7ff] text-slate-900">
                <div className="animate-float absolute -left-24 -top-20 h-80 w-80 rounded-full bg-[#050a97]/15 blur-3xl" />
                <div className="animate-float animation-delay-400 absolute -bottom-20 right-0 h-96 w-96 rounded-full bg-[#05a3e8]/20 blur-3xl" />
                <div className="animate-float animation-delay-200 absolute right-1/3 top-1/3 h-52 w-52 rounded-full bg-[#050a49]/10 blur-3xl" />

                <main className="relative mx-auto flex min-h-screen w-full max-w-6xl items-center px-5 py-16 sm:px-8">
                    <div className="grid w-full items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
                        <section className="animate-fade-up">
                            <img
                                src="/logo-06.svg"
                                alt="Bellah Options logo"
                                className="h-12 w-auto sm:h-14"
                            />

                            <h1 className="font-display mt-6 text-4xl font-bold leading-tight tracking-tighter text-[#050a49] sm:text-5xl lg:text-6xl">
                                Our new website is almost here.
                            </h1>

                            <p className="mt-6 max-w-xl text-base leading-8 text-slate-600 sm:text-lg">
                                A better way to book our services and keep track of your bookings. Join the waitlist and be first to access the
                                platform when we open early access.
                            </p>

                            <div className="mt-8 grid max-w-xl gap-3 sm:grid-cols-2">
                                <div className="rounded-lg border border-[#050a97]/15 bg-white/80 p-4 shadow-sm backdrop-blur-sm">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Early Access
                                    </p>
                                    <p className="mt-2 flex items-center gap-2 text-sm font-medium text-slate-800">
                                        <Clock3 className="h-4 w-4 text-[#050a97]" />
                                        Priority invite drops first.
                                    </p>
                                </div>
                                <div className="rounded-lg border border-[#050a97]/15 bg-white/80 p-4 shadow-sm backdrop-blur-sm">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                        Security First
                                    </p>
                                    <p className="mt-2 flex items-center gap-2 text-sm font-medium text-slate-800">
                                        <ShieldCheck className="h-4 w-4 text-[#050a97]" />
                                        Human verification enabled.
                                    </p>
                                </div>
                            </div>
                        </section>

                        <section className="animate-fade-up animation-delay-200">
                            <Card className="border-[#050a97]/15 bg-white/90 shadow-2xl shadow-[#050a97]/10 backdrop-blur-xl">
                                <CardHeader className="pb-5">
                                    <CardTitle className="font-display text-2xl text-[#050a49]">
                                        Join the Waitlist
                                    </CardTitle>
                                    <CardDescription className="text-slate-600">
                                        Save your spot and receive a confirmation email instantly.
                                    </CardDescription>
                                </CardHeader>

                                <CardContent>
                                    {flash?.success && (
                                        <div className="mb-5 flex items-start gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                                            <span>{flash.success}</span>
                                        </div>
                                    )}

                                    {flash?.error && (
                                        <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                                            {flash.error}
                                        </div>
                                    )}

                                    <form onSubmit={submit} className="space-y-4">
                                        <input
                                            type="text"
                                            name="company_name"
                                            value={data.company_name}
                                            onChange={(event) => setData('company_name', event.target.value)}
                                            className="hidden"
                                            tabIndex={-1}
                                            autoComplete="off"
                                            aria-hidden="true"
                                        />
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Full Name</Label>
                                            <div className="relative">
                                                <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
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
                                                <p className="text-sm text-red-600">{errors.name}</p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="email">Email Address</Label>
                                            <div className="relative">
                                                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
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
                                                <p className="text-sm text-red-600">{errors.email}</p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="occupation">Occupation</Label>
                                            <div className="relative">
                                                <BriefcaseBusiness className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                                                <select
                                                    id="occupation"
                                                    name="occupation"
                                                    value={data.occupation}
                                                    onChange={(event) => setData('occupation', event.target.value)}
                                                    className="h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#050a97] disabled:cursor-not-allowed disabled:opacity-50"
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
                                                <p className="text-sm text-red-600">{errors.occupation}</p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="human_check_answer">
                                                Identify yourself: {humanCheckQuestion}
                                            </Label>
                                            <Input
                                                id="human_check_answer"
                                                type="number"
                                                min="0"
                                                name="human_check_answer"
                                                value={data.human_check_answer}
                                                onChange={(event) => setData('human_check_answer', event.target.value)}
                                                placeholder="Enter answer"
                                                required
                                            />
                                            {errors.human_check_answer && (
                                                <p className="text-sm text-red-600">{errors.human_check_answer}</p>
                                            )}
                                        </div>

                                        <Button
                                            type="submit"
                                            size="lg"
                                            className="w-full bg-[#050a97] hover:bg-[#050a49] focus-visible:ring-[#050a97]"
                                            disabled={processing}
                                        >
                                            {processing ? 'Saving your spot...' : 'Join Waitlist'}
                                        </Button>

                                        <p className="text-center text-xs leading-6 text-slate-500">
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
