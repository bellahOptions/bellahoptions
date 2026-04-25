<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreWaitlistRequest;
use App\Mail\WaitlistAdminAlertMail;
use App\Mail\WaitlistWelcomeMail;
use App\Models\Waitlist;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class WaitlistController extends Controller
{
    public function create(Request $request): Response
    {
        return Inertia::render('ComingSoon', [
            'occupations' => config('occupations.list', []),
            ...$this->createHumanChallenge($request),
        ]);
    }

    public function store(StoreWaitlistRequest $request): RedirectResponse
    {
        $payload = $request->safe()->only(['name', 'email', 'occupation']);
        $payload['ip_address'] = $request->ip();
        $payload['user_agent'] = Str::limit((string) $request->userAgent(), 1000);
        $payload['submitted_at'] = now();

        $waitlist = Waitlist::create($payload);

        try {
            Mail::to($waitlist->email)->send(new WaitlistWelcomeMail($waitlist));
        } catch (Throwable $exception) {
            Log::warning('Waitlist signup email could not be sent.', [
                'waitlist_id' => $waitlist->id,
                'email' => $waitlist->email,
                'error' => $exception->getMessage(),
            ]);
        }

        $adminRecipients = config('bellah.waitlist_admin_emails', []);

        if ($adminRecipients !== []) {
            try {
                Mail::to($adminRecipients)->send(new WaitlistAdminAlertMail($waitlist));
            } catch (Throwable $exception) {
                Log::warning('Waitlist admin alert email could not be sent.', [
                    'waitlist_id' => $waitlist->id,
                    'recipients' => $adminRecipients,
                    'error' => $exception->getMessage(),
                ]);
            }
        }

        $request->session()->forget('waitlist_human_check');

        return back()->with('success', 'Thanks for joining the waitlist! We will notify you when we launch.')->withInput();
    }

    /**
     * @return array{humanCheckQuestion: string, humanCheckNonce: string, formRenderedAt: int}
     */
    private function createHumanChallenge(Request $request): array
    {
        $left = random_int(2, 11);
        $right = random_int(2, 11);
        $issuedAt = now()->timestamp;
        $nonce = Str::random(32);

        $request->session()->put('waitlist_human_check', [
            'answer' => $left + $right,
            'issued_at' => $issuedAt,
            'nonce' => $nonce,
        ]);

        return [
            'humanCheckQuestion' => "What is {$left} + {$right}?",
            'humanCheckNonce' => $nonce,
            'formRenderedAt' => $issuedAt,
        ];
    }
}
