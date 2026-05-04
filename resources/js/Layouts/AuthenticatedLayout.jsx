import ApplicationLogo from '@/Components/ApplicationLogo';
import Dropdown from '@/Components/Dropdown';
import { Link, usePage } from '@inertiajs/react';
import { useState } from 'react';

export default function AuthenticatedLayout({ header, children }) {
    const user = usePage().props.auth.user;
    const isStaff = Boolean(user?.is_staff);
    const canManageInvoices = Boolean(user?.can_manage_invoices);
    const canManageSettings = Boolean(user?.can_manage_settings);
    const canManageSlides = Boolean(user?.can_manage_slides);
    const canManagePublicContent = Boolean(user?.can_manage_public_content);
    const canManageUsers = Boolean(user?.can_manage_users);

    const [showingNavigationDropdown, setShowingNavigationDropdown] =
        useState(false);

    const navItems = isStaff
        ? [
            {
                label: 'Dashboard',
                href: route('dashboard'),
                active: route().current('dashboard'),
                show: true,
            },
            {
                label: 'Invoices',
                href: route('admin.invoices.index'),
                active: route().current('admin.invoices.*'),
                show: canManageInvoices,
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
                label: 'Slides',
                href: route('admin.slides.index'),
                active: route().current('admin.slides.*'),
                show: canManageSlides,
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
        ].filter((item) => item.show)
        : [];

    return (
        <div className="min-h-screen bg-gray-100">
            <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-gray-200 bg-white lg:flex lg:flex-col">
                <div className="flex h-20 shrink-0 items-center border-b border-gray-100 px-6">
                    <Link href="/" className="inline-flex items-center gap-3">
                        <ApplicationLogo className="block h-10 w-auto" />
                    </Link>
                </div>

                <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-6">
                    <p className="px-3 pb-3 text-xs font-bold uppercase tracking-[0.18em] text-gray-400">
                        Admin Menu
                    </p>
                    {navItems.map((item) => (
                        <SidebarLink
                            key={item.label}
                            href={item.href}
                            active={item.active}
                        >
                            {item.label}
                        </SidebarLink>
                    ))}
                </nav>

                <div className="border-t border-gray-100 p-4">
                    <div className="rounded-xl bg-gray-50 p-4">
                        <p className="truncate text-sm font-bold text-gray-900">{user.name}</p>
                        <p className="mt-1 truncate text-xs text-gray-500">{user.email}</p>
                        <div className="mt-4 grid grid-cols-2 gap-2">
                            <Link
                                href={route('profile.edit')}
                                className="rounded-md border border-gray-200 bg-white px-3 py-2 text-center text-xs font-bold text-gray-700 hover:bg-gray-50"
                            >
                                Profile
                            </Link>
                            <Link
                                method="post"
                                href={route('logout')}
                                as="button"
                                className="rounded-md bg-[#000285] px-3 py-2 text-center text-xs font-bold text-white hover:bg-blue-800"
                            >
                                Log Out
                            </Link>
                        </div>
                    </div>
                </div>
            </aside>

            <div className="lg:pl-72">
                <nav className="sticky top-0 z-30 border-b border-gray-200 bg-white/95 backdrop-blur">
                    <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() =>
                                    setShowingNavigationDropdown(
                                        (previousState) => !previousState,
                                    )
                                }
                                className="inline-flex items-center justify-center rounded-md p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 focus:bg-gray-100 focus:text-gray-700 focus:outline-none lg:hidden"
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
                                <ApplicationLogo className="block h-9 w-auto" />
                            </Link>
                        </div>

                        <div className="relative">
                            <Dropdown>
                                <Dropdown.Trigger>
                                    <span className="inline-flex rounded-md">
                                        <button
                                            type="button"
                                            className="inline-flex items-center rounded-md border border-transparent bg-white px-3 py-2 text-sm font-medium leading-4 text-gray-500 transition hover:text-gray-700 focus:outline-none"
                                        >
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
                        <div className="border-t border-gray-100 bg-white px-4 py-4 shadow-sm lg:hidden">
                            <div className="space-y-1">
                                {navItems.map((item) => (
                                    <SidebarLink
                                        key={item.label}
                                        href={item.href}
                                        active={item.active}
                                        onClick={() => setShowingNavigationDropdown(false)}
                                    >
                                        {item.label}
                                    </SidebarLink>
                                ))}
                            </div>
                        </div>
                    )}
                </nav>

                {header && (
                    <header className="bg-white shadow-sm">
                        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                            {header}
                        </div>
                    </header>
                )}

                <main>{children}</main>
            </div>
        </div>
    );
}

function SidebarLink({ href, active, onClick, children }) {
    return (
        <Link
            href={href}
            onClick={onClick}
            className={`block rounded-lg px-3 py-2.5 text-sm font-bold transition ${
                active
                    ? 'bg-[#000285] text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-[#000285]'
            }`}
        >
            {children}
        </Link>
    );
}
