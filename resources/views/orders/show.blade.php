@extends('layouts.public')

@section('title', 'Order Progress | Bellah Options')
@section('description', 'Track your Bellah Options project progress, invoices, and payment updates.')

@section('content')
<section class="hero">
    <div class="container reveal">
        <span class="eyebrow">Order Tracking</span>
        <h1>{{ $order->service_name }} Progress</h1>
        <p class="lead">Track project status, payment records, and delivery milestones.</p>
    </div>
</section>

<section class="section">
    <div class="container grid-2">
        <div class="card soft reveal">
            <h2 style="font-size:1.3rem;">Order Information</h2>
            <ul style="margin:0.8rem 0 0; padding-left:1rem; display:grid; gap:0.35rem;">
                <li><strong>Order ID:</strong> {{ $order->uuid }}</li>
                <li><strong>Service:</strong> {{ $order->service_name }}</li>
                <li><strong>Package:</strong> {{ $order->package_name }}</li>
                <li><strong>Payment Status:</strong> {{ strtoupper((string) $order->payment_status) }}</li>
                <li><strong>Order Status:</strong> {{ str_replace('_', ' ', strtoupper((string) $order->order_status)) }}</li>
                <li><strong>Created:</strong> {{ $order->created_at?->format('M d, Y h:i A') }}</li>
                @if ($order->paid_at)
                    <li><strong>Paid At:</strong> {{ $order->paid_at->format('M d, Y h:i A') }}</li>
                @endif
            </ul>

            <div class="card" style="margin-top:0.95rem; padding:0.9rem;">
                <div style="display:flex; align-items:center; justify-content:space-between; gap:0.5rem;">
                    <strong style="color:var(--navy);">Progress</strong>
                    <span>{{ (int) $order->progress_percent }}%</span>
                </div>
                <div style="margin-top:0.6rem; height:9px; width:100%; border-radius:999px; background:#dbe7f5; overflow:hidden;">
                    <div style="height:9px; width:{{ max(0, min(100, (int) $order->progress_percent)) }}%; background:linear-gradient(120deg,#1f56d9,#2fb6e5);"></div>
                </div>
            </div>

            <div class="btn-row" style="margin-top:0.9rem;">
                @if ($order->payment_status !== 'paid')
                    <a class="btn" href="{{ route('orders.payment.show', $order) }}">Complete Payment</a>
                @endif
                <a class="btn-outline" href="{{ route('services') }}">Order Another Service</a>
            </div>
        </div>

        <div class="card reveal">
            <h2 style="font-size:1.3rem;">Invoice & Updates</h2>

            @if ($order->invoice)
                <div class="card soft" style="margin-top:0.8rem; padding:0.8rem;">
                    <p><strong>Invoice Number:</strong> {{ $order->invoice->invoice_number }}</p>
                    <p><strong>Amount:</strong>
                        @if (strtoupper((string) $order->invoice->currency) === 'NGN')
                            ₦
                        @else
                            {{ strtoupper((string) $order->invoice->currency) }}
                        @endif
                        {{ number_format((float) $order->invoice->amount, 2) }}
                    </p>
                    <p><strong>Invoice Status:</strong> {{ strtoupper((string) $order->invoice->status) }}</p>
                    @if ($order->invoice->payment_reference)
                        <p><strong>Payment Reference:</strong> {{ $order->invoice->payment_reference }}</p>
                    @endif
                </div>
            @endif

            <h3 style="font-size:1.05rem; margin-top:0.95rem;">Progress Timeline</h3>
            <div style="margin-top:0.55rem; display:grid; gap:0.6rem;">
                @forelse ($order->updates as $update)
                    <article class="card soft" style="padding:0.75rem; box-shadow:none;">
                        <p style="font-weight:700; color:var(--navy); margin:0;">{{ str_replace('_', ' ', strtoupper((string) $update->status)) }}</p>
                        <p class="small" style="margin-top:0.25rem;">{{ $update->note ?: 'Progress updated.' }}</p>
                        <p class="small" style="margin-top:0.25rem;">{{ $update->created_at?->format('M d, Y h:i A') }} • {{ (int) $update->progress_percent }}%</p>
                    </article>
                @empty
                    <div class="card soft" style="padding:0.75rem; box-shadow:none;">
                        <p class="small">No progress updates yet. Your timeline updates will appear here.</p>
                    </div>
                @endforelse
            </div>
        </div>
    </div>
</section>
@endsection
