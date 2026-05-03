import { Head, Link } from "@inertiajs/react";
import { motion } from "motion/react";
import PageTheme from "@/Layouts/PageTheme";
import { RevealSection, Stagger, StaggerItem } from "@/Components/MotionReveal";
import { ArrowRightIcon, CalendarDaysIcon, MapPinIcon, SparklesIcon } from "@heroicons/react/24/outline";

export default function Events({ events = [] }) {
    const hasEvents = Array.isArray(events) && events.length > 0;

    return (
        <>
            <Head title="Events" />
            <PageTheme>
                <main className="bg-white text-gray-950">
                    <RevealSection className="bg-[#000285] py-20 text-white sm:py-24 lg:py-28">
                        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
                            <p className="text-sm font-black uppercase tracking-[0.22em] text-cyan-300">Events</p>
                            <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                                Workshops, launches, and creative sessions.
                            </h1>
                            <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-blue-100">
                                Events uploaded by the super-admin appear here automatically.
                            </p>
                        </div>
                    </RevealSection>

                    {hasEvents ? (
                        <RevealSection className="bg-gray-50 py-16 sm:py-20 lg:py-24">
                            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                                <Stagger className="grid gap-6 lg:grid-cols-3">
                                    {events.map((event) => (
                                        <StaggerItem as="article" key={event.id} className="overflow-hidden bg-white shadow-sm ring-1 ring-gray-200">
                                            {event.image && (
                                                <img src={event.image} alt={event.title} className="h-56 w-full object-cover" />
                                            )}
                                            <div className="p-6">
                                                <h2 className="text-2xl font-black text-gray-950">{event.title}</h2>
                                                <p className="mt-3 text-sm leading-6 text-gray-600">{event.description}</p>
                                                <div className="mt-5 space-y-2 text-sm font-semibold text-gray-700">
                                                    <p className="flex items-center gap-2"><CalendarDaysIcon className="h-5 w-5 text-[#000285]" />{event.event_date || "Date to be announced"}</p>
                                                    <p className="flex items-center gap-2"><MapPinIcon className="h-5 w-5 text-[#000285]" />{event.location}</p>
                                                </div>
                                                {event.registration_url && (
                                                    <a href={event.registration_url} className="mt-6 inline-flex items-center gap-2 rounded-md bg-[#000285] px-5 py-3 text-sm font-black text-white">
                                                        Register
                                                        <ArrowRightIcon className="h-4 w-4" />
                                                    </a>
                                                )}
                                            </div>
                                        </StaggerItem>
                                    ))}
                                </Stagger>
                            </div>
                        </RevealSection>
                    ) : (
                        <RevealSection className="bg-gray-50 py-20 sm:py-24 lg:py-28">
                            <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
                                <motion.div
                                    className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-blue-100 text-[#000285]"
                                    animate={{ y: [0, -10, 0], rotate: [0, 4, -4, 0] }}
                                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                >
                                    <SparklesIcon className="h-14 w-14" />
                                </motion.div>
                                <h2 className="mt-8 text-3xl font-black tracking-tight text-gray-950 sm:text-4xl">
                                    No public events yet.
                                </h2>
                                <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-gray-600">
                                    The next Bellah Options session is being shaped. When the super-admin publishes an event, it will appear here with the full details.
                                </p>
                                <Link href="/contact-us" className="mt-8 inline-flex items-center gap-2 rounded-md bg-[#000285] px-6 py-3 text-sm font-black text-white">
                                    Ask about upcoming events
                                    <ArrowRightIcon className="h-4 w-4" />
                                </Link>
                            </div>
                        </RevealSection>
                    )}
                </main>
            </PageTheme>
        </>
    );
}
