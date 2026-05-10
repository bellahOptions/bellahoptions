<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Support Reply</title>
</head>
<body style="margin:0; padding:24px 12px; background:#f8fafc; font-family:Arial, Helvetica, sans-serif; color:#1f2937;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px; background:#ffffff; border:1px solid #e5e7eb; border-radius:12px;">
                    <tr>
                        <td style="padding:24px;">
                            <h2 style="margin:0 0 12px; font-size:20px; color:#0f172a;">We replied to your ticket</h2>
                            <p style="margin:0 0 12px; font-size:14px; line-height:1.7;">Our support team responded to your ticket {{ $ticket->ticket_number }}.</p>
                            <p style="margin:0 0 8px; font-size:14px;"><strong>Subject:</strong> {{ $ticket->subject }}</p>
                            <div style="margin:12px 0 16px; padding:12px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px; font-size:14px; line-height:1.7;">
                                {!! nl2br(e(trim(preg_replace('/\s+/u', ' ', strip_tags((string) $message->message))))) !!}
                            </div>
                            <a href="{{ route('dashboard.support') }}" style="display:inline-block; background:#000285; color:#ffffff; text-decoration:none; padding:10px 14px; border-radius:8px; font-size:14px; font-weight:700;">View and Reply</a>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
