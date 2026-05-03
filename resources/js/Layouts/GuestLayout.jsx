import { Link } from '@inertiajs/react';

export default function GuestLayout({ children }) {
    return (
        <div className="relative min-h-screen overflow-hidden bg-gradient-to-br from-[#04102a] via-[#062056] to-[#123b9d] text-slate-100">
            <div className="pointer-events-none absolute -left-16 top-8 h-72 w-72 rounded-full bg-blue-300/25 blur-3xl" />
            <div className="pointer-events-none absolute right-0 top-1/3 h-80 w-80 rounded-full bg-cyan-300/20 blur-3xl" />
            <div className="pointer-events-none absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-indigo-300/20 blur-3xl" />

            <div className="relative mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-8 sm:px-8">
                <div className="grid w-full gap-8 lg:grid-cols-[1.1fr_0.9fr]">
                    <section className="hidden flex-col justify-between rounded-3xl border border-blue-200/20 bg-gradient-to-b from-[#0b2a70]/70 to-[#071b47]/80 p-8 backdrop-blur-xl lg:flex">
                        <div>
                            <Link href="/" className="inline-flex items-center gap-3">
                                <img src="/logo-08.svg" alt="Bellah Options" className="h-10 w-auto" />
                                <span className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-100">
                                    Bellah Portal
                                </span>
                            </Link>

                            <h1 className="mt-10 max-w-md text-4xl font-semibold leading-tight text-white">
                                A secure portal for modern operations and client billing.
                            </h1>

                            <p className="mt-5 max-w-md text-sm leading-7 text-blue-100/90">
                                Access your workspace, manage customer records, and keep your invoicing workflow moving from one dashboard.
                            </p>
                        </div>

                        <p className="text-xs uppercase tracking-[0.16em] text-blue-100/70">
                            Built for Bellah Options teams
                        </p>
                    </section>

                    <section className="rounded-3xl border border-blue-100/60 bg-gradient-to-b from-white to-blue-50/70 p-6 text-slate-900 shadow-2xl shadow-blue-950/30 backdrop-blur-xl sm:p-8">
                        <div className="mb-6 flex items-center justify-between lg:hidden">
                            <Link href="/" className="inline-flex items-center gap-2">
                                <img src="/logo-06.svg" alt="Bellah Options" className="h-8 w-auto" />
                            </Link>
                            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-blue-700">
                                Secure Access
                            </p>
                        </div>

                        {children}
                    </section>
                </div>
            </div>
        </div>
    );
}
