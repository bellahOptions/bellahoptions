<?php

namespace App\Support;

use App\Mail\ServiceBriefRequestMail;
use App\Models\ServiceOrder;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\URL;
use Throwable;

/**
 * Sends the detailed pre-project questionnaire (the same schema used by the
 * standalone /brief flow) as an automatic follow-up once an order is
 * placed, so checkout itself can stay short while we still collect a full
 * brief for the work. The link is signed so the order/service linkage
 * embedded in it can't be tampered with by the browser.
 */
class ServiceBriefRequestService
{
    /**
     * @return array{status: string, link: ?string}
     */
    public function sendForOrder(ServiceOrder $order): array
    {
        $serviceSlug = (string) $order->service_slug;
        $meta = (array) config("service_briefs.service_meta.{$serviceSlug}", []);

        if ($meta === []) {
            return ['status' => 'no_template', 'link' => null];
        }

        $email = strtolower(trim((string) $order->email));

        if ($email === '') {
            return ['status' => 'no_email', 'link' => null];
        }

        $link = URL::temporarySignedRoute('brief.create', now()->addDays(30), [
            'serviceSlug' => $serviceSlug,
            'service_order_id' => $order->id,
        ]);

        try {
            Mail::to($email)->send(new ServiceBriefRequestMail($order, $link));
        } catch (Throwable $exception) {
            Log::warning('Service brief request email failed.', [
                'service_order_id' => $order->id,
                'service_slug' => $serviceSlug,
                'email' => $email,
                'error' => $exception->getMessage(),
            ]);

            return ['status' => 'failed', 'link' => null];
        }

        return ['status' => 'sent', 'link' => $link];
    }
}
