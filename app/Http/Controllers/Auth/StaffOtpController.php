<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Mail\StaffLoginOtpMail;
use App\Models\User;
use App\Support\StaffOtpChallenge;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class StaffOtpController extends Controller
{
    public function create(Request $request, StaffOtpChallenge $staffOtpChallenge): Response|RedirectResponse
    {
        $challenge = $staffOtpChallenge->get($request);

        if (! $challenge || $staffOtpChallenge->isExpired($challenge)) {
            $staffOtpChallenge->clear($request);

            return redirect()->route('staff.login')
                ->with('error', 'Your OTP session expired. Please sign in again.');
        }

        return Inertia::render('Auth/StaffOtpChallenge', [
            'maskedEmail' => $this->maskEmail((string) $challenge['email']),
            'expiresInMinutes' => StaffOtpChallenge::EXPIRES_IN_MINUTES,
            'status' => session('status'),
        ]);
    }

    /**
     * @throws ValidationException
     */
    public function store(Request $request, StaffOtpChallenge $staffOtpChallenge): RedirectResponse
    {
        $validated = $request->validate([
            'otp' => ['required', 'digits:6'],
        ]);

        $challenge = $staffOtpChallenge->get($request);

        if (! $challenge || $staffOtpChallenge->isExpired($challenge)) {
            $staffOtpChallenge->clear($request);

            return redirect()->route('staff.login')
                ->with('error', 'Your OTP session expired. Please sign in again.');
        }

        if (! $staffOtpChallenge->verifyCode($challenge, (string) $validated['otp'])) {
            $attempts = $staffOtpChallenge->recordFailedAttempt($request);

            if ($attempts >= StaffOtpChallenge::MAX_VERIFY_ATTEMPTS) {
                $staffOtpChallenge->clear($request);

                return redirect()->route('staff.login')
                    ->with('error', 'Too many invalid OTP attempts. Please sign in again.');
            }

            throw ValidationException::withMessages([
                'otp' => 'Invalid OTP code.',
            ]);
        }

        $user = User::query()->find((int) $challenge['user_id']);

        if (! $user || ! $user->isStaff()) {
            $staffOtpChallenge->clear($request);

            return redirect()->route('staff.login')
                ->with('error', 'This portal is restricted to Bellah Options staff accounts.');
        }

        $staffOtpChallenge->clear($request);
        Auth::login($user, false);
        $request->session()->regenerate();

        return redirect()->intended(route('dashboard', absolute: false));
    }

    public function resend(Request $request, StaffOtpChallenge $staffOtpChallenge): RedirectResponse
    {
        $challenge = $staffOtpChallenge->get($request);

        if (! $challenge || $staffOtpChallenge->isExpired($challenge)) {
            $staffOtpChallenge->clear($request);

            return redirect()->route('staff.login')
                ->with('error', 'Your OTP session expired. Please sign in again.');
        }

        $user = User::query()->find((int) $challenge['user_id']);

        if (! $user || ! $user->isStaff()) {
            $staffOtpChallenge->clear($request);

            return redirect()->route('staff.login')
                ->with('error', 'This portal is restricted to Bellah Options staff accounts.');
        }

        $resendCooldown = $staffOtpChallenge->resendAvailableIn($request);

        if ($resendCooldown > 0) {
            return back()->withErrors([
                'otp' => "Please wait {$resendCooldown} seconds before requesting another OTP.",
            ]);
        }

        $rateKey = 'staff-otp-resend:'.strtolower(trim((string) $challenge['email'])).'|'.$request->ip();

        if (RateLimiter::tooManyAttempts($rateKey, 5)) {
            $seconds = RateLimiter::availableIn($rateKey);

            return back()->withErrors([
                'otp' => "Too many resend attempts. Try again in {$seconds} seconds.",
            ]);
        }

        RateLimiter::hit($rateKey, 60);

        $otpCode = $staffOtpChallenge->refresh($request);

        if (! $otpCode) {
            return redirect()->route('staff.login')
                ->with('error', 'OTP setup failed. Please sign in again.');
        }

        try {
            Mail::to($user->email)->send(new StaffLoginOtpMail($user, $otpCode));
        } catch (Throwable $exception) {
            Log::warning('Staff OTP resend email failed.', [
                'user_id' => $user->id,
                'email' => $user->email,
                'error' => $exception->getMessage(),
            ]);

            return back()->withErrors([
                'otp' => 'Unable to resend OTP email right now. Please try again shortly.',
            ]);
        }

        return back()->with('status', 'A new OTP code has been sent to your email.');
    }

    private function maskEmail(string $email): string
    {
        $parts = explode('@', $email);

        if (count($parts) !== 2) {
            return $email;
        }

        $local = $parts[0];
        $domain = $parts[1];

        if (strlen($local) <= 2) {
            return str_repeat('*', strlen($local)).'@'.$domain;
        }

        return substr($local, 0, 1).str_repeat('*', max(strlen($local) - 2, 1)).substr($local, -1).'@'.$domain;
    }
}
