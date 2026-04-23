<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Waitlist Confirmation</title>
</head>
<body style="margin:0; padding:0; background-color:#eef4ff; font-family:Arial, Helvetica, sans-serif; color:#0f172a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:linear-gradient(135deg,#e7f0ff 0%,#f3f7ff 50%,#fff6ef 100%); padding:30px 12px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px; background:#ffffff; border-radius:20px; overflow:hidden; border:1px solid #dbeafe; box-shadow:0 24px 60px rgba(30,64,175,0.14);">
                    <tr>
                        <td style="padding:28px 30px; background:#0f172a;">
                            <p style="margin:0; font-size:12px; letter-spacing:0.1em; text-transform:uppercase; color:#bfdbfe;">Bellah Options</p>
                            <h1 style="margin:12px 0 0; font-size:28px; line-height:1.2; color:#ffffff;">Welcome to the waitlist, {{ $waitlist->name }}.</h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:28px 30px 12px;">
                            <p style="margin:0 0 14px; font-size:16px; line-height:1.7; color:#334155;">
                                You are officially on our early access list. We are building something thoughtful and practical, and we will notify you first when we launch.
                            </p>
                            <p style="margin:0 0 22px; font-size:16px; line-height:1.7; color:#334155;">
                                We saved your details as:
                            </p>
                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:14px; margin-bottom:24px;">
                                <tr>
                                    <td style="padding:16px 18px; font-size:14px; color:#475569;">
                                        <strong style="color:#0f172a;">Name:</strong> {{ $waitlist->name }}<br>
                                        <strong style="color:#0f172a;">Email:</strong> {{ $waitlist->email }}<br>
                                        <strong style="color:#0f172a;">Occupation:</strong> {{ $waitlist->occupation }}
                                    </td>
                                </tr>
                            </table>
                            <a href="{{ config('app.url') }}" style="display:inline-block; background:#1d4ed8; color:#ffffff; text-decoration:none; font-size:14px; font-weight:700; letter-spacing:0.01em; padding:12px 20px; border-radius:10px;">
                                Visit Website
                            </a>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:14px 30px 28px;">
                            <p style="margin:18px 0 0; font-size:13px; line-height:1.7; color:#64748b;">
                                Thanks for believing in what we are building.<br>
                                The Bellah Options Team
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
