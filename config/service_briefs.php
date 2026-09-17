<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Universal intake block
    |--------------------------------------------------------------------------
    |
    | Asked once, as Step 1 of every service brief, regardless of service.
    | Editing this array updates every service's brief in one place. Field
    | option values double as their stored "value" — conditions and flag_on
    | rules compare against these exact strings, same convention used for
    | the per-service fields below (and matching how the questionnaire
    | template question options work elsewhere in this app).
    |
    */

    'universal_fields' => [
        ['key' => 'client_name', 'label' => 'What is your full name?', 'type' => 'text', 'required' => true, 'min' => 2, 'max' => 60],
        ['key' => 'brand_name', 'label' => 'What is your business or brand name?', 'type' => 'text', 'required' => false, 'help' => "Leave blank if this is a personal project."],
        ['key' => 'email', 'label' => 'Email address', 'type' => 'email', 'required' => true, 'help' => "We'll send your quote here."],
        ['key' => 'phone', 'label' => 'Phone number (WhatsApp preferred)', 'type' => 'tel', 'required' => true],
        ['key' => 'contact_pref', 'label' => 'How would you prefer we reach you?', 'type' => 'select', 'required' => true,
            'options' => ['WhatsApp', 'Phone call', 'Email', 'In-app messages']],
        ['key' => 'location', 'label' => 'Where are you based?', 'type' => 'select', 'required' => true,
            'options' => ['Lagos', 'Ogun', 'Oyo', 'Abuja (FCT)', 'Rivers', 'Kano', 'Other Nigerian state', 'Outside Nigeria']],
        ['key' => 'location_other', 'label' => 'Please specify', 'type' => 'text', 'required' => true,
            'condition' => ['field' => 'location', 'operator' => 'in', 'value' => ['Other Nigerian state', 'Outside Nigeria']]],
        ['key' => 'industry', 'label' => 'What industry are you in?', 'type' => 'select', 'required' => true,
            'options' => [
                'Fashion & Beauty', 'Food & Beverage', 'Retail / E-commerce', 'Real Estate', 'Health & Wellness',
                'Education / Training', 'Finance & Fintech', 'Logistics & Transport', 'Church / Ministry',
                'NGO / Non-profit', 'Entertainment & Media', 'Agriculture', 'Professional services',
                'Technology / Software', 'Events & Hospitality', 'Other',
            ]],
        ['key' => 'industry_other', 'label' => 'Tell us your industry', 'type' => 'text', 'required' => true,
            'condition' => ['field' => 'industry', 'operator' => 'equals', 'value' => 'Other']],
        ['key' => 'brand_stage', 'label' => 'Is this a new brand or an existing one?', 'type' => 'select', 'required' => true,
            'options' => ['Brand new – not launched yet', 'Existing, but rebranding', 'Existing, staying as it is']],
        ['key' => 'timeline', 'label' => 'How soon do you need this delivered?', 'type' => 'select', 'required' => true,
            'options' => ['Rush – within 48 hours', 'Within 1 week', '2–3 weeks', 'Within 1 month', 'Over a month', 'Flexible, no fixed date'],
            'flag_on' => ['Rush – within 48 hours' => 'is_rush']],
        ['key' => 'deadline_date', 'label' => 'Do you have a hard deadline date?', 'type' => 'date', 'required' => false],
        ['key' => 'budget_range', 'label' => 'What budget range are you working with?', 'type' => 'select', 'required' => true,
            'options_source' => 'per_service_budget_scale'],
        ['key' => 'referral_source', 'label' => 'How did you hear about Bellah Options?', 'type' => 'select', 'required' => false,
            'options' => ['Instagram', 'Google search', 'Referral from a friend or client', 'LinkedIn', 'Facebook', 'TikTok', "I'm a returning client", 'Other']],
        ['key' => 'intake_notes', 'label' => 'Anything urgent we should know before we start?', 'type' => 'textarea', 'required' => false, 'max' => 500],
        ['key' => 'consent_ndpa', 'label' => 'I agree to Bellah Options storing this information to prepare my quote, in line with the Privacy Policy.', 'type' => 'checkbox', 'required' => true],
        ['key' => 'consent_marketing', 'label' => 'Send me occasional offers and design tips.', 'type' => 'checkbox', 'required' => false],
    ],

    /*
    |--------------------------------------------------------------------------
    | Budget scales
    |--------------------------------------------------------------------------
    |
    | Options for the universal `budget_range` field, per service slug.
    | Amounts are indicative bands, never a computed quote.
    |
    */

    'budget_scales' => [
        'social-media-design' => ['Under ₦50,000', '₦50,000–₦85,000', '₦85,000–₦150,000', '₦150,000–₦300,000', 'Over ₦300,000', 'Not sure – advise me'],
        'graphic-design' => ['Under ₦30,000', '₦30,000–₦75,000', '₦75,000–₦150,000', '₦150,000–₦350,000', 'Over ₦350,000', 'Not sure – advise me'],
        'brand-design' => ['Under ₦100,000', '₦100,000–₦250,000', '₦250,000–₦500,000', '₦500,000–₦1,000,000', 'Over ₦1,000,000', 'Not sure – advise me'],
        'web-design' => ['Under ₦150,000', '₦150,000–₦400,000', '₦400,000–₦800,000', '₦800,000–₦1,500,000', 'Over ₦1,500,000', 'Not sure – advise me'],
        'special-service' => ['Under ₦50,000', '₦50,000–₦200,000', '₦200,000–₦500,000', '₦500,000–₦1,000,000', 'Over ₦1,000,000', 'Not sure – advise me'],
        'mobile-app-development' => ['Under ₦500,000', '₦500,000–₦1,500,000', '₦1,500,000–₦4,000,000', '₦4,000,000–₦10,000,000', 'Over ₦10,000,000', 'Not sure – advise me'],
        'ui-ux' => ['Under ₦150,000', '₦150,000–₦400,000', '₦400,000–₦1,000,000', '₦1,000,000–₦2,500,000', 'Over ₦2,500,000', 'Not sure – advise me'],
        'manage-hires' => ['Under ₦100,000', '₦100,000–₦300,000', '₦300,000–₦700,000', 'Over ₦700,000', 'Not sure – advise me'],
    ],

    /*
    |--------------------------------------------------------------------------
    | Service metadata
    |--------------------------------------------------------------------------
    */

    'service_meta' => [
        'social-media-design' => ['name' => 'Social Media Design', 'intro' => "Tell us what you're posting and who you're posting to. The more detail here, the fewer rounds of revision later.", 'estimated_minutes' => 4],
        'graphic-design' => ['name' => 'Graphic Design', 'intro' => 'This covers print and one-off design pieces – flyers, cards, packaging, banners and more.', 'estimated_minutes' => 4],
        'brand-design' => ['name' => 'Brand Design', 'intro' => 'Brand design goes deeper than a logo. These questions help us build something that actually fits your business – please take your time.', 'estimated_minutes' => 10],
        'web-design' => ['name' => 'Web Design', 'intro' => "Whether it's a one-page site or a full store, this helps us scope it properly and give you a real number.", 'estimated_minutes' => 10],
        'special-service' => ['name' => 'Special Service', 'intro' => "This is for work that doesn't fit neatly into the other categories. Tell us what you have in mind and we'll come back with a custom quote.", 'estimated_minutes' => 5],
        'mobile-app-development' => ['name' => 'Mobile App Development', 'intro' => "App projects live or die on scope. Answer as honestly as you can – 'not sure' is a perfectly good answer and we'll advise.", 'estimated_minutes' => 8],
        'ui-ux' => ['name' => 'UI/UX', 'intro' => "UI/UX is about how your product feels to use. Tell us what you're building and where it's currently falling short.", 'estimated_minutes' => 8],
        'manage-hires' => ['name' => 'Manage Hires', 'intro' => 'Tell us about the role(s) you need managed or filled, and we will follow up with a tailored quote.', 'estimated_minutes' => 3],
    ],

    'service_codes' => [
        'social-media-design' => 'SMD',
        'graphic-design' => 'GD',
        'brand-design' => 'BD',
        'web-design' => 'WD',
        'special-service' => 'SS',
        'mobile-app-development' => 'APP',
        'ui-ux' => 'UX',
        'manage-hires' => 'MH',
    ],

    'response_sla_hours' => [
        'default' => 24,
        'special-service' => 48,
        'mobile-app-development' => 48,
    ],
];
