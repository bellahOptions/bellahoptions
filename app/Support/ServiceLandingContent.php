<?php

namespace App\Support;

/**
 * Landing-page content for a single service.
 *
 * Pricing, package names and package descriptions always come from
 * ServiceOrderCatalog so a landing page can never advertise a price the order
 * form disagrees with. This class supplies the human framing around that data:
 * the hero, the outcomes, the process, the FAQs and the imagery.
 *
 * Every service in the catalogue gets a page. Services with bespoke copy live in
 * ServiceLandingCopy; anything else falls through to {@see self::fallback()},
 * which derives a complete page from the catalogue description so a newly added
 * service is never broken or empty.
 */
class ServiceLandingContent
{
    /**
     * @param  array<string, mixed>  $service
     * @return array<string, mixed>
     */
    public static function for(string $serviceSlug, array $service): array
    {
        $bespoke = ServiceLandingCopy::all()[$serviceSlug] ?? [];
        $fallback = self::fallback($serviceSlug, $service);

        return array_replace_recursive($fallback, $bespoke);
    }

    /**
     * @param  array<string, mixed>  $service
     * @return array<string, mixed>
     */
    private static function fallback(string $serviceSlug, array $service): array
    {
        $name = trim((string) ($service['name'] ?? ucfirst($serviceSlug)));
        $description = trim((string) ($service['description'] ?? ''));

        if ($description === '') {
            $description = $name.' delivered by the Bellah Options team, scoped in writing before any work begins.';
        }

        return [
            'eyebrow' => 'Service',
            'headline' => $name,
            'subheadline' => $description,
            'summary' => $description,
            'image' => '/bo.png',
            'category' => 'Service',
            'period' => 'Project',
            'hero_points' => [
                'Scope, price and timeline confirmed in writing',
                'Source files and documentation handed over in full',
                'Delivered by the same team that scoped the work',
            ],
            'outcomes' => [
                [
                    'title' => 'A clear scope',
                    'text' => 'You know exactly what is included in your '.$name.' package before anything is scheduled.',
                ],
                [
                    'title' => 'Work you can use immediately',
                    'text' => 'Deliverables arrive in the formats your team, printer or developer actually needs.',
                ],
                [
                    'title' => 'A dependable timeline',
                    'text' => 'Dated milestones agreed up front, with a named person accountable for each one.',
                ],
            ],
            'deliverables' => [
                'A written scope covering exactly what is included',
                'The design work produced by our in-house team',
                'The revision rounds stated in your package',
                'Editable source files and export-ready assets',
                'Handover documentation for your team',
            ],
            'process' => self::defaultProcess(),
            'faqs' => self::defaultFaqs($name),
        ];
    }

    /**
     * @return array<int, array{title: string, text: string}>
     */
    private static function defaultProcess(): array
    {
        return [
            [
                'title' => 'Choose your package',
                'text' => 'Pick the option that matches your scope. If two look close, send the brief anyway and we will tell you which fits.',
            ],
            [
                'title' => 'Complete the short brief',
                'text' => 'A few questions about your brand, audience and deadline. It takes minutes and removes most later back-and-forth.',
            ],
            [
                'title' => 'Confirm scope and pay securely',
                'text' => 'You receive the final scope, price and timeline in writing before work is scheduled.',
            ],
            [
                'title' => 'Receive, review, launch',
                'text' => 'We deliver on schedule. You review, request the included revisions, and take full ownership of the files.',
            ],
        ];
    }

    /**
     * @return array<int, array{q: string, a: string}>
     */
    private static function defaultFaqs(string $name): array
    {
        return [
            [
                'q' => 'How is this priced?',
                'a' => 'Each '.$name.' package is listed on this page with its deliverables. Nothing is added later without your written approval.',
            ],
            [
                'q' => 'How long does it take?',
                'a' => 'You receive a dated delivery plan with your scope confirmation. Project timelines begin on the working day we receive your deposit and completed brief.',
            ],
            [
                'q' => 'What do you need from me to start?',
                'a' => 'Your existing brand assets if you have them, any copy or product details you want used, examples of work you like, and your deadline. If you have none of that, we can start from scratch.',
            ],
            [
                'q' => 'What if I am not sure this is the right service?',
                'a' => 'Send the brief anyway. We review every submission and will tell you honestly if a different service fits better.',
            ],
        ];
    }
}
