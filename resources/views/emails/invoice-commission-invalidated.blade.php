<?php /** @var \App\Models\InvoiceStaffCommission $commission */ /** @var \App\Models\Invoice $invoice */ ?>
@php
    $isNaira = strtoupper((string) $invoice->currency) === 'NGN';
    $currencyPrefix = $isNaira ? '&#8358;' : strtoupper((string) $invoice->currency).' ';
    $commissionPercent = rtrim(rtrim(number_format((float) $commission->commission_percent, 2), '0'), '.');
@endphp
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Commission Voided</title>
</head>
<body style="margin:0; padding:0; background:#f7f9fc; font-family:Arial, sans-serif; color:#1f2937;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:24px 12px; background:#f7f9fc;">
    <tr>
        <td align="center">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:640px; background:#ffffff; border:1px solid #e5e7eb; border-radius:8px; overflow:hidden;">
                @include('emails.partials.logo-header')
                <tr>
                    <td style="padding:20px 24px; background:#991b1b; color:#ffffff;">
                        <h1 style="margin:0; font-size:18px;">A commission has been voided</h1>
                    </td>
                </tr>
                <tr>
                    <td style="padding:24px;">
                        <p style="margin:0 0 14px;">
                            Hi {{ $commission->user?->name ?: 'there' }}, invoice
                            <strong>#{{ $invoice->invoice_number }}</strong> ({{ $invoice->title }}) has been deleted,
                            so the {{ $commissionPercent }}% commission you earned on it is no longer valid and will
                            not be paid out.
                        </p>

                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fef2f2; border:1px solid #fecaca; border-radius:6px; margin-bottom:16px;">
                            <tr>
                                <td style="padding:16px;">
                                    <p style="margin:0; font-size:13px; color:#991b1b; text-transform:uppercase; letter-spacing:0.04em;">Voided Commission</p>
                                    <p style="margin:4px 0 0; font-size:26px; font-weight:700; color:#b91c1c; text-decoration:line-through;">
                                        {!! $currencyPrefix !!}{{ number_format((float) $commission->commission_amount, 2) }}
                                    </p>
                                </td>
                            </tr>
                        </table>

                        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb; border:1px solid #e5e7eb; border-radius:6px;">
                            <tr>
                                <td style="padding:14px 16px;">
                                    <p style="margin:0 0 6px;"><strong>Invoice Number:</strong> {{ $invoice->invoice_number }}</p>
                                    <p style="margin:0;"><strong>Title:</strong> {{ $invoice->title }}</p>
                                </td>
                            </tr>
                        </table>

                        <p style="margin:16px 0 0; font-size:13px; color:#6b7280;">
                            If you believe this was a mistake, reach out to a super admin for details.
                        </p>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
</table>
</body>
</html>
