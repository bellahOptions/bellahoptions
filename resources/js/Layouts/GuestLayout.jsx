import { Link } from '@inertiajs/react';

const authHighlights = [
    {
        title: 'Client-first workflow',
        text: 'Place service orders, track progress, and keep every update in one dashboard.',
    },
    {
        title: 'Secure access',
        text: 'Your account is protected with modern authentication and verification checks.',
    },
    {
        title: 'Built for growth',
        text: 'From social media designs to full websites, your account scales with your needs.',
    },
];

export default function GuestLayout({ children }) {
    return (
        <div className="relative min-h-screen overflow-hidden bg-white text-gray-900">
            <div className="pointer-events-none absolute -left-24 top-10 h-80 w-80 rounded-full bg-blue-100 blur-3xl" />
            <div className="pointer-events-none absolute right-0 top-1/4 h-96 w-96 rounded-full bg-indigo-100/80 blur-3xl" />
            <div className="pointer-events-none absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-cyan-100/70 blur-3xl" />

            <div className="relative mx-auto flex min-h-screen w-full max-w-7xl items-center px-4 py-10 sm:px-6 lg:px-8">
                <div className="grid w-full gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
                    <section className="hidden rounded-3xl border border-gray-200 bg-gradient-to-b from-white to-blue-50 p-8 shadow-sm lg:flex lg:flex-col lg:justify-between">
                        <div>
                            <Link href="/" className="inline-flex items-center gap-3">
                                <img src="/logo-06.svg" alt="Bellah Options" className="h-10 w-auto" />
                                <span className="text-xs font-black uppercase tracking-[0.2em] text-[#000285]">
                                    Bellah Portal
                                </span>
                            </Link>

                            <h1 className="mt-10 max-w-lg text-4xl font-black leading-tight text-gray-950">
                                Welcome to your <span className="text-[#000285]">#yourBestOption</span> client portal.
                            </h1>

                            <p className="mt-5 max-w-lg text-sm leading-7 text-gray-600">
                                Sign in to manage orders, monitor project updates, and keep your brand operations moving.
                            </p>
                        </div>

                        <div className="mt-10 space-y-3">
                            {authHighlights.map((item) => (
                                <article
                                    key={item.title}
                                    className="rounded-2xl border-l-4 border-[#000285] bg-white px-4 py-3 shadow-sm"
                                >
                                    <p className="text-sm font-black text-gray-900">{item.title}</p>
                                    <p className="mt-1 text-sm leading-6 text-gray-600">{item.text}</p>
                                </article>
                            ))}
                        </div>
                    </section>

                    <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-xl shadow-blue-100/40 sm:p-8">
                        <div className="mb-6 flex items-center justify-between lg:hidden">
                            <Link href="/" className="inline-flex items-center gap-2">
                                <img src="/logo-06.svg" alt="Bellah Options" className="h-8 w-auto" />
                            </Link>
                            <p className="text-xs font-black uppercase tracking-[0.16em] text-[#000285]">
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
