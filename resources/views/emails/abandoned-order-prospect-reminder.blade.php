<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Complete Your Order</title>
</head>
<body style="margin:0;padding:0;background:#f6f9fc;font-family:Arial,Helvetica,sans-serif;color:#102a43;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px;">
    <tr>
        <td align="center">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;background:#ffffff;border:1px solid #d9e2ec;border-radius:12px;overflow:hidden;">
                <tr>
                    <td style="padding:24px;">
                        <h1 style="margin:0 0 12px;font-size:22px;color:#0f172a;">Your order is almost complete</h1>
                        <p style="margin:0 0 10px;line-height:1.65;">
                            Hello {{ $prospect->full_name ?: 'there' }}, we noticed you started your Bellah Options order
                            but did not finish the process.
                        </p>
                        <p style="margin:0 0 16px;line-height:1.65;">
                            Continue from where you stopped and finalize your request.
                        </p>
                        <p style="margin:0 0 20px;">
                            <a href="{{ $resumeUrl }}" style="display:inline-block;background:#000285;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:700;">
                                Resume Order
                            </a>
                        </p>
                        <p style="margin:0;line-height:1.65;color:#486581;">
                            Service: <strong>{{ $prospect->service_name ?: ucfirst(str_replace('-', ' ', (string) $prospect->service_slug)) }}</strong>
                        </p>
                        @if($prospect->service_package)
                            <p style="margin:6px 0 0;line-height:1.65;color:#486581;">
                                Package: <strong>{{ str_replace('-', ' ', (string) $prospect->service_package) }}</strong>
                            </p>
                        @endif
                    </td>
                </tr>
            </table>
        </td>
    </tr>
</table>
</body>
</html>
