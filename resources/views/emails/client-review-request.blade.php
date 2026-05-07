<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Share Your Bellah Options Review</title>
</head>
<body style="margin:0; padding:0; background:#f8fafc; font-family:Arial, Helvetica, sans-serif; color:#0f172a;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px; background:#ffffff; border:1px solid #e2e8f0; border-radius:14px; overflow:hidden;">
                    <tr>
                        <td style="background:#fdfdfd; padding:22px 24px; text-align:center;">
                            <img src="https://i.postimg.cc/6p6BMwX0/logo-06.png" alt="Bellah Options" height="32" style="display:inline-block; max-width:120px;">
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:24px;">
                            <p style="margin:0 0 14px; font-size:16px; line-height:1.7; color:#334155;">
                                Hello {{ $review->reviewer_name ?: 'there' }},
                            </p>
                            <p style="margin:0 0 14px; font-size:15px; line-height:1.7; color:#334155;">
                                Thank you for choosing Bellah Options. We would love to hear about your experience.
                            </p>
                            <p style="margin:0 0 20px; font-size:15px; line-height:1.7; color:#334155;">
                                Your feedback helps us improve and serve other clients better.
                            </p>

                            <a href="{{ $reviewLink }}" style="display:inline-block; background:#000285; color:#ffffff; text-decoration:none; padding:12px 20px; border-radius:8px; font-size:14px; font-weight:700;">
                                Leave a Review
                            </a>

                            <p style="margin:20px 0 0; font-size:12px; line-height:1.7; color:#64748b;">
                                If the button does not work, copy this link into your browser:<br>
                                <a href="{{ $reviewLink }}" style="color:#1d4ed8; word-break:break-all;">{{ $reviewLink }}</a>
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
