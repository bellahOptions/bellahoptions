<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Service Brief</title>
</head>
<body style="margin:0; padding:0; background:#f8fafc; font-family:Arial, Helvetica, sans-serif; color:#0f172a;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px; background:#ffffff; border:1px solid #e2e8f0; border-radius:14px; overflow:hidden;">
                    <tr>
                        <td style="padding:24px;">
                            <p style="margin:0 0 14px; font-size:16px; line-height:1.7; color:#334155;">
                                A new service brief was submitted.
                            </p>
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse; margin-bottom:16px;">
                                <tr><td style="padding:6px 0; font-size:13px; color:#64748b; width:40%;">Reference</td><td style="padding:6px 0; font-size:13px; color:#0f172a;">{{ $brief->reference_number }}</td></tr>
                                <tr><td style="padding:6px 0; font-size:13px; color:#64748b;">Service</td><td style="padding:6px 0; font-size:13px; color:#0f172a;">{{ config("service_briefs.service_meta.{$brief->service_slug}.name", $brief->service_slug) }}</td></tr>
                                <tr><td style="padding:6px 0; font-size:13px; color:#64748b;">Client</td><td style="padding:6px 0; font-size:13px; color:#0f172a;">{{ $brief->customer_name }} ({{ $brief->customer_email }})</td></tr>
                                @if ($brief->is_rush)
                                    <tr><td style="padding:6px 0; font-size:13px; color:#b91c1c;">Priority</td><td style="padding:6px 0; font-size:13px; color:#b91c1c; font-weight:700;">RUSH — within 48 hours</td></tr>
                                @endif
                                @if ($brief->nda_required)
                                    <tr><td style="padding:6px 0; font-size:13px; color:#64748b;">NDA</td><td style="padding:6px 0; font-size:13px; color:#0f172a;">Requested</td></tr>
                                @endif
                            </table>
                            <a href="{{ route('admin.service-briefs.show', $brief->uuid) }}" style="display:inline-block; background:#050a80; color:#ffffff; text-decoration:none; padding:12px 20px; border-radius:8px; font-size:14px; font-weight:700;">
                                Review Brief
                            </a>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
