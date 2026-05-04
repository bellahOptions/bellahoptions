@extends('layouts.public')

@section('title', 'Start Order | Bellah Options')
@section('description', 'Multi-step order form for Bellah Options services with optional account creation and invoice-ready order summary.')

@section('content')
<section class="hero">
    <div class="container reveal">
        <span class="eyebrow">Secure Order Intake</span>
        <h1>Get Started With Bellah Options</h1>
        <p class="lead">Complete the guided form below to submit your request, select a service package, and generate your order invoice.</p>
    </div>
</section>

<section class="section">
    <div class="container grid-2">
        <div class="card soft reveal">
            <h2 style="font-size:1.35rem;">Order Steps</h2>
            <ol style="margin:0.8rem 0 0; padding-left:1.1rem; display:grid; gap:0.45rem;">
                <li>Client contact details</li>
                <li>Service selection</li>
                <li>Business/brand details</li>
                <li>Plan/package selection</li>
                <li>Account option (or guest checkout)</li>
                <li>Order summary and invoice preview</li>
            </ol>
            <p class="small" style="margin-top:0.8rem;">
                Your selected service determines the available plans and request fields.
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

            <div id="step-indicator" style="display:grid; grid-template-columns:repeat(6, minmax(0, 1fr)); gap:0.35rem; margin-bottom:0.9rem;"></div>

            <form id="order-wizard-form" method="post" action="{{ route('orders.store', $serviceSlug) }}" style="display:grid; gap:0.8rem;">
                @csrf

                <input type="hidden" name="order_nonce" value="{{ $formGuard['nonce'] ?? '' }}">
                <input type="hidden" name="order_rendered_at" value="{{ $formGuard['issued_at'] ?? '' }}">
                <input type="hidden" name="discount_code" value="{{ old('discount_code', $discountCode ?? '') }}">
                <input type="hidden" id="checkout_step" name="checkout_step" value="{{ old('checkout_step', 1) }}">

                <section class="order-step" data-step="1">
                    <h2 style="font-size:1.15rem; margin-bottom:0.5rem;">Step 1: Client Information</h2>

                    @if ($isAuthenticated)
                        <label style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.8rem; font-weight:700;">
                            <input type="checkbox" id="use_profile_data">
                            Use my existing account data
                        </label>
                    @endif

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
                            <label for="position">Your Role / Position</label>
                            <input id="position" name="position" type="text" maxlength="120" value="{{ old('position') }}">
                        </div>
                    </div>
                </section>

                <section class="order-step" data-step="2" style="display:none;">
                    <h2 style="font-size:1.15rem; margin-bottom:0.5rem;">Step 2: Service Selection</h2>
                    <div class="field">
                        <label for="selected_service_slug">Choose Service</label>
                        <select id="selected_service_slug" name="selected_service_slug" required>
                            @foreach ($checkoutServices as $slug => $serviceEntry)
                                <option value="{{ $slug }}" @selected(old('selected_service_slug', $selectedServiceSlug ?? $serviceSlug) === $slug)>
                                    {{ $serviceEntry['name'] ?? ucfirst(str_replace('-', ' ', $slug)) }}
                                </option>
                            @endforeach
                        </select>
                        <p id="selected-service-description" class="small" style="margin-top:0.45rem;"></p>
                    </div>
                </section>

                <section class="order-step" data-step="3" style="display:none;">
                    <h2 style="font-size:1.15rem; margin-bottom:0.5rem;">Step 3: Business / Brand Information</h2>

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

                    <div class="field">
                        <label for="project_summary">Business / Project Summary</label>
                        <textarea id="project_summary" name="project_summary" rows="4" required minlength="30" maxlength="2500">{{ old('project_summary') }}</textarea>
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
                        <label for="preferred_style">Preferred Style</label>
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

                    <div class="field">
                        <label for="timeline_preference">Timeline Preference</label>
                        <input id="timeline_preference" name="timeline_preference" type="text" maxlength="120" placeholder="e.g. Start in 2 weeks" value="{{ old('timeline_preference') }}">
                    </div>

                    @foreach ($checkoutServices as $slug => $serviceEntry)
                        <div class="card soft service-intake-group" data-service-group="{{ $slug }}" style="display:none; padding:0.9rem; margin-top:0.8rem;">
                            <h3 style="font-size:1rem; margin-bottom:0.45rem;">{{ $serviceEntry['name'] ?? ucfirst(str_replace('-', ' ', $slug)) }} Brief</h3>
                            <p class="small" style="margin-bottom:0.75rem;">Provide service-specific details for better scoping.</p>

                            <div class="grid-2" style="gap:0.8rem;">
                                @foreach (($serviceEntry['intake'] ?? []) as $field)
                                    @php
                                        $fieldName = (string) ($field['name'] ?? '');
                                        $fieldType = (string) ($field['type'] ?? 'text');
                                        $fieldLabel = (string) ($field['label'] ?? ucfirst(str_replace('_', ' ', $fieldName)));
                                        $fieldRequired = (bool) ($field['required'] ?? false);
                                        $fieldPlaceholder = (string) ($field['placeholder'] ?? '');
                                        $fieldMax = (int) ($field['max'] ?? ($fieldType === 'textarea' ? 2500 : 255));
                                        $fieldRows = (int) ($field['rows'] ?? 3);
                                        $fieldOptions = (array) ($field['options'] ?? []);
                                        $isLongField = $fieldType === 'textarea';
                                    @endphp

                                    @continue($fieldName === '')

                                    <div class="field" style="{{ $isLongField ? 'grid-column:1 / -1;' : '' }}">
                                        <label for="{{ $slug }}-{{ $fieldName }}">{{ $fieldLabel }}</label>

                                        @if ($fieldType === 'textarea')
                                            <textarea
                                                id="{{ $slug }}-{{ $fieldName }}"
                                                name="{{ $fieldName }}"
                                                rows="{{ $fieldRows }}"
                                                maxlength="{{ $fieldMax }}"
                                                placeholder="{{ $fieldPlaceholder }}"
                                                data-required="{{ $fieldRequired ? '1' : '0' }}"
                                                data-service-field="{{ $slug }}"
                                            >{{ old($fieldName) }}</textarea>
                                        @elseif ($fieldType === 'select')
                                            <select
                                                id="{{ $slug }}-{{ $fieldName }}"
                                                name="{{ $fieldName }}"
                                                data-required="{{ $fieldRequired ? '1' : '0' }}"
                                                data-service-field="{{ $slug }}"
                                            >
                                                <option value="">Select an option</option>
                                                @foreach ($fieldOptions as $optionValue => $optionLabel)
                                                    @php
                                                        $resolvedValue = is_int($optionValue) ? (string) $optionLabel : (string) $optionValue;
                                                        $resolvedLabel = is_int($optionValue) ? (string) $optionLabel : (string) $optionLabel;
                                                    @endphp
                                                    <option value="{{ $resolvedValue }}" @selected(old($fieldName) === $resolvedValue)>{{ $resolvedLabel }}</option>
                                                @endforeach
                                            </select>
                                        @else
                                            <input
                                                id="{{ $slug }}-{{ $fieldName }}"
                                                name="{{ $fieldName }}"
                                                type="{{ $fieldType === 'number' ? 'number' : ($fieldType === 'url' ? 'url' : 'text') }}"
                                                @if ($fieldType === 'number' && isset($field['min'])) min="{{ (int) $field['min'] }}" @endif
                                                @if ($fieldType === 'number' && isset($field['max'])) max="{{ (int) $field['max'] }}" @endif
                                                @if ($fieldType !== 'number') maxlength="{{ $fieldMax }}" @endif
                                                placeholder="{{ $fieldPlaceholder }}"
                                                value="{{ old($fieldName) }}"
                                                data-required="{{ $fieldRequired ? '1' : '0' }}"
                                                data-service-field="{{ $slug }}"
                                            >
                                        @endif

                                        @if (! empty($field['hint']))
                                            <p class="small" style="margin-top:0.35rem;">{{ $field['hint'] }}</p>
                                        @endif
                                    </div>
                                @endforeach
                            </div>
                        </div>
                    @endforeach
                </section>

                <section class="order-step" data-step="4" style="display:none;">
                    <h2 style="font-size:1.15rem; margin-bottom:0.5rem;">Step 4: Choose Plan / Package</h2>

                    <div class="field">
                        <label for="service_package">Select Package</label>
                        <select id="service_package" name="service_package" required></select>
                    </div>

                    <div id="package-cards" style="display:grid; gap:0.6rem; margin-top:0.4rem;"></div>
                </section>

                <section class="order-step" data-step="5" style="display:none;">
                    <h2 style="font-size:1.15rem; margin-bottom:0.5rem;">Step 5: Account Option</h2>

                    @if (! $isAuthenticated)
                        <div class="card soft" style="padding:0.9rem;">
                            <label style="display:flex; align-items:center; gap:0.5rem; margin:0; font-weight:700;">
                                <input id="create_account" type="checkbox" name="create_account" value="1" @checked(old('create_account'))>
                                Create an account on Bellah Options
                            </label>

                            <p class="small" style="margin-top:0.45rem; margin-bottom:0.45rem;">Benefits of creating an account:</p>
                            <ul style="margin:0; padding-left:1rem; display:grid; gap:0.3rem;">
                                <li>Track order progress from your dashboard</li>
                                <li>Access invoices and payment records anytime</li>
                                <li>Manage multiple projects in one place</li>
                                <li>Receive delivery and update notifications</li>
                            </ul>

                            <p class="small" style="margin-top:0.55rem;">If you skip this, your order will be treated as a guest order.</p>

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
                    @else
                        <div class="status success" style="margin-top:0;">
                            You are already logged in. This order will be linked to your account automatically.
                        </div>
                    @endif
                </section>

                <section class="order-step" data-step="6" style="display:none;">
                    <h2 style="font-size:1.15rem; margin-bottom:0.5rem;">Step 6: Order Summary & Invoice Preview</h2>

                    <div class="card soft" style="padding:0.9rem;">
                        <ul id="order-summary-list" style="margin:0; padding-left:1rem; display:grid; gap:0.3rem;"></ul>
                    </div>

                    <div class="card" style="margin-top:0.7rem; padding:0.9rem;">
                        <p class="small" style="margin:0;">Invoice preview details:</p>
                        <p class="small" style="margin-top:0.35rem;">An invoice is generated immediately after submission and linked to this order.</p>
                        <p id="invoice-preview-amount" style="margin-top:0.45rem; font-size:1.2rem; font-weight:800; color:var(--navy);"></p>
                    </div>
                </section>

                <div class="btn-row" style="margin-top:0.3rem;">
                    <button type="button" class="btn-outline" id="prev-step-btn" style="display:none;">Back</button>
                    <button type="button" class="btn" id="next-step-btn">Continue</button>
                    <button type="submit" class="btn" id="submit-order-btn" style="display:none;">Submit Order</button>
                </div>

                <input type="text" name="website" value="" style="position:absolute;left:-99999px;width:1px;height:1px;opacity:0;" tabindex="-1" autocomplete="off" aria-hidden="true">
                <input type="text" name="company_name" value="" style="position:absolute;left:-99999px;width:1px;height:1px;opacity:0;" tabindex="-1" autocomplete="off" aria-hidden="true">
            </form>
        </div>
    </div>
</section>
@endsection

@push('scripts')
<script>
    const checkoutServices = @json($checkoutServices ?? []);
    const checkoutCreateRoutes = @json($checkoutCreateRoutes ?? []);
    const checkoutStoreRoutes = @json($checkoutStoreRoutes ?? []);

    const form = document.getElementById('order-wizard-form');
    const serviceSelect = document.getElementById('selected_service_slug');
    const packageSelect = document.getElementById('service_package');
    const packageCards = document.getElementById('package-cards');
    const serviceDescription = document.getElementById('selected-service-description');
    const summaryList = document.getElementById('order-summary-list');
    const invoicePreviewAmount = document.getElementById('invoice-preview-amount');

    const steps = Array.from(document.querySelectorAll('.order-step'));
    const stepIndicator = document.getElementById('step-indicator');
    const prevStepBtn = document.getElementById('prev-step-btn');
    const nextStepBtn = document.getElementById('next-step-btn');
    const submitOrderBtn = document.getElementById('submit-order-btn');
    const checkoutStepInput = document.getElementById('checkout_step');

    let currentStep = Math.max(1, Math.min(6, Number(checkoutStepInput?.value || 1)));

    const locale = @json(str_replace('_', '-', (string) ($visitorLocalization['locale'] ?? 'en-NG')));
    const currency = @json(strtoupper((string) ($visitorLocalization['currency'] ?? 'NGN')));

    function money(amount) {
        const value = Number(amount || 0);
        return new Intl.NumberFormat(locale || 'en-NG', {
            style: 'currency',
            currency,
            maximumFractionDigits: 0,
        }).format(value);
    }

    function currentServiceSlug() {
        return String(serviceSelect?.value || '').trim();
    }

    function activeServiceConfig() {
        const slug = currentServiceSlug();
        return checkoutServices[slug] || null;
    }

    function setFormRoutesByService() {
        const slug = currentServiceSlug();
        if (!slug) {
            return;
        }

        if (checkoutStoreRoutes[slug]) {
            form.setAttribute('action', checkoutStoreRoutes[slug]);
        }

        const targetCreate = checkoutCreateRoutes[slug];
        if (targetCreate && window.history && window.history.replaceState) {
            const url = new URL(targetCreate, window.location.origin);
            url.searchParams.set('service', slug);
            window.history.replaceState({}, '', url.toString());
        }
    }

    function updateServiceIntakeVisibility() {
        const slug = currentServiceSlug();
        const groups = Array.from(document.querySelectorAll('.service-intake-group'));

        groups.forEach((group) => {
            const isActive = group.dataset.serviceGroup === slug;
            group.style.display = isActive ? 'block' : 'none';

            group.querySelectorAll('[data-service-field]').forEach((field) => {
                const shouldRequire = isActive && field.dataset.required === '1';
                field.required = shouldRequire;
                field.disabled = !isActive;
            });
        });
    }

    function renderPackages() {
        const service = activeServiceConfig();
        const oldSelected = '{{ old('service_package', $selectedPackageCode ?? '') }}';
        const selectedValueBefore = packageSelect.value || oldSelected;

        packageSelect.innerHTML = '';
        packageCards.innerHTML = '';

        if (!service || !service.packages) {
            return;
        }

        const optionPlaceholder = document.createElement('option');
        optionPlaceholder.value = '';
        optionPlaceholder.textContent = 'Choose package';
        packageSelect.appendChild(optionPlaceholder);

        Object.entries(service.packages).forEach(([code, pkg]) => {
            const option = document.createElement('option');
            option.value = code;
            option.textContent = `${pkg.name || code} - ${money(pkg.price || 0)}`;
            packageSelect.appendChild(option);

            const card = document.createElement('button');
            card.type = 'button';
            card.dataset.packageCode = code;
            card.style.textAlign = 'left';
            card.style.border = '1px solid #d8e2f3';
            card.style.borderRadius = '10px';
            card.style.padding = '0.7rem';
            card.style.background = '#fff';
            card.style.cursor = 'pointer';
            card.innerHTML = `
                <p style="margin:0; font-weight:800; color:var(--navy);">${pkg.name || code}</p>
                <p style="margin:0.25rem 0 0; font-weight:700;">${money(pkg.price || 0)}</p>
                <p class="small" style="margin-top:0.35rem;">${pkg.description || ''}</p>
            `;

            card.addEventListener('click', () => {
                packageSelect.value = code;
                highlightPackageCard();
            });

            packageCards.appendChild(card);
        });

        if (selectedValueBefore && packageSelect.querySelector(`option[value="${selectedValueBefore}"]`)) {
            packageSelect.value = selectedValueBefore;
        } else {
            packageSelect.value = '';
        }

        highlightPackageCard();
    }

    function highlightPackageCard() {
        const selected = packageSelect.value;
        Array.from(packageCards.querySelectorAll('button[data-package-code]')).forEach((button) => {
            const active = button.dataset.packageCode === selected;
            button.style.borderColor = active ? '#1f56d9' : '#d8e2f3';
            button.style.boxShadow = active ? '0 0 0 2px rgba(31,86,217,0.15)' : 'none';
        });
    }

    function renderServiceDescription() {
        const service = activeServiceConfig();
        serviceDescription.textContent = service?.description || '';
    }

    function renderSummary() {
        const service = activeServiceConfig();
        const pkgCode = packageSelect.value;
        const pkg = service?.packages?.[pkgCode] || null;

        const fullName = document.getElementById('full_name')?.value || '';
        const email = document.getElementById('email')?.value || '';
        const phone = document.getElementById('phone')?.value || '';
        const businessName = document.getElementById('business_name')?.value || '';

        const listItems = [
            `<li><strong>Client:</strong> ${fullName || 'N/A'}</li>`,
            `<li><strong>Email:</strong> ${email || 'N/A'}</li>`,
            `<li><strong>Phone/WhatsApp:</strong> ${phone || 'N/A'}</li>`,
            `<li><strong>Business:</strong> ${businessName || 'N/A'}</li>`,
            `<li><strong>Service:</strong> ${service?.name || 'N/A'}</li>`,
            `<li><strong>Plan:</strong> ${pkg?.name || 'N/A'}</li>`,
        ];

        summaryList.innerHTML = listItems.join('');

        const amount = Number(pkg?.price || 0);
        if (amount > 0) {
            invoicePreviewAmount.textContent = `Estimated Amount: ${money(amount)}`;
        } else {
            invoicePreviewAmount.textContent = 'Consultation Package: Final invoice amount will be scoped after review.';
        }
    }

    function validateStep(step) {
        const container = steps.find((item) => Number(item.dataset.step) === step);
        if (!container) {
            return true;
        }

        const fields = Array.from(container.querySelectorAll('input, select, textarea'));

        for (const field of fields) {
            if (field.disabled) {
                continue;
            }

            if (field.offsetParent === null) {
                continue;
            }

            if (!field.checkValidity()) {
                field.reportValidity();
                return false;
            }
        }

        return true;
    }

    function renderStepIndicator() {
        stepIndicator.innerHTML = '';

        for (let step = 1; step <= 6; step++) {
            const badge = document.createElement('div');
            const active = step === currentStep;
            const done = step < currentStep;
            badge.style.padding = '0.35rem 0.2rem';
            badge.style.textAlign = 'center';
            badge.style.borderRadius = '8px';
            badge.style.fontSize = '0.72rem';
            badge.style.fontWeight = '700';
            badge.style.border = '1px solid #d8e2f3';
            badge.style.background = active ? '#000285' : (done ? '#edf4ff' : '#fff');
            badge.style.color = active ? '#fff' : '#334155';
            badge.textContent = `Step ${step}`;
            stepIndicator.appendChild(badge);
        }
    }

    function showStep(step) {
        currentStep = Math.max(1, Math.min(6, step));
        if (checkoutStepInput) {
            checkoutStepInput.value = String(currentStep);
        }

        steps.forEach((section) => {
            section.style.display = Number(section.dataset.step) === currentStep ? 'block' : 'none';
        });

        prevStepBtn.style.display = currentStep === 1 ? 'none' : 'inline-flex';
        nextStepBtn.style.display = currentStep === 6 ? 'none' : 'inline-flex';
        submitOrderBtn.style.display = currentStep === 6 ? 'inline-flex' : 'none';

        if (currentStep === 6) {
            renderSummary();
        }

        renderStepIndicator();
    }

    function updatePasswordFields() {
        const accountToggle = document.getElementById('create_account');
        const passwordFields = document.getElementById('account-password-fields');
        const password = document.getElementById('password');
        const confirmation = document.getElementById('password_confirmation');

        if (!accountToggle || !passwordFields) {
            return;
        }

        const shouldShow = accountToggle.checked;
        passwordFields.style.display = shouldShow ? 'block' : 'none';

        if (password) {
            password.required = shouldShow;
        }
        if (confirmation) {
            confirmation.required = shouldShow;
        }
    }

    function setupProfileFill() {
        const toggle = document.getElementById('use_profile_data');
        const fullName = document.getElementById('full_name');
        const email = document.getElementById('email');

        if (!toggle || !fullName || !email) {
            return;
        }

        const profileName = @json(auth()->user()?->name ?? '');
        const profileEmail = @json(auth()->user()?->email ?? '');

        const apply = () => {
            if (toggle.checked) {
                if (profileName) {
                    fullName.value = profileName;
                }
                if (profileEmail) {
                    email.value = profileEmail;
                }
                fullName.readOnly = true;
                email.readOnly = true;
            } else {
                fullName.readOnly = false;
                email.readOnly = false;
            }
        };

        apply();
        toggle.addEventListener('change', apply);
    }

    if (serviceSelect) {
        serviceSelect.addEventListener('change', () => {
            setFormRoutesByService();
            renderServiceDescription();
            updateServiceIntakeVisibility();
            renderPackages();
            renderSummary();
        });
    }

    if (packageSelect) {
        packageSelect.addEventListener('change', () => {
            highlightPackageCard();
            renderSummary();
        });
    }

    nextStepBtn?.addEventListener('click', () => {
        if (!validateStep(currentStep)) {
            return;
        }

        showStep(currentStep + 1);
    });

    prevStepBtn?.addEventListener('click', () => {
        showStep(currentStep - 1);
    });

    document.getElementById('create_account')?.addEventListener('change', updatePasswordFields);

    setFormRoutesByService();
    renderServiceDescription();
    updateServiceIntakeVisibility();
    renderPackages();
    updatePasswordFields();
    setupProfileFill();
    showStep(currentStep);
</script>
@endpush
