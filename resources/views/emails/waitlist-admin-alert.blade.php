<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Waitlist Signup</title>
</head>
<body style="margin:0; padding:0; background-color:#f8fafc; font-family:Arial, Helvetica, sans-serif; color:#0f172a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:20px 12px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px; background:#ffffff; border:1px solid #e2e8f0; border-radius:14px; overflow:hidden;">
                    <tr>
                        <td style="background:#0f172a; color:#ffffff; padding:20px 24px;">
                            <h1 style="margin:0; font-size:20px;">New Waitlist Signup</h1>
                            <p style="margin:8px 0 0; font-size:13px; color:#cbd5e1;">Bellah Options website notification</p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:22px 24px;">
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
                                <tr>
                                    <td style="padding:8px 0; font-size:14px; color:#475569; width:170px;"><strong style="color:#0f172a;">Name</strong></td>
                                    <td style="padding:8px 0; font-size:14px; color:#0f172a;">{{ $waitlist->name }}</td>
                                </tr>
                                <tr>
                                    <td style="padding:8px 0; font-size:14px; color:#475569;"><strong style="color:#0f172a;">Email</strong></td>
                                    <td style="padding:8px 0; font-size:14px; color:#0f172a;">{{ $waitlist->email }}</td>
                                </tr>
                                <tr>
                                    <td style="padding:8px 0; font-size:14px; color:#475569;"><strong style="color:#0f172a;">Occupation</strong></td>
                                    <td style="padding:8px 0; font-size:14px; color:#0f172a;">{{ $waitlist->occupation }}</td>
                                </tr>
                                <tr>
                                    <td style="padding:8px 0; font-size:14px; color:#475569;"><strong style="color:#0f172a;">Submitted At</strong></td>
                                    <td style="padding:8px 0; font-size:14px; color:#0f172a;">{{ optional($waitlist->submitted_at)->toDateTimeString() }}</td>
                                </tr>
                                <tr>
                                    <td style="padding:8px 0; font-size:14px; color:#475569;"><strong style="color:#0f172a;">IP Address</strong></td>
                                    <td style="padding:8px 0; font-size:14px; color:#0f172a;">{{ $waitlist->ip_address ?: 'N/A' }}</td>
                                </tr>
                                <tr>
                                    <td style="padding:8px 0; font-size:14px; color:#475569;"><strong style="color:#0f172a;">User Agent</strong></td>
                                    <td style="padding:8px 0; font-size:14px; color:#0f172a;">{{ $waitlist->user_agent ?: 'N/A' }}</td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
