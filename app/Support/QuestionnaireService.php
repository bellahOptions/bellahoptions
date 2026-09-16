<?php

namespace App\Support;

use App\Mail\QuestionnaireRequestMail;
use App\Models\Invoice;
use App\Models\Questionnaire;
use App\Models\QuestionnaireTemplate;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Throwable;

class QuestionnaireService
{
    /**
     * @return array{status: string, questionnaire: ?Questionnaire}
     */
    public function sendForInvoice(Invoice $invoice, ?User $sender = null): array
    {
        $invoice->loadMissing('serviceOrder');

        $serviceOrder = $invoice->serviceOrder;

        if (! $serviceOrder) {
            return ['status' => 'no_service_order', 'questionnaire' => null];
        }

        $template = QuestionnaireTemplate::query()
            ->where('service_slug', $serviceOrder->service_slug)
            ->where('is_active', true)
            ->first();

        if (! $template) {
            return ['status' => 'no_template', 'questionnaire' => null];
        }

        $email = strtolower(trim((string) $invoice->customer_email));

        if ($email === '') {
            return ['status' => 'no_email', 'questionnaire' => null];
        }

        $questionnaire = Questionnaire::create([
            'invoice_id' => $invoice->id,
            'service_order_id' => $serviceOrder->id,
            'questionnaire_template_id' => $template->id,
            'created_by' => $sender?->id,
            'token' => $this->generateToken(),
            'customer_name' => $invoice->customer_name,
            'customer_email' => $email,
            'status' => 'pending',
            'requested_at' => now(),
        ]);

        try {
            Mail::to($email)->send(new QuestionnaireRequestMail($questionnaire->fresh(['template', 'serviceOrder', 'invoice'])));
        } catch (Throwable $exception) {
            $questionnaire->delete();

            Log::warning('Questionnaire request email failed.', [
                'invoice_id' => $invoice->id,
                'customer_email' => $email,
                'error' => $exception->getMessage(),
            ]);

            return ['status' => 'failed', 'questionnaire' => null];
        }

        return ['status' => 'sent', 'questionnaire' => $questionnaire];
    }

    private function generateToken(): string
    {
        do {
            $token = Str::random(64);
        } while (Questionnaire::query()->where('token', $token)->exists());

        return $token;
    }
}
