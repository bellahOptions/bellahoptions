import { Head } from "@inertiajs/react";
import { motion } from "motion/react";
import PageTheme from "@/Layouts/PageTheme";
import PublicPageHeader from "@/Components/PublicPageHeader";
import { Button, Card, Display, Eyebrow, Section, Stagger, StaggerItem } from "@/Components/PublicUI";
import {
    CalendarDaysIcon,
    MapPinIcon,
} from "@heroicons/react/24/outline";

export default function Events({ events = [] }) {
    const hasEvents = Array.isArray(events) && events.length > 0;

    return (
        <>
            <Head title="Events" />
            <PageTheme>
                <main className="text-white">
                    <PublicPageHeader
                        pageKey="events"
                        fallbackTitle="Workshops, launches, and creative sessions."
                        fallbackText="Events published by the Bellah Options team appear here automatically."
                        eyebrow="Events"
                    />

                    {hasEvents ? (
                        <Section className="border-t border-jv-line">
                            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                                <div>
                                    <Eyebrow>What&apos;s coming up</Eyebrow>
                                    <Display size="md" muted="from the studio." className="mt-6">
                                        Scheduled sessions
                                    </Display>
                                </div>
                                <span className="jv-mono text-white/35">
                                    {events.length} event{events.length === 1 ? "" : "s"}
                                </span>
                            </div>

                            <Stagger className="mt-12 grid gap-6 lg:grid-cols-3">
                                {events.map((event) => (
                                    <StaggerItem
                                        as="article"
                                        key={event.id}
                                        className="h-full"
                                    >
                                        <Card
                                            hover
                                            pad={false}
                                            className="flex h-full flex-col overflow-hidden"
                                        >
                                            {event.image ? (
                                                <div className="jv-media jv-media--zoom aspect-[16/10] rounded-b-none border-0 border-b border-jv-line">
                                                    <img src={event.image} alt={event.title} />
                                                </div>
                                            ) : null}

                                            <div className="flex flex-1 flex-col p-6">
                                                <span className="jv-mono text-jv-accent">
                                                    {event.event_date || "Date to be announced"}
                                                </span>
                                                <h2 className="mt-4 text-xl font-semibold tracking-tight text-white">
                                                    {event.title}
                                                </h2>
                                                <p className="jv-body mt-3">
                                                    {event.description}
                                                </p>

                                                <div className="mt-6 space-y-3 border-t border-jv-line pt-5">
                                                    <p className="flex items-center gap-2.5 text-sm text-white/70">
                                                        <CalendarDaysIcon className="h-4 w-4 shrink-0 text-jv-accent" />
                                                        {event.event_date || "Date to be announced"}
                                                    </p>
                                                    <p className="flex items-center gap-2.5 text-sm text-white/70">
                                                        <MapPinIcon className="h-4 w-4 shrink-0 text-jv-accent" />
                                                        {event.location}
                                                    </p>
                                                </div>

                                                {event.registration_url ? (
                                                    <div className="mt-auto pt-6">
                                                        <Button
                                                            href={event.registration_url}
                                                            external
                                                            variant="primary"
                                                            icon
                                                            className="w-full"
                                                        >
                                                            Register
                                                        </Button>
                                                    </div>
                                                ) : null}
                                            </div>
                                        </Card>
                                    </StaggerItem>
                                ))}
                            </Stagger>
                        </Section>
                    ) : (
                        <Section className="border-t border-jv-line">
                            <Card className="jv-grid-bg relative overflow-hidden px-6 py-14 text-center sm:px-12">
                                <div
                                    aria-hidden="true"
                                    className="pointer-events-none absolute -top-24 left-1/2 h-56 w-[min(620px,110%)] -translate-x-1/2 bg-[radial-gradient(closest-side,rgba(0,85,255,0.32),transparent_72%)]"
                                />
                                <div className="relative mx-auto flex max-w-2xl flex-col items-center">
                                    <motion.span
                                        className="flex h-20 w-20 items-center justify-center rounded-full border border-jv-line-strong bg-white/[0.06] text-jv-accent"
                                        animate={{ y: [0, -8, 0] }}
                                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                    >
                                        <CalendarDaysIcon className="h-9 w-9" />
                                    </motion.span>

                                    <Display size="md" className="mt-8">
                                        No public events yet.
                                    </Display>
                                    <p className="jv-lead mt-5">
                                        The next Bellah Options session is being shaped. When a
                                        new event is published, it will appear here with the full
                                        details.
                                    </p>

                                    <div className="mt-8">
                                        <Button href="/contact-us" variant="primary" icon>
                                            Ask about upcoming events
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        </Section>
                    )}
                </main>
            </PageTheme>
        </>
    );
}
