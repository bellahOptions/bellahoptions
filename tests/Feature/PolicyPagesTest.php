<?php

namespace Tests\Feature;

use App\Models\Term;
use App\Support\PolicyContent;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/**
 * Legal policy pages.
 *
 * These were a light Blade layout that looked like a different site, and privacy
 * and cookie rendered no body text at all on a fresh install because their only
 * content lived in admin-editable records. Both are now covered.
 */
class PolicyPagesTest extends TestCase
{
    use RefreshDatabase;

    public function test_terms_page_renders_through_the_site_theme(): void
    {
        $this->get(route('terms.show'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Policy')
                ->where('policy.key', 'terms')
                ->where('policy.title', 'Terms of Service')
                ->has('sections')
                ->has('metaItems')
            );
    }

    public function test_privacy_page_has_built_in_content_without_any_admin_record(): void
    {
        // The regression: with no Term record, privacy rendered an empty body.
        $this->assertSame(0, Term::query()->count());

        $response = $this->get(route('privacy.show'))->assertOk();

        $response->assertInertia(fn (Assert $page) => $page
            ->component('Policy')
            ->where('policy.key', 'privacy')
        );

        $sections = $response->viewData('page')['props']['sections'];

        $this->assertNotEmpty($sections, 'Privacy policy should fall back to built-in content.');
        $this->assertGreaterThanOrEqual(5, count($sections));
    }

    public function test_cookie_page_has_built_in_content_without_any_admin_record(): void
    {
        $response = $this->get(route('cookies.show'))->assertOk();

        $sections = $response->viewData('page')['props']['sections'];

        $this->assertNotEmpty($sections, 'Cookie policy should fall back to built-in content.');
    }

    public function test_every_policy_has_a_title_badge_and_notice(): void
    {
        foreach (['terms.show', 'privacy.show', 'cookies.show'] as $route) {
            $response = $this->get(route($route))->assertOk();

            $policy = $response->viewData('page')['props']['policy'];

            $this->assertNotSame('', $policy['title'], "{$route} is missing a title.");
            $this->assertNotSame('', $policy['badge'], "{$route} is missing a badge.");
            $this->assertNotSame('', $policy['heroDescription'], "{$route} is missing a hero description.");
            $this->assertNotSame('', $policy['notice'], "{$route} is missing its notice.");
        }
    }

    public function test_admin_edited_content_overrides_the_built_in_copy(): void
    {
        Term::query()->create([
            'title' => 'Terms of Service',
            'content' => "1. Custom Section\n\nThis wording came from the admin area.\n\n- First custom bullet\n- Second custom bullet",
        ]);

        $response = $this->get(route('terms.show'))->assertOk();

        $sections = $response->viewData('page')['props']['sections'];

        $this->assertCount(1, $sections);
        $this->assertSame('1. Custom Section', $sections[0]['title']);
        $this->assertContains('First custom bullet', $sections[0]['bullets']);
    }

    public function test_every_section_carries_a_linkable_anchor(): void
    {
        $sections = PolicyContent::sectionsFor('terms');

        $this->assertNotEmpty($sections);

        foreach ($sections as $section) {
            $this->assertArrayHasKey('id', $section);
            $this->assertNotSame('', $section['id'], 'Section is missing an anchor id.');

            // Anchor ids must be safe for use in an href and a DOM id.
            $this->assertMatchesRegularExpression('/^[a-z0-9-]+$/', $section['id']);
        }

        // Ids must be unique, or the contents list would link to the wrong place.
        $ids = array_column($sections, 'id');
        $this->assertSame($ids, array_values(array_unique($ids)));
    }

    public function test_policy_content_is_present_for_all_three_policies(): void
    {
        foreach (['terms' => 10, 'privacy' => 5, 'cookie' => 3] as $policy => $minimum) {
            $sections = PolicyContent::sectionsFor($policy);

            $this->assertGreaterThanOrEqual(
                $minimum,
                count($sections),
                "The {$policy} policy should carry at least {$minimum} sections.",
            );

            foreach ($sections as $section) {
                $this->assertNotSame('', $section['title']);

                // A section with no prose and no bullets renders as an empty card.
                $this->assertTrue(
                    $section['body'] !== [] || $section['bullets'] !== [],
                    "Section '{$section['title']}' in {$policy} has no content.",
                );
            }
        }
    }

    public function test_policy_pages_stay_indexable(): void
    {
        // Legal pages are legitimate search results and must not be caught by the
        // private-route noindex rules.
        foreach (['terms.show', 'privacy.show', 'cookies.show'] as $route) {
            $this->withoutVite();

            $this->get(route($route))
                ->assertOk()
                ->assertHeaderMissing('x-robots-tag');
        }
    }
}
