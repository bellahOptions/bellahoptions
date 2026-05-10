@php
    $isNaira = strtoupper((string) $order->currency) === 'NGN';
    $currencyPrefix = $isNaira ? '&#8358;' : strtoupper((string) $order->currency).' ';
    $baseAmount = number_format((float) ($order->base_amount ?? 0), 2);
    $discountAmount = number_format((float) ($order->discount_amount ?? 0), 2);
    $totalAmount = number_format((float) $order->amount, 2);
@endphp
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Thank You For Your Purchase</title>
</head>
<body style="margin:0; padding:24px 12px; background:#f8fafc; font-family:Arial, Helvetica, sans-serif; color:#1f2937;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px; background:#ffffff; border:1px solid #e5e7eb; border-radius:12px;">
                    <tr>
                        <td style="padding:24px;">
                            <h2 style="margin:0 0 12px; font-size:22px; color:#0f172a;">Thank you for your purchase</h2>
                            <p style="margin:0 0 12px; font-size:14px; line-height:1.7;">Hi {{ $order->full_name ?: 'there' }}, your payment has been confirmed and your project is now in our production queue.</p>

                            <div style="margin:12px 0 16px; padding:14px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px;">
                                <p style="margin:0 0 6px; font-size:14px;"><strong>Order Code:</strong> {{ $order->order_code }}</p>
                                <p style="margin:0 0 6px; font-size:14px;"><strong>Service:</strong> {{ $order->service_name }}</p>
                                <p style="margin:0 0 6px; font-size:14px;"><strong>Package:</strong> {{ $order->package_name }}</p>
                                <p style="margin:0 0 6px; font-size:14px;"><strong>Estimated Delivery Timeline:</strong> {{ $estimatedTimeline }}</p>
                                <p style="margin:0; font-size:14px;"><strong>Paid At:</strong> {{ $order->paid_at?->format('Y-m-d H:i:s') ?: 'N/A' }}</p>
                            </div>

                            <h3 style="margin:0 0 8px; font-size:16px; color:#0f172a;">Payment Breakdown</h3>
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e2e8f0; border-radius:10px; overflow:hidden;">
                                <tr>
                                    <td style="padding:10px 14px; font-size:14px; border-bottom:1px solid #e2e8f0;">Base Amount</td>
                                    <td style="padding:10px 14px; font-size:14px; border-bottom:1px solid #e2e8f0; text-align:right;">{!! $currencyPrefix !!}{{ $baseAmount }}</td>
                                </tr>
                                <tr>
                                    <td style="padding:10px 14px; font-size:14px; border-bottom:1px solid #e2e8f0;">Discount</td>
                                    <td style="padding:10px 14px; font-size:14px; border-bottom:1px solid #e2e8f0; text-align:right;">{!! $currencyPrefix !!}{{ $discountAmount }}</td>
                                </tr>
                                <tr>
                                    <td style="padding:10px 14px; font-size:14px; font-weight:700;">Total Paid</td>
                                    <td style="padding:10px 14px; font-size:14px; font-weight:700; text-align:right;">{!! $currencyPrefix !!}{{ $totalAmount }}</td>
                                </tr>
                            </table>

                            <p style="margin:16px 0 0; font-size:13px; line-height:1.7; color:#64748b;">
                                This email is a project kickoff confirmation and is separate from your payment receipt.
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
