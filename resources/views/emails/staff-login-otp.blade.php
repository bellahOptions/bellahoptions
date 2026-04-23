<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Staff Login OTP</title>
</head>
<body style="margin:0; padding:0; background-color:#f8fafc; font-family:Arial, Helvetica, sans-serif; color:#0f172a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:20px 12px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px; background:#ffffff; border:1px solid #e2e8f0; border-radius:14px; overflow:hidden;">
                    <tr>
                        <td style="background:#0f172a; color:#ffffff; padding:20px 24px;">
                            <h1 style="margin:0; font-size:20px;">Bellah Options Staff OTP</h1>
                            <p style="margin:8px 0 0; font-size:13px; color:#cbd5e1;">
                                Use this one-time code to complete your sign-in
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:24px;">
                            <p style="margin:0 0 12px; font-size:14px; color:#334155;">
                                Hello {{ $user->first_name ?: $user->name }},
                            </p>
                            <p style="margin:0 0 18px; font-size:14px; color:#334155; line-height:1.6;">
                                Your staff login verification code is:
                            </p>
                            <p style="margin:0 0 18px; font-size:30px; font-weight:700; letter-spacing:0.2em; color:#0f172a;">
                                {{ $otpCode }}
                            </p>
                            <p style="margin:0 0 10px; font-size:13px; color:#64748b; line-height:1.6;">
                                This code expires in {{ $expiresInMinutes }} minutes and can only be used once.
                            </p>
                            <p style="margin:0; font-size:13px; color:#64748b; line-height:1.6;">
                                If you did not attempt to sign in, ignore this email and reset your password.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
