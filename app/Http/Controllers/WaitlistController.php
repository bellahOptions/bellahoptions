<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreWaitlistRequest;
use App\Mail\WaitlistWelcomeMail;
use App\Models\Waitlist;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Throwable;

class WaitlistController extends Controller
{
    public function store(StoreWaitlistRequest $request): RedirectResponse
    {
        $waitlist = Waitlist::create($request->validated());

        try {
            Mail::to($waitlist->email)->send(new WaitlistWelcomeMail($waitlist));
        } catch (Throwable $exception) {
            Log::warning('Waitlist signup email could not be sent.', [
                'waitlist_id' => $waitlist->id,
                'email' => $waitlist->email,
                'error' => $exception->getMessage(),
            ]);
        }

        return back()->with('success', 'You are on the list! Check your inbox for a welcome email.');
    }
}
