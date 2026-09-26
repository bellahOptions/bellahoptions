<?php

namespace Tests\Feature;

use App\Models\GalleryProject;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

/**
 * Projects shown on a service landing page.
 *
 * A project belongs to a service through `service_slug`. Projects saved before
 * that column existed only carry a free-text `category`, so an untagged project
 * whose category is exactly the service name is treated as belonging to it. An
 * explicit tag always wins.
 */
class ServiceProjectGalleryTest extends TestCase
{
    use RefreshDatabase;

    private function superAdmin(): User
    {
        return User::factory()->create(['role' => User::ROLE_SUPER_ADMIN]);
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    private function project(array $attributes = []): GalleryProject
    {
        return GalleryProject::create(array_merge([
            'title' => 'Untitled project',
            'category' => 'Creative Work',
            'service_slug' => null,
            'image_path' => '/media/gallery/example.jpg',
            'is_published' => true,
            'position' => 0,
        ], $attributes));
    }

    /**
     * @return array<int, string>
     */
    private function titlesOn(string $serviceSlug): array
    {
        $response = $this->get(route('services.show', $serviceSlug))->assertOk();

        return array_column($response->viewData('page')['props']['projects'], 'title');
    }

    public function test_a_service_landing_page_receives_its_tagged_projects(): void
    {
        $this->project(['title' => 'Brand identity for Acme', 'service_slug' => 'brand-design']);
        $this->project(['title' => 'Website for Beta', 'service_slug' => 'web-design']);

        $this->assertSame(['Brand identity for Acme'], $this->titlesOn('brand-design'));
    }

    public function test_projects_tagged_to_another_service_never_leak_in(): void
    {
        $this->project(['title' => 'Website for Beta', 'service_slug' => 'web-design']);

        $this->assertSame([], $this->titlesOn('brand-design'));
    }

    public function test_untagged_projects_fall_back_to_a_category_name_match(): void
    {
        // What a project saved before service tagging looks like.
        $this->project(['title' => 'Legacy brand work', 'category' => 'Brand Design']);

        $this->assertSame(['Legacy brand work'], $this->titlesOn('brand-design'));
    }

    public function test_the_category_fallback_is_case_insensitive(): void
    {
        $this->project(['title' => 'Lowercase category', 'category' => 'brand design']);

        $this->assertSame(['Lowercase category'], $this->titlesOn('brand-design'));
    }

    public function test_an_untagged_project_with_an_unrelated_category_is_excluded(): void
    {
        $this->project(['title' => 'Something else', 'category' => 'Motion Graphics']);

        $this->assertSame([], $this->titlesOn('brand-design'));
    }

    public function test_an_explicit_tag_beats_a_conflicting_category(): void
    {
        // Tagged to web design but categorised as brand design: the explicit
        // tag wins, and it must not also appear on the brand design page.
        $this->project([
            'title' => 'Tagged web work',
            'category' => 'Brand Design',
            'service_slug' => 'web-design',
        ]);

        $this->assertSame([], $this->titlesOn('brand-design'));
        $this->assertSame(['Tagged web work'], $this->titlesOn('web-design'));
    }

    public function test_unpublished_projects_are_never_shown(): void
    {
        $this->project([
            'title' => 'Draft project',
            'service_slug' => 'brand-design',
            'is_published' => false,
        ]);

        $this->assertSame([], $this->titlesOn('brand-design'));
    }

    public function test_projects_are_ordered_by_position(): void
    {
        $this->project(['title' => 'Third', 'service_slug' => 'brand-design', 'position' => 30]);
        $this->project(['title' => 'First', 'service_slug' => 'brand-design', 'position' => 10]);
        $this->project(['title' => 'Second', 'service_slug' => 'brand-design', 'position' => 20]);

        $this->assertSame(['First', 'Second', 'Third'], $this->titlesOn('brand-design'));
    }

    public function test_the_section_payload_carries_what_the_grid_needs(): void
    {
        $this->project([
            'title' => 'Campaign visuals',
            'category' => 'Social Media Design',
            'service_slug' => 'social-media-design',
            'description' => 'A month of campaign assets.',
            'image_path' => '/media/gallery/campaign.jpg',
            'project_url' => 'https://www.behance.net/gallery/123',
        ]);

        $response = $this->get(route('services.show', 'social-media-design'))->assertOk();

        $response->assertInertia(fn (Assert $page) => $page
            ->component('ServiceDetail')
            ->has('projects', 1)
            ->where('projects.0.title', 'Campaign visuals')
            ->where('projects.0.category', 'Social Media Design')
            ->where('projects.0.description', 'A month of campaign assets.')
            ->where('projects.0.image', '/media/gallery/campaign.jpg')
            ->where('projects.0.project_url', 'https://www.behance.net/gallery/123')
        );
    }

    public function test_an_unsafe_project_url_is_dropped(): void
    {
        $this->project([
            'title' => 'Suspicious link',
            'service_slug' => 'brand-design',
            'project_url' => 'javascript:alert(1)',
        ]);

        $response = $this->get(route('services.show', 'brand-design'))->assertOk();

        // A javascript: URL must never reach an href on a public page.
        $this->assertNull($response->viewData('page')['props']['projects'][0]['project_url']);
    }

    public function test_a_service_with_no_projects_receives_an_empty_list(): void
    {
        $this->assertSame([], $this->titlesOn('graphic-design'));
    }

    public function test_a_landing_only_service_can_be_tagged_too(): void
    {
        // social-media-management is a landing page whose orders go through
        // special-service, so it must still be taggable in its own right.
        $this->project(['title' => 'Managed social work', 'service_slug' => 'social-media-management']);

        $this->assertSame(['Managed social work'], $this->titlesOn('social-media-management'));
    }

    public function test_an_admin_can_tag_a_project_to_a_service(): void
    {
        $this->actingAs($this->superAdmin())
            ->post(route('admin.gallery.store'), [
                'title' => 'New brand work',
                'category' => 'Brand Design',
                'service_slug' => 'brand-design',
                'image_path' => '/media/gallery/new.jpg',
                'is_published' => true,
            ])
            ->assertRedirect()
            ->assertSessionDoesntHaveErrors();

        $this->assertSame(
            'brand-design',
            GalleryProject::query()->where('title', 'New brand work')->value('service_slug'),
        );
    }

    public function test_an_unknown_service_slug_is_rejected(): void
    {
        // A typo must not silently orphan a project from every landing page.
        $this->actingAs($this->superAdmin())
            ->post(route('admin.gallery.store'), [
                'title' => 'Typo project',
                'category' => 'Brand Design',
                'service_slug' => 'brand-desgin',
                'image_path' => '/media/gallery/new.jpg',
                'is_published' => true,
            ])
            ->assertSessionHasErrors(['service_slug']);

        $this->assertSame(0, GalleryProject::query()->count());
    }

    public function test_the_admin_gallery_exposes_the_service_options(): void
    {
        $response = $this->actingAs($this->superAdmin())
            ->get(route('admin.gallery.index'))
            ->assertOk();

        $options = $response->viewData('page')['props']['serviceOptions'];
        $slugs = array_column($options, 'slug');

        $this->assertContains('brand-design', $slugs);
        $this->assertContains('social-media-management', $slugs);

        $names = array_column($options, 'name', 'slug');
        $this->assertSame('Brand Design', $names['brand-design']);
    }

    public function test_an_admin_can_clear_a_project_service_tag(): void
    {
        $project = $this->project(['title' => 'Was tagged', 'service_slug' => 'brand-design']);

        $this->actingAs($this->superAdmin())
            ->put(route('admin.gallery.update', $project), [
                'title' => 'Was tagged',
                'category' => 'Brand Design',
                'service_slug' => '',
                'image_path' => '/media/gallery/example.jpg',
                'is_published' => true,
            ])
            ->assertRedirect();

        $this->assertNull($project->fresh()->service_slug);

        // Clearing the tag still leaves it matched by category, which is the
        // documented fallback rather than a silent disappearance.
        $this->assertSame(['Was tagged'], $this->titlesOn('brand-design'));
    }
}
