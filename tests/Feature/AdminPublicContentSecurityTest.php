<?php

namespace Tests\Feature;

use App\Models\BlogPost;
use App\Models\SlideShow;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AdminPublicContentSecurityTest extends TestCase
{
    use RefreshDatabase;

    public function test_super_admin_cannot_store_blog_post_with_unsafe_cover_image(): void
    {
        $superAdmin = $this->superAdmin();

        $this->actingAs($superAdmin)
            ->post(route('admin.blog.store'), [
                'title' => 'Unsafe Image Test',
                'slug' => 'unsafe-image-test',
                'cover_image' => 'javascript:alert(1)',
                'is_published' => true,
            ])
            ->assertSessionHasErrors('cover_image');

        $this->assertDatabaseMissing('blog_posts', [
            'slug' => 'unsafe-image-test',
        ]);
    }

    public function test_super_admin_cannot_store_gallery_item_with_unsafe_image_path(): void
    {
        $superAdmin = $this->superAdmin();

        $this->actingAs($superAdmin)
            ->post(route('admin.gallery.store'), [
                'title' => 'Unsafe Gallery Path',
                'image_path' => '/../secrets.png',
                'is_published' => true,
            ])
            ->assertSessionHasErrors('image_path');
    }

    public function test_super_admin_cannot_store_event_with_non_http_registration_url(): void
    {
        $superAdmin = $this->superAdmin();

        $this->actingAs($superAdmin)
            ->post(route('admin.events.store'), [
                'title' => 'Unsafe Event',
                'registration_url' => 'ftp://example.com/register',
                'is_published' => true,
            ])
            ->assertSessionHasErrors('registration_url');
    }

    public function test_public_blog_hides_unsafe_cover_image_values_from_existing_records(): void
    {
        BlogPost::create([
            'title' => 'Legacy Unsafe Record',
            'slug' => 'legacy-unsafe-record',
            'excerpt' => 'Legacy excerpt',
            'body' => 'Legacy body',
            'cover_image' => 'javascript:alert(1)',
            'is_published' => true,
            'published_at' => now(),
            'position' => 0,
        ]);

        $this->get(route('blog'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Blog')
                ->has('posts', 1)
                ->where('posts.0.cover_image', null)
            );
    }

    public function test_homepage_only_exposes_slides_with_safe_images(): void
    {
        SlideShow::query()->create([
            'slide_title' => 'Blocked Slide',
            'text' => 'Should not render',
            'slide_image' => 'javascript:alert(1)',
            'slide_link' => '/contact-us',
            'slide_link_text' => 'Contact',
        ]);

        SlideShow::query()->create([
            'slide_title' => 'Safe Slide',
            'text' => 'Should render',
            'slide_image' => '/safe-slide.jpg',
            'slide_link' => '/contact-us',
            'slide_link_text' => 'Contact',
        ]);

        $this->get(route('home'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Welcome')
                ->has('slideShows', 1)
                ->where('slideShows.0.slide_title', 'Safe Slide')
            );
    }

    private function superAdmin(): User
    {
        return User::factory()->create([
            'role' => User::ROLE_SUPER_ADMIN,
        ]);
    }
}
