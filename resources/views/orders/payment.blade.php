@extends('layouts.public')

@section('title', 'Secure Payment | Bellah Options')
@section('description', 'Complete your Bellah Options service order payment securely via Paystack.')

@section('content')
<section class="hero">
    <div class="container reveal">
        <span class="eyebrow">Secure Checkout</span>
        <h1>Complete Payment For {{ $order->service_name }}</h1>
        <p class="lead">Order ID: {{ $order->order_code }}</p>
    </div>
</section>

<section class="section">
    <div class="container grid-2">
        <div class="card soft reveal">
            <h2 style="font-size:1.3rem;">Order Summary</h2>
            <ul style="margin:0.8rem 0 0; padding-left:1rem; display:grid; gap:0.35rem;">
                <li><strong>Service:</strong> {{ $order->service_name }}</li>
                <li><strong>Package:</strong> {{ $order->package_name }}</li>
                <li><strong>Customer:</strong> {{ $order->full_name }}</li>
                <li><strong>Email:</strong> {{ $order->email }}</li>
                <li><strong>Invoice:</strong> {{ $order->invoice?->invoice_number ?? 'Pending' }}</li>
                <li><strong>Status:</strong> {{ strtoupper($order->payment_status) }}</li>
            </ul>

            <div class="card" style="margin-top:0.9rem; padding:0.9rem;">
                <p class="small" style="margin-bottom:0.3rem;">Amount Breakdown</p>
                <p class="small" style="margin:0.1rem 0;">
                    Base Price:
                    <strong>
                        @if (strtoupper((string) $order->currency) === 'NGN')
                            ₦
                        @else
                            {{ strtoupper((string) $order->currency) }}
                        @endif
                        {{ number_format((float) ($order->base_amount ?? $order->amount), 2) }}
                    </strong>
                </p>
                @if ((float) ($order->discount_amount ?? 0) > 0)
                    <p class="small" style="margin:0.1rem 0;">
                        Discount{{ $order->discount_code ? " ({$order->discount_code})" : '' }}:
                        <strong>
                            -@if (strtoupper((string) $order->currency) === 'NGN')
                                ₦
                            @else
                                {{ strtoupper((string) $order->currency) }}
                            @endif
                            {{ number_format((float) $order->discount_amount, 2) }}
                        </strong>
                    </p>
                @endif
                <p style="font-size:1.6rem; font-weight:800; color:var(--navy);">
                    <span class="small" style="display:block; margin-bottom:0.15rem;">Amount Payable</span>
                    @if (strtoupper((string) $order->currency) === 'NGN')
                        ₦
                    @else
                        {{ strtoupper((string) $order->currency) }}
                    @endif
                    {{ number_format((float) $order->amount, 2) }}
                </p>
            </div>
        </div>

        <div class="card reveal" style="display:grid; gap:0.8rem;">
            @if (session('success'))
                <div class="status success" style="margin-top:0;">{{ session('success') }}</div>
            @endif

            @if (session('error'))
                <div class="status warning" style="margin-top:0;">{{ session('error') }}</div>
            @endif

            <h2 style="font-size:1.3rem;">{{ strtoupper((string) ($paymentProvider ?? 'paystack')) }} Payment</h2>
            <p>
                All card and transfer details are handled securely on
                <strong>{{ strtoupper((string) ($paymentProvider ?? 'paystack')) }}</strong>
                checkout based on your regional localization.
            </p>

            @if ($canPay)
                <form method="post" action="{{ route('orders.payment.initialize', $order) }}">
                    @csrf
                    <button type="submit" class="btn" style="width:100%;">
                        Pay Now With {{ strtoupper((string) ($paymentProvider ?? 'paystack')) }}
                    </button>
                </form>
            @else
                <div class="status success" style="margin-top:0;">
                    {{ (string) $order->payment_status === 'not_required' ? 'This order is in consultation mode and does not require immediate online payment.' : 'Payment has been completed for this order.' }}
                </div>
            @endif

            <div class="btn-row" style="margin-top:0.2rem;">
                <a class="btn-outline" href="{{ route('orders.show', $order) }}">View Order Progress</a>
                <a class="btn-outline" href="{{ route('contact') }}">Need Help?</a>
            </div>
        </div>
    </div>
</section>
@endsection
