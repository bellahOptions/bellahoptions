@extends('emails.layouts.base')

@php
    $ticketRows = [
        'Ticket' => e((string) $ticket->ticket_number),
        'Subject' => e((string) $ticket->subject),
        'Priority' => e(ucfirst((string) $ticket->priority)),
    ];

    if ($ticket->created_at) {
        $ticketRows['Opened'] = e($ticket->created_at->format('j M Y, g:ia'));
    }
@endphp

@section('title', 'Support ticket '.$ticket->ticket_number)

@section('preheader', 'We have received ticket '.$ticket->ticket_number.' and our team will respond shortly.')

@section('hero')
    <p style="margin:0; font-size:12px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:#9fb0e8;">
        Support
    </p>
    <h1 class="jv-h1" style="margin:8px 0 0; font-size:24px; line-height:1.3; font-weight:700; color:#ffffff;">
        We have your request
    </h1>
    <p style="margin:10px 0 0; font-size:14px; line-height:1.6; color:#c7d2f5;">
        Ticket {{ $ticket->ticket_number }} is open and our team has been notified.
    </p>
@endsection

@section('content')
    <p style="margin:0 0 18px; font-size:15px;">
        Hi {{ $ticket->user?->name ?: 'there' }},
    </p>
    <p style="margin:0 0 20px; font-size:15px;">
        Thanks for getting in touch. Your support ticket has been created and logged against your
        account. You can follow the conversation and add more detail at any time from your dashboard.
    </p>

    @include('emails.partials.panel', [
        'tone' => 'accent',
        'title' => 'Ticket details',
        'rows' => $ticketRows,
    ])

    <p style="margin:20px 0 18px; font-size:15px;">
        We aim to reply within one working day. Replying to this email adds your message to the same
        ticket, so nothing gets lost.
    </p>

    @include('emails.partials.button', [
        'url' => route('dashboard.support'),
        'label' => 'Open your support tickets',
    ])
@endsection

@section('footer-links')
    <a href="{{ route('dashboard.support') }}" style="color:#64748b; text-decoration:underline;">Support</a>
    &nbsp;·&nbsp;
@endsection
