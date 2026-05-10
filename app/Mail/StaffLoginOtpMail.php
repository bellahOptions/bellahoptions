<?php

namespace App\Mail;

use App\Mail\Concerns\UsesEmailTemplateLibrary;
use App\Models\User;
use App\Support\StaffOtpChallenge;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class StaffLoginOtpMail extends Mailable
{
    use Queueable, SerializesModels, UsesEmailTemplateLibrary;

    /**
     * Create a new message instance.
     */
    public function __construct(public User $user, public string $otpCode) {}

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        $senderEmail = (string) config('mail.from.address', 'no-reply@bellahoptions.com');
        $senderName = (string) config('mail.from.name', 'Bellah Options');

        return new Envelope(
            subject: $this->resolveTemplateSubject(
                'staff_login_otp',
                'Your Bellah Options staff login OTP',
                $this->templateFields(),
            ),
            from: $this->resolveTemplateFromAddress('staff_login_otp', $senderEmail, $senderName),
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return $this->resolveTemplateContent(
            'staff_login_otp',
            'emails.staff-login-otp',
            $this->templateFields(),
            [
                'user' => $this->user,
                'otpCode' => $this->otpCode,
                'expiresInMinutes' => StaffOtpChallenge::EXPIRES_IN_MINUTES,
            ],
        );
    }

    /**
     * @return array<string, scalar|null>
     */
    private function templateFields(): array
    {
        return [
            'customer_name' => (string) ($this->user->name ?: 'Staff'),
            'customer_email' => (string) $this->user->email,
            'otp_code' => (string) $this->otpCode,
            'otp_expires_in_minutes' => (string) StaffOtpChallenge::EXPIRES_IN_MINUTES,
        ];
    }
}
