import PolicyLayout from "./PolicyLayout";
import { cookieSections } from "./policyData";
import { resolvePolicySections } from "./policyParser";

const meta = [
    { label: "Purpose", value: "Security, session support, performance, and analytics" },
    { label: "Control", value: "You can manage cookies through your browser settings" },
    { label: "Impact", value: "Disabling some cookies may affect forms and secure flows" },
    { label: "Applies To", value: "Bellah Options public website and related form experiences" },
];

export default function Cookies({ term = null }) {
    const sections = resolvePolicySections(term?.content, cookieSections);

    return (
        <PolicyLayout
            title="Cookie Policy"
            eyebrow="Cookies & Tracking"
            description="This page explains what cookies are, how Bellah Options uses them, and what choices you have when it comes to managing browser-based tracking technologies."
            sections={sections}
            meta={meta}
            notice="Essential and security-related cookies may be necessary for some parts of the website, especially protected forms and order workflows."
            ctaLabel="Talk to Us"
        />
    );
}
