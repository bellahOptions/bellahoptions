@extends('layouts.public')

@section('title', $title.' | Bellah Options')
@section('description', $heroDescription)

@section('content')
<section class="hero">
    <div class="container">
        <span class="eyebrow">{{ $badge }}</span>
        <h1>{{ $title }}</h1>
        <p class="lead">{{ $heroDescription }}</p>
    </div>
</section>

<section class="section">
    <div class="container">
        @if (!empty($notice))
            <div class="card soft" style="margin-bottom:1.1rem;">{{ $notice }}</div>
        @endif

        <div class="card" style="line-height:1.7;">
            @foreach ($sections as $section)
                <h2 style="{{ $loop->first ? '' : 'margin-top:1.8rem;' }}">{{ $section['title'] }}</h2>
                @foreach ($section['body'] as $paragraph)
                    <p style="margin-top:0.6rem;">{{ $paragraph }}</p>
                @endforeach
                @if (!empty($section['bullets']))
                    <ul style="margin-top:0.6rem; padding-left:1.2rem; display:grid; gap:0.35rem;">
                        @foreach ($section['bullets'] as $bullet)
                            <li>{{ $bullet }}</li>
                        @endforeach
                    </ul>
                @endif
            @endforeach

            <div class="btn-row">
                <a class="btn-outline" href="{{ route('contact') }}">Contact Bellah Options</a>
            </div>
        </div>

        @if ($updatedAt ?? null)
            <p class="small" style="margin-top:0.9rem; color:var(--ink-soft);">
                Last updated {{ \Illuminate\Support\Carbon::parse($updatedAt)->format('F j, Y') }}.
            </p>
        @endif
    </div>
</section>
@endsection
