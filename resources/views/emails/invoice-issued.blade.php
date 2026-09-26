@extends('emails.layouts.base')

@php
    $isNaira = strtoupper((string) $invoice->currency) === 'NGN';
    $currencyPrefix = $isNaira ? '&#8358;' : strtoupper((string) $invoice->currency).' ';
    $formattedAmount = number_format((float) $invoice->amount, 2);
    $orderCode = $invoice->serviceOrder?->order_code;

    // The transfer accounts are the super-admin managed fallback, so an invoice
    // never quotes an account the settings screen has since changed or cleared.
    // The fallback is a list, so every configured account is shown.
    $transfer = app(\App\Services\PaymentReadinessService::class)->transferPayload();
    $transferAccounts = $transfer['available'] ? $transfer['accounts'] : [];

    $invoiceRows = [
        'Invoice number' => '#'.e($invoice->invoice_number),
        'Service' => e((string) $invoice->title),
    ];

    if ($orderCode) {
        $invoiceRows['Order code'] = e((string) $orderCode);
    }

    if ($invoice->issued_at) {
        $invoiceRows['Issued'] = e($invoice->issued_at->format('j M Y'));
    }
@endphp

@section('title', 'Invoice '.$invoice->invoice_number)

@section('preheader', 'Invoice #'.$invoice->invoice_number.' for '.html_entity_decode($currencyPrefix, ENT_QUOTES, 'UTF-8').$formattedAmount.' is ready.')

@section('hero')
    <p style="margin:0; font-size:12px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:#9fb0e8;">
        Invoice issued
    </p>
    <h1 class="jv-h1" style="margin:8px 0 0; font-size:24px; line-height:1.3; font-weight:700; color:#ffffff;">
        Invoice #{{ $invoice->invoice_number }}
    </h1>
    <p style="margin:10px 0 0; font-size:14px; line-height:1.6; color:#c7d2f5;">
        Payment is due on receipt. Your invoice PDF is attached to this email.
    </p>
@endsection

@section('content')
    <p style="margin:0 0 18px; font-size:15px;">
        Dear {{ $invoice->customer_name }},
    </p>
    <p style="margin:0 0 20px; font-size:15px;">
        Thank you for trusting {{ config('bellah.invoice.company_name', 'Bellah Options') }} with this project.
        Here is the invoice for the work we have agreed.
    </p>

    @include('emails.partials.panel', [
        'tone' => 'accent',
        'title' => 'Invoice summary',
        'rows' => $invoiceRows,
    ])

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:18px;">
        <tr>
            <td valign="bottom" style="font-size:13px; color:#64748b; padding-bottom:4px;">
                Amount due
            </td>
            <td valign="bottom" align="right" style="padding-bottom:4px;">
                <span class="jv-amount" style="font-size:30px; font-weight:700; color:#050a49; letter-spacing:-0.01em;">
                    {!! $currencyPrefix !!}{{ $formattedAmount }}
                </span>
            </td>
        </tr>
        <tr>
            <td colspan="2" style="border-top:1px solid #e2e8f0; padding-top:10px; font-size:12px; color:#94a3b8;">
                Payment terms: 100% on receipt
            </td>
        </tr>
    </table>

    <p style="margin:26px 0 10px; font-size:12px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:#64748b;">
        How to pay
    </p>

    @if ($transferAccounts !== [])
        <p style="margin:0 0 12px; font-size:14px;">
            Transfer the amount above to {{ count($transferAccounts) > 1 ? 'any of the accounts' : 'the account' }} below, then reply to this email with your receipt
            {{ $transfer['support_email'] ? 'or send it to '.$transfer['support_email'] : '' }}.
        </p>

        @foreach ($transferAccounts as $account)
            @include('emails.partials.panel', [
                'tone' => 'default',
                'title' => $loop->first ? 'Bank transfer' : 'Bank transfer ('.$loop->iteration.')',
                'rows' => [
                    'Bank' => e($account['bank_name']),
                    'Account name' => e($account['account_name']),
                    'Account number' => '<span style="font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace; font-size:15px; letter-spacing:0.04em;">'.e($account['account_number']).'</span>',
                ],
            ])
        @endforeach

        @if ($transfer['reference_hint'] !== '')
            <p style="margin:12px 0 0; font-size:13px; color:#64748b;">
                {{ $transfer['reference_hint'] }}
            </p>
        @endif
    @else
        @include('emails.partials.panel', [
            'tone' => 'warning',
            'title' => 'Payment details',
            'content' => '<p style="margin:0; font-size:14px;">Reply to this email and our team will send the current bank transfer details for this invoice.</p>',
        ])
    @endif
@endsection

@section('after-content')
    @include('emails.partials.panel', [
        'tone' => 'accent',
        'content' => '<p style="margin:0; font-size:14px;">Please read our '
            .'<a href="'.e(rtrim(\App\Support\PlatformSettings::siteUrl(), '/')).'/terms-of-service" style="color:#050a49; font-weight:700; text-decoration:underline;">Terms of Service</a>'
            .' before making payment.</p>',
    ])
@endsection

@section('footer-note')
    You are receiving this because you placed an order with {{ config('bellah.invoice.company_name', 'Bellah Options') }}.
@endsection
