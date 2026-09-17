import ApplicationLogo from '@/Components/ApplicationLogo';
import AuthCanvas from '@/Components/AuthCanvas';
import TemplatrPromoBanner from '@/Components/TemplatrPromoBanner';
import { CheckItem, Display, Eyebrow } from '@/Components/PublicUI';
import { Link } from '@inertiajs/react';
import { CheckBadgeIcon, ClipboardDocumentCheckIcon, LockClosedIcon } from '@heroicons/react/24/outline';

const brandHighlights = [
    {
        icon: CheckBadgeIcon,
        text: 'Design, campaigns, and delivery tracked in one place.',
    },
    {
        icon: ClipboardDocumentCheckIcon,
        text: 'Briefs, revisions, and approvals without the email thread.',
    },
    {
        icon: LockClosedIcon,
        text: 'Secure accounts with verified sessions and staff 2FA.',
    },
];

/**
 * Shared authentication shell: near-black canvas, one glass card, and a brand
 * rail that fills the empty space on wide screens.
 */
export default function GuestLayout({ children }) {
    return (
        <div className="jv-canvas relative min-h-screen overflow-hidden">
            <TemplatrPromoBanner />
            <AuthCanvas />

            <div className="jv-container relative flex min-h-screen items-center justify-center py-12">
                <div className="grid w-full items-center gap-14 lg:grid-cols-[1.05fr_minmax(0,1fr)] lg:gap-20">
                    <section className="hidden lg:block">
                        <Eyebrow>Client &amp; staff portal</Eyebrow>

                        <Display as="h1" size="lg" className="mt-7" muted="one workspace.">
                            Your projects,
                        </Display>

                        <p className="jv-lead mt-6 max-w-md">
                            Sign in to review work in progress, approve deliverables, and keep your brand moving
                            forward.
                        </p>

                        <ul className="mt-10 grid max-w-md gap-4">
                            {brandHighlights.map((item) => (
                                <CheckItem key={item.text} icon={item.icon}>
                                    {item.text}
                                </CheckItem>
                            ))}
                        </ul>

                        <div className="mt-12 flex items-center gap-8 border-t border-jv-line pt-8">
                            <div>
                                <p className="jv-display jv-display--sm">48h</p>
                                <p className="jv-small mt-1">Average first draft</p>
                            </div>
                            <div className="h-10 w-px bg-jv-line" />
                            <div>
                                <p className="jv-display jv-display--sm">4.9/5</p>
                                <p className="jv-small mt-1">Client rating</p>
                            </div>
                        </div>
                    </section>

                    <section className="mx-auto w-full max-w-md">
                        <div className="mb-7 flex items-center justify-between gap-4">
                            <Link href="/" className="inline-flex items-center gap-3">
                                <ApplicationLogo className="h-9 w-auto brightness-0 invert" />
                            </Link>

                            <Link
                                href="/"
                                className="jv-small transition-colors hover:text-white"
                            >
                                Back to site
                            </Link>
                        </div>

                        {/*
                          `block`, not `flex flex-col`: as a flex column with
                          `items-start` every child (including the <form>, and so
                          every input) shrink-wrapped to its own text instead of
                          filling the card. A block card gives the text blocks
                          their natural fit-content width while the form spans the
                          full width — with no extra classes on either.
                        */}
                        <div className="jv-card jv-card--pad jv-rise block w-full sm:!p-9">
                            {children}
                        </div>

                        <p className="jv-small mt-6 text-center">
                            Protected by session verification and encrypted storage.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
