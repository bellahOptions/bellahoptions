<?php

namespace Tests\Feature;

use App\Mail\ClientReviewRequestMail;
use App\Models\ClientReview;
use App\Models\Invoice;
use App\Models\ServiceOrder;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Tests\TestCase;

class ClientReviewFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_marking_service_order_completed_sends_review_request_email(): void
    {
        Mail::fake();

        $staff = User::factory()->create([
            'role' => 'staff',
        ]);

        $serviceOrder = ServiceOrder::create([
            'uuid' => (string) Str::uuid(),
            'order_code' => 'BOREVIEW1',
            'service_slug' => 'social-media-design',
            'service_name' => 'Social Media Design',
            'package_code' => 'starter',
            'package_name' => 'Starter',
            'currency' => 'NGN',
            'amount' => 50000,
            'payment_status' => 'paid',
            'order_status' => 'in_progress',
            'progress_percent' => 60,
            'full_name' => 'Client One',
            'email' => 'client-one@example.com',
            'business_name' => 'Client One Ltd',
            'project_summary' => 'Design support needed',
        ]);

        $this->actingAs($staff)
            ->post(route('admin.service-orders.updates.store', $serviceOrder), [
                'status' => 'completed',
                'progress_percent' => 100,
                'note' => 'Project delivered.',
                'is_public' => true,
            ])
            ->assertSessionHas('success');

        $review = ClientReview::query()->where('service_order_id', $serviceOrder->id)->first();

        $this->assertNotNull($review);
        $this->assertNotNull($review?->review_requested_at);

        Mail::assertSent(ClientReviewRequestMail::class, function (ClientReviewRequestMail $mail): bool {
            return $mail->hasTo('client-one@example.com');
        });
    }

    public function test_marking_invoice_paid_sends_review_request_email(): void
    {
        Mail::fake();

        $staff = User::factory()->create([
            'role' => 'staff',
        ]);

        $invoice = Invoice::create([
            'invoice_number' => 'INV-REVIEW-200',
            'customer_name' => 'Invoice Client',
            'customer_email' => 'invoice-client@example.com',
            'title' => 'Creative Work',
            'amount' => 45000,
            'currency' => 'NGN',
            'status' => 'sent',
            'issued_at' => now(),
            'created_by' => $staff->id,
        ]);

        $this->actingAs($staff)
            ->patch(route('admin.invoices.mark-paid', $invoice), [
                'payment_reference' => 'PAY-REVIEW-001',
            ])
            ->assertSessionHas('success');

        $review = ClientReview::query()->where('invoice_id', $invoice->id)->first();

        $this->assertNotNull($review);
        $this->assertNotNull($review?->review_requested_at);

        Mail::assertSent(ClientReviewRequestMail::class, function (ClientReviewRequestMail $mail): bool {
            return $mail->hasTo('invoice-client@example.com');
        });
    }

    public function test_submitted_review_is_public_only_for_four_star_and_above(): void
    {
        $review = ClientReview::create([
            'source' => 'client',
            'review_token' => Str::random(64),
            'reviewer_name' => 'Pending Client',
            'reviewer_email' => 'pending-client@example.com',
            'review_requested_at' => now(),
        ]);

        $this->post(route('reviews.submit.store', $review->review_token), [
            'reviewer_name' => 'Pending Client',
            'reviewer_email' => 'pending-client@example.com',
            'rating' => 3,
            'comment' => 'Average service.',
        ])->assertSessionHas('success');

        $review->refresh();

        $this->assertSame('3.0', (string) $review->rating);
        $this->assertFalse((bool) $review->is_public);

        $secondReview = ClientReview::create([
            'source' => 'client',
            'review_token' => Str::random(64),
            'reviewer_name' => 'Happy Client',
            'reviewer_email' => 'happy-client@example.com',
            'review_requested_at' => now(),
        ]);

        $this->post(route('reviews.submit.store', $secondReview->review_token), [
            'reviewer_name' => 'Happy Client',
            'reviewer_email' => 'happy-client@example.com',
            'rating' => 5,
            'comment' => 'Excellent delivery.',
        ])->assertSessionHas('success');

        $secondReview->refresh();

        $this->assertSame('5.0', (string) $secondReview->rating);
        $this->assertTrue((bool) $secondReview->is_public);
        $this->assertNotNull($secondReview->published_at);
    }
}
