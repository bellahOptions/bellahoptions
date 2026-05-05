import PolicyLayout from "./PolicyLayout";
import { cookieSections } from "./policyData";

const meta = [
    { label: "Purpose", value: "Security, session support, performance, and analytics" },
    { label: "Control", value: "You can manage cookies through your browser settings" },
    { label: "Impact", value: "Disabling some cookies may affect forms and secure flows" },
    { label: "Applies To", value: "Bellah Options public website and related form experiences" },
];

export default function Cookies() {
    return (
        <PolicyLayout
            title="Cookie Policy"
            eyebrow="Cookies & Tracking"
            description="This page explains what cookies are, how Bellah Options uses them, and what choices you have when it comes to managing browser-based tracking technologies."
            sections={cookieSections}
            meta={meta}
            notice="Essential and security-related cookies may be necessary for some parts of the website, especially protected forms and order workflows."
            ctaLabel="Talk to Us"
        />
    );
}
