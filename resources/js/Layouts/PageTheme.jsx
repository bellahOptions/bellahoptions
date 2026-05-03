import { Link } from "@inertiajs/react";
import { useState } from "react";
import { XMarkIcon, Bars3Icon } from "@heroicons/react/24/outline";

export default function PageTheme({ children }) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <>
            <header className="bg-white font-sans tracking-tight">
                <div
                    className="
            bg-[#000285] 
            text-white
            text-sm 
            md:px-20
            md:flex
            justify-between
            space-x-10
            gap-8
            hidden
            p-3
            "
                >
                    <span className="flex items-center gap-2">
                        <span className="location-icon">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth="1.5"
                                stroke="currentColor"
                                className="size-5"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                                />
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
                                />
                            </svg>
                        </span>
                        <span>Baba Ode, Onibukun Ota</span>
                    </span>

                    <span className="flex items-center gap-2">
                        <span className="location-icon">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth="1.5"
                                stroke="currentColor"
                                className="size-5"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z"
                                />
                            </svg>
                        </span>
                        <span>
                            <Link href="tel:+2348108671804">
                                +234(0) 810 867 1804
                            </Link>{" "}
                            |{" "}
                            <Link href="tel:+2349031412354">
                                +234(0) 903 141 2354
                            </Link>
                        </span>
                    </span>

                    <span className="flex row-reverse items-center gap-2">
                        <span className="location-icon">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                strokeWidth="1.5"
                                stroke="currentColor"
                                className="size-5"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                                />
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
                                />
                            </svg>
                        </span>
                        <span>Check us out on social Media:</span>
                    </span>
                </div>
                <nav className="md:p-5 bg-white fixed flex justify-between items-center md:px-20 p-4">
                    <div className="logo">
                        <Link href="/welcome">
                        <img
                            src="/logo-06.svg"
                            alt="Bellah Options Official Logo"
                            className="h-8"
                        />
                        </Link>
                    </div>
                    <div className="hidden md:flex gap-8 space-x-5 items-center">
                        <div className="main-nav flex space-x-5 gap-6 text-gray-700">
                            <Link href="/about-bellah-options" className="hover:text-blue-500">
                                About us
                            </Link>
                            <Link href="#" className="hover:text-blue-500">
                                Services
                            </Link>
                            <Link href="#" className="hover:text-blue-500">
                                Gallery
                            </Link>
                            <Link href="#" className="hover:text-blue-500">
                                Blog
                            </Link>
                            <Link href="#" className="hover:text-blue-500">
                                Events
                            </Link>
                        </div>
                        <div className="cta gap-8 space-x-5">
                            <Link href="#">
                                <button
                                    role="button"
                                    className="px-4 py-2 bg-[#000285] text-white rounded-md"
                                >
                                    Get Started
                                </button>
                            </Link>
                            <Link href="#">
                                <button
                                    role="button"
                                    className="w-auto px-4 py-2 bg-gray-800 text-white rounded-md"
                                >
                                    Login
                                </button>
                            </Link>
                        </div>
                    </div>
                    <div onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden cursor-pointer">
                        {isMenuOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
                    </div>
                    
                </nav>
                {isMenuOpen && (
                        <div className="mobile-menu flex flex-col gap-4 mt-4 md:hidden p-2 px-4">
                            <Link href="#" className="hover:text-blue-500 text-gray-600">
                                About us
                            </Link>
                            <Link href="#" className="hover:text-blue-500 text-gray-600">
                                Services
                            </Link>
                            <Link href="#" className="hover:text-blue-500 text-gray-600">
                                Gallery
                            </Link>
                            <Link href="#" className="hover:text-blue-500 text-gray-600">
                                Blog
                            </Link>
                            <Link href="#" className="hover:text-blue-500 text-gray-600">
                                Events
                            </Link>
                            <Link href="#" className="mb-5">
                                <button
                                    role="button"
                                    className="w-full px-4 py-2 bg-[#000285] text-white rounded-md"
                                >
                                    Get Started
                                </button>
                            </Link>
                        </div>
                    )}
            </header>
            <main className="min-h-screen bg-gray-100">{children}</main>
        </>
    );
}
