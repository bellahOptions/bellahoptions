import ApplicationLogo from "@/Components/ApplicationLogo";
import TemplatrPromoBanner from "@/Components/TemplatrPromoBanner";
import WhatsAppButton from "@/Components/WhatsAppButton";
import { Button, Eyebrow } from "@/Components/PublicUI";
import { Link, usePage } from "@inertiajs/react";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
    FaBehance,
    FaFacebookF,
    FaInstagram,
    FaLinkedinIn,
} from "react-icons/fa6";
import {
    ArrowUpIcon,
    Bars3Icon,
    EnvelopeIcon,
    MapPinIcon,
    PhoneIcon,
    XMarkIcon,
} from "@heroicons/react/24/outline";

const navLinks = [
    { label: "Home", href: "/" },
    { label: "About", href: "/about-bellah-options" },
    { label: "Services", href: "/services" },
    { label: "Gallery", href: "/gallery" },
    { label: "Blog", href: "/blog" },
    { label: "Events", href: "/events" },
    { label: "Reviews", href: "/reviews" },
];

const footerQuickLinks = [
    { label: "Home", href: "/" },
    { label: "About Us", href: "/about-bellah-options" },
    { label: "Services", href: "/services" },
    { label: "Gallery", href: "/gallery" },
    { label: "Blog", href: "/blog" },
    { label: "Events", href: "/events" },
    { label: "Reviews", href: "/reviews" },
    { label: "SEO Modules", href: "/seo-modules-and-functions" },
];

const footerServices = [
    { label: "Brand Design", href: "/order/brand-design" },
    { label: "Graphic Design", href: "/order/graphic-design" },
    { label: "Web Design", href: "/order/web-design" },
    { label: "UI/UX Design", href: "/order/ui-ux" },
    { label: "Manage Your Hires", href: "/manage-your-hires" },
];

const socialLinks = [
    {
        label: "Find Bellah Options on Facebook",
        href: "https://www.facebook.com/BellahOptions/",
        icon: FaFacebookF,
    },
    {
        label: "Find Bellah Options on Behance",
        href: "https://www.behance.net/bellahoptionsNG",
        icon: FaBehance,
    },
    {
        label: "Find Bellah Options on Instagram",
        href: "https://www.instagram.com/bellahgroup/",
        icon: FaInstagram,
    },
    {
        label: "Find Bellah Options on LinkedIn",
        href: "https://ng.linkedin.com/company/bellahoptions",
        icon: FaLinkedinIn,
    },
];

const contactRows = [
    {
        icon: PhoneIcon,
        label: "Phone",
        value: "+234 810 867 1804",
        href: "tel:+2348108671804",
    },
    {
        icon: EnvelopeIcon,
        label: "Email",
        value: "info@bellahoptions.com",
        href: "mailto:info@bellahoptions.com",
    },
    {
        icon: MapPinIcon,
        label: "Studio",
        value: "Ogun State, Nigeria",
        href: null,
    },
];

function FooterColumn({ title, links }) {
    return (
        <div>
            <p className="jv-mono text-white/40">{title}</p>
            <ul className="mt-5 space-y-3">
                {links.map((link) => (
                    <li key={link.label}>
                        <Link
                            href={link.href}
                            className="text-sm text-white/60 transition-colors hover:text-white"
                        >
                            {link.label}
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default function PageTheme({ children }) {
    const user = usePage().props?.auth?.user;
    const isLoggedIn = Boolean(user?.id);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handler = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handler, { passive: true });
        handler();

        return () => window.removeEventListener("scroll", handler);
    }, []);

    useEffect(() => {
        document.body.classList.add("jv-canvas", "marketing-ui");

        return () => document.body.classList.remove("jv-canvas", "marketing-ui");
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    return (
        <>
            <TemplatrPromoBanner />

            {/* ── HEADER ── */}
            <header
                className={`sticky top-0 z-50 w-full border-b transition-all duration-300 ${
                    scrolled
                        ? "border-jv-line-strong bg-[#08080cf2] shadow-lg shadow-black/50 backdrop-blur-xl"
                        : "border-jv-line bg-[#08080ccc] backdrop-blur-md"
                }`}
            >
                <div className="jv-container flex items-center justify-between gap-4 py-4">
                    <Link href="/" className="shrink-0" aria-label="Bellah Options home">
                        <ApplicationLogo className="h-7 w-auto brightness-0 invert" />
                    </Link>

                    {/* Desktop nav */}
                    <div className="hidden items-center gap-1 lg:flex">
                        {navLinks.map((link) => (
                            <Link
                                key={link.label}
                                href={link.href}
                                className="jv-nav-link"
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    <div className="hidden items-center gap-3 lg:flex">
                        {isLoggedIn ? (
                            <Link
                                href={route("dashboard")}
                                className="flex items-center gap-2 rounded-full px-2 py-1.5 pr-3 text-sm font-medium text-white/70 transition hover:bg-white/[0.07] hover:text-white"
                            >
                                <span className="h-7 w-7 overflow-hidden rounded-full border border-white/15 bg-white/10">
                                    {user?.profile_photo_url ? (
                                        <img
                                            src={user.profile_photo_url}
                                            alt={user?.name || "User"}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <span className="flex h-full w-full items-center justify-center text-[11px] font-semibold text-white/70">
                                            {(user?.name || "U").slice(0, 1).toUpperCase()}
                                        </span>
                                    )}
                                </span>
                                Dashboard
                            </Link>
                        ) : null}

                        <Button href="/contact-us" variant="primary" size="sm">
                            Get In Touch
                        </Button>
                    </div>

                    {/* Mobile toggle */}
                    <button
                        type="button"
                        onClick={() => setIsMenuOpen((open) => !open)}
                        className="rounded-full p-2 text-white/80 transition hover:bg-white/[0.08] hover:text-white lg:hidden"
                        aria-label="Toggle menu"
                        aria-expanded={isMenuOpen}
                    >
                        {isMenuOpen ? (
                            <XMarkIcon className="h-5 w-5" />
                        ) : (
                            <Bars3Icon className="h-5 w-5" />
                        )}
                    </button>
                </div>

                {/* Mobile menu */}
                <AnimatePresence>
                    {isMenuOpen && (
                        <motion.div
                            className="overflow-hidden border-t border-jv-line bg-[#08080cf2] backdrop-blur-xl lg:hidden"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.22, ease: "easeOut" }}
                        >
                            <div className="jv-container py-4">
                                <div className="space-y-1">
                                    {navLinks.map((link) => (
                                        <Link
                                            key={link.label}
                                            href={link.href}
                                            onClick={() => setIsMenuOpen(false)}
                                            className="block rounded-xl px-3 py-2.5 text-sm text-white/70 transition hover:bg-white/[0.07] hover:text-white"
                                        >
                                            {link.label}
                                        </Link>
                                    ))}
                                </div>
                                <div className="mt-4 flex flex-col gap-2 border-t border-jv-line pt-4">
                                    <Button
                                        href="/contact-us"
                                        variant="primary"
                                        className="w-full"
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        Get In Touch
                                    </Button>
                                    <Button
                                        href={isLoggedIn ? route("dashboard") : "/login"}
                                        variant="ghost"
                                        className="w-full"
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        {isLoggedIn ? "Dashboard" : "Log In"}
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </header>

            <main className="min-h-screen">{children}</main>

            <motion.button
                type="button"
                onClick={scrollToTop}
                className={`fixed bottom-5 right-24 z-50 flex h-11 w-11 items-center justify-center rounded-full border border-jv-line-strong bg-white/10 text-white backdrop-blur-xl transition hover:bg-jv-accent focus:outline-none focus:ring-2 focus:ring-jv-accent focus:ring-offset-2 focus:ring-offset-black ${
                    scrolled ? "" : "pointer-events-none"
                }`}
                initial={false}
                animate={
                    scrolled
                        ? { opacity: 1, y: 0, scale: 1 }
                        : { opacity: 0, y: 12, scale: 0.94 }
                }
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.94 }}
                transition={{ duration: 0.2 }}
                aria-label="Scroll to top"
            >
                <ArrowUpIcon className="h-5 w-5" />
            </motion.button>

            {/* ── FOOTER ── */}
            <footer className="relative mt-8 overflow-hidden border-t border-jv-line">
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -top-40 left-1/2 h-80 w-[min(900px,120%)] -translate-x-1/2 bg-[radial-gradient(closest-side,rgba(0,85,255,0.28),transparent_75%)]"
                />

                <div className="jv-container relative py-16 lg:py-20">
                    <div className="flex flex-col gap-8 border-b border-jv-line pb-12 lg:flex-row lg:items-end lg:justify-between">
                        <div className="max-w-xl">
                            <Eyebrow>Start a project</Eyebrow>
                            <h2 className="jv-display jv-display--md mt-5">
                                Ready to build something{" "}
                                <span className="jv-muted">worth remembering?</span>
                            </h2>
                            <p className="jv-body mt-4">
                                Tell us what you are building. We will help you choose the
                                right creative direction and next step.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <Button href="/order/special-service" variant="primary" icon>
                                Start a Project
                            </Button>
                            <Button href="/contact-us" variant="ghost">
                                Book a call
                            </Button>
                        </div>
                    </div>

                    <div className="grid gap-12 pt-12 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.1fr]">
                        <div className="space-y-5">
                            <img src="/logo-08.svg" className="h-10 w-auto" alt="Bellah Options" />
                            <p className="jv-body max-w-xs">
                                Creative design agency transforming ideas into meaningful
                                visual experiences through branding, design, and digital
                                execution.
                            </p>
                            <div className="flex gap-2">
                                {socialLinks.map((social) => {
                                    const SocialIcon = social.icon;

                                    return (
                                        <a
                                            key={social.label}
                                            href={social.href}
                                            target="_blank"
                                            rel="noreferrer"
                                            aria-label={social.label}
                                            className="flex h-9 w-9 items-center justify-center rounded-full border border-jv-line bg-white/[0.05] text-white/60 transition hover:border-jv-accent-line hover:bg-jv-accent/15 hover:text-white"
                                        >
                                            <SocialIcon className="h-3.5 w-3.5" />
                                        </a>
                                    );
                                })}
                            </div>
                        </div>

                        <FooterColumn title="Quick Links" links={footerQuickLinks} />
                        <FooterColumn title="Services" links={footerServices} />

                        <div>
                            <p className="jv-mono text-white/40">Get In Touch</p>
                            <ul className="mt-5 space-y-4">
                                {contactRows.map((row) => {
                                    const RowIcon = row.icon;

                                    return (
                                        <li key={row.label} className="flex items-start gap-3">
                                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-jv-line bg-white/[0.05] text-white/60">
                                                <RowIcon className="h-4 w-4" />
                                            </span>
                                            <div>
                                                <p className="jv-mono text-white/35">{row.label}</p>
                                                {row.href ? (
                                                    <a
                                                        href={row.href}
                                                        className="mt-1 block break-all text-sm text-white/80 transition hover:text-jv-accent"
                                                    >
                                                        {row.value}
                                                    </a>
                                                ) : (
                                                    <p className="mt-1 text-sm text-white/80">{row.value}</p>
                                                )}
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    </div>

                    <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-jv-line pt-6 sm:flex-row">
                        <p className="jv-small">
                            © {new Date().getFullYear()} Bellah Options. All rights reserved.
                        </p>
                        <div className="flex flex-wrap gap-5">
                            {[
                                { label: "Privacy Policy", href: "/privacy-policy" },
                                { label: "Terms of Service", href: "/terms-of-service" },
                                { label: "Cookie Policy", href: "/cookie-policy" },
                            ].map((link) => (
                                <Link
                                    key={link.label}
                                    href={link.href}
                                    className="jv-small transition hover:text-white"
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </footer>

            <WhatsAppButton />
        </>
    );
}
