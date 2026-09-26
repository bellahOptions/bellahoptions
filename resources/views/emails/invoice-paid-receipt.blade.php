@extends('emails.layouts.base')

@php
    $isNaira = strtoupper((string) $invoice->currency) === 'NGN';
    $currencyPrefix = $isNaira ? '&#8358;' : strtoupper((string) $invoice->currency).' ';
    $formattedAmount = number_format((float) $invoice->amount, 2);

    $receiptRows = [
        'Invoice' => '#'.e($invoice->invoice_number),
        'Amount paid' => $currencyPrefix.e($formattedAmount),
        'Reference' => e((string) ($invoice->payment_reference ?: 'Not provided')),
    ];

    if ($invoice->paid_at) {
        $receiptRows['Paid on'] = e($invoice->paid_at->format('j M Y, g:ia'));
    }
@endphp

@section('title', 'Receipt for invoice '.$invoice->invoice_number)

@section('preheader', 'Payment received for invoice #'.$invoice->invoice_number.'. Your receipt is attached.')

@section('hero')
    <p style="margin:0; font-size:12px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:#9fe8d0;">
        Payment received
    </p>
    <h1 class="jv-h1" style="margin:8px 0 0; font-size:24px; line-height:1.3; font-weight:700; color:#ffffff;">
        Thank you, {{ $invoice->customer_name }}
    </h1>
    <p style="margin:10px 0 0; font-size:14px; line-height:1.6; color:#cdefe4;">
        We have received your payment and your project is now queued for production.
    </p>
@endsection

@section('content')
    <p style="margin:0 0 18px; font-size:15px;">
        Your receipt for invoice <strong>#{{ $invoice->invoice_number }}</strong> is attached to this
        email as a PDF, and the details are summarised below.
    </p>

    @include('emails.partials.panel', [
        'tone' => 'success',
        'title' => 'Receipt',
        'rows' => $receiptRows,
    ])

    <p style="margin:26px 0 10px; font-size:12px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:#64748b;">
        What happens next
    </p>

    @include('emails.partials.panel', [
        'tone' => 'accent',
        'content' => '<p style="margin:0 0 10px; font-size:14px;">Your project begins on the next working day and is delivered in batches during working hours.</p>'
            .'<p style="margin:0; font-size:14px;">The batch schedule depends on the service you paid for, and deliverables are shared through a dedicated Google Drive folder you will be given access to.</p>',
    ])

    <p style="margin:22px 0 0; font-size:13px; color:#64748b;">
        Thank you for choosing {{ config('bellah.invoice.company_name', 'Bellah Options') }}.
    </p>
@endsection

@section('footer-note')
    Keep this email as your payment record.
@endsection
