import ApplicationLogo from '@/Components/ApplicationLogo';
import Dropdown from '@/Components/Dropdown';
import TemplatrPromoBanner from '@/Components/TemplatrPromoBanner';
import WhatsAppButton from '@/Components/WhatsAppButton';
import { Link, usePage } from '@inertiajs/react';
import { useState } from 'react';

const SERVICE_PRICING_SLUGS = [
    { slug: 'social-media-design', label: 'Social Media Design' },
    { slug: 'graphic-design', label: 'Graphic Design' },
    { slug: 'brand-design', label: 'Brand Design' },
    { slug: 'web-design', label: 'Web Design' },
    { slug: 'special-service', label: 'Special Service' },
    { slug: 'mobile-app-development', label: 'Mobile App Development' },
    { slug: 'ui-ux', label: 'UI/UX' },
    { slug: 'manage-hires', label: 'Manage Hires' },
];

export default function AuthenticatedLayout({ header, children }) {
    const user = usePage().props.auth.user;
    const isStaff = Boolean(user?.is_staff);
    const isSuperAdmin = Boolean(user?.is_super_admin);
    const canManageInvoices = Boolean(user?.can_manage_invoices);
    const canManageSettings = Boolean(user?.can_manage_settings);
    const canManagePublicContent = Boolean(user?.can_manage_public_content);
    const canManageUsers = Boolean(user?.can_manage_users);

    const [showingNavigationDropdown, setShowingNavigationDropdown] =
        useState(false);
    const userInitials = getUserInitials(user?.name);

    const navItems = isStaff
        ? [
            {
                label: 'Dashboard',
                href: route('dashboard'),
                active: route().current('dashboard'),
                show: true,
            },
            {
                label: 'Support Tickets',
                href: route('admin.support-tickets.index'),
                active: route().current('admin.support-tickets.*'),
                show: true,
            },
            {
                label: 'Orders',
                href: route('admin.service-orders.index'),
                active: route().current('admin.service-orders.*'),
                show: canManageInvoices,
            },
            {
                label: 'Invoices',
                href: route('admin.invoices.index'),
                active: route().current('admin.invoices.*'),
                show: canManageInvoices,
            },
            {
                label: 'Service Briefs',
                href: route('admin.service-briefs.index'),
                active: route().current('admin.service-briefs.*'),
                show: canManageInvoices,
            },
            {
                label: 'Finance',
                href: route('admin.finance.index'),
                active: route().current('admin.finance.*'),
                show: isSuperAdmin,
            },
            {
                label: 'My Earnings',
                href: route('admin.my-earnings'),
                active: route().current('admin.my-earnings'),
                show: true,
            },
            {
                label: 'Users',
                href: route('admin.users.index'),
                active: route().current('admin.users.*'),
                show: canManageUsers,
            },
            {
                label: 'Settings',
                href: route('admin.settings.edit'),
                active: route().current('admin.settings.*'),
                show: canManageSettings,
            },
            {
                label: 'Email Center',
                href: route('admin.email-center.index'),
                active: route().current('admin.email-center.*'),
                show: canManageSettings,
            },
            {
                label: 'Questionnaires',
                href: route('admin.questionnaire-templates.index'),
                active: route().current('admin.questionnaire-templates.*'),
                show: canManageSettings,
            },
            {
                label: 'Brief Templates',
                href: route('admin.service-brief-templates.index'),
                active: route().current('admin.service-brief-templates.*'),
                show: canManageSettings,
            },
            {
                type: 'group',
                label: 'Service Pricing',
                show: canManageSettings,
                active: route().current('admin.service-pricing.*')
                    || route().current('admin.subscription-plans.*')
                    || route().current('admin.discount-codes.*'),
                children: [
                    ...SERVICE_PRICING_SLUGS.map(({ slug, label }) => ({
                        label,
                        href: route('admin.service-pricing.edit', slug),
                        active: route().current('admin.service-pricing.edit', { serviceSlug: slug }),
                    })),
                    {
                        label: 'Subscription Plans',
                        href: route('admin.subscription-plans.index'),
                        active: route().current('admin.subscription-plans.*'),
                    },
                    {
                        label: 'Discount Codes',
                        href: route('admin.discount-codes.index'),
                        active: route().current('admin.discount-codes.*'),
                    },
                ],
            },
            {
                label: 'Projects',
                href: route('admin.gallery.index'),
                active: route().current('admin.gallery.*'),
                show: canManagePublicContent,
            },
            {
                label: 'Events',
                href: route('admin.events.index'),
                active: route().current('admin.events.*'),
                show: canManagePublicContent,
            },
            {
                label: 'Blog',
                href: route('admin.blog.index'),
                active: route().current('admin.blog.*'),
                show: canManagePublicContent,
            },
            {
                label: 'FAQs',
                href: route('admin.faqs.index'),
                active: route().current('admin.faqs.*'),
                show: canManagePublicContent,
            },
        ].filter((item) => item.show)
        : [
            {
                label: 'Order New Service',
                href: route('orders.create', 'social-media-design'),
                active: route().current('orders.create'),
                show: true,
            },
            {
                label: 'Job Progress/Mgt',
                href: route('dashboard.orders'),
                active: route().current('dashboard.orders'),
                show: true,
            },
            {
                label: 'Manage Referrals',
                href: route('dashboard.referrals'),
                active: route().current('dashboard.referrals'),
                show: true,
            },
            {
                label: 'Manage your hires',
                href: route('dashboard.hires'),
                active: route().current('dashboard.hires'),
                show: true,
            },
            {
                label: 'Support Tickets',
                href: route('dashboard.support'),
                active: route().current('dashboard.support'),
                show: true,
            },
        ].filter((item) => item.show);

    return (
        <div className="jv-canvas min-h-screen">
            <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col border-r border-jv-line bg-black/40 backdrop-blur-xl lg:flex">
                <div className="flex h-20 shrink-0 items-center border-b border-jv-line px-6">
                    <Link href="/" className="inline-flex items-center gap-3">
                        <ApplicationLogo className="block h-8 w-auto brightness-0 invert" />
                    </Link>
                </div>

                <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-6">
                    {navItems.map((item) => (
                        item.type === 'group' ? (
                            <SidebarGroup key={item.label} label={item.label} active={item.active} items={item.children} />
                        ) : (
                            <SidebarLink
                                key={item.label}
                                href={item.href}
                                active={item.active}
                            >
                                {item.label}
                            </SidebarLink>
                        )
                    ))}
                </nav>

                <div className="border-t border-jv-line p-4">
                    <div className="rounded-jv border border-jv-line bg-white/[0.04] p-4">
                        <div className="mb-3 flex items-center gap-3">
                            <Avatar
                                photoUrl={user?.profile_photo_url}
                                initials={userInitials}
                                sizeClassName="h-11 w-11"
                            />
                            <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-white">{user.name}</p>
                                <p className="mt-0.5 truncate text-xs text-white/45">{user.email}</p>
                            </div>
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-2">
                            <Link
                                href={route('profile.edit')}
                                className="jv-btn jv-btn--ghost jv-btn--sm w-full"
                            >
                                Profile
                            </Link>
                            <Link
                                method="post"
                                href={route('logout')}
                                as="button"
                                className="jv-btn jv-btn--primary jv-btn--sm w-full"
                            >
                                Log Out
                            </Link>
                        </div>
                    </div>
                </div>
            </aside>

            <div className="lg:pl-72">
                <TemplatrPromoBanner />

                <nav className="sticky top-0 z-30 border-b border-jv-line bg-black/55 backdrop-blur-xl">
                    <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() =>
                                    setShowingNavigationDropdown(
                                        (previousState) => !previousState,
                                    )
                                }
                                className="inline-flex items-center justify-center rounded-full p-2 text-white/60 transition hover:bg-white/[0.08] hover:text-white focus:outline-none lg:hidden"
                                aria-label="Toggle admin menu"
                            >
                                <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                                    <path
                                        className={!showingNavigationDropdown ? 'inline-flex' : 'hidden'}
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M4 6h16M4 12h16M4 18h16"
                                    />
                                    <path
                                        className={showingNavigationDropdown ? 'inline-flex' : 'hidden'}
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>

                            <Link href="/" className="lg:hidden">
                                <ApplicationLogo className="block h-7 w-auto brightness-0 invert" />
                            </Link>
                        </div>

                        <div className="relative">
                            <Dropdown>
                                <Dropdown.Trigger>
                                    <span className="inline-flex rounded-full">
                                        <button
                                            type="button"
                                            className="inline-flex items-center gap-2 rounded-full border border-jv-line bg-white/[0.05] px-3 py-2 text-sm font-medium leading-4 text-white/70 transition hover:bg-white/[0.09] hover:text-white focus:outline-none"
                                        >
                                            <Avatar
                                                photoUrl={user?.profile_photo_url}
                                                initials={userInitials}
                                                sizeClassName="h-8 w-8"
                                            />
                                            {user.name}

                                            <svg
                                                className="-me-0.5 ms-2 h-4 w-4"
                                                xmlns="http://www.w3.org/2000/svg"
                                                viewBox="0 0 20 20"
                                                fill="currentColor"
                                            >
                                                <path
                                                    fillRule="evenodd"
                                                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                        </button>
                                    </span>
                                </Dropdown.Trigger>

                                <Dropdown.Content>
                                    <Dropdown.Link href={route('profile.edit')}>
                                        Profile
                                    </Dropdown.Link>
                                    <Dropdown.Link
                                        href={route('logout')}
                                        method="post"
                                        as="button"
                                    >
                                        Log Out
                                    </Dropdown.Link>
                                </Dropdown.Content>
                            </Dropdown>
                        </div>
                    </div>

                    {showingNavigationDropdown && (
                        <div className="border-t border-jv-line bg-black/70 px-4 py-4 backdrop-blur-xl lg:hidden">
                            <div className="space-y-1">
                                {navItems.map((item) => (
                                    item.type === 'group' ? (
                                        <SidebarGroup
                                            key={item.label}
                                            label={item.label}
                                            active={item.active}
                                            items={item.children}
                                            onNavigate={() => setShowingNavigationDropdown(false)}
                                        />
                                    ) : (
                                        <SidebarLink
                                            key={item.label}
                                            href={item.href}
                                            active={item.active}
                                            onClick={() => setShowingNavigationDropdown(false)}
                                        >
                                            {item.label}
                                        </SidebarLink>
                                    )
                                ))}
                            </div>
                        </div>
                    )}
                </nav>

                {header && (
                    <header className="border-b border-jv-line bg-white/[0.02]">
                        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                            {header}
                        </div>
                    </header>
                )}

                <main>{children}</main>
            </div>

            {!isStaff && <WhatsAppButton />}

        </div>
    );
}

function SidebarGroup({ label, active, items = [], onNavigate }) {
    const [open, setOpen] = useState(active);

    return (
        <div>
            <button
                type="button"
                onClick={() => setOpen((previous) => !previous)}
                className={`flex w-full items-center justify-between rounded-jv-sm px-3 py-2.5 text-sm font-medium transition ${
                    active
                        ? 'bg-jv-accent/15 text-white'
                        : 'text-white/55 hover:bg-white/[0.06] hover:text-white'
                }`}
                aria-expanded={open}
            >
                {label}
                <svg
                    className={`h-4 w-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                >
                    <path
                        fillRule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clipRule="evenodd"
                    />
                </svg>
            </button>

            {open && (
                <div className="mt-1 space-y-1 border-l border-jv-line pl-3">
                    {items.map((child) => (
                        <SidebarLink
                            key={child.label}
                            href={child.href}
                            active={child.active}
                            onClick={onNavigate}
                        >
                            {child.label}
                        </SidebarLink>
                    ))}
                </div>
            )}
        </div>
    );
}

function SidebarLink({ href, active, onClick, children }) {
    return (
        <Link
            href={href}
            onClick={onClick}
            className={`block rounded-jv-sm px-3 py-2.5 text-sm font-medium transition ${
                active
                    ? 'bg-jv-accent/15 text-white shadow-[inset_2px_0_0_0_var(--jv-accent)]'
                    : 'text-white/55 hover:bg-white/[0.06] hover:text-white'
            }`}
        >
            {children}
        </Link>
    );
}

function Avatar({ photoUrl, initials, sizeClassName = 'h-9 w-9' }) {
    if (photoUrl) {
        return (
            <img
                src={photoUrl}
                alt="Profile avatar"
                className={`${sizeClassName} rounded-full border border-jv-line-strong object-cover`}
            />
        );
    }

    return (
        <div
            className={`${sizeClassName} flex items-center justify-center rounded-full border border-jv-line-strong bg-jv-accent/15 text-xs font-semibold text-white`}
        >
            {initials}
        </div>
    );
}

function getUserInitials(name = '') {
    const parts = String(name).trim().split(/\s+/).filter(Boolean);

    if (parts.length === 0) {
        return 'BO';
    }

    if (parts.length === 1) {
        return parts[0].slice(0, 2).toUpperCase();
    }

    return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
}
