@php
    $isNaira = strtoupper((string) $invoice->currency) === 'NGN';
    $currencyPrefix = $isNaira ? '&#8358;' : strtoupper((string) $invoice->currency).' ';
    $formattedAmount = number_format((float) $invoice->amount, 2);

    // The admin-managed fallback is the source of truth here too. This template
    // used to read only the environment config (with a hard-coded bank as its
    // fallback), so an account changed on the settings screen never reached a
    // reminder email. The fallback is a list, so every account is shown.
    $transfer = app(\App\Services\PaymentReadinessService::class)->transferPayload();
    $transferAccounts = $transfer['available'] ? $transfer['accounts'] : [];
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
                        @include('emails.partials.logo-mark')
                    </tr>

                    <tr>
                        <td style="padding:24px; font-size:15px; line-height:1.75; color:#243b53;">
                            <p style="margin:0 0 12px;">Hello {{ $invoice->customer_name }},</p>
                            <p style="margin:0 0 12px;">
                                This is a reminder that your invoice <strong>#{{ $invoice->invoice_number }}</strong> is still pending payment.
                            </p>

                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #0b07ed; border-radius:10px; background:#f5f5fc;">
                                <tr>
                                    <td style="padding:14px 16px;">
                                        <p style="margin:0 0 4px;"><strong>Invoice Title:</strong> {{ $invoice->title }}</p>
                                        <p style="margin:0 0 4px;"><strong>Amount Due:</strong> {!! $currencyPrefix !!}{{ $formattedAmount }}</p>
                                        <p style="margin:0;"><strong>Due Date:</strong> {{ $invoice->due_date?->format('Y-m-d') ?? 'N/A' }}</p>
                                    </td>
                                </tr>
                            </table>

                            @if ($transferAccounts !== [])
                                <p style="margin:16px 0 8px;"><strong>Payment method:</strong> Bank Transfer</p>

                                @foreach ($transferAccounts as $account)
                                    @if (! $loop->first)
                                        <p style="margin:12px 0 0; font-size:13px; color:#627d98;">Or transfer to:</p>
                                    @endif
                                    <p style="margin:0 0 4px;"><strong>Account Number:</strong> {{ $account['account_number'] }}</p>
                                    <p style="margin:0 0 4px;"><strong>Account Name:</strong> {{ $account['account_name'] }}</p>
                                    <p style="margin:0 0 14px;"><strong>Bank Name:</strong> {{ $account['bank_name'] }}</p>
                                @endforeach

                                @if ($transfer['reference_hint'] !== '')
                                    <p style="margin:0 0 8px; font-size:13px; color:#627d98;">{{ $transfer['reference_hint'] }}</p>
                                @endif
                            @else
                                <p style="margin:16px 0 14px;">
                                    Payment method: <strong>Bank Transfer</strong>. Reply to this email and our
                                    team will send the current bank transfer details.
                                </p>
                            @endif

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
