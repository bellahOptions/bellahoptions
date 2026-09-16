<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>We've Received Your Brief</title>
</head>
<body style="margin:0; padding:0; background:#f8fafc; font-family:Arial, Helvetica, sans-serif; color:#0f172a;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px; background:#ffffff; border:1px solid #e2e8f0; border-radius:14px; overflow:hidden;">
                    <tr>
                        <td style="background:#fdfdfd; padding:22px 24px; text-align:center;">
                            <img src="{{ asset('logo-06.svg') }}" alt="Bellah Options" height="32" style="display:inline-block; max-width:120px;">
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:24px;">
                            <p style="margin:0 0 14px; font-size:16px; line-height:1.7; color:#334155;">
                                Hello {{ $brief->customer_name ?: 'there' }},
                            </p>
                            <p style="margin:0 0 6px; font-size:15px; line-height:1.7; color:#334155;">
                                Thank you for your brief. Your reference number is:
                            </p>
                            <p style="margin:0 0 14px; font-size:18px; font-weight:700; color:#050a80;">
                                {{ $brief->reference_number }}
                            </p>
                            <p style="margin:0 0 20px; font-size:15px; line-height:1.7; color:#334155;">
                                We'll review it and get back to you with a quote within
                                {{ $brief->response_due_at ? $brief->response_due_at->diffInHours(now()) . ' hours' : '24-48 working hours' }}.
                            </p>

                            <p style="margin:0 0 8px; font-size:13px; font-weight:700; color:#334155; text-transform:uppercase; letter-spacing:.04em;">
                                A copy of what you submitted
                            </p>
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse; margin-bottom:8px;">
                                @foreach ($answers as $answer)
                                    <tr>
                                        <td style="padding:8px 0; border-bottom:1px solid #f1f5f9; font-size:13px; color:#64748b; vertical-align:top; width:45%;">{{ $answer['label'] }}</td>
                                        <td style="padding:8px 0; border-bottom:1px solid #f1f5f9; font-size:13px; color:#0f172a; vertical-align:top;">{{ $answer['value'] }}</td>
                                    </tr>
                                @endforeach
                            </table>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
