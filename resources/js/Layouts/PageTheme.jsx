import { Link } from "@inertiajs/react";
import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { FaBehance, FaFacebookF, FaInstagram, FaLinkedinIn } from "react-icons/fa6";
import {
    ArrowUpIcon,
    Bars3Icon,
    ChevronRightIcon,
    EnvelopeIcon,
    MapPinIcon,
    PhoneIcon,
    XMarkIcon,
    ArrowRightIcon,
    SparklesIcon,
} from "@heroicons/react/24/outline";

const navLinks = [
    { label: "About Us", href: "/about-bellah-options" },
    { label: "Services", href: "/services" },
    { label: "Gallery", href: "/gallery" },
    { label: "Web Samples", href: "/web-design-samples" },
    { label: "Blog", href: "/blog" },
    { label: "Events", href: "/events" },
];

const quickLinks = [
    { label: "Home", href: "/" },
    { label: "About Us", href: "/about-bellah-options" },
    { label: "Services", href: "/services" },
    { label: "Gallery", href: "/gallery" },
    { label: "Web Samples", href: "/web-design-samples" },
    { label: "Blog", href: "/blog" },
    { label: "Events", href: "/events" },
    { label: "Contact", href: "/contact-us" },
];

const footerServices = [
    { label: "Brand Design", href: "/order/brand-design" },
    { label: "Graphic Design", href: "/order/graphic-design" },
    { label: "Web Design", href: "/order/web-design" },
    { label: "UI/UX Design", href: "/order/ui-ux" },
];

const socialLinks = [
    { label: "Find Bellah Options on Facebook", href: "https://www.facebook.com/BellahOptions/", icon: FaFacebookF },
    { label: "Find Bellah Options on Behance", href: "https://www.behance.net/bellahoptionsNG", icon: FaBehance },
    { label: "Find Bellah Options on Instagram", href: "https://www.instagram.com/bellahgroup/", icon: FaInstagram },
    { label: "Find Bellah Options on LinkedIn", href: "https://ng.linkedin.com/company/bellahoptions", icon: FaLinkedinIn },
];

function FooterLink({ href, children }) {
    return (
        <li>
            <Link
                href={href}
                className="group flex items-center gap-2 text-sm text-blue-200 transition-colors hover:text-white"
            >
                <ChevronRightIcon className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1 text-blue-400" />
                {children}
            </Link>
        </li>
    );
}

export default function PageTheme({ children }) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handler = () => setScrolled(window.scrollY > 20);
        window.addEventListener("scroll", handler);
        handler();

        return () => window.removeEventListener("scroll", handler);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    return (
        <>
            {/* ── HEADER ── */}
            <header className={`z-50 bg-white transition-all duration-300 md:sticky md:top-0 ${scrolled ? "md:shadow-lg md:shadow-blue-900/5" : ""}`}>

                {/* Top bar */}
                <div className="hidden border-b border-gray-100 bg-[#000285]/95 backdrop-blur-sm md:block">
                    <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-2.5 lg:px-8">
                        <div className="flex items-center gap-6 text-xs text-blue-100">
                            <span className="flex items-center gap-1.5">
                                <MapPinIcon className="h-3.5 w-3.5 text-blue-300" />
                                Baba Ode, Onibukun Ota
                            </span>
                            <span className="flex items-center gap-1.5">
                                <PhoneIcon className="h-3.5 w-3.5 text-blue-300" />
                                <a href="tel:+2348108671804" className="hover:text-white transition">+234 810 867 1804</a>
                                <span className="text-blue-400">·</span>
                                <a href="tel:+2349031412354" className="hover:text-white transition">+234 903 141 2354</a>
                            </span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-blue-200">
                            <span className="mr-2 text-blue-400">Follow us:</span>
                            {socialLinks.map((s) => {
                                const SocialIcon = s.icon;

                                return (
                                <a
                                    key={s.label}
                                    href={s.href}
                                    target="_blank"
                                    rel="noreferrer"
                                    aria-label={s.label}
                                    className="flex h-6 w-6 items-center justify-center rounded bg-white/10 text-white transition hover:bg-white/20"
                                >
                                    <SocialIcon className="h-3 w-3" />
                                </a>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Main nav */}
                <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
                    <Link href="/" className="shrink-0">
                        <img src="/logo-06.svg" alt="Bellah Options" className="h-9" />
                    </Link>

                    {/* Desktop nav */}
                    <div className="hidden items-center gap-1 md:flex">
                        {navLinks.map((link) => (
                            <Link
                                key={link.label}
                                href={link.href}
                                className="rounded-lg px-4 py-2 text-sm font-bold text-gray-600 transition hover:bg-gray-50 hover:text-[#000285]"
                            >
                                {link.label}
                            </Link>
                        ))}
                    </div>

                    <div className="hidden items-center gap-3 md:flex">
                        <Link
                            href="/login"
                            className="rounded-lg px-4 py-2 text-sm font-black text-gray-700 transition hover:text-[#000285]"
                        >
                            Log In
                        </Link>
                        <Link
                            href="/order/special-service"
                            className="group inline-flex items-center gap-2 rounded-lg bg-[#000285] px-5 py-2.5 text-sm font-black text-white shadow-lg shadow-blue-900/20 transition hover:-translate-y-0.5 hover:bg-blue-800"
                        >
                            Get Started
                            <ArrowRightIcon className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                        </Link>
                    </div>

                    {/* Mobile toggle */}
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="rounded-lg p-2 text-gray-600 transition hover:bg-gray-100 md:hidden"
                        aria-label="Toggle menu"
                    >
                        {isMenuOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
                    </button>
                </nav>

                {/* Mobile menu */}
                <AnimatePresence>
                    {isMenuOpen && (
                    <motion.div
                        className="border-t border-gray-100 bg-white px-4 pb-6 md:hidden"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.22, ease: "easeOut" }}
                    >
                        <div className="space-y-1 pt-4">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.label}
                                    href={link.href}
                                    onClick={() => setIsMenuOpen(false)}
                                    className="block rounded-lg px-4 py-3 text-sm font-bold text-gray-700 transition hover:bg-gray-50 hover:text-[#000285]"
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </div>
                        <div className="mt-4 flex flex-col gap-3 border-t border-gray-100 pt-4">
                            <Link
                                href="/order/special-service"
                                className="flex items-center justify-center gap-2 rounded-lg bg-[#000285] px-5 py-3 text-sm font-black text-white"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Get Started
                                <ArrowRightIcon className="h-4 w-4" />
                            </Link>
                            <Link
                                href="/login"
                                className="flex items-center justify-center rounded-lg border border-gray-200 px-5 py-3 text-sm font-black text-gray-700"
                                onClick={() => setIsMenuOpen(false)}
                            >
                                Log In
                            </Link>
                        </div>
                    </motion.div>
                    )}
                </AnimatePresence>
            </header>

            <main className="min-h-screen">{children}</main>

            <motion.button
                type="button"
                onClick={scrollToTop}
                className={`fixed bottom-5 right-5 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-[#000285] text-white shadow-lg shadow-blue-900/25 hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 ${
                    scrolled ? "" : "pointer-events-none"
                }`}
                initial={false}
                animate={scrolled ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 12, scale: 0.94 }}
                whileHover={{ y: -3 }}
                whileTap={{ scale: 0.94 }}
                transition={{ duration: 0.2 }}
                aria-label="Scroll to top"
            >
                <ArrowUpIcon className="h-5 w-5" />
            </motion.button>

            {/* ── FOOTER ── */}
            <motion.footer
                className="bg-[#000285] text-white"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, amount: 0.08 }}
                transition={{ duration: 0.45 }}
            >

                {/* Newsletter / pre-footer strip */}
                <div className="border-b border-white/10">
                    <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
                        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10">
                                    <SparklesIcon className="h-5 w-5 text-cyan-300" />
                                </div>
                                <div>
                                    <p className="font-black text-white">Ready to start your project?</p>
                                    <p className="text-sm text-blue-200">Get a response within 24 hours.</p>
                                </div>
                            </div>
                            <Link
                                href="/order/special-service"
                                className="group inline-flex shrink-0 items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-black text-[#000285] transition hover:bg-cyan-50"
                            >
                                Start a Project
                                <ArrowRightIcon className="h-4 w-4 transition group-hover:translate-x-0.5" />
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Main footer grid */}
                <div className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
                    <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4">

                        {/* Brand */}
                        <div className="space-y-5">
                            <img
                                src="https://bellahoptions.com/images/logo-08.svg"
                                alt="Bellah Options"
                                className="h-10 w-auto"
                            />
                            <p className="text-sm leading-7 text-blue-200">
                                Creative design agency transforming ideas into meaningful visual experiences through branding, design, and digital execution.
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
                                        className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-blue-200 transition hover:bg-white/20 hover:text-white"
                                    >
                                        <SocialIcon className="h-4 w-4" />
                                    </a>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Quick Links */}
                        <div>
                            <h3 className="mb-5 flex items-center gap-2 text-sm font-black uppercase tracking-[0.15em] text-white">
                                <span className="h-4 w-1 rounded-full bg-cyan-400" />
                                Quick Links
                            </h3>
                            <ul className="space-y-3">
                                {quickLinks.map((link) => (
                                    <FooterLink key={link.label} href={link.href}>{link.label}</FooterLink>
                                ))}
                            </ul>
                        </div>

                        {/* Services */}
                        <div>
                            <h3 className="mb-5 flex items-center gap-2 text-sm font-black uppercase tracking-[0.15em] text-white">
                                <span className="h-4 w-1 rounded-full bg-blue-300" />
                                Services
                            </h3>
                            <ul className="space-y-3">
                                {footerServices.map((service) => (
                                    <FooterLink key={service.label} href={service.href}>{service.label}</FooterLink>
                                ))}
                            </ul>
                        </div>

                        {/* Contact */}
                        <div>
                            <h3 className="mb-5 flex items-center gap-2 text-sm font-black uppercase tracking-[0.15em] text-white">
                                <span className="h-4 w-1 rounded-full bg-indigo-400" />
                                Get In Touch
                            </h3>
                            <ul className="space-y-4">
                                <li className="flex items-start gap-3">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10">
                                        <PhoneIcon className="h-4 w-4 text-blue-300" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-wider text-blue-400">Phone</p>
                                        <a href="tel:+2348108671804" className="mt-0.5 block text-sm text-white transition hover:text-blue-200">
                                            +234 810 867 1804
                                        </a>
                                    </div>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10">
                                        <EnvelopeIcon className="h-4 w-4 text-blue-300" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-wider text-blue-400">Email</p>
                                        <a href="mailto:info@bellahoptions.com" className="mt-0.5 block break-all text-sm text-white transition hover:text-blue-200">
                                            info@bellahoptions.com
                                        </a>
                                    </div>
                                </li>
                                <li className="flex items-start gap-3">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10">
                                        <MapPinIcon className="h-4 w-4 text-blue-300" />
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold uppercase tracking-wider text-blue-400">Location</p>
                                        <p className="mt-0.5 text-sm text-white">Ogun State, Nigeria</p>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="border-t border-white/10">
                    <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-5 sm:flex-row lg:px-8">
                        <p className="text-sm text-blue-300">
                            © 2026 Bellah Options. All rights reserved.
                        </p>
                        <div className="flex flex-wrap gap-5 text-xs">
                            <a href="#" className="text-blue-300 transition hover:text-white">Privacy Policy</a>
                            <Link href="/terms-of-service" className="text-blue-300 transition hover:text-white">Terms of Service</Link>
                            <a href="#" className="text-blue-300 transition hover:text-white">Cookie Policy</a>
                        </div>
                    </div>
                </div>
            </motion.footer>
        </>
    );
}
