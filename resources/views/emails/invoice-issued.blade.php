@php
    $isNaira = strtoupper((string) $invoice->currency) === 'NGN';
    $currencyPrefix = $isNaira ? '&#8358;' : strtoupper((string) $invoice->currency).' ';
    $formattedAmount = number_format((float) $invoice->amount, 2);
    $orderCode = $invoice->serviceOrder?->order_code;
@endphp
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice #{{ $invoice->invoice_number }}</title>
</head>
<body style="margin:0; padding:0; background:#f7fafc; font-family:Arial, Helvetica, sans-serif; color:#102a43;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px; border:1px solid #d9e2ec; border-radius:14px; overflow:hidden; background:#ffffff;">
                    <tr>
                        <td style="background:#fdfdfd; color:#ffffff; padding:20px 24px;">
                            <img src="https://i.postimg.cc/6p6BMwX0/logo-06.png" alt="Bellah Options Logo" height="30px" style="display:flex; justify-content: center; flex-direction: row; max-width:120px; margin:12px auto;">
                        </td>
                    </tr>

                    <tr>
                        <td style="padding:24px; font-size:15px; line-height:1.75; color:#243b53;">
                            <p style="margin:0 0 12px;">Dear {{ $invoice->customer_name }},</p>
                            <p style="margin:0 0 12px;">We appreciate your trust in our services and we are committed to providing you with the best possible experience.</p>
                            <p style="margin:0 0 16px;">Your invoice number is <strong>#{{ $invoice->invoice_number }}</strong>.</p>
                            @if ($orderCode)
                                <p style="margin:0 0 16px;">Your order code is <strong>{{ $orderCode }}</strong>.</p>
                            @endif

                            <p style="margin:0 0 10px; font-weight:700; color:#102a43;">Please see a list of things that are contained in the invoice:</p>
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #d9e2ec; border-radius:10px; background:#fafaff;">
                                <tr>
                                    <td style="padding:14px 16px;">
                                        @if ($orderCode)
                                            <p style="margin:0 0 4px;"><strong>Order Code:</strong> {{ $orderCode }}</p>
                                        @endif
                                        <p style="margin:0 0 4px;"><strong>Service Title:</strong> {{ $invoice->title }}</p>
                                        <p style="margin:0;">- {!! $currencyPrefix !!}{{ $formattedAmount }}</p>
                                    </td>
                                </tr>
                            </table>

                            <p style="margin:16px 0 8px; color:#486581;">------------------------------------------------------</p>
                            <p style="margin:0 0 8px;"><strong>Total:</strong> {!! $currencyPrefix !!}{{ $formattedAmount }}</p>
                            <p style="margin:0 0 14px;"><strong>Payment Terms:</strong> 100%</p>

                            <p style="margin:0 0 4px;"><strong>Payment method:</strong></p>
                            <p style="margin:0 0 10px; font-weight:700; color:#0f4c5c;">BANK TRANSFER</p>
                            <p style="margin:0 0 8px;">Please make payment to the account below:</p>

                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #d9e2ec; border-radius:10px; background:#ffffff;">
                                <tr>
                                    <td style="padding:14px 16px;">
                                        <p style="margin:0 0 4px;"><strong>Account Number:</strong> 4210082961</p>
                                        <p style="margin:0 0 4px;"><strong>Account Name:</strong> Bellah Options</p>
                                        <p style="margin:0;"><strong>Bank Name:</strong> Fidelity Bank</p>
                                    </td>
                                </tr>
                            </table>

                            <p style="margin:16px 0 8px;">Kindly reply with a receipt after payment.</p>
                            <p style="margin:0 0 8px;">A detailed version of the invoice is also attached to the mail.</p>
                            <div style="background:#fafaff ; border:1px solid #d9e2ec; border-radius:10px; padding:14px 16px; margin-top:16px;">
                            <p style="margin:0;">Ensure you've read and understood our <a href="{{ route('terms.show') }}" style="color:#03004f; font-weight:700; text-decoration: none;">Terms of Service before payment</a></p>
                            </div>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
