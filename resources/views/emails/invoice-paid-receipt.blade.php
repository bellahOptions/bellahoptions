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
    <title>Thank you for Trusting #yourBestOptions - Receipt {{ $invoice->invoice_number }}</title>
</head>
<body style="margin:0; padding:0; background:#f8fafc; font-family:Arial, Helvetica, sans-serif; color:#0f172a;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px; background:#ffffff; border:1px solid #e2e8f0; border-radius:14px; overflow:hidden;">
                    <tr>
                        <td style="background:#fdfdfd; color:#ffffff; padding:20px 24px;">
                            <img src="https://i.postimg.cc/6p6BMwX0/logo-06.png" alt="Bellah Options Logo" height="30px" style="display:flex; justify-content: center; flex-direction: row; max-width:120px; margin:12px auto;">
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:24px;">
                            <p style="margin:0 0 14px; font-size:15px; line-height:1.7; color:#334155;">
                                Hello {{ $invoice->customer_name }}, we have recieved your payment for <b>Invoice#{{ $invoice->invoice_number}}.</b> Your receipt is attached.
                            </p>
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #ccfbf1; border-radius:12px; background:#f0fdfa;">
                                <tr>
                                    <td style="padding:16px 18px; font-size:14px; line-height:1.8; color:#134e4a;">
                                        <strong style="color:#042f2e;">Invoice:</strong> {{ $invoice->invoice_number }}<br>
                                        <strong style="color:#042f2e;">Amount Paid:</strong> {!! $currencyPrefix !!}{{ $formattedAmount }}<br>
                                        <strong style="color:#042f2e;">Payment Reference:</strong> {{ $invoice->payment_reference ?: 'N/A' }}<br>
                                        <strong style="color:#042f2e;">Paid At:</strong> {{ $invoice->paid_at?->format('Y-m-d H:i:s') }}
                                    </td>
                                </tr>
                            </table>
                            <div style="background: #ebebfc; padding: 10px 15px; margin:10px auto; border-radius:10px;">
                                <h2>What to expect</h2>
                                <p style="margin:0 0 14px; font-size:15px; line-height:1.7; color:#334155;">Your Project will begin and will be delivered in batches (during work hours)</p>
                                <p style="margin:0 0 14px; font-size:15px; line-height:1.7; color:#334155;">Delivery batch will depend on the type of service you paid for, via a shared Google drive</p>
                            </div>
                            <p style="margin:18px 0 0; font-size:13px; line-height:1.7; color:#64748b;">
                                Thank you for choosing {{ config('bellah.invoice.company_name') }} - #yourBestOption.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
