@extends('layouts.public')

@section('title', ($service['name'] ?? 'Service Order').' | Bellah Options')
@section('description', 'Secure onboarding form for '.($service['name'] ?? 'service').' with optional account creation and payment checkout.')

@section('content')
<section class="hero">
    <div class="container reveal">
        <span class="eyebrow">Secure Service Onboarding</span>
        <h1>{{ $service['name'] ?? 'Service Order' }}</h1>
        <p class="lead">{{ $service['description'] ?? 'Complete this form to start your service request and continue to secure checkout.' }}</p>
    </div>
</section>

<section class="section">
    <div class="container grid-2">
        <div class="card soft reveal">
            <h2 style="font-size:1.35rem;">What Happens Next</h2>
            <ol style="margin:0.8rem 0 0; padding-left:1.1rem; display:grid; gap:0.45rem;">
                <li>Submit this secure onboarding form.</li>
                <li>Review your order summary and package amount.</li>
                <li>Complete payment via Paystack checkout.</li>
                <li>Track project status and progress in your dashboard.</li>
            </ol>
            <p class="small" style="margin-top:0.8rem;">
                Optional account creation lets you track jobs, invoices, and progress from your dashboard.
            </p>
        </div>

        <div class="card reveal" style="padding: 1rem;">
            @if (session('error'))
                <div class="status warning" style="margin-top:0; margin-bottom:0.8rem;">{{ session('error') }}</div>
            @endif

            @if (! empty($discountCode) || old('discount_code'))
                <div class="status success" style="margin-top:0; margin-bottom:0.8rem;">
                    Discount <strong>{{ old('discount_code', $discountCode) }}</strong> is attached to this checkout.
                    @if (! empty($discountSummary))
                        <span>({{ $discountSummary }})</span>
                    @endif
                </div>
            @endif

            @if ($errors->any())
                <div class="errors" style="margin-top:0; margin-bottom:0.8rem;">
                    <ul>
                        @foreach ($errors->all() as $error)
                            <li>{{ $error }}</li>
                        @endforeach
                    </ul>
                </div>
            @endif

            <form method="post" action="{{ route('orders.store', $serviceSlug) }}" style="display:grid; gap:0.8rem;">
                @csrf

                <input type="hidden" name="order_nonce" value="{{ $formGuard['nonce'] ?? '' }}">
                <input type="hidden" name="order_rendered_at" value="{{ $formGuard['issued_at'] ?? '' }}">
                <input type="hidden" name="discount_code" value="{{ old('discount_code', $discountCode ?? '') }}">

                <div class="field">
                    <label for="service_package">Select Package</label>
                    <select id="service_package" name="service_package" required>
                        <option value="">Choose package</option>
                        @foreach (($service['packages'] ?? []) as $packageCode => $package)
                            <option value="{{ $packageCode }}" @selected(old('service_package', $selectedPackageCode ?? '') === $packageCode)>
                                {{ $package['name'] ?? ucfirst((string) $packageCode) }} - ₦{{ number_format((float) ($package['price'] ?? 0), 0) }}
                            </option>
                        @endforeach
                    </select>
                </div>

                <div class="grid-2" style="gap:0.8rem;">
                    <div class="field">
                        <label for="full_name">Full Name</label>
                        <input id="full_name" name="full_name" type="text" required minlength="3" maxlength="120" value="{{ old('full_name', auth()->user()?->name) }}">
                    </div>
                    <div class="field">
                        <label for="email">Email Address</label>
                        <input id="email" name="email" type="email" required maxlength="255" value="{{ old('email', auth()->user()?->email) }}">
                    </div>
                </div>

                <div class="grid-2" style="gap:0.8rem;">
                    <div class="field">
                        <label for="phone">Phone / WhatsApp</label>
                        <input id="phone" name="phone" type="text" required minlength="7" maxlength="30" value="{{ old('phone') }}">
                    </div>
                    <div class="field">
                        <label for="position">Your Position</label>
                        <input id="position" name="position" type="text" maxlength="120" value="{{ old('position') }}">
                    </div>
                </div>

                <div class="grid-2" style="gap:0.8rem;">
                    <div class="field">
                        <label for="business_name">Business Name</label>
                        <input id="business_name" name="business_name" type="text" required minlength="2" maxlength="180" value="{{ old('business_name') }}">
                    </div>
                    <div class="field">
                        <label for="business_website">Business Website</label>
                        <input id="business_website" name="business_website" type="url" maxlength="255" placeholder="https://example.com" value="{{ old('business_website') }}">
                    </div>
                </div>

                @if (! empty($serviceIntakeFields))
                    <div class="card soft" style="padding:0.9rem;">
                        <h3 style="font-size:1rem; margin-bottom:0.45rem;">Service-Specific Brief</h3>
                        <p class="small" style="margin-bottom:0.75rem;">Tell us more about this service so we can tailor your onboarding and delivery.</p>

                        <div class="grid-2" style="gap:0.8rem;">
                            @foreach ($serviceIntakeFields as $field)
                                @php
                                    $fieldName = (string) ($field['name'] ?? '');
                                    $fieldType = (string) ($field['type'] ?? 'text');
                                    $fieldLabel = (string) ($field['label'] ?? ucfirst(str_replace('_', ' ', $fieldName)));
                                    $fieldRequired = (bool) ($field['required'] ?? false);
                                    $fieldPlaceholder = (string) ($field['placeholder'] ?? '');
                                    $fieldMax = (int) ($field['max'] ?? ($fieldType === 'textarea' ? 2500 : 255));
                                    $fieldRows = (int) ($field['rows'] ?? 3);
                                    $fieldOptions = (array) ($field['options'] ?? []);
                                    $isLongField = in_array($fieldType, ['textarea'], true);
                                @endphp

                                @continue($fieldName === '')

                                <div class="field" style="{{ $isLongField ? 'grid-column:1 / -1;' : '' }}">
                                    <label for="{{ $fieldName }}">
                                        {{ $fieldLabel }}
                                        @if ($fieldRequired)
                                            <span style="color:#b91c1c;">*</span>
                                        @endif
                                    </label>

                                    @if ($fieldType === 'textarea')
                                        <textarea
                                            id="{{ $fieldName }}"
                                            name="{{ $fieldName }}"
                                            rows="{{ $fieldRows }}"
                                            maxlength="{{ $fieldMax }}"
                                            placeholder="{{ $fieldPlaceholder }}"
                                            {{ $fieldRequired ? 'required' : '' }}
                                        >{{ old($fieldName) }}</textarea>
                                    @elseif ($fieldType === 'select')
                                        <select id="{{ $fieldName }}" name="{{ $fieldName }}" {{ $fieldRequired ? 'required' : '' }}>
                                            <option value="">Select an option</option>
                                            @foreach ($fieldOptions as $optionValue => $optionLabel)
                                                @php
                                                    $resolvedValue = is_int($optionValue) ? (string) $optionLabel : (string) $optionValue;
                                                    $resolvedLabel = is_int($optionValue) ? (string) $optionLabel : (string) $optionLabel;
                                                @endphp
                                                <option value="{{ $resolvedValue }}" @selected(old($fieldName) === $resolvedValue)>
                                                    {{ $resolvedLabel }}
                                                </option>
                                            @endforeach
                                        </select>
                                    @else
                                        <input
                                            id="{{ $fieldName }}"
                                            name="{{ $fieldName }}"
                                            type="{{ $fieldType === 'number' ? 'number' : ($fieldType === 'url' ? 'url' : 'text') }}"
                                            @if ($fieldType === 'number' && isset($field['min'])) min="{{ (int) $field['min'] }}" @endif
                                            @if ($fieldType === 'number' && isset($field['max'])) max="{{ (int) $field['max'] }}" @endif
                                            @if ($fieldType !== 'number') maxlength="{{ $fieldMax }}" @endif
                                            placeholder="{{ $fieldPlaceholder }}"
                                            value="{{ old($fieldName) }}"
                                            {{ $fieldRequired ? 'required' : '' }}
                                        >
                                    @endif

                                    @if (! empty($field['hint']))
                                        <p class="small" style="margin-top:0.35rem;">{{ $field['hint'] }}</p>
                                    @endif
                                </div>
                            @endforeach
                        </div>
                    </div>
                @endif

                <div class="field">
                    <label for="timeline_preference">Timeline Preference</label>
                    <input id="timeline_preference" name="timeline_preference" type="text" maxlength="120" placeholder="e.g. Start in 2 weeks" value="{{ old('timeline_preference') }}">
                </div>

                <div class="field">
                    <label for="project_summary">Project Summary</label>
                    <textarea id="project_summary" name="project_summary" rows="5" required minlength="30" maxlength="2500">{{ old('project_summary') }}</textarea>
                </div>

                <div class="field">
                    <label for="project_goals">Project Goals</label>
                    <textarea id="project_goals" name="project_goals" rows="3" maxlength="1500">{{ old('project_goals') }}</textarea>
                </div>

                <div class="field">
                    <label for="target_audience">Target Audience</label>
                    <textarea id="target_audience" name="target_audience" rows="3" maxlength="1000">{{ old('target_audience') }}</textarea>
                </div>

                <div class="field">
                    <label for="preferred_style">Preferred Design Style</label>
                    <textarea id="preferred_style" name="preferred_style" rows="3" maxlength="1000">{{ old('preferred_style') }}</textarea>
                </div>

                <div class="field">
                    <label for="deliverables">Expected Deliverables</label>
                    <textarea id="deliverables" name="deliverables" rows="3" maxlength="1500">{{ old('deliverables') }}</textarea>
                </div>

                <div class="field">
                    <label for="additional_details">Additional Details</label>
                    <textarea id="additional_details" name="additional_details" rows="3" maxlength="2000">{{ old('additional_details') }}</textarea>
                </div>

                @if (! $isAuthenticated)
                    <div class="card soft" style="padding:0.9rem;">
                        <label style="display:flex; align-items:center; gap:0.5rem; margin:0; font-weight:700;">
                            <input id="create_account" type="checkbox" name="create_account" value="1" @checked(old('create_account'))>
                            Create an account for dashboard tracking
                        </label>
                        <p class="small" style="margin-top:0.45rem;">If checked, you can monitor progress and manage payments from your dashboard.</p>

                        <div id="account-password-fields" style="display:none; margin-top:0.8rem;">
                            <div class="grid-2" style="gap:0.8rem;">
                                <div class="field">
                                    <label for="password">Password</label>
                                    <input id="password" name="password" type="password" minlength="8" autocomplete="new-password">
                                </div>
                                <div class="field">
                                    <label for="password_confirmation">Confirm Password</label>
                                    <input id="password_confirmation" name="password_confirmation" type="password" minlength="8" autocomplete="new-password">
                                </div>
                            </div>
                        </div>
                    </div>
                @endif

                <input type="text" name="website" value="" style="position:absolute;left:-99999px;width:1px;height:1px;opacity:0;" tabindex="-1" autocomplete="off" aria-hidden="true">
                <input type="text" name="company_name" value="" style="position:absolute;left:-99999px;width:1px;height:1px;opacity:0;" tabindex="-1" autocomplete="off" aria-hidden="true">

                <button type="submit" class="btn" style="width:100%;">Continue To Secure Payment</button>
            </form>
        </div>
    </div>
</section>
@endsection

@push('scripts')
<script>
    const accountToggle = document.getElementById('create_account');
    const passwordFields = document.getElementById('account-password-fields');

    const updatePasswordFieldState = () => {
        if (!accountToggle || !passwordFields) {
            return;
        }

        passwordFields.style.display = accountToggle.checked ? 'block' : 'none';
    };

    if (accountToggle && passwordFields) {
        updatePasswordFieldState();
        accountToggle.addEventListener('change', updatePasswordFieldState);
    }
</script>
@endpush
