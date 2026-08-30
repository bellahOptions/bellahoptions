<?php

namespace Tests\Feature;

use App\Models\ClientReview;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class AdminClientReviewScreenshotTest extends TestCase
{
    use RefreshDatabase;

    public function test_non_super_admin_cannot_create_a_review(): void
    {
        $staff = User::factory()->create(['role' => 'customer_rep']);

        $this->actingAs($staff)->post(route('admin.client-reviews.store'), [
            'reviewer_name' => 'Jane Doe',
            'rating' => 5,
            'screenshot_path' => '/storage/client-reviews/example.webp',
            'is_public' => true,
        ])->assertForbidden();

        $this->assertDatabaseCount('client_reviews', 0);
    }

    public function test_super_admin_can_create_a_screenshot_only_review_without_a_comment(): void
    {
        $superAdmin = User::factory()->create(['role' => 'super_admin']);

        $this->actingAs($superAdmin)->post(route('admin.client-reviews.store'), [
            'reviewer_name' => 'Jane Doe',
            'rating' => 5,
            'comment' => '',
            'screenshot_path' => '/storage/client-reviews/example.webp',
            'is_public' => true,
        ])->assertSessionHas('success');

        $review = ClientReview::firstOrFail();
        $this->assertNull($review->comment);
        $this->assertSame('/storage/client-reviews/example.webp', $review->screenshot_path);
        $this->assertTrue((bool) $review->is_public);
    }

    public function test_review_requires_either_a_comment_or_a_screenshot(): void
    {
        $superAdmin = User::factory()->create(['role' => 'super_admin']);

        $this->actingAs($superAdmin)->post(route('admin.client-reviews.store'), [
            'reviewer_name' => 'Jane Doe',
            'rating' => 5,
            'comment' => '',
            'is_public' => true,
        ])->assertSessionHasErrors('comment');

        $this->assertDatabaseCount('client_reviews', 0);
    }

    public function test_super_admin_can_still_create_a_text_only_review_without_a_screenshot(): void
    {
        $superAdmin = User::factory()->create(['role' => 'super_admin']);

        $this->actingAs($superAdmin)->post(route('admin.client-reviews.store'), [
            'reviewer_name' => 'Jane Doe',
            'rating' => 5,
            'comment' => 'Excellent work, highly recommended.',
            'is_public' => true,
        ])->assertSessionHas('success');

        $review = ClientReview::firstOrFail();
        $this->assertSame('Excellent work, highly recommended.', $review->comment);
        $this->assertNull($review->screenshot_path);
    }

    public function test_public_review_listing_exposes_screenshot_url_for_visible_reviews(): void
    {
        ClientReview::create([
            'source' => 'admin',
            'reviewer_name' => 'Screenshot Client',
            'rating' => 5,
            'comment' => null,
            'screenshot_path' => '/storage/client-reviews/example.webp',
            'is_public' => true,
            'review_submitted_at' => now(),
            'published_at' => now(),
        ]);

        $this->get('/reviews')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('publicClientReviews', 1)
                ->where('publicClientReviews.0.screenshot_url', '/storage/client-reviews/example.webp')
            );
    }

    public function test_admin_settings_page_exposes_screenshot_path_for_every_review(): void
    {
        $superAdmin = User::factory()->create(['role' => 'super_admin']);

        ClientReview::create([
            'source' => 'admin',
            'reviewer_name' => 'Private Screenshot Client',
            'rating' => 5,
            'comment' => null,
            'screenshot_path' => '/storage/client-reviews/private.webp',
            'is_public' => false,
        ]);

        $this->actingAs($superAdmin)->get(route('admin.settings.edit'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('clientReviews.0.screenshot_path', '/storage/client-reviews/private.webp')
            );
    }
}
