<?php

namespace App\Support;

/**
 * Bespoke landing-page copy, keyed by service slug.
 *
 * Data only - no logic. ServiceLandingContent merges this over a generated
 * fallback so a service without an entry here still gets a complete page.
 *
 * @return array<string, array<string, mixed>>
 */
class ServiceLandingCopy
{
    public static function all(): array
    {
        return [
            'social-media-management' => [
                'eyebrow' => 'New service',
                'headline' => 'Social Media Management',
                'subheadline' => 'We run your social channels for you: strategy, content, publishing, replies and monthly reporting, so your brand stays visible without you chasing it.',
                'summary' => 'Most businesses do not have a posting problem, they have a consistency problem. Social Media Management hands the whole cycle to a team that plans the month, produces the content, publishes it on schedule, answers your audience and reports back on what actually moved.',
                'image' => '/sa2.jpeg',
                'category' => 'Growth',
                'period' => 'Month',
                'hero_points' => [
                    'A monthly content plan built from your business goals',
                    'Design, captions and scheduling handled end to end',
                    'Comment and DM management so no enquiry goes cold',
                    'A monthly report in plain language, not vanity metrics',
                ],
                'outcomes' => [
                    [
                        'title' => 'Consistency you can rely on',
                        'text' => 'Your channels post on a fixed cadence every week, including the weeks when your team is buried in delivery.',
                    ],
                    [
                        'title' => 'A feed that looks intentional',
                        'text' => 'Content pillars, a visual system and a tone of voice that make your account recognisable at a glance.',
                    ],
                    [
                        'title' => 'Enquiries that get answered',
                        'text' => 'Comments and DMs are monitored and handled, so interest turns into conversations instead of being missed.',
                    ],
                    [
                        'title' => 'Decisions based on evidence',
                        'text' => 'Each month you see what was published, how it performed and what we are changing next, with the reasoning.',
                    ],
                ],
                'deliverables' => [
                    'A documented channel strategy with content pillars and posting cadence',
                    'A monthly content calendar approved by you before anything is published',
                    'Post, carousel, reel and story design produced by our team',
                    'Captions, hooks and hashtag sets written for each post',
                    'Scheduled publishing across every channel you have signed off',
                    'Comment and direct message management within agreed hours',
                    'Monthly performance reporting with next-month recommendations',
                    'Quarterly strategy review call with your account lead',
                ],
                'process' => [
                    [
                        'title' => 'Scoping call',
                        'text' => 'We review your channels, competitors and goals, then propose a cadence, content mix and management scope. This call is free.',
                    ],
                    [
                        'title' => 'Strategy and onboarding',
                        'text' => 'We document the content pillars, tone of voice and visual rules, and collect the access we need to publish on your behalf.',
                    ],
                    [
                        'title' => 'Plan and approve',
                        'text' => 'You receive the next month calendar before the month starts. You approve, request changes, and then we schedule everything.',
                    ],
                    [
                        'title' => 'Publish, manage, report',
                        'text' => 'We publish on schedule, handle the community, and send a monthly report with what performed and what changes next.',
                    ],
                ],
                'faqs' => [
                    [
                        'q' => 'How is this priced?',
                        'a' => 'Management is quoted per account after the scoping call, because the work depends on how many channels you run, how many posts a week you need and whether we are creating the content or you are supplying it. You get a fixed monthly figure in writing, with no per-post surprises.',
                    ],
                    [
                        'q' => 'Is this different from Social Media Design?',
                        'a' => 'Yes. Social Media Design produces artwork for you to post. Social Media Management runs the channel: strategy, calendar, copy, publishing, community replies and reporting. Many clients start with design and move to management once they want the posting handled too.',
                    ],
                    [
                        'q' => 'Do I need to give you access to my accounts?',
                        'a' => 'For publishing and community management, yes, usually through Meta Business Suite or the platform collaborator tools rather than your personal password. If you would rather keep access, we can deliver the calendar and assets for your team to publish, and adjust the scope accordingly.',
                    ],
                    [
                        'q' => 'Who writes the content?',
                        'a' => 'We do, unless you prefer to supply final copy. Either way, every caption is written for the specific post and platform, not reused across channels.',
                    ],
                    [
                        'q' => 'Do you create video and photography?',
                        'a' => 'We design motion graphics, reel edits and story assets from footage you supply. Original photography and videography shoots are quoted separately, and we can direct the shoot if you need that.',
                    ],
                    [
                        'q' => 'How soon will I see results?',
                        'a' => 'Consistency shows up in reach and engagement within the first month or two. Lead and sales impact depends on your offer, your pricing and your response time, so we report on the numbers we can actually influence and tell you plainly which ones we cannot.',
                    ],
                    [
                        'q' => 'Can I pause or cancel?',
                        'a' => 'Management runs month to month. You can pause, upgrade or cancel with notice before the next billing date, and you keep every asset we produced.',
                    ],
                ],
            ],

            'social-media-design' => [
                'eyebrow' => 'Service',
                'headline' => 'Social Media Design',
                'subheadline' => 'Always-on design for your feed: posts, carousels and stories produced on a monthly rhythm so your brand never goes quiet.',
                'summary' => 'A dormant feed costs you trust. This lane keeps a steady stream of on-brand design landing on your channels every month, with the content written for each post so you are not staring at a blank caption box.',
                'image' => '/sa1.jpeg',
                'category' => 'Design',
                'period' => 'Month',
                'hero_points' => [
                    'A fixed number of designs every month, delivered in batches',
                    'Content development and captions written for each post',
                    'Platform-correct sizing and safe areas',
                    'Up to five revision rounds included',
                ],
                'outcomes' => [
                    [
                        'title' => 'A feed that looks current',
                        'text' => 'Fresh, on-brand work published on a predictable rhythm instead of sporadic bursts followed by silence.',
                    ],
                    [
                        'title' => 'No blank-page problem',
                        'text' => 'The captions, hooks and content ideas come with the artwork, so posting never stalls waiting on copy.',
                    ],
                    [
                        'title' => 'Recognisable at a glance',
                        'text' => 'A consistent visual system means your posts are identifiable before anyone reads your handle.',
                    ],
                ],
                'deliverables' => [
                    'Your monthly allocation of custom post and carousel designs',
                    'Story and highlight cover assets where your package includes them',
                    'Content development and copywriting for each post',
                    'Platform-tailored exports for every channel you publish on',
                    'The revision rounds stated in your chosen package',
                ],
            ],

            'graphic-design' => [
                'eyebrow' => 'Service',
                'headline' => 'Graphic Design',
                'subheadline' => 'Print and campaign artwork produced to exact specification, with press-ready output your printer will not send back.',
                'summary' => 'Flyers, brochures, banners, packaging, exhibition graphics and campaign creatives. Everything is built to the specification your printer or media house requires, including bleed, colour profile and resolution.',
                'image' => '/a4.jpeg',
                'category' => 'Design',
                'period' => 'Project',
                'hero_points' => [
                    'Built to the exact specification your printer requires',
                    'Correct bleed, colour profile and resolution',
                    'Print-ready and screen-ready exports',
                    'Source files handed over on completion',
                ],
                'outcomes' => [
                    [
                        'title' => 'No rejected print files',
                        'text' => 'Artwork arrives at the specification your printer asked for, so production is not held up by technical fixes.',
                    ],
                    [
                        'title' => 'One visual language',
                        'text' => 'Campaign pieces, print and digital share the same system instead of looking like separate suppliers made them.',
                    ],
                    [
                        'title' => 'Reusable assets',
                        'text' => 'You receive the source files, so adapting them next season does not start from zero.',
                    ],
                ],
                'deliverables' => [
                    'The artwork specified in your brief, produced to size',
                    'Print-ready files with bleed, crop marks and correct colour profile',
                    'Screen-optimised exports for digital placement',
                    'Editable source files',
                    'A short specification sheet for your printer',
                ],
            ],

            'brand-design' => [
                'eyebrow' => 'Service',
                'headline' => 'Brand Design',
                'subheadline' => 'Identity systems built so your business looks the same everywhere it shows up, from the logo to the last template.',
                'summary' => 'A logo is one asset. A brand is a system: colour, type, layout, tone and the rules that keep it consistent. We build the whole thing, document it, and hand it over so your team can apply it without guessing.',
                'image' => '/bio.png',
                'category' => 'Branding',
                'period' => 'Project',
                'hero_points' => [
                    'Strategy before visuals, so the identity has a reason',
                    'Logo suite with every lockup you will actually need',
                    'Documented colour, type and layout system',
                    'Templates your team can reuse without us',
                ],
                'outcomes' => [
                    [
                        'title' => 'Recognisable everywhere',
                        'text' => 'Your invoice, your Instagram and your shop front finally look like the same company.',
                    ],
                    [
                        'title' => 'Decisions stop being subjective',
                        'text' => 'Written rules for colour, type and spacing mean your team applies the brand correctly without art-directing every file.',
                    ],
                    [
                        'title' => 'Room to grow',
                        'text' => 'The system is built to extend to new products, sub-brands and campaigns without a redesign.',
                    ],
                ],
                'deliverables' => [
                    'A completed brand strategy questionnaire and positioning notes',
                    'Primary logo, secondary lockups and mark-only variants',
                    'Colour palette with print and screen values',
                    'Typography system with licensed or open-source recommendations',
                    'Layout and spacing rules with applied examples',
                    'Stationery and social templates as included in your package',
                    'A brand guideline document your team can follow',
                ],
            ],

            'web-design' => [
                'eyebrow' => 'Service',
                'headline' => 'Web Design',
                'subheadline' => 'Sites structured to explain your offer clearly and turn visitors into enquiries, built to load fast, rank, and be editable by you.',
                'summary' => 'A website is a sales tool, not a brochure. We structure the pages around what your visitor needs to decide, then build it so it is fast, findable and easy for your team to update.',
                'image' => '/t-site.PNG',
                'category' => 'Digital',
                'period' => 'Project',
                'hero_points' => [
                    'Page structure built around the buying decision',
                    'Search and answer-engine friendly from day one',
                    'Fast, mobile-first build',
                    'Editable content so you are not dependent on us',
                ],
                'outcomes' => [
                    [
                        'title' => 'Visitors understand the offer',
                        'text' => 'The site answers what you do, who it is for and what it costs before the visitor has to hunt for it.',
                    ],
                    [
                        'title' => 'Enquiries instead of bounces',
                        'text' => 'Clear calls to action and short forms placed where the decision actually happens.',
                    ],
                    [
                        'title' => 'Found by search and AI assistants',
                        'text' => 'Structured content, metadata and machine-readable files so both search engines and LLM tools can describe you accurately.',
                    ],
                ],
                'deliverables' => [
                    'A sitemap and page-by-page content plan',
                    'Designed pages built to the scope in your package',
                    'Responsive implementation across mobile, tablet and desktop',
                    'On-page SEO, metadata and structured data',
                    'Forms wired to the inbox or CRM you nominate',
                    'Analytics and search console configuration',
                    'Handover documentation and a walkthrough recording',
                ],
            ],

            'ui-ux' => [
                'eyebrow' => 'Service',
                'headline' => 'UI/UX Design',
                'subheadline' => 'Product flows and interfaces designed to remove friction at every step, and handed to your developers as a buildable system.',
                'summary' => 'Good product design is mostly subtraction. We map the journey, find where people drop off, and design the screens and states your developers need, documented well enough to build from without a follow-up meeting for every edge case.',
                'image' => '/flux.PNG',
                'category' => 'Product',
                'period' => 'Project',
                'hero_points' => [
                    'Research and flows before pixels',
                    'Every screen state documented, including errors and empty states',
                    'A component system your developers can reuse',
                    'Accessibility considered from the first wireframe',
                ],
                'outcomes' => [
                    [
                        'title' => 'Fewer drop-offs',
                        'text' => 'Flows are reduced to the steps that earn their place, with the friction removed where users actually hesitate.',
                    ],
                    [
                        'title' => 'Faster development',
                        'text' => 'A documented component system and complete states mean fewer build-time decisions and fewer surprises.',
                    ],
                    [
                        'title' => 'A product that scales',
                        'text' => 'Patterns are established so new features inherit the system instead of inventing a new one each time.',
                    ],
                ],
                'deliverables' => [
                    'User flows and journey maps for the scoped flows',
                    'Wireframes at the fidelity your package specifies',
                    'High-fidelity UI screen designs',
                    'A component library with variants and states',
                    'Interactive prototype for testing or stakeholder sign-off',
                    'Developer handoff notes with spacing, type and behaviour specs',
                ],
            ],

            'mobile-app-development' => [
                'eyebrow' => 'Service',
                'headline' => 'Mobile App Development',
                'subheadline' => 'App builds taken from validated idea to a release that survives its first month of real users.',
                'summary' => 'App projects fail on scope more often than on technology. We scope the build in phases, ship the core experience first, and instrument it so the roadmap is driven by real usage rather than assumptions.',
                'image' => '/smart.gif',
                'category' => 'Product',
                'period' => 'Project',
                'hero_points' => [
                    'Phased scope so value ships early',
                    'iOS and Android from one codebase where it makes sense',
                    'Analytics and crash reporting from the first release',
                    'Store submission handled end to end',
                ],
                'outcomes' => [
                    [
                        'title' => 'Something usable, sooner',
                        'text' => 'A core build that real users can operate, instead of a long silence followed by a large reveal.',
                    ],
                    [
                        'title' => 'A release that holds up',
                        'text' => 'Crash reporting, analytics and a support path in place before launch day, not after the first reviews land.',
                    ],
                    [
                        'title' => 'A roadmap with evidence',
                        'text' => 'The next phase is prioritised from actual usage data and store feedback.',
                    ],
                ],
                'deliverables' => [
                    'A scoped feature list split into build phases',
                    'The app implementation for your target platforms',
                    'Backend and third-party integrations in scope',
                    'App store and Play Store submission and review handling',
                    'Crash reporting, analytics and release monitoring',
                    'Source code, repository access and build documentation',
                ],
            ],

            'manage-hires' => [
                'eyebrow' => 'Service',
                'headline' => 'Manage Your Hires',
                'subheadline' => 'A dedicated design team on retainer for businesses with a constant stream of requests and no in-house designers.',
                'summary' => 'Instead of briefing an agency per project, you get assigned designers who already know your brand, a fixed monthly cost, and a request queue that keeps moving.',
                'image' => '/dr.png',
                'category' => 'Retainer',
                'period' => 'Month',
                'hero_points' => [
                    'Named designers who learn your brand once',
                    'Fixed monthly cost, no per-project quoting',
                    'A request queue with agreed turnaround times',
                    'Unused requests roll over where your package allows',
                ],
                'outcomes' => [
                    [
                        'title' => 'Requests stop queueing behind quotes',
                        'text' => 'No scoping email for every asset. You submit the request and it enters the schedule.',
                    ],
                    [
                        'title' => 'Consistency without management',
                        'text' => 'The same designers apply the same brand rules, so quality does not drift between deliverables.',
                    ],
                    [
                        'title' => 'Predictable design spend',
                        'text' => 'One monthly figure you can budget for instead of a variable invoice every time marketing needs something.',
                    ],
                ],
                'deliverables' => [
                    'A dedicated design team assigned to your account',
                    'The monthly request volume stated in your package',
                    'Brand coverage up to the number of brands your plan includes',
                    'An agreed turnaround window per request type',
                    'Source files for everything produced',
                    'A shared request board so you can see status at any time',
                ],
            ],

            'special-service' => [
                'eyebrow' => 'Service',
                'headline' => 'Special Service',
                'subheadline' => 'Mixed-scope work and unusual briefs, scoped properly before anything begins.',
                'summary' => 'Motion graphics, video editing, pitch decks, book design and publishing support, ad campaign management, shoot direction, print production and workshops. If it does not fit a standard lane, it belongs here, and it gets scoped like everything else.',
                'image' => '/gs.gif',
                'category' => 'Custom',
                'period' => 'Project',
                'hero_points' => [
                    'A real scope before a real price',
                    'Work reviewed by the team that will deliver it',
                    'Written quote covering every deliverable',
                    'No payment until you accept the scope',
                ],
                'outcomes' => [
                    [
                        'title' => 'An honest answer',
                        'text' => 'If the work is outside what we do well, we say so instead of quoting for it anyway.',
                    ],
                    [
                        'title' => 'A defined deliverable',
                        'text' => 'The brief becomes a written scope with named outputs, so neither side is guessing at the finish line.',
                    ],
                    [
                        'title' => 'No payment to find out',
                        'text' => 'Scoping is free. You receive the plan and the price before any invoice exists.',
                    ],
                ],
                'deliverables' => [
                    'A written scope of work based on your submitted brief',
                    'A fixed quote with the deliverable list itemised',
                    'A dated production schedule',
                    'The work itself, produced by the relevant specialist',
                    'Source files and handover notes',
                ],
            ],
        ];
    }
}
