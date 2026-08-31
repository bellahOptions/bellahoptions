@extends('layouts.public')

@section('title', 'Privacy Policy | Bellah Options')
@section('description', 'How Bellah Options collects, uses, stores, shares, and protects personal information.')

@section('content')
<section class="hero">
    <div class="container">
        <span class="eyebrow">Data &amp; Privacy</span>
        <h1>Privacy Policy</h1>
        <p class="lead">
            This policy explains how Bellah Options collects, uses, stores, shares, protects, and retains information shared through the website, forms, payments, and project workflows.
        </p>
    </div>
</section>

<section class="section">
    <div class="container">
        <div class="card" style="line-height:1.7;">
            <p>We only collect the information reasonably needed to communicate, secure our forms, process orders, issue invoices, meet record-keeping duties, and deliver services effectively.</p>

            <h2 style="margin-top:1.8rem;">1. Privacy Commitment</h2>
            <p style="margin-top:0.6rem;">Bellah Options protects personal data in compliance with the Nigerian Data Protection Act 2023 and, where applicable, GDPR requirements for clients in the European Economic Area. This policy explains how we collect, use, store, share, and retain personal information when you visit our website, submit forms, request services, make payments, or communicate with our team.</p>

            <h2 style="margin-top:1.8rem;">2. Data We Collect</h2>
            <ul style="margin-top:0.6rem; padding-left:1.2rem; display:grid; gap:0.35rem;">
                <li>Names, email addresses, phone numbers, business names, and other contact details.</li>
                <li>Project briefs, business information, brand assets, written content, and service request details.</li>
                <li>Payment and invoice-related information needed to process payments and maintain records.</li>
                <li>Website and form security metadata, including IP address, browser type, session timing, and submission guard information.</li>
            </ul>

            <h2 style="margin-top:1.8rem;">3. How We Use Data</h2>
            <ul style="margin-top:0.6rem; padding-left:1.2rem; display:grid; gap:0.35rem;">
                <li>To provide agreed services and manage project communication.</li>
                <li>To process payments, issue invoices, receipts, reminders, and order updates.</li>
                <li>To respond to enquiries and support requests.</li>
                <li>To verify legitimate submissions and reduce spam, abuse, or automated activity.</li>
                <li>To comply with legal, tax, accounting, and business record-keeping obligations.</li>
            </ul>

            <h2 style="margin-top:1.8rem;">4. Sharing &amp; Third-Party Platforms</h2>
            <p style="margin-top:0.6rem;">Bellah Options does not sell, rent, or share personal data with third parties for their marketing purposes. Data may be shared with payment processors such as Paystack, cloud storage providers, email services, project management tools, hosting providers, or trusted collaborators only where necessary to deliver services or comply with law. Third-party tools and platforms are governed by their own terms and privacy policies.</p>

            <h2 style="margin-top:1.8rem;">5. Retention &amp; Security</h2>
            <p style="margin-top:0.6rem;">We store client data using practical administrative and technical safeguards designed to protect submitted information. No digital system can guarantee absolute security. Client data may be retained for at least six years from the end of an engagement to meet Nigerian tax and business record-keeping requirements, and may then be deleted or anonymised where appropriate.</p>

            <h2 style="margin-top:1.8rem;">6. Client Rights</h2>
            <ul style="margin-top:0.6rem; padding-left:1.2rem; display:grid; gap:0.35rem;">
                <li>Request access to personal data held by Bellah Options.</li>
                <li>Request correction of inaccurate or incomplete data.</li>
                <li>Request deletion of personal data, subject to legal retention duties.</li>
                <li>Object to certain processing where applicable law allows.</li>
                <li>Lodge a complaint with Nigeria's National Information Technology Development Agency if you believe your data rights have been violated.</li>
            </ul>

            <h2 style="margin-top:1.8rem;">7. Privacy Contact</h2>
            <p style="margin-top:0.6rem;">To make a privacy-related request or ask how your information is handled, contact us:</p>
            <ul style="margin-top:0.6rem; padding-left:1.2rem; display:grid; gap:0.35rem;">
                <li>Company: Bellah Options</li>
                <li>Email: hello@bellahoptions.com</li>
                <li>Phone: +234 810 867 1804</li>
                <li>Location: Otta, Ogun State, Nigeria</li>
                <li>Business Number: BN3668420</li>
                <li>Jurisdiction: Lagos, Federal Republic of Nigeria</li>
            </ul>

            <div class="btn-row">
                <a class="btn-outline" href="{{ route('contact') }}">Ask a Privacy Question</a>
            </div>
        </div>
    </div>
</section>
@endsection
