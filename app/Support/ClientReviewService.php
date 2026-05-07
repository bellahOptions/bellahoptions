<?php

namespace App\Support;

use App\Mail\ClientReviewRequestMail;
use App\Models\ClientReview;
use App\Models\Invoice;
use App\Models\ServiceOrder;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Throwable;

class ClientReviewService
{
    public function requestFromServiceOrder(ServiceOrder $serviceOrder): ?ClientReview
    {
        $email = strtolower(trim((string) $serviceOrder->email));

        if ($email === '') {
            return null;
        }

        return $this->issueReviewRequest(
            source: 'client',
            reviewerName: trim((string) $serviceOrder->full_name),
            reviewerEmail: $email,
            serviceOrderId: $serviceOrder->id,
            invoiceId: $serviceOrder->invoice_id,
        );
    }

    public function requestFromInvoice(Invoice $invoice): ?ClientReview
    {
        $invoice->loadMissing('serviceOrder:id,invoice_id');

        $email = strtolower(trim((string) $invoice->customer_email));

        if ($email === '') {
            return null;
        }

        return $this->issueReviewRequest(
            source: 'client',
            reviewerName: trim((string) $invoice->customer_name),
            reviewerEmail: $email,
            serviceOrderId: $invoice->serviceOrder?->id,
            invoiceId: $invoice->id,
        );
    }

    public function shouldBePublic(mixed $rating): bool
    {
        return (float) $rating >= 4.0;
    }

    private function issueReviewRequest(
        string $source,
        string $reviewerName,
        string $reviewerEmail,
        ?int $serviceOrderId,
        ?int $invoiceId,
    ): ?ClientReview {
        $review = $this->findByOrderOrInvoice($serviceOrderId, $invoiceId) ?? new ClientReview();

        if ($review->review_submitted_at !== null) {
            return $review;
        }

        if ($review->review_requested_at !== null) {
            return $review;
        }

        if (! is_string($review->review_token) || trim($review->review_token) === '') {
            $review->review_token = $this->generateToken();
        }

        $review->source = $source;
        $review->service_order_id = $serviceOrderId;
        $review->invoice_id = $invoiceId;
        $review->reviewer_name = $reviewerName !== '' ? $reviewerName : null;
        $review->reviewer_email = $reviewerEmail;
        $review->review_requested_at = now();
        $review->save();

        try {
            Mail::to($reviewerEmail)->send(new ClientReviewRequestMail($review->fresh()));
        } catch (Throwable $exception) {
            $review->review_requested_at = null;
            $review->save();

            Log::warning('Failed to send client review request email.', [
                'client_review_id' => $review->id,
                'service_order_id' => $serviceOrderId,
                'invoice_id' => $invoiceId,
                'reviewer_email' => $reviewerEmail,
                'error' => $exception->getMessage(),
            ]);
        }

        return $review;
    }

    private function findByOrderOrInvoice(?int $serviceOrderId, ?int $invoiceId): ?ClientReview
    {
        return ClientReview::query()
            ->when($serviceOrderId !== null || $invoiceId !== null, function ($query) use ($serviceOrderId, $invoiceId): void {
                $query->where(function ($innerQuery) use ($serviceOrderId, $invoiceId): void {
                    if ($serviceOrderId !== null) {
                        $innerQuery->orWhere('service_order_id', $serviceOrderId);
                    }

                    if ($invoiceId !== null) {
                        $innerQuery->orWhere('invoice_id', $invoiceId);
                    }
                });
            })
            ->latest('id')
            ->first();
    }

    private function generateToken(): string
    {
        do {
            $token = Str::random(64);
        } while (ClientReview::query()->where('review_token', $token)->exists());

        return $token;
    }
}
