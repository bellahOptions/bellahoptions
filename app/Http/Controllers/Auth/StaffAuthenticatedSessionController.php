<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Mail\StaffLoginOtpMail;
use App\Models\User;
use App\Support\HumanVerification;
use App\Support\StaffOtpChallenge;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class StaffAuthenticatedSessionController extends Controller
{
    /**
     * Display the staff login view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/StaffLogin', [
            'status' => session('status'),
            ...HumanVerification::createChallenge(request(), 'auth_login_human_check'),
        ]);
    }

    /**
     * Handle an incoming staff authentication request.
     *
     * @throws ValidationException
     */
    public function store(LoginRequest $request, StaffOtpChallenge $staffOtpChallenge): RedirectResponse
    {
        $request->ensureIsNotRateLimited();

        $credentials = $request->only('email', 'password');

        if (! Auth::validate($credentials)) {
            RateLimiter::hit($request->throttleKey());

            throw ValidationException::withMessages([
                'email' => trans('auth.failed'),
            ]);
        }

        RateLimiter::clear($request->throttleKey());

        $email = strtolower(trim((string) $request->string('email')));
        $user = User::query()->whereRaw('LOWER(email) = ?', [$email])->first();

        if (! $user || ! $user->isStaff()) {
            Auth::guard('web')->logout();

            throw ValidationException::withMessages([
                'email' => 'This portal is restricted to Bellah Options staff accounts.',
            ]);
        }

        $request->session()->forget('auth_login_human_check');

        $request->session()->regenerate();
        $otpCode = $staffOtpChallenge->issue($request, $user);

        try {
            Mail::to($user->email)->send(new StaffLoginOtpMail($user, $otpCode));
        } catch (Throwable $exception) {
            $staffOtpChallenge->clear($request);

            Log::warning('Staff OTP email failed from staff login.', [
                'user_id' => $user->id,
                'email' => $user->email,
                'error' => $exception->getMessage(),
            ]);

            throw ValidationException::withMessages([
                'email' => 'We could not send your OTP email right now. Please try again.',
            ]);
        }

        return redirect()->route('staff.otp.create')
            ->with('status', 'OTP sent to your email. Enter it to finish staff sign-in.');
    }
}
