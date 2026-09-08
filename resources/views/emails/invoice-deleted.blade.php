<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Regarding Invoice {{ $invoice->invoice_number }} - Bellah Options</title>
</head>
<body style="margin:0; padding:0; background:#f8fafc; font-family:Arial, Helvetica, sans-serif; color:#0f172a;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px; background:#ffffff; border:1px solid #e2e8f0; border-radius:14px; overflow:hidden;">
                    <tr>
                        <td style="background:#fdfdfd; color:#ffffff; padding:20px 24px;">
                            <img src="{{ asset('logo-06.svg') }}" alt="Bellah Options Logo" height="30px" style="display:flex; justify-content: center; flex-direction: row; max-width:120px; margin:12px auto;">
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:24px;">
                            <p style="margin:0 0 14px; font-size:15px; line-height:1.7; color:#334155;">
                                Hello {{ $invoice->customer_name }},
                            </p>
                            <p style="margin:0 0 14px; font-size:15px; line-height:1.7; color:#334155;">
                                We're writing to let you know that <b>Invoice #{{ $invoice->invoice_number }}</b>
                                ({{ $invoice->title }}) was sent to you in error and has now been withdrawn. You are
                                not required to take any action, and no payment is due against this invoice.
                            </p>
                            <p style="margin:0 0 14px; font-size:15px; line-height:1.7; color:#334155;">
                                We sincerely apologize for any confusion this may have caused.
                            </p>
                            @if (!empty($reason))
                                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #fde68a; border-radius:12px; background:#fffbeb; margin:0 0 14px;">
                                    <tr>
                                        <td style="padding:14px 18px; font-size:14px; line-height:1.7; color:#92400e;">
                                            <strong style="color:#78350f;">Note from our team:</strong><br>
                                            {{ $reason }}
                                        </td>
                                    </tr>
                                </table>
                            @endif
                            <p style="margin:18px 0 0; font-size:15px; line-height:1.7; color:#334155;">
                                If you have any questions, simply reply to this email and we'll be happy to help.
                            </p>
                            <p style="margin:18px 0 0; font-size:15px; line-height:1.7; color:#334155;">
                                Sincerely,<br>
                                {{ $staffName }}<br>
                                <span style="color:#64748b;">{{ $staffPosition }}</span><br>
                                {{ config('bellah.invoice.company_name') }}
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
