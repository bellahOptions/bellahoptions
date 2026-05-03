<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bellah Options | Terms of Service</title>
    @include('partials.public-head-tags')
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Newsreader:opsz,wght@6..72,500;6..72,700&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg: #f6f8f9;
            --panel: #ffffff;
            --ink: #0f1e25;
            --ink-soft: #3e555f;
            --line: #d7e0e4;
            --accent: #0a6f8f;
            --accent-soft: #d9f0f7;
        }

        * {
            box-sizing: border-box;
        }

        body {
            margin: 0;
            font-family: 'Manrope', 'Segoe UI', sans-serif;
            color: var(--ink);
            background:
                radial-gradient(circle at 12% 8%, #d8edf6 0%, transparent 35%),
                radial-gradient(circle at 88% 0%, #f1eddc 0%, transparent 36%),
                var(--bg);
            line-height: 1.65;
        }

        html {
            scroll-behavior: smooth;
        }

        .wrap {
            width: min(980px, 92vw);
            margin: 34px auto 60px;
        }

        .hero {
            background: linear-gradient(135deg, #0f3341, #16546a);
            color: #f8fcfe;
            border-radius: 22px;
            padding: 30px 26px;
            box-shadow: 0 18px 40px rgba(15, 51, 65, 0.2);
        }

        .hero h1 {
            margin: 8px 0 0;
            font-family: 'Newsreader', Georgia, serif;
            font-size: clamp(2rem, 4vw, 3rem);
            line-height: 1.2;
        }

        .hero p {
            margin: 12px 0 0;
            max-width: 780px;
            color: #def3fb;
        }

        .badge {
            display: inline-block;
            padding: 7px 12px;
            border-radius: 999px;
            background: rgba(255, 255, 255, 0.16);
            border: 1px solid rgba(255, 255, 255, 0.3);
            font-size: 12px;
            font-weight: 700;
            letter-spacing: 0.07em;
            text-transform: uppercase;
        }

        .meta-grid {
            margin-top: 16px;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
            gap: 12px;
        }

        .meta-item {
            background: var(--panel);
            border: 1px solid var(--line);
            border-radius: 14px;
            padding: 14px;
        }

        .meta-item span {
            display: block;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            color: var(--ink-soft);
            margin-bottom: 3px;
        }

        .notice {
            margin-top: 16px;
            border-radius: 14px;
            border: 1px solid #ffd7b2;
            background: #fff6ec;
            padding: 14px 15px;
            font-size: 14px;
        }

        .section {
            background: var(--panel);
            border: 1px solid var(--line);
            border-radius: 18px;
            margin-top: 14px;
            padding: 22px 20px;
            scroll-margin-top: 130px;
        }

        .section h2 {
            margin: 0 0 12px;
            font-family: 'Newsreader', Georgia, serif;
            font-size: clamp(1.4rem, 2.4vw, 2rem);
            line-height: 1.2;
        }

        .section h3 {
            margin: 16px 0 8px;
            font-size: 1rem;
        }

        .section p {
            margin: 8px 0;
            color: var(--ink-soft);
        }

        ul {
            margin: 10px 0 12px;
            padding-left: 18px;
            color: var(--ink-soft);
        }

        li {
            margin: 4px 0;
        }

        .toc {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
            gap: 8px 14px;
            margin-top: 12px;
        }

        .toc a {
            color: var(--accent);
            text-decoration: none;
            font-weight: 600;
            font-size: 14px;
            border-radius: 10px;
            padding: 7px 9px;
            border: 1px solid transparent;
            transition: all 140ms ease;
        }

        .toc a:hover {
            text-decoration: underline;
        }

        .toc a.is-active {
            border-color: #8dcde1;
            background: #eaf8fd;
            color: #084c61;
            text-decoration: none;
        }

        .scroller-panel {
            position: sticky;
            top: 12px;
            z-index: 10;
        }

        .utility-row {
            display: grid;
            grid-template-columns: minmax(260px, 1fr) auto;
            gap: 12px;
            align-items: end;
        }

        .search-wrap label {
            display: block;
            font-size: 12px;
            letter-spacing: 0.06em;
            text-transform: uppercase;
            color: var(--ink-soft);
            margin-bottom: 6px;
            font-weight: 700;
        }

        .search-input-row {
            display: grid;
            grid-template-columns: 1fr auto;
            gap: 8px;
        }

        .search-input {
            width: 100%;
            border: 1px solid #b9c9cf;
            background: #fbfdff;
            border-radius: 12px;
            padding: 11px 12px;
            font-size: 14px;
            color: var(--ink);
            outline: none;
        }

        .search-input:focus {
            border-color: #0a6f8f;
            box-shadow: 0 0 0 3px rgba(10, 111, 143, 0.14);
        }

        .ghost-btn {
            border: 1px solid #aec6cf;
            background: #f7fcff;
            color: #0a4f66;
            border-radius: 10px;
            padding: 10px 12px;
            font-size: 13px;
            font-weight: 700;
            cursor: pointer;
        }

        .ghost-btn:hover {
            background: #eaf8fd;
        }

        .ghost-btn:disabled {
            opacity: 0.52;
            cursor: not-allowed;
        }

        .scroll-controls {
            display: flex;
            align-items: center;
            gap: 8px;
            flex-wrap: wrap;
            justify-content: flex-end;
        }

        .status-row {
            margin-top: 10px;
            display: flex;
            justify-content: space-between;
            gap: 12px;
            align-items: center;
            flex-wrap: wrap;
        }

        .status-text {
            margin: 0;
            font-size: 13px;
            color: #46616b;
            font-weight: 600;
        }

        .progress-track {
            width: 100%;
            margin-top: 10px;
            height: 7px;
            border-radius: 999px;
            background: #e7eff2;
            overflow: hidden;
        }

        .progress-fill {
            height: 100%;
            width: 0;
            background: linear-gradient(90deg, #0a6f8f, #2aa8cf);
            transition: width 140ms linear;
        }

        .tos-section[hidden] {
            display: none;
        }

        .sr-only {
            position: absolute;
            width: 1px;
            height: 1px;
            padding: 0;
            margin: -1px;
            overflow: hidden;
            clip: rect(0, 0, 0, 0);
            border: 0;
        }

        @media (max-width: 860px) {
            .scroller-panel {
                position: static;
            }

            .utility-row {
                grid-template-columns: 1fr;
            }

            .scroll-controls {
                justify-content: flex-start;
            }
        }

        @media (prefers-reduced-motion: reduce) {
            html {
                scroll-behavior: auto;
            }
        }

        .sign {
            display: grid;
            gap: 12px;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            margin-top: 12px;
        }

        .line-box {
            border: 1px dashed #9db4be;
            border-radius: 12px;
            padding: 12px;
            color: var(--ink-soft);
        }

        footer {
            margin-top: 18px;
            font-size: 12px;
            color: #63818c;
            text-align: center;
        }
    </style>
</head>
<body>
    <main class="wrap">
        <header class="hero">
            <span class="badge">Legal Agreement</span>
            <h1>Bellah Options Terms of Service</h1>
            <p>
                These Terms govern all services provided by Bellah Options and form a legally binding agreement between Bellah Options and every Client who engages our services.
            </p>
        </header>

        <section class="meta-grid" aria-label="Company details">
            <article class="meta-item">
                <span>Registered Name</span>
                Bellah Options
            </article>
            <article class="meta-item">
                <span>Business Number</span>
                BN3668420
            </article>
            <article class="meta-item">
                <span>Jurisdiction</span>
                Federal Republic of Nigeria
            </article>
            <article class="meta-item">
                <span>Governing Law</span>
                Nigerian Law and applicable international standards
            </article>
            <article class="meta-item">
                <span>Contact Email</span>
                bellahoptions@gmail.com
            </article>
            <article class="meta-item">
                <span>Contact Phone</span>
                +234 810 867 1804 | +234 903 141 2354
            </article>
        </section>

        <section class="notice">
            <strong>Important Notice:</strong> By engaging Bellah Options through signed proposal, purchase order, verbal agreement, email confirmation, or payment, you acknowledge that you have read, understood, and agreed to these Terms. If you do not agree, do not proceed with engagement.
        </section>

        <section class="section scroller-panel" aria-label="Table of contents and section navigation" data-tos-navigator>
            <h2>Contents & Quick Navigation</h2>
            <div class="utility-row">
                <div class="search-wrap">
                    <label for="section-search">Search in terms</label>
                    <div class="search-input-row">
                        <input id="section-search" class="search-input" type="search" placeholder="Type keywords like refund, payment, cancellation..." autocomplete="off">
                        <button type="button" class="ghost-btn" id="clear-search">Clear</button>
                    </div>
                </div>
                <div class="scroll-controls">
                    <button type="button" class="ghost-btn" id="prev-section">Previous</button>
                    <button type="button" class="ghost-btn" id="next-section">Next</button>
                </div>
            </div>

            <div class="status-row">
                <p class="status-text" id="search-summary">Showing all sections.</p>
                <p class="status-text" id="current-section-label">Current: 1. Introduction & Company Overview</p>
            </div>

            <div class="progress-track" aria-hidden="true">
                <div class="progress-fill" id="read-progress"></div>
            </div>

            <div class="toc" id="section-toc">
                <a href="#s1">1. Introduction & Company Overview</a>
                <a href="#s2">2. Engagement & Contract Formation</a>
                <a href="#s3">3. Client Responsibilities</a>
                <a href="#s4">4. Payment Terms</a>
                <a href="#s5">5. Revisions, Approvals & Delivery</a>
                <a href="#s6">6. Intellectual Property Rights</a>
                <a href="#s7">7. Cancellation & Termination</a>
                <a href="#s8">8. Refund Policy</a>
                <a href="#s9">9. Confidentiality</a>
                <a href="#s10">10. Data Protection & Privacy</a>
                <a href="#s11">11. Third-Party Tools & Platforms</a>
                <a href="#s12">12. Limitation of Liability</a>
                <a href="#s13">13. Warranties & Disclaimers</a>
                <a href="#s14">14. Force Majeure</a>
                <a href="#s15">15. Dispute Resolution</a>
                <a href="#s16">16. Amendments</a>
                <a href="#s17">17. General Provisions</a>
                <a href="#s18">18. Contact Information</a>
            </div>
        </section>

        <section id="s1" class="section tos-section">
            <h2>1. Introduction & Company Overview</h2>
            <p>
                Bellah Options is a creative and digital branding studio registered under BN3668420 in Nigeria. These Terms apply to every individual, business, or entity that engages our services.
            </p>
            <p>
                Our services are governed by Nigerian contract law and applicable legal frameworks, including CAMA 2020, NDPA 2023, and internationally recognized commercial principles where applicable.
            </p>
            <h3>1.1 Services Offered</h3>
            <ul>
                <li>Graphic Design: logos, brand identities, print and digital collateral.</li>
                <li>Web Design and No-Code Web Development: responsive websites and landing pages.</li>
                <li>UI/UX Design: wireframes, prototypes, and user experience design.</li>
                <li>Social Media Management: content, scheduling, and community management.</li>
                <li>Brand Strategy and Consulting: positioning, language, and market alignment.</li>
            </ul>
            <h3>1.2 Eligibility</h3>
            <p>
                You must be at least 18 years old, have legal capacity to contract, and where acting for an organization, have authority to bind that organization.
            </p>
        </section>

        <section id="s2" class="section tos-section">
            <h2>2. Engagement & Contract Formation</h2>
            <p>A binding agreement is formed on the earliest of:</p>
            <ul>
                <li>Written acceptance of a proposal or quote.</li>
                <li>Payment of a deposit or any portion of fees.</li>
                <li>Commencement of work at client request.</li>
            </ul>
            <p>
                Verbal agreements may be legally binding, but all project scope, timeline, and fee terms should be confirmed in writing.
            </p>
            <h3>2.1 Project Scope</h3>
            <p>
                Every engagement is governed by a brief, proposal, or statement of work. Any out-of-scope request is a change request and must be separately quoted and approved before execution.
            </p>
        </section>

        <section id="s3" class="section tos-section">
            <h2>3. Client Responsibilities</h2>
            <ul>
                <li>Provide complete and timely briefs, content, and assets.</li>
                <li>Assign an authorized point of contact for approvals and instructions.</li>
                <li>Respond to feedback requests within 3 business days unless otherwise agreed.</li>
                <li>Approve or reject deliverables within 5 business days.</li>
                <li>Make payments in line with agreed terms.</li>
                <li>Ensure provided materials are owned or properly licensed.</li>
                <li>Do not request unlawful, defamatory, or fraudulent work.</li>
            </ul>
            <p>
                Non-compliance may lead to delays, additional charges, or suspension of work.
            </p>
        </section>

        <section id="s4" class="section tos-section">
            <h2>4. Payment Terms</h2>
            <p>
                Fees are quoted in NGN unless otherwise agreed. International projects may use other currencies as stated on invoice.
            </p>
            <h3>4.1 Deposit Requirement</h3>
            <p>Default structure: 70% non-refundable deposit before work starts, and 30% on completion before final file release.</p>
            <h3>4.2 Payment Schedule</h3>
            <p>Project-specific schedules in proposal override defaults. Milestone billing may apply for large projects.</p>
            <h3>4.3 Accepted Payment Methods</h3>
            <ul>
                <li>Direct bank transfer to official company account.</li>
                <li>Paystack gateway.</li>
                <li>Any other written, mutually confirmed payment platform.</li>
            </ul>
            <h3>4.4 Late Payment</h3>
            <p>
                Invoices are due as stated, or within 7 days where no due date is listed. Outstanding balances beyond 14 days may attract 5% monthly compounded late charge and may result in work suspension.
            </p>
            <h3>4.5 Disputed Invoices</h3>
            <p>
                Disputes must be submitted in writing within 5 business days of receipt. Undisputed portions remain payable on time.
            </p>
        </section>

        <section id="s5" class="section tos-section">
            <h2>5. Revisions, Approvals & Delivery</h2>
            <h3>5.1 Included Revisions</h3>
            <p>Unless stated otherwise, each deliverable includes up to 2 revision rounds.</p>
            <h3>5.2 Additional Revisions</h3>
            <p>Extra revisions are billed at current hourly or agreed fixed rates after client approval.</p>
            <h3>5.3 Approval & Sign-Off</h3>
            <p>Written approval makes deliverables final. Later changes are treated as new work.</p>
            <h3>5.4 Turnaround Time</h3>
            <p>
                Timelines are estimates unless fixed in writing. Delays caused by missing client feedback/materials, third-party outages, internet issues, or force majeure automatically extend timelines.
            </p>
        </section>

        <section id="s6" class="section tos-section">
            <h2>6. Intellectual Property Rights</h2>
            <h3>6.1 Ownership Prior to Full Payment</h3>
            <p>All concepts, drafts, source files, and intermediate deliverables remain Bellah Options property until full payment.</p>
            <h3>6.2 Rights After Full Payment</h3>
            <p>
                Upon full payment, the client receives a perpetual, non-exclusive, royalty-free license for agreed use. Exclusive assignment requires separate written agreement and may involve additional fees.
            </p>
            <h3>6.3 Retained Rights</h3>
            <p>Bellah Options retains rights in unused concepts, internal frameworks, tools, and reusable non-client-specific elements.</p>
            <h3>6.4 Portfolio Rights</h3>
            <p>Completed work may be used for portfolio and marketing unless an NDA is signed before project start.</p>
            <h3>6.5 Client-Provided Materials</h3>
            <p>Clients warrant ownership or licensing and indemnify Bellah Options against infringement claims.</p>
        </section>

        <section id="s7" class="section tos-section">
            <h2>7. Cancellation & Termination</h2>
            <h3>7.1 Cancellation by Client</h3>
            <ul>
                <li>Within 72 hours and before work starts: 50% deposit refund as goodwill.</li>
                <li>After 72 hours or after work starts: deposit is non-refundable.</li>
                <li>After milestones: client pays completed milestones and in-progress work.</li>
            </ul>
            <h3>7.2 Cancellation by Bellah Options</h3>
            <p>
                Bellah Options may terminate for material breach, payment default, unlawful requests, abuse, or circumstances beyond control.
            </p>
            <h3>7.3 Project Abandonment</h3>
            <p>
                If a client is unresponsive for 30 consecutive days, project may be treated as abandoned and terminated without refund.
            </p>
        </section>

        <section id="s8" class="section tos-section">
            <h2>8. Refund Policy</h2>
            <h3>8.1 Eligible Refunds</h3>
            <ul>
                <li>50% deposit refund when cancelled in first 72 hours and work has not started.</li>
                <li>Bellah Options-initiated termination not due to client breach: deposit minus value of completed work.</li>
                <li>Delivery failure due to Bellah Options negligence: proportionate partial or full refund may apply.</li>
            </ul>
            <h3>8.2 Non-Refundable Cases</h3>
            <ul>
                <li>Deposits after work has started or 72 hours have passed.</li>
                <li>Accepted and delivered final work.</li>
                <li>Change of mind or business circumstance cancellations.</li>
                <li>Abandoned projects due to unresponsiveness.</li>
            </ul>
            <h3>8.3 Refund Process</h3>
            <p>Approved refunds are processed within 14 business days using original payment method where feasible.</p>
        </section>

        <section id="s9" class="section tos-section">
            <h2>9. Confidentiality</h2>
            <p>
                Both parties must protect non-public information shared during engagement. Confidentiality survives termination for 3 years, subject to lawful disclosure requirements.
            </p>
        </section>

        <section id="s10" class="section tos-section">
            <h2>10. Data Protection & Privacy</h2>
            <p>
                Bellah Options processes personal data only for project delivery, billing, and communication, in line with NDPA 2023 and GDPR where applicable.
            </p>
            <ul>
                <li>Data is protected using industry-standard measures.</li>
                <li>Data is never sold for marketing.</li>
                <li>Retention period is at least 6 years for tax and records compliance.</li>
                <li>Clients may request access, correction, or deletion subject to legal obligations.</li>
            </ul>
        </section>

        <section id="s11" class="section tos-section">
            <h2>11. Third-Party Tools & Platforms</h2>
            <p>
                Bellah Options may use tools such as Adobe, Canva, Figma, Webflow, WordPress, Paystack, and Google Workspace. Availability and terms of such tools are controlled by their providers.
            </p>
        </section>

        <section id="s12" class="section tos-section">
            <h2>12. Limitation of Liability</h2>
            <p>
                To the maximum extent permitted by law, Bellah Options total liability for claims tied to a project is limited to fees paid by the client for that project.
            </p>
            <p>
                Bellah Options is not liable for indirect or consequential losses, loss of profits, data loss, reputational harm, or business interruption.
            </p>
        </section>

        <section id="s13" class="section tos-section">
            <h2>13. Warranties & Disclaimers</h2>
            <p>
                Services are provided with reasonable skill and care, but creative outcomes are subjective and business results are not guaranteed.
            </p>
            <p>
                Final approved deliverables are provided as-is.
            </p>
        </section>

        <section id="s14" class="section tos-section">
            <h2>14. Force Majeure</h2>
            <p>
                Delays or non-performance caused by events beyond reasonable control are excused for the duration of the force majeure event. If such event exceeds 30 days, either party may terminate with written notice and proportionate refund for unstarted work.
            </p>
        </section>

        <section id="s15" class="section tos-section">
            <h2>15. Dispute Resolution</h2>
            <ul>
                <li>Good-faith negotiation for 21 calendar days after written notice.</li>
                <li>Mediation by mutually agreed mediator if unresolved.</li>
                <li>Arbitration under the Arbitration and Conciliation Act (ACA) 2023, seat: Lagos, language: English.</li>
                <li>Governing law: Federal Republic of Nigeria.</li>
            </ul>
        </section>

        <section id="s16" class="section tos-section">
            <h2>16. Amendments to These Terms</h2>
            <p>
                Bellah Options may amend these Terms. For material changes, existing clients will receive at least 14 days written notice. Continued engagement after notice period constitutes acceptance.
            </p>
        </section>

        <section id="s17" class="section tos-section">
            <h2>17. General Provisions</h2>
            <ul>
                <li>Entire agreement: these Terms plus agreed proposal/brief/SOW.</li>
                <li>Severability: invalid provisions do not invalidate remaining provisions.</li>
                <li>Waiver: delay in enforcing rights is not waiver.</li>
                <li>Assignment: client may not assign rights without written consent.</li>
                <li>Notices: formal notices must be in writing by email.</li>
            </ul>
        </section>

        <section id="s18" class="section tos-section">
            <h2>18. Contact Information</h2>
            <p>For questions, disputes, or formal notices, contact:</p>
            <ul>
                <li>Company: Bellah Options</li>
                <li>Email: bellahoptions@gmail.com</li>
                <li>Phone: +234 810 867 1804 | +234 903 141 2354</li>
                <li>Business Number: BN3668420</li>
                <li>Jurisdiction: Lagos, Federal Republic of Nigeria</li>
            </ul>
        </section>

        <section class="section">
            <h2>Acceptance & Acknowledgement</h2>
            <p>
                By proceeding with payment, written confirmation, or project commencement request, you confirm that you have read, understood, and agree to these Terms of Service in full.
            </p>
            <div class="sign">
                <div class="line-box">For Bellah Options<br>Authorized Signatory | Date: ____________</div>
                <div class="line-box">For Client<br>Authorized Signatory | Date: ____________</div>
            </div>
            <footer>
                &copy; 2025 Bellah Options. All rights reserved. This document is for contractual purposes only.
            </footer>
        </section>
    </main>
    <script>
        (() => {
            const navigator = document.querySelector('[data-tos-navigator]');

            if (!navigator) {
                return;
            }

            const searchInput = navigator.querySelector('#section-search');
            const clearButton = navigator.querySelector('#clear-search');
            const prevButton = navigator.querySelector('#prev-section');
            const nextButton = navigator.querySelector('#next-section');
            const summaryText = navigator.querySelector('#search-summary');
            const currentLabel = navigator.querySelector('#current-section-label');
            const progressFill = navigator.querySelector('#read-progress');

            const links = Array.from(navigator.querySelectorAll('.toc a[href^="#s"]'));
            const records = links
                .map((link) => {
                    const id = link.getAttribute('href').slice(1);
                    const section = document.getElementById(id);

                    if (!section) {
                        return null;
                    }

                    const heading = section.querySelector('h2');
                    const title = heading ? heading.textContent.trim() : id;

                    return { id, link, section, title };
                })
                .filter(Boolean);

            if (records.length === 0) {
                return;
            }

            const normalize = (value) => value.toLowerCase().replace(/\s+/g, ' ').trim();

            let filteredRecords = [...records];
            let activeId = filteredRecords[0].id;

            const updateActiveStyles = () => {
                for (const item of records) {
                    item.link.classList.toggle('is-active', item.id === activeId);
                }
            };

            const updateCurrentLabel = () => {
                const activeItem = records.find((item) => item.id === activeId);

                if (!activeItem) {
                    currentLabel.textContent = 'Current: No section selected';
                    return;
                }

                currentLabel.textContent = `Current: ${activeItem.title}`;
            };

            const updatePagerButtons = () => {
                const index = filteredRecords.findIndex((item) => item.id === activeId);

                prevButton.disabled = index <= 0;
                nextButton.disabled = index === -1 || index >= filteredRecords.length - 1;
            };

            const setActive = (id) => {
                activeId = id;
                updateActiveStyles();
                updateCurrentLabel();
                updatePagerButtons();
            };

            const scrollToSectionByOffset = (offset) => {
                if (filteredRecords.length === 0) {
                    return;
                }

                const currentIndex = filteredRecords.findIndex((item) => item.id === activeId);
                const safeIndex = currentIndex === -1 ? 0 : currentIndex;
                const nextIndex = Math.max(0, Math.min(filteredRecords.length - 1, safeIndex + offset));
                const target = filteredRecords[nextIndex];

                if (!target) {
                    return;
                }

                setActive(target.id);
                target.section.scrollIntoView({ behavior: 'smooth', block: 'start' });
            };

            const updateProgress = () => {
                const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
                const currentScroll = window.scrollY;
                const progress = maxScroll > 0 ? Math.min(100, Math.max(0, (currentScroll / maxScroll) * 100)) : 0;

                progressFill.style.width = `${progress}%`;
            };

            const filterSections = () => {
                const query = normalize(searchInput.value);
                filteredRecords = [];

                for (const item of records) {
                    const haystack = normalize(item.section.textContent);
                    const titleMatch = normalize(item.title);
                    const match = query === '' || haystack.includes(query) || titleMatch.includes(query);

                    item.section.hidden = !match;
                    item.link.hidden = !match;

                    if (match) {
                        filteredRecords.push(item);
                    }
                }

                if (filteredRecords.length === 0) {
                    summaryText.textContent = `No section matched "${searchInput.value.trim()}".`;
                    currentLabel.textContent = 'Current: No section selected';
                    prevButton.disabled = true;
                    nextButton.disabled = true;

                    for (const item of records) {
                        item.link.classList.remove('is-active');
                    }

                    return;
                }

                const plural = filteredRecords.length === 1 ? 'section' : 'sections';
                summaryText.textContent = query === ''
                    ? 'Showing all sections.'
                    : `Showing ${filteredRecords.length} ${plural} for "${searchInput.value.trim()}".`;

                const stillVisible = filteredRecords.some((item) => item.id === activeId);
                setActive(stillVisible ? activeId : filteredRecords[0].id);
            };

            const observer = new IntersectionObserver(
                (entries) => {
                    const visibleCandidates = entries
                        .filter((entry) => entry.isIntersecting && !entry.target.hidden)
                        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

                    if (visibleCandidates.length === 0) {
                        return;
                    }

                    const nextId = visibleCandidates[0].target.id;

                    if (nextId !== activeId) {
                        setActive(nextId);
                    }
                },
                { threshold: [0.35, 0.65], rootMargin: '-14% 0px -56% 0px' },
            );

            for (const item of records) {
                observer.observe(item.section);
                item.link.addEventListener('click', () => setActive(item.id));
            }

            prevButton.addEventListener('click', () => scrollToSectionByOffset(-1));
            nextButton.addEventListener('click', () => scrollToSectionByOffset(1));
            clearButton.addEventListener('click', () => {
                searchInput.value = '';
                filterSections();
                searchInput.focus();
            });
            searchInput.addEventListener('input', filterSections);
            window.addEventListener('scroll', updateProgress, { passive: true });
            window.addEventListener('resize', updateProgress);

            filterSections();
            updateProgress();
        })();
    </script>
</body>
</html>
