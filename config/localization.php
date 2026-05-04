<?php

return [
    'default_country' => env('VISITOR_DEFAULT_COUNTRY', 'NG'),

    // Rates are expressed as NGN per 1 unit of target currency.
    'ngn_per_currency' => [
        'NGN' => 1,
        'USD' => 1500,
        'EUR' => 1650,
        'GBP' => 1950,
        'CAD' => 1100,
        'KES' => 11,
        'GHS' => 120,
        'ZAR' => 80,
    ],

    'country_profiles' => [
        'NG' => [
            'country' => 'Nigeria',
            'locale' => 'en_NG',
            'language' => 'en',
            'currency' => 'NGN',
            'payment_processor' => 'paystack',
        ],
        'US' => [
            'country' => 'United States',
            'locale' => 'en_US',
            'language' => 'en',
            'currency' => 'USD',
            'payment_processor' => 'flutterwave',
        ],
        'GB' => [
            'country' => 'United Kingdom',
            'locale' => 'en_GB',
            'language' => 'en',
            'currency' => 'GBP',
            'payment_processor' => 'flutterwave',
        ],
        'CA' => [
            'country' => 'Canada',
            'locale' => 'en_CA',
            'language' => 'en',
            'currency' => 'CAD',
            'payment_processor' => 'flutterwave',
        ],
        'FR' => [
            'country' => 'France',
            'locale' => 'fr_FR',
            'language' => 'fr',
            'currency' => 'EUR',
            'payment_processor' => 'flutterwave',
        ],
        'DE' => [
            'country' => 'Germany',
            'locale' => 'de_DE',
            'language' => 'de',
            'currency' => 'EUR',
            'payment_processor' => 'flutterwave',
        ],
        'ES' => [
            'country' => 'Spain',
            'locale' => 'es_ES',
            'language' => 'es',
            'currency' => 'EUR',
            'payment_processor' => 'flutterwave',
        ],
        'IT' => [
            'country' => 'Italy',
            'locale' => 'it_IT',
            'language' => 'it',
            'currency' => 'EUR',
            'payment_processor' => 'flutterwave',
        ],
        'IE' => [
            'country' => 'Ireland',
            'locale' => 'en_IE',
            'language' => 'en',
            'currency' => 'EUR',
            'payment_processor' => 'flutterwave',
        ],
        'KE' => [
            'country' => 'Kenya',
            'locale' => 'en_KE',
            'language' => 'en',
            'currency' => 'KES',
            'payment_processor' => 'flutterwave',
        ],
        'GH' => [
            'country' => 'Ghana',
            'locale' => 'en_GH',
            'language' => 'en',
            'currency' => 'GHS',
            'payment_processor' => 'flutterwave',
        ],
        'ZA' => [
            'country' => 'South Africa',
            'locale' => 'en_ZA',
            'language' => 'en',
            'currency' => 'ZAR',
            'payment_processor' => 'flutterwave',
        ],
    ],
];
