<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreContactRequest;
use App\Mail\ContactSubmissionAdminAlertMail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Throwable;

class ContactController extends Controller
{
    public function store(StoreContactRequest $request): RedirectResponse
    {
        $payload = [
            'name' => trim((string) $request->input('name')),
            'email' => strtolower(trim((string) $request->input('email'))),
            'phone' => $this->nullableTrim($request->input('phone')),
            'project_type' => trim((string) $request->input('project_type')),
            'message' => trim((string) $request->input('message')),
            'ip_address' => $request->ip(),
            'user_agent' => Str::limit((string) $request->userAgent(), 1000),
            'submitted_at' => now(),
        ];

        $adminRecipients = config('bellah.contact_admin_emails', []);

        if ($adminRecipients !== []) {
            try {
                Mail::to($adminRecipients)->send(new ContactSubmissionAdminAlertMail($payload));
            } catch (Throwable $exception) {
                Log::warning('Contact form admin alert email could not be sent.', [
                    'email' => $payload['email'],
                    'recipients' => $adminRecipients,
                    'error' => $exception->getMessage(),
                ]);
            }
        }

        $request->session()->forget('contact_human_check');

        return redirect()
            ->route('contact')
            ->with('success', 'Thanks for reaching out. Our team has received your message and will get back to you soon.');
    }

    private function nullableTrim(mixed $value): ?string
    {
        $trimmed = trim((string) $value);

        return $trimmed !== '' ? $trimmed : null;
    }
}
