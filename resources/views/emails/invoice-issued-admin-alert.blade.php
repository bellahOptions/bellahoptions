@php
    $isNaira = strtoupper((string) $invoice->currency) === 'NGN';
    $currencyPrefix = $isNaira ? '&#8358;' : strtoupper((string) $invoice->currency).' ';
    $formattedAmount = number_format((float) $invoice->amount, 2);
    $actionLabel = strtolower(trim((string) ($action ?? 'issued'))) === 'resent' ? 'resent' : 'issued';
@endphp
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice Admin Alert</title>
</head>
<body style="margin:0; padding:0; background:#f7f9fc; font-family:Arial, sans-serif; color:#1f2937;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px; background:#f7f9fc;">
    <tr>
        <td align="center">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px; background:#ffffff; border:1px solid #e5e7eb; border-radius:8px; overflow:hidden;">
                <tr>
                    <td style="padding:20px 24px; background:#111827; color:#ffffff;">
                        <h1 style="margin:0; font-size:18px;">Invoice Notification (Admin)</h1>
                    </td>
                </tr>
                <tr>
                    <td style="padding:24px;">
                        <p style="margin:0 0 14px;">An invoice was <strong>{{ $actionLabel }}</strong> to a customer.</p>

                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb; border:1px solid #e5e7eb; border-radius:6px;">
                            <tr>
                                <td style="padding:14px 16px;">
                                    <p style="margin:0 0 6px;"><strong>Invoice Number:</strong> {{ $invoice->invoice_number }}</p>
                                    <p style="margin:0 0 6px;"><strong>Customer:</strong> {{ $invoice->customer_name }}</p>
                                    <p style="margin:0 0 6px;"><strong>Email:</strong> {{ $invoice->customer_email }}</p>
                                    <p style="margin:0 0 6px;"><strong>Title:</strong> {{ $invoice->title }}</p>
                                    <p style="margin:0 0 6px;"><strong>Amount:</strong> {!! $currencyPrefix !!}{{ $formattedAmount }}</p>
                                    <p style="margin:0;"><strong>Status:</strong> {{ strtoupper((string) $invoice->status) }}</p>
                                </td>
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
