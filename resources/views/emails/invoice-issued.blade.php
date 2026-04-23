<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice {{ $invoice->invoice_number }}</title>
</head>
<body style="margin:0; padding:0; background:#f8fafc; font-family:Arial, Helvetica, sans-serif; color:#0f172a;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px; background:#ffffff; border:1px solid #e2e8f0; border-radius:14px; overflow:hidden;">
                    <tr>
                        <td style="padding:20px 24px; background:#0b2b5c; color:#ffffff;">
                            <p style="margin:0; font-size:12px; text-transform:uppercase; letter-spacing:0.08em; color:#bfdbfe;">{{ config('bellah.invoice.company_name') }}</p>
                            <h1 style="margin:8px 0 0; font-size:24px;">Invoice {{ $invoice->invoice_number }}</h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:24px;">
                            <p style="margin:0 0 14px; font-size:15px; line-height:1.7; color:#334155;">
                                Hello {{ $invoice->customer_name }}, your invoice is ready and attached to this email as a PDF file.
                            </p>
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0; border-radius:12px; background:#f8fafc;">
                                <tr>
                                    <td style="padding:16px 18px; font-size:14px; line-height:1.8; color:#334155;">
                                        <strong style="color:#0f172a;">Title:</strong> {{ $invoice->title }}<br>
                                        <strong style="color:#0f172a;">Amount:</strong> {{ number_format((float) $invoice->amount, 2) }} {{ strtoupper($invoice->currency) }}<br>
                                        <strong style="color:#0f172a;">Due Date:</strong> {{ $invoice->due_date?->format('Y-m-d') ?? 'N/A' }}
                                    </td>
                                </tr>
                            </table>
                            <p style="margin:18px 0 0; font-size:13px; line-height:1.7; color:#64748b;">
                                If you need any clarification, reply to this email and our team will assist.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
