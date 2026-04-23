<?php

namespace App\Mail;

use App\Models\User;
use App\Support\StaffOtpChallenge;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class StaffLoginOtpMail extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * Create a new message instance.
     */
    public function __construct(public User $user, public string $otpCode) {}

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Your Bellah Options staff login OTP',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.staff-login-otp',
            with: [
                'user' => $this->user,
                'otpCode' => $this->otpCode,
                'expiresInMinutes' => StaffOtpChallenge::EXPIRES_IN_MINUTES,
            ],
        );
    }
}
