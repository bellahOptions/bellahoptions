@php
    $isNaira = strtoupper((string) $order->currency) === 'NGN';
    $currencyPrefix = $isNaira ? '&#8358;' : strtoupper((string) $order->currency).' ';
    $formattedAmount = number_format((float) $order->amount, 2);
@endphp
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order Received {{ $order->order_code }}</title>
</head>
<body style="margin:0; padding:0; background:#f7fafc; font-family:Arial, Helvetica, sans-serif; color:#102a43;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px; border:1px solid #d9e2ec; border-radius:14px; overflow:hidden; background:#ffffff;">
                    <tr>
                        <td style="background:#fdfdfd; padding:20px 24px;">
                            <img src="https://i.postimg.cc/6p6BMwX0/logo-06.png" alt="Bellah Options Logo" height="30" style="display:flex; justify-content:center; flex-direction:row; max-width:120px; margin:12px auto;">
                        </td>
                    </tr>

                    <tr>
                        <td style="padding:24px; font-size:15px; line-height:1.75; color:#243b53;">
                            <p style="margin:0 0 12px;">Hello {{ $order->full_name }},</p>
                            <p style="margin:0 0 12px;">Thank you for placing your order with Bellah Options. We have received your request and generated your invoice successfully.</p>
                            <p style="margin:0 0 16px;">Your order code is <strong>{{ $order->order_code }}</strong>.</p>

                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #d9e2ec; border-radius:10px; background:#fafaff;">
                                <tr>
                                    <td style="padding:14px 16px;">
                                        <p style="margin:0 0 6px;"><strong>Service:</strong> {{ $order->service_name }}</p>
                                        <p style="margin:0 0 6px;"><strong>Package:</strong> {{ $order->package_name }}</p>
                                        @if ($order->invoice?->invoice_number)
                                            <p style="margin:0 0 6px;"><strong>Invoice Number:</strong> {{ $order->invoice->invoice_number }}</p>
                                        @endif
                                        <p style="margin:0;"><strong>Amount:</strong> {!! $currencyPrefix !!}{{ $formattedAmount }}</p>
                                    </td>
                                </tr>
                            </table>

                            <p style="margin:16px 0 12px;">Our sales team will review your order and reach out to you shortly with the next steps, guidance, or confirmation where needed.</p>
                            <p style="margin:0 0 12px;">If payment is required immediately, please use the invoice attached in the previous email or return to your order payment page to continue.</p>

                            <div style="background:#fafaff; border:1px solid #d9e2ec; border-radius:10px; padding:14px 16px; margin-top:16px;">
                                <p style="margin:0;"><strong>Need help?</strong> Reply to this email or contact Bellah Options and we will assist you.</p>
                            </div>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
