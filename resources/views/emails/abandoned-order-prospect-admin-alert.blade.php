<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Abandoned Order Prospect</title>
</head>
<body style="margin:0;padding:0;background:#f6f9fc;font-family:Arial,Helvetica,sans-serif;color:#102a43;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px;">
    <tr>
        <td align="center">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:#ffffff;border:1px solid #d9e2ec;border-radius:12px;overflow:hidden;">
                <tr>
                    <td style="padding:24px;">
                        <h1 style="margin:0 0 12px;font-size:20px;color:#0f172a;">Order process abandoned</h1>
                        <p style="margin:0 0 12px;line-height:1.65;">
                            A guest prospect abandoned the order process after 24 hours of inactivity.
                        </p>
                        <p style="margin:0 0 6px;line-height:1.6;"><strong>Name:</strong> {{ $prospect->full_name ?: 'N/A' }}</p>
                        <p style="margin:0 0 6px;line-height:1.6;"><strong>Email:</strong> {{ $prospect->email ?: 'N/A' }}</p>
                        <p style="margin:0 0 6px;line-height:1.6;"><strong>Phone:</strong> {{ $prospect->phone ?: 'N/A' }}</p>
                        <p style="margin:0 0 6px;line-height:1.6;"><strong>Business:</strong> {{ $prospect->business_name ?: 'N/A' }}</p>
                        <p style="margin:0 0 6px;line-height:1.6;"><strong>Service:</strong> {{ $prospect->service_name ?: ucfirst(str_replace('-', ' ', (string) $prospect->service_slug)) }}</p>
                        <p style="margin:0 0 16px;line-height:1.6;"><strong>Package:</strong> {{ $prospect->service_package ? str_replace('-', ' ', (string) $prospect->service_package) : 'N/A' }}</p>
                        <p style="margin:0;">
                            <a href="{{ $resumeUrl }}" style="display:inline-block;background:#000285;color:#ffffff;text-decoration:none;padding:10px 16px;border-radius:8px;font-weight:700;">
                                Resume Link
                            </a>
                        </p>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
</table>
</body>
</html>
