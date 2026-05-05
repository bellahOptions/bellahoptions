import PolicyLayout from "./PolicyLayout";
import { termsSections } from "./policyData";

const meta = [
    { label: "Registered Name", value: "Bellah Options" },
    { label: "Business Number", value: "BN3668420" },
    { label: "Jurisdiction", value: "Federal Republic of Nigeria" },
    { label: "Contact", value: "bellahoptions@gmail.com | +234 810 867 1804" },
];

export default function Terms() {
    return (
        <PolicyLayout
            title="Terms of Service"
            eyebrow="Legal Agreement"
            description="These terms govern the services Bellah Options provides and explain the responsibilities, rights, payment expectations, and legal boundaries that apply to every client engagement."
            sections={termsSections}
            meta={meta}
            notice="By engaging Bellah Options through a proposal, payment, written confirmation, or project commencement request, you acknowledge that you have read and accepted these Terms of Service."
            ctaLabel="Contact Our Team"
        />
    );
}
