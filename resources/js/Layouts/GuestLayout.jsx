import ApplicationLogo from '@/Components/ApplicationLogo';
import AuthCanvas from '@/Components/AuthCanvas';
import { Link } from '@inertiajs/react';

export default function GuestLayout({ children }) {
    return (
        <div className="relative min-h-screen overflow-hidden bg-white text-gray-900">
            <AuthCanvas />

            <div className="relative mx-auto flex min-h-screen w-full max-w-7xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
                <section className="w-full max-w-xl rounded-3xl border border-white/80 bg-white/90 p-6 shadow-xl shadow-blue-100/40 backdrop-blur sm:p-8">
                    <div className="mb-6 flex items-center justify-between">
                        <Link href="/" className="inline-flex items-center gap-3">
                            <ApplicationLogo className="h-10 w-auto" />
                        </Link>
                    </div>
                    {children}
                </section>
            </div>
        </div>
    );
}
