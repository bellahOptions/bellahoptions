import PolicyLayout from "./PolicyLayout";
import { privacySections } from "./policyData";
import { resolvePolicySections } from "./policyParser";

const meta = [
    { label: "Policy Scope", value: "Website visitors, clients, leads, and form submissions" },
    { label: "Primary Use", value: "Service delivery, billing, communication, and security" },
    { label: "Legal Basis", value: "NDPA 2023 and applicable GDPR requirements" },
    { label: "Contact", value: "hello@bellahoptions.com" },
];

export default function Privacy({ term = null }) {
    const sections = resolvePolicySections(term?.content, privacySections);

    return (
        <PolicyLayout
            title="Privacy Policy"
            eyebrow="Data & Privacy"
            description="This policy explains how Bellah Options collects, uses, stores, shares, protects, and retains information shared through the website, forms, payments, and project workflows."
            sections={sections}
            meta={meta}
            notice="We only collect the information reasonably needed to communicate, secure our forms, process orders, issue invoices, meet record-keeping duties, and deliver services effectively."
            ctaLabel="Ask a Privacy Question"
        />
    );
}
