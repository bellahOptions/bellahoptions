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
    <title>Invoice #{{ $invoice->invoice_number }}</title>
</head>
<body style="margin:0; padding:0; background:#f7fafc; font-family:Arial, Helvetica, sans-serif; color:#102a43;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px; border:1px solid #d9e2ec; border-radius:14px; overflow:hidden; background:#ffffff;">
                    <tr>
                        <td style="background:#0f4c5c; color:#ffffff; padding:20px 24px;">
                            <p style="margin:0; font-size:12px; text-transform:uppercase; letter-spacing:0.1em; color:#d2f5ff;">Bellah Options</p>
                            <h1 style="margin:8px 0 0; font-size:24px; line-height:1.25;">Invoice #{{ $invoice->invoice_number }}</h1>
                        </td>
                    </tr>

                    <tr>
                        <td style="padding:24px; font-size:15px; line-height:1.75; color:#243b53;">
                            <p style="margin:0 0 12px;">Dear {{ $invoice->customer_name }},</p>
                            <p style="margin:0 0 12px;">We appreciate your trust in our services and we are committed to providing you with the best possible experience.</p>
                            <p style="margin:0 0 16px;">Your invoice number is <strong>#{{ $invoice->invoice_number }}</strong>.</p>

                            <p style="margin:0 0 10px; font-weight:700; color:#102a43;">Please see a list of things that are contained in the invoice:</p>
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #d9e2ec; border-radius:10px; background:#f8fbff;">
                                <tr>
                                    <td style="padding:14px 16px;">
                                        <p style="margin:0 0 4px;"><strong>Product Title:</strong> {{ $invoice->title }}</p>
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
                            <p style="margin:0;">Ensure you've read and understood our Terms of Service before payment: <a href="{{ route('terms.show') }}" style="color:#0f4c5c; font-weight:700;">View Terms of Service</a></p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
