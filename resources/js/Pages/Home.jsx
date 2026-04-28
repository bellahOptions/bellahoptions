import { Head } from '@inertiajs/react';

const highlights = [
    'Transparent Pricing',
    'Efficient work progress tracking',
    'Express Delivery',
    'Better discount offer',
    'Client loyalty system',
    'Easy landing page setup',
];

export default function Home() {
    return (
        <>
            <Head title="We are building a better experience" />

            <div className="min-h-screen bg-gradient-to-br from-[#f7fbff] via-[#edf4ff] to-[#e9f1ff] text-slate-900">
                <main className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-5 py-16 sm:px-8">
                    <div className="grid items-center w-full gap-10 lg:grid-cols-[1.1fr_0.9fr]">
                        <section>
                            <img src="/logo-06.svg" alt="Bellah Options" className="h-11 w-auto" />
                            <h1 className="mt-10 md:text-5xl font-black leading-tighter tracking-tighter text-[#0f2557] text-3xl">
                                We are preparing a faster, smarter Bellah Options experience.
                            </h1>
                            <p className="mt-5 max-w-2xl text-base leading-tight text-slate-600 sm:text-lg">
                                A refreshed service platform is on the way. We are streamlining delivery,
                                pricing, and client experience so your next project is easier to launch and
                                manage.
                            </p>

                            <div className="mt-8 flex flex-wrap gap-3">
                                <a
                                    href="/waitlist"
                                    className="rounded-xl bg-[#1f4ed8] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#143ba8]"
                                >
                                    Join Waitlist
                                </a>
                            </div>
                        </section>

                        <section className="rounded-3xl border border-[#d3e2ff] bg-white/85 p-6 shadow-xl shadow-[#86a9ff33] sm:p-8">
                            <h2 className="text-lg font-bold text-[#0f2557] sm:text-xl">What to expect</h2>
                            <ul className="mt-5 space-y-3">
                                {highlights.map((item) => (
                                    <li
                                        key={item}
                                        className="rounded-xl border border-[#e3ecff] bg-[#f8fbff] px-4 py-3 text-sm font-medium text-slate-700"
                                    >
                                        {'- ' + item}
                                    </li>
                                ))}
                            </ul>

                            <p className="mt-6 text-xs leading-6 text-slate-500">
                                We will notify early-access subscribers first once the rollout begins.
                            </p>
                        </section>
                    </div>
                </main>
            </div>
        </>
    );
}
