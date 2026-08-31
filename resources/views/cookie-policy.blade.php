@extends('layouts.public')

@section('title', 'Cookie Policy | Bellah Options')
@section('description', 'How Bellah Options uses cookies and how you can manage them.')

@section('content')
<section class="hero">
    <div class="container">
        <span class="eyebrow">Cookies &amp; Tracking</span>
        <h1>Cookie Policy</h1>
        <p class="lead">
            This page explains what cookies are, how Bellah Options uses them, and what choices you have when it comes to managing browser-based tracking technologies.
        </p>
    </div>
</section>

<section class="section">
    <div class="container">
        <div class="card" style="line-height:1.7;">
            <p>Essential and security-related cookies may be necessary for some parts of the website, especially protected forms and order workflows.</p>

            <h2 style="margin-top:1.8rem;">1. What Are Cookies</h2>
            <p style="margin-top:0.6rem;">Cookies are small data files stored by your browser to help websites remember settings, maintain sessions, improve performance, and understand how visitors use a site.</p>

            <h2 style="margin-top:1.8rem;">2. How Bellah Options Uses Cookies</h2>
            <ul style="margin-top:0.6rem; padding-left:1.2rem; display:grid; gap:0.35rem;">
                <li>To maintain site sessions and support form security.</li>
                <li>To remember basic browsing state where required.</li>
                <li>To measure traffic and site performance.</li>
                <li>To support analytics and marketing tools where enabled.</li>
            </ul>

            <h2 style="margin-top:1.8rem;">3. Types of Cookies We May Use</h2>
            <ul style="margin-top:0.6rem; padding-left:1.2rem; display:grid; gap:0.35rem;">
                <li>Essential cookies needed for core site functionality.</li>
                <li>Security cookies used to reduce fraudulent or automated activity.</li>
                <li>Analytics cookies used to understand usage patterns.</li>
                <li>Preference cookies used to improve convenience and continuity.</li>
            </ul>

            <h2 style="margin-top:1.8rem;">4. Managing Cookies</h2>
            <p style="margin-top:0.6rem;">You can control or delete cookies through your browser settings. Disabling some cookies may affect secure forms, sign-in flows, or order-related actions.</p>

            <div class="btn-row">
                <a class="btn-outline" href="{{ route('contact') }}">Talk to Us</a>
            </div>
        </div>
    </div>
</section>
@endsection
