import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Head, useForm, usePage } from '@inertiajs/react';
import {
    BriefcaseBusiness,
    CheckCircle2,
    Clock3,
    Mail,
    Sparkles,
    User,
} from 'lucide-react';

export default function ComingSoon() {
    const { flash } = usePage().props;

    const { data, setData, post, processing, errors, reset, clearErrors } =
        useForm({
            name: '',
            email: '',
            occupation: '',
        });

    const submit = (event) => {
        event.preventDefault();

        post(route('waitlist.store'), {
            preserveScroll: true,
            onSuccess: () => {
                reset();
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

                            <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-[#050a97]/20 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#050a97] shadow-sm backdrop-blur-sm">
                                <Sparkles className="h-3.5 w-3.5" />
                                Launching Soon
                            </p>

                            <h1 className="font-display mt-6 text-4xl font-bold leading-tight text-[#050a49] sm:text-5xl lg:text-6xl">
                                Bellah Options is almost here.
                            </h1>

                            <p className="mt-6 max-w-xl text-base leading-8 text-slate-600 sm:text-lg">
                                A sharper way to discover opportunities is on the
                                way. Join the waitlist and be first to access the
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
                                        Product Updates
                                    </p>
                                    <p className="mt-2 flex items-center gap-2 text-sm font-medium text-slate-800">
                                        <Mail className="h-4 w-4 text-[#050a97]" />
                                        Meaningful build updates only.
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
                                        Save your spot and receive a beautifully
                                        crafted confirmation email instantly.
                                    </CardDescription>
                                </CardHeader>

                                <CardContent>
                                    {flash?.success && (
                                        <div className="mb-5 flex items-start gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                                            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                                            <span>{flash.success}</span>
                                        </div>
                                    )}

                                    <form onSubmit={submit} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Full Name</Label>
                                            <div className="relative">
                                                <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                                <Input
                                                    id="name"
                                                    name="name"
                                                    value={data.name}
                                                    onChange={(event) =>
                                                        setData(
                                                            'name',
                                                            event.target.value,
                                                        )
                                                    }
                                                    className="pl-10"
                                                    placeholder="Aisha Bello"
                                                    required
                                                />
                                            </div>
                                            {errors.name && (
                                                <p className="text-sm text-red-600">
                                                    {errors.name}
                                                </p>
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
                                                    onChange={(event) =>
                                                        setData(
                                                            'email',
                                                            event.target.value,
                                                        )
                                                    }
                                                    className="pl-10"
                                                    placeholder="you@example.com"
                                                    required
                                                />
                                            </div>
                                            {errors.email && (
                                                <p className="text-sm text-red-600">
                                                    {errors.email}
                                                </p>
                                            )}
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="occupation">Occupation</Label>
                                            <div className="relative">
                                                <BriefcaseBusiness className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                                <Input
                                                    id="occupation"
                                                    name="occupation"
                                                    value={data.occupation}
                                                    onChange={(event) =>
                                                        setData(
                                                            'occupation',
                                                            event.target.value,
                                                        )
                                                    }
                                                    className="pl-10"
                                                    placeholder="Product Designer"
                                                    required
                                                />
                                            </div>
                                            {errors.occupation && (
                                                <p className="text-sm text-red-600">
                                                    {errors.occupation}
                                                </p>
                                            )}
                                        </div>

                                        <Button
                                            type="submit"
                                            size="lg"
                                            className="w-full bg-[#050a97] hover:bg-[#050a49] focus-visible:ring-[#050a97]"
                                            disabled={processing}
                                        >
                                            {processing
                                                ? 'Saving your spot...'
                                                : 'Join Waitlist'}
                                        </Button>

                                        <p className="text-center text-xs leading-6 text-slate-500">
                                            We only send launch-related updates.
                                            No spam, ever.
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
