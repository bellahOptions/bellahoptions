import PolicyLayout from "./PolicyLayout";
import { privacySections } from "./policyData";

const meta = [
    { label: "Policy Scope", value: "Website visitors, clients, leads, and form submissions" },
    { label: "Primary Use", value: "Service delivery, billing, communication, and security" },
    { label: "Data Region", value: "Processed in line with applicable Nigerian legal requirements" },
    { label: "Contact", value: "bellahoptions@gmail.com" },
];

export default function Privacy() {
    return (
        <PolicyLayout
            title="Privacy Policy"
            eyebrow="Data & Privacy"
            description="This policy explains how Bellah Options collects, uses, stores, and protects information you share with us across the website, forms, and project workflows."
            sections={privacySections}
            meta={meta}
            notice="We only collect the information we reasonably need to communicate, secure our forms, process orders, issue invoices, and deliver services effectively."
            ctaLabel="Ask a Privacy Question"
        />
    );
}
