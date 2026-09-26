@extends('emails.layouts.base')

@section('title', 'Your staff sign-in code')

@section('preheader', 'Your one-time staff sign-in code expires in '.$expiresInMinutes.' minutes.')

@section('brand-tagline', 'Staff access')

@section('hero')
    <p style="margin:0; font-size:12px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:#9fb0e8;">
        Security check
    </p>
    <h1 class="jv-h1" style="margin:8px 0 0; font-size:24px; line-height:1.3; font-weight:700; color:#ffffff;">
        Your sign-in code
    </h1>
    <p style="margin:10px 0 0; font-size:14px; line-height:1.6; color:#c7d2f5;">
        Enter this code to finish signing in. It can only be used once.
    </p>
@endsection

@section('content')
    <p style="margin:0 0 18px; font-size:15px;">
        Hello {{ $user->first_name ?: $user->name }},
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"
           style="background:#f5f7ff; border:1px solid #dbe3ff; border-radius:12px;">
        <tr>
            <td align="center" style="padding:24px 20px;">
                <p style="margin:0 0 10px; font-size:12px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:#64748b;">
                    One-time code
                </p>
                <p style="margin:0; font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace; font-size:34px; font-weight:700; letter-spacing:0.22em; color:#050a49; line-height:1.1;">
                    {{ $otpCode }}
                </p>
                <p style="margin:12px 0 0; font-size:13px; color:#64748b;">
                    Expires in {{ $expiresInMinutes }} {{ \Illuminate\Support\Str::plural('minute', (int) $expiresInMinutes) }}
                </p>
            </td>
        </tr>
    </table>

    <div style="height:16px; line-height:16px;">&nbsp;</div>

    @include('emails.partials.panel', [
        'tone' => 'warning',
        'title' => 'Did not request this?',
        'content' => '<p style="margin:0; font-size:14px;">Ignore this email, then sign in and change your password. Do not forward or share this code with anyone — our team will never ask you for it.</p>',
    ])
@endsection

@section('footer-note')
    This is an automated security message from {{ config('bellah.invoice.company_name', 'Bellah Options') }} staff access.
@endsection
