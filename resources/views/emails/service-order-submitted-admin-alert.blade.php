@php
    $order->loadMissing('invoice');
    $isNaira = strtoupper((string) $order->currency) === 'NGN';
    $currencyPrefix = $isNaira ? '&#8358;' : strtoupper((string) $order->currency).' ';
@endphp
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Service Order</title>
</head>
<body style="margin:0; padding:0; background:#f8fafc; font-family:Arial, Helvetica, sans-serif; color:#0f172a;">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:20px 12px;">
    <tr>
        <td align="center">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:680px; background:#ffffff; border:1px solid #e2e8f0; border-radius:14px; overflow:hidden;">
                <tr>
                    <td style="background:#0f172a; color:#ffffff; padding:20px 24px;">
                        <h1 style="margin:0; font-size:20px;">New Service Order Submitted</h1>
                        <p style="margin:8px 0 0; font-size:13px; color:#cbd5e1;">Bellah Options website notification</p>
                    </td>
                </tr>
                <tr>
                    <td style="padding:22px 24px;">
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">
                            <tr>
                                <td style="padding:7px 0; font-size:14px; color:#475569; width:180px;"><strong style="color:#0f172a;">Order ID</strong></td>
                                <td style="padding:7px 0; font-size:14px; color:#0f172a;">{{ $order->uuid }}</td>
                            </tr>
                            <tr>
                                <td style="padding:7px 0; font-size:14px; color:#475569;"><strong style="color:#0f172a;">Service</strong></td>
                                <td style="padding:7px 0; font-size:14px; color:#0f172a;">{{ $order->service_name }}</td>
                            </tr>
                            <tr>
                                <td style="padding:7px 0; font-size:14px; color:#475569;"><strong style="color:#0f172a;">Package</strong></td>
                                <td style="padding:7px 0; font-size:14px; color:#0f172a;">{{ $order->package_name }}</td>
                            </tr>
                            <tr>
                                <td style="padding:7px 0; font-size:14px; color:#475569;"><strong style="color:#0f172a;">Amount</strong></td>
                                <td style="padding:7px 0; font-size:14px; color:#0f172a;">{!! $currencyPrefix !!}{{ number_format((float) $order->amount, 2) }}</td>
                            </tr>
                            <tr>
                                <td style="padding:7px 0; font-size:14px; color:#475569;"><strong style="color:#0f172a;">Invoice Number</strong></td>
                                <td style="padding:7px 0; font-size:14px; color:#0f172a;">{{ $order->invoice?->invoice_number ?? 'Pending' }}</td>
                            </tr>
                            <tr>
                                <td style="padding:7px 0; font-size:14px; color:#475569;"><strong style="color:#0f172a;">Customer Name</strong></td>
                                <td style="padding:7px 0; font-size:14px; color:#0f172a;">{{ $order->full_name }}</td>
                            </tr>
                            <tr>
                                <td style="padding:7px 0; font-size:14px; color:#475569;"><strong style="color:#0f172a;">Customer Email</strong></td>
                                <td style="padding:7px 0; font-size:14px; color:#0f172a;">{{ $order->email }}</td>
                            </tr>
                            <tr>
                                <td style="padding:7px 0; font-size:14px; color:#475569;"><strong style="color:#0f172a;">Phone</strong></td>
                                <td style="padding:7px 0; font-size:14px; color:#0f172a;">{{ $order->phone }}</td>
                            </tr>
                            <tr>
                                <td style="padding:7px 0; font-size:14px; color:#475569;"><strong style="color:#0f172a;">Submitted At</strong></td>
                                <td style="padding:7px 0; font-size:14px; color:#0f172a;">{{ $order->created_at?->toDateTimeString() }}</td>
                            </tr>
                        </table>

                        <div style="margin-top:16px; border:1px solid #e2e8f0; border-radius:10px; padding:12px 14px; background:#f8fafc;">
                            <p style="margin:0 0 6px; font-size:13px; color:#475569;"><strong style="color:#0f172a;">Project Summary</strong></p>
                            <p style="margin:0; font-size:14px; color:#0f172a; line-height:1.6;">{{ $order->project_summary }}</p>
                        </div>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
</table>
</body>
</html>
