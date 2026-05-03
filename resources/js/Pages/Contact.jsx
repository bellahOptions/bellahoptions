import { Head } from "@inertiajs/react";
import PageTheme from "@/Layouts/PageTheme";
import { RevealSection, Stagger, StaggerItem } from "@/Components/MotionReveal";
import { EnvelopeIcon, MapPinIcon, PhoneIcon } from "@heroicons/react/24/outline";

const contactCards = [
    {
        label: "Call",
        value: "+234 810 867 1804",
        href: "tel:+2348108671804",
        icon: PhoneIcon,
    },
    {
        label: "Email",
        value: "info@bellahoptions.com",
        href: "mailto:info@bellahoptions.com",
        icon: EnvelopeIcon,
    },
    {
        label: "Visit",
        value: "Ogun State, Nigeria",
        href: null,
        icon: MapPinIcon,
    },
];

export default function Contact() {
    return (
        <>
            <Head title="Contact Bellah Options" />
            <PageTheme>
                <main className="bg-white text-gray-950">
                    <RevealSection className="bg-[#000285] py-20 text-white sm:py-24 lg:py-28">
                        <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
                            <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
                                Tell us what you are building.
                            </h1>
                            <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-blue-100">
                                Share the project, launch, campaign, or brand challenge. We will help you pick a clear next step.
                            </p>
                        </div>
                    </RevealSection>

                    <RevealSection className="bg-gray-50 py-16 sm:py-20 lg:py-24">
                        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
                            <Stagger className="grid gap-4">
                                {contactCards.map((item) => {
                                    const Icon = item.icon;
                                    const content = (
                                        <StaggerItem
                                            as="article"
                                            className="flex items-center gap-4 bg-white p-6 shadow-sm ring-1 ring-gray-200"
                                        >
                                            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-blue-50 text-[#000285]">
                                                <Icon className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black uppercase tracking-[0.18em] text-gray-500">{item.label}</p>
                                                <p className="mt-1 font-bold text-gray-950">{item.value}</p>
                                            </div>
                                        </StaggerItem>
                                    );

                                    return item.href ? (
                                        <a key={item.label} href={item.href}>{content}</a>
                                    ) : (
                                        <div key={item.label}>{content}</div>
                                    );
                                })}
                            </Stagger>

                            <form className="bg-white p-6 shadow-sm ring-1 ring-gray-200">
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <Field label="Name" placeholder="Your name" />
                                    <Field label="Email" placeholder="you@example.com" type="email" />
                                    <div className="sm:col-span-2">
                                        <Field label="Project Type" placeholder="Brand design, website, campaign..." />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label className="mb-2 block text-sm font-bold text-gray-700">Message</label>
                                        <textarea rows={6} className="w-full rounded-md border-gray-300 text-sm focus:border-[#000285] focus:ring-[#000285]" placeholder="Tell us what you need..." />
                                    </div>
                                </div>
                                <button type="button" className="mt-5 rounded-md bg-[#000285] px-6 py-3 text-sm font-black text-white transition hover:bg-blue-800">
                                    Send Message
                                </button>
                                <p className="mt-3 text-xs text-gray-500">
                                    For now, use phone or email for fastest response.
                                </p>
                            </form>
                        </div>
                    </RevealSection>
                </main>
            </PageTheme>
        </>
    );
}

function Field({ label, type = "text", placeholder = "" }) {
    return (
        <div>
            <label className="mb-2 block text-sm font-bold text-gray-700">{label}</label>
            <input
                type={type}
                placeholder={placeholder}
                className="w-full rounded-md border-gray-300 text-sm focus:border-[#000285] focus:ring-[#000285]"
            />
        </div>
    );
}
