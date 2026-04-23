@php
    $isNaira = strtoupper((string) $invoice->currency) === 'NGN';
    $currencyPrefix = $isNaira ? '&#8358;' : strtoupper((string) $invoice->currency).' ';
    $formattedAmount = number_format((float) $invoice->amount, 2);
@endphp
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice Reminder {{ $invoice->invoice_number }}</title>
</head>
<body style="margin:0; padding:0; background:#f7fafc; font-family:Arial, Helvetica, sans-serif; color:#102a43;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px; border:1px solid #d9e2ec; border-radius:14px; overflow:hidden; background:#ffffff;">
                    <tr>
                        <td style="background:#7c2d12; color:#ffffff; padding:20px 24px;">
                            <p style="margin:0; font-size:12px; text-transform:uppercase; letter-spacing:0.1em; color:#fed7aa;">Bellah Options</p>
                            <h1 style="margin:8px 0 0; font-size:24px; line-height:1.25;">Payment Reminder: #{{ $invoice->invoice_number }}</h1>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding:24px; font-size:15px; line-height:1.75; color:#243b53;">
                            <p style="margin:0 0 12px;">Hello {{ $invoice->customer_name }},</p>
                            <p style="margin:0 0 12px;">
                                This is a reminder that your invoice <strong>#{{ $invoice->invoice_number }}</strong> is still pending payment.
                            </p>

                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #fbd38d; border-radius:10px; background:#fffaf0;">
                                <tr>
                                    <td style="padding:14px 16px;">
                                        <p style="margin:0 0 4px;"><strong>Invoice Title:</strong> {{ $invoice->title }}</p>
                                        <p style="margin:0 0 4px;"><strong>Amount Due:</strong> {!! $currencyPrefix !!}{{ $formattedAmount }}</p>
                                        <p style="margin:0;"><strong>Due Date:</strong> {{ $invoice->due_date?->format('Y-m-d') ?? 'N/A' }}</p>
                                    </td>
                                </tr>
                            </table>

                            <p style="margin:16px 0 8px;"><strong>Payment method:</strong> Bank Transfer</p>
                            <p style="margin:0 0 4px;"><strong>Account Number:</strong> 4210082961</p>
                            <p style="margin:0 0 4px;"><strong>Account Name:</strong> Bellah Options</p>
                            <p style="margin:0 0 14px;"><strong>Bank Name:</strong> Fidelity Bank</p>

                            <p style="margin:0 0 8px;">Please reply with your receipt once payment is completed.</p>
                            <p style="margin:0;">The invoice PDF is attached for easy reference.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
